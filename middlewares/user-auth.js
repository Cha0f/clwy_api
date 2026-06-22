const jwt = require('jsonwebtoken');
const createError = require('http-errors');
const { failure } = require('../utils/responses');

/**
 * 通用用户 Bearer Token 鉴权中间件
 *
 * 仅验证 Token 合法性和 userId 有效性，不做角色判断。
 * 适用于前台需登录的接口（/users/*、/likes/*）。
 *
 * 验证通过后：
 *   - 将 userId（数字）挂载到 req.userId
 *   - 调用 next() 进入后续路由
 *
 * 验证失败直接调用 failure() 返回 401。
 */
module.exports = async (req, res, next) => {
  try {
    // 从 Authorization 头中获取 Token（格式: Bearer <token>）
    const authHeader = req.headers.authorization;
    if (!authHeader || !/^Bearer\s+/i.test(authHeader)) {
      throw createError(401, '当前接口需要认证才能访问');
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
      throw createError(401, 'Token格式错误。');
    }

    // 验证 token 是否正确并解析 payload
    const decodedToken = jwt.verify(token, process.env.SECRET_KEY);
    const { userId } = decodedToken;
    if (!userId) {
      throw createError(401, 'Token无效。');
    }

    // 将 userId 挂载到 req，后续路由可通过 req.userId 获取
    req.userId = userId;
    next();
  } catch (error) {
    failure(res, error);
  }
};
