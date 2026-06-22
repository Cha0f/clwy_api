/**
 * 通用用户 Bearer Token 鉴权中间件
 *
 * 仅验证 JWT Token 合法性和 userId 有效性，不做角色判断。
 * 适用于前台需要登录的接口（/users/*、/likes/*）。
 *
 * 验证通过：
 *   - 将 userId（数字）挂载到 req.userId（注意：非完整对象）
 *   - 调用 next() 进入后续路由处理器
 *
 * 验证失败通过 failure() 返回 401。
 */

const jwt = require('jsonwebtoken');
const createError = require('http-errors');
const { failure } = require('../utils/responses');

module.exports = async (req, res, next) => {
  try {
    // 1. 从 Authorization 头提取 Token
    const authHeader = req.headers.authorization;
    if (!authHeader || !/^Bearer\s+/i.test(authHeader)) {
      throw createError(401, '当前接口需要认证才能访问');
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
      throw createError(401, 'Token格式错误。');
    }

    // 2. 验证 JWT 签名和算法（仅接受 HS256）
    const decodedToken = jwt.verify(token, process.env.SECRET_KEY, { algorithms: ['HS256'] });
    const { userId } = decodedToken;
    if (!userId) {
      throw createError(401, 'Token无效。');
    }

    // 3. 将 userId 挂载到 req，后续路由通过 req.userId 获取
    req.userId = userId;
    next();
  } catch (error) {
    failure(res, error);
  }
};
