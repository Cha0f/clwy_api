const jwt = require('jsonwebtoken');
const { UnauthorizedError } = require('../utils/errors');
const { failure } = require('../utils/responses');

/**
 * 管理员 Bearer Token 鉴权中间件
 *
 * 从 Authorization 头中提取 Token，解析出 userId，
 * 查询数据库确认用户存在且 role === 100（管理员）。
 *
 * 验证通过后：
 *   - 将 user 对象挂载到 req.user
 *   - 调用 next() 进入后续中间件或路由
 *
 * 验证失败直接调用 failure() 返回 401。
 */
module.exports = async (req, res, next) => {
  try {
    // 从 Authorization 头中获取 Token（格式: Bearer <token>）
    const authHeader = req.headers.authorization;
    if (!authHeader || !/^Bearer\s+/i.test(authHeader)) {
      throw new UnauthorizedError('当前接口需要认证才能访问');
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedError('Token格式错误。');
    }

    // 验证 token 是否正确并解析 payload
    const decodedToken = jwt.verify(token, process.env.SECRET_KEY);
    const { userId } = decodedToken;
    if (!userId) {
      throw new UnauthorizedError('Token无效。');
    }

    // 查询当前登录的用户
    const { User } = require('../models');
    const user = await User.findByPk(userId);
    if (!user) {
      throw new UnauthorizedError('用户不存在。');
    }

    // 验证当前用户是否是管理员
    if (user.role !== 100) {
      throw new UnauthorizedError('您没有权限使用当前接口。');
    }

    // 验证通过，将 user 对象挂载到 req 上
    req.user = user;
    next();
  } catch (error) {
    failure(res, error);
  }
};
