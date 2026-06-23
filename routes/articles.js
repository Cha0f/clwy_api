/**
 * 前台文章路由。
 */
const express = require('express');
const { Article } = require('../models');
const { cacheKeys, remember } = require('../utils/cache');
const { getPagination } = require('../utils/pagination');
const { success } = require('../utils/responses');
const { asyncRoute, findByPkOrFail, paginate } = require('../utils/routes');

const router = express.Router();

/**
 * GET /articles
 * 获取文章列表。
 * @query {number} page - 当前页
 * @query {number} pageSize - 每页数量
 * @returns {Object} { articles, pagination: { total, currentPage, pageSize } }
 */
router.get(
  '/',
  asyncRoute(async (req, res) => {
    // 先规范化分页参数，保证等价请求落到同一个缓存键。
    const { currentPage, pageSize } = getPagination(req.query);
    const key = cacheKeys.articleList(currentPage, pageSize);
    // 列表不读取正文，降低数据库与网络传输量。
    const data = await remember(key, () =>
      paginate(
        Article,
        req.query,
        {
          attributes: { exclude: ['content'] },
          order: [['id', 'DESC']],
        },
        'articles',
      ),
    );

    success(res, '查询文章列表成功。', data);
  }),
);

/**
 * GET /articles/:id
 * 获取文章详情。
 * @param {number} id - 文章 ID
 * @returns {Object} { article }
 */
router.get(
  '/:id',
  asyncRoute(async (req, res) => {
    // 详情包含完整正文，并按文章 ID 独立缓存。
    const article = await remember(cacheKeys.article(req.params.id), () =>
      findByPkOrFail(Article, req.params.id, {}, '文章'),
    );

    success(res, '查询文章成功。', { article });
  }),
);

module.exports = router;
