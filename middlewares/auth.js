/**
 * JWT 身份认证中间件。
 *
 * 前台和后台认证共用 Token 提取与验签实现；管理员认证额外查询用户并校验角色。
 */
const createError = require('http-errors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User } = require('../models');
const { asyncRoute } = require('../utils/routes');

/**
 * 从 Authorization 请求头提取 Bearer Token。
 *
 * @param {import('express').Request} req Express 请求
 * @returns {string} JWT 字符串
 */
function getBearerToken(req) {
  // Bearer 前缀大小写不敏感，但 Token 本身保持原样。
  const match = req.headers.authorization?.match(/^Bearer\s+(.+)$/i);
  if (!match?.[1]) {
    throw createError(401, '当前接口需要认证才能访问。');
  }
  return match[1];
}

/**
 * 验证 JWT 并返回其中的 userId。
 *
 * @param {string} token JWT 字符串
 * @returns {string|number} 用户 ID
 */
function verifyUserId(token) {
  // 固定 HS256，防止算法混淆。
  const payload = jwt.verify(token, process.env.SECRET_KEY, { algorithms: ['HS256'] });
  if (!payload.userId) {
    throw createError(401, 'Token无效。');
  }
  return payload.userId;
}

/**
 * 使用邮箱或用户名验证登录凭据。
 * 前台和后台共用相同错误提示，避免通过响应差异枚举账号。
 */
async function authenticateCredentials(login, password) {
  // 缺少字段时直接返回参数错误，不执行数据库查询。
  if (!login) {
    throw createError(400, '邮箱/用户名必须填写。');
  }
  if (!password) {
    throw createError(400, '密码必须填写。');
  }

  // 登录校验必须显式读取默认 scope 隐藏的密码哈希。
  const user = await User.scope('withPassword').findOne({
    where: { [Op.or]: [{ email: login }, { username: login }] },
  });
  if (!user || !bcrypt.compareSync(password, user.password)) {
    throw createError(401, '邮箱/用户名或密码错误。');
  }
  return user;
}

/**
 * 使用固定 HS256 算法签发只包含 userId 的 Token。
 */
function signUserToken(userId, defaultExpiresIn) {
  return jwt.sign({ userId }, process.env.SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES_IN || defaultExpiresIn,
    algorithm: 'HS256',
  });
}

/**
 * 前台认证只验证 Token，并把 userId 交给后续路由。
 */
const userAuth = asyncRoute(async (req, res, next) => {
  // 先解析请求头，再验证签名与有效期。
  req.userId = verifyUserId(getBearerToken(req));
  // 验证通过后继续执行实际业务路由。
  next();
});

/**
 * 后台认证同时确认用户仍存在且角色为管理员。
 */
const adminAuth = asyncRoute(async (req, res, next) => {
  // 从合法 Token 中取得用户 ID。
  const userId = verifyUserId(getBearerToken(req));
  // 管理员修改密码时需要哈希，因此显式使用包含密码的 scope。
  const user = await User.scope('withPassword').findByPk(userId);
  if (!user) {
    throw createError(401, '用户不存在。');
  }
  if (user.role !== 100) {
    throw createError(401, '您没有权限使用当前接口。');
  }

  // 把已验证的管理员实例挂到请求上，避免后续重复查询。
  req.user = user;
  next();
});

module.exports = {
  adminAuth,
  authenticateCredentials,
  getBearerToken,
  signUserToken,
  userAuth,
  verifyUserId,
};
