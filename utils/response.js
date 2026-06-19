/**
 * 自定义 404 错误类
 */
class NotFondError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFondError';
  }
}

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
 * @param res
 * @param error
 */
function failure(res, error) {
  if (error.name === 'SequelizeValidationError') {
    const errors = error.errors.map((e) => e.message);
    return res.status(400).json({
      status: 400,
      message: '请求参数错误。',
      errors,
    });
  }

  if (error.name === 'NotFoundError') {
    return res.status(404).json({
      status: 404,
      message: '资源不存在。',
      errors: [error.message],
    });
  }

  res.status(500).json({
    status: 500,
    message: '服务器错误。',
    errors: [error.message],
  });
}

// 导出
module.exports = {
  NotFondError,
  success,
  failure,
};
