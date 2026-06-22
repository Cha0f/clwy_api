const createError = require('http-errors');

/**
 * 请求成功
 * @param res
 * @param message
 * @param data
 * @param code
 */
function success(res, message, data = {}, code = 200) {
  res.status(code).json({
    status: code,
    message,
    data,
  });
}

/**
 * 请求失败
 * @param res - Express 响应对象
 * @param error - 错误对象
 */
function failure(res, error) {
  // 根据错误类型设置响应状态码和消息
  let statusCode = 500;
  let errors = '服务器错误。';

  if (error.name === 'SequelizeValidationError') {
    // Sequelize 模型验证错误
    statusCode = 400;
    errors = error.errors.map((e) => e.message);
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    errors = ['您提交的 token 错误。'];
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    errors = ['您的 token 已过期。'];
  } else if (error instanceof createError.HttpError) {
    // http-errors 库创建的错误
    statusCode = error.status;
    errors = [error.message];
  }

  // 开发环境下打印错误以便调试
  if (process.env.NODE_ENV === 'development') {
    console.error('错误详情:', error);
  }

  res.status(statusCode).json({
    status: statusCode,
    message: getDefaultMessage(statusCode),
    errors,
  });
}

/**
 * 根据 HTTP 状态码获取默认消息
 */
function getDefaultMessage(statusCode) {
  switch (statusCode) {
    case 400:
      return '请求参数错误。';
    case 401:
      return '认证失败。';
    case 404:
      return '资源不存在。';
    case 409:
      return '操作冲突。';
    case 429:
      return '请求过于频繁。';
    default:
      return '服务器错误。';
  }
}

// 导出
module.exports = {
  success,
  failure,
};
