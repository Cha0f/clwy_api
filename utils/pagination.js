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
function getPagination(query, maxPageSize = 100) {
  // currentPage：从 query.currentPage 或 query.page 读取，非正数时默认为 1
  const currentPage = Math.abs(Number(query.currentPage || query.page)) || 1;
  // pageSize：从 query.pageSize 读取，限制在 1 ~ maxPageSize 范围内
  const pageSize = Math.min(Math.abs(Number(query.pageSize)) || 10, maxPageSize);
  return {
    currentPage,
    pageSize,
    // offset = (当前页 - 1) × 每页条数（Sequelize 的 LIMIT/OFFSET 标准实现）
    offset: (currentPage - 1) * pageSize,
  };
}

module.exports = { getPagination };
