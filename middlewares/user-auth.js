const jwt = require('jsonwebtoken');
const { UnauthorizedError } = require('../utils/errors');
const { failure } = require('../utils/responses');

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
    // 验证token是否正确
    const decodedToken = jwt.verify(token, process.env.SECRET_KEY);
    // 从jwt中，解析出之前存入的userId
    const { userId } = decodedToken;
    if (!userId) {
      throw new UnauthorizedError('Token无效。');
    }

    // 如果通过验证，将user对象挂载到req上，方便后续中间件或路由使用
    req.userId = userId;
    // 一定要加 next() ，才能继续进入到后续中间件或者路由中
    next();
  } catch (error) {
    failure(res, error);
  }
};
