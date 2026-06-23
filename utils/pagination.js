/**
 * 分页参数工具函数
 *
 * 从 express 的 req.query 中提取分页参数，计算 offset 用于 Sequelize 分页查询。
 * 默认第 1 页、每页 10 条，最大每页不超过 100 条（防止恶意请求导致的性能问题）。
 *
 * @param {object} query - req.query
 * @param {number} maxPageSize - 每页最大条数，默认 100
 * @returns {{ currentPage: number, pageSize: number, offset: number }}
 */
const createError = require('http-errors');

function getPagination(query, maxPageSize = 100) {
  // currentPage 优先于兼容参数 page；缺失时使用第一页。
  const currentPage = parsePositiveInteger(query.currentPage ?? query.page, 1, '当前页码');
  // pageSize 缺失时使用 10，非法值由解析函数统一抛出 400。
  const requestedPageSize = parsePositiveInteger(query.pageSize, 10, '每页条数');
  // 超过上限的合法整数按最大值执行，避免单次查询过多记录。
  const pageSize = Math.min(requestedPageSize, maxPageSize);
  // Sequelize 使用从 0 开始的 offset，因此页码需要先减一。
  const offset = (currentPage - 1) * pageSize;

  // 极大页码可能使乘法超出 JavaScript 安全整数范围。
  if (!Number.isSafeInteger(offset)) {
    throw createError(400, '分页范围超出限制。');
  }

  return {
    currentPage,
    pageSize,
    offset,
  };
}

function parsePositiveInteger(value, fallback, fieldName) {
  // undefined、null 和空字符串都表示调用方没有提供该参数。
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  // Number 负责接收数字字符串，随后必须再次验证整数范围和正数约束。
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number <= 0) {
    throw createError(400, `${fieldName}必须是正整数。`);
  }

  return number;
}

module.exports = { getPagination };
