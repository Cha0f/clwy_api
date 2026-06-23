/**
 * 统一响应工具函数
 *
 * 提供标准的 API 响应格式：
 *   - success(): 成功响应（200/201）
 *   - failure(): 统一错误处理，根据错误类型映射 HTTP 状态码和用户友好消息
 */

const createError = require('http-errors');
const env = require('../config/env');
const { formatTimestamps } = require('./date-time');

/**
 * 请求成功
 *
 * @param {object} res - Express 响应对象
 * @param {string} message - 成功消息
 * @param {object} [data={}] - 返回的数据对象
 * @param {number} [code=200] - HTTP 状态码（创建成功用 201）
 */
function success(res, message, data = {}, code = 200) {
  res.status(code).json({
    status: code,
    message,
    // 在统一出口递归格式化，确保所有创建和更新时间遵循相同格式。
    data: formatTimestamps(data),
  });
}

/**
 * 请求失败 — 统一错误处理
 *
 * 根据 error 对象的类型/名称自动选择合适的 HTTP 状态码和错误消息，
 * 确保客户端能正确解析错误详情。
 *
 * 支持的错误类型（优先级从上到下）：
 *   - SequelizeValidationError     → 400（模型验证不通过）
 *   - SequelizeUniqueConstraintError → 409（重复数据）
 *   - SequelizeForeignKeyConstraintError → 409（外键约束）
 *   - JsonWebTokenError            → 401（token 无效）
 *   - TokenExpiredError            → 401（token 过期）
 *   - http-errors 创建的错误      → 使用 error.status
 *   - 其他未识别错误              → 500（服务器错误）
 *
 * @param {object} res - Express 响应对象
 * @param {Error} error - 错误对象
 */
function failure(res, error) {
  let statusCode = 500;
  let errors = ['服务器错误。'];

  if (error.name === 'SequelizeValidationError') {
    // 模型字段验证失败（如字段为空、长度超限、格式不匹配等）
    statusCode = 400;
    errors = error.errors.map((e) => e.message);
  } else if (error.name === 'SequelizeUniqueConstraintError') {
    // 唯一约束冲突（如重复的邮箱/用户名/分类名等）
    statusCode = 409;
    errors = [error.errors?.map((e) => e.message).join('；') || '数据已存在，请勿重复操作。'];
  } else if (error.name === 'SequelizeForeignKeyConstraintError') {
    // 外键约束冲突（如引用了不存在的关联记录）
    statusCode = 409;
    errors = ['操作失败，关联数据不存在。'];
  } else if (error.name === 'JsonWebTokenError') {
    // JWT 格式错误或签名不匹配
    statusCode = 401;
    errors = ['您提交的 token 错误。'];
  } else if (error.name === 'TokenExpiredError') {
    // JWT 已过期
    statusCode = 401;
    errors = ['您的 token 已过期。'];
  } else if (error.name === 'MulterError') {
    // 文件数量、大小等 Multer 限制属于客户端请求错误。
    statusCode = 400;
    errors = [error.message];
  } else if (error instanceof createError.HttpError) {
    // 业务代码中用 http-errors throw 的自定义错误
    statusCode = error.status;
    errors = [error.message];
  }

  // 开发模式下将详细错误打印到控制台（便于调试）
  if (env.nodeEnv === 'development') {
    console.error('错误详情:', error);
  }

  res.status(statusCode).json({
    status: statusCode,
    message: getDefaultMessage(statusCode),
    errors,
  });
}

/**
 * 根据 HTTP 状态码返回默认提示消息
 *
 * @param {number} statusCode - HTTP 状态码
 * @returns {string} 用户友好的默认消息
 */
function getDefaultMessage(statusCode) {
  switch (statusCode) {
    case 400:
      return '请求参数错误。';
    case 401:
      return '认证失败。';
    case 403:
      return '禁止访问。';
    case 404:
      return '资源不存在。';
    case 409:
      return '操作冲突。';
    case 429:
      return '请求过于频繁。';
    case 502:
      return '上游服务错误。';
    default:
      return '服务器错误。';
  }
}

module.exports = {
  success,
  failure,
};
