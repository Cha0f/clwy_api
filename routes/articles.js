const express = require('express');
const router = express.Router();
const { Article } = require('../models');
const { success, failure } = require('../utils/responses');
const createError = require('http-errors');
const { getPagination } = require('../utils/pagination');

/**
 * 查询文章列表
 *
 * 分页返回所有文章（排除 content 字段以减少传输量），
 * 按 id 降序排列（最新优先）。
 *
 * GET /articles?currentPage=&pageSize=
 */
router.get('/', async function (req, res) {
  try {
    const query = req.query;
    const { currentPage, pageSize, offset } = getPagination(query);

    const condition = {
      attributes: { exclude: ['content'] },
      order: [['id', 'DESC']],
      limit: pageSize,
      offset,
    };

    const { count, rows } = await Article.findAndCountAll(condition);
    success(res, '查询文章列表成功。', {
      articles: rows,
      pagination: {
        total: count,
        currentPage,
        pageSize,
      },
    });
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 查询文章详情
 *
 * 返回完整文章内容（含 content 字段）。
 *
 * GET /articles/:id
 */
router.get('/:id', async function (req, res) {
  try {
    const { id } = req.params;

    const article = await Article.findByPk(id);
    if (!article) {
      throw createError(404, `ID: ${id}的文章未找到。`);
    }

    success(res, '查询文章成功。', { article });
  } catch (error) {
    failure(res, error);
  }
});

module.exports = router;
