/**
 * 管理员 Bearer Token 鉴权中间件
 *
 * 从 Authorization 头提取 JWT Token，验证签名和算法后解析 userId，
 * 查询数据库确认用户存在且 role === 100（管理员）。
 *
 * 验证通过：
 *   - 将完整的 user 对象挂载到 req.user
 *   - 调用 next() 进入后续中间件或路由处理器
 *
 * 验证失败通过 failure() 返回 401。
 */

const jwt = require('jsonwebtoken');
const createError = require('http-errors');
const { failure } = require('../utils/responses');

module.exports = async (req, res, next) => {
  try {
    // 1. 从 Authorization 头提取 Token（预期格式: "Bearer <token>"）
    const authHeader = req.headers.authorization;
    if (!authHeader || !/^Bearer\s+/i.test(authHeader)) {
      throw createError(401, '当前接口需要认证才能访问');
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
      throw createError(401, 'Token格式错误。');
    }

    // 2. 验证 JWT 签名和算法（仅接受 HS256，防止算法混淆攻击）
    const decodedToken = jwt.verify(token, process.env.SECRET_KEY, { algorithms: ['HS256'] });
    const { userId } = decodedToken;
    if (!userId) {
      throw createError(401, 'Token无效。');
    }

    // 3. 从数据库查询该用户（同时验证用户未被删除）
    const { User } = require('../models');
    const user = await User.findByPk(userId);
    if (!user) {
      throw createError(401, '用户不存在。');
    }

    // 4. 检查 role 是否为管理员（100）
    if (user.role !== 100) {
      throw createError(401, '您没有权限使用当前接口。');
    }

    // 全部通过，将用户对象传给后续路由
    req.user = user;
    next();
  } catch (error) {
    failure(res, error);
  }
};
