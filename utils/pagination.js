/**
 * 分页参数工具
 * @param {object} query - req.query
 * @param {number} maxPageSize - 每页最大条数
 * @returns {{ currentPage: number, pageSize: number, offset: number }}
 */
function getPagination(query, maxPageSize = 100) {
  const currentPage = Math.abs(Number(query.currentPage || query.page)) || 1;
  const pageSize = Math.min(Math.abs(Number(query.pageSize)) || 10, maxPageSize);
  return {
    currentPage,
    pageSize,
    offset: (currentPage - 1) * pageSize,
  };
}

module.exports = { getPagination };
