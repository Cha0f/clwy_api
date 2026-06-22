const express = require('express');
const router = express.Router();
const { Article } = require('../../models');
const { Op } = require('sequelize');
const createError = require('http-errors');
const { success, failure } = require('../../utils/responses');
const { getPagination } = require('../../utils/pagination');

/**
 * 查询文章列表
 *
 * 支持按标题（title）模糊搜索，按 id 降序排列。
 *
 * GET /admin/articles?title=&currentPage=&pageSize=
 */
router.get('/', async function (req, res) {
  try {
    const query = req.query;
    const { currentPage, pageSize, offset } = getPagination(query);

    const condition = {
      order: [['id', 'DESC']],
      limit: pageSize,
      offset,
      where: {},
    };

    // title 模糊搜索（输入净化防类型绕过）
    if (query.title) {
      const title = String(query.title).trim();
      if (title) {
        condition.where.title = {
          [Op.like]: `%${title}%`,
        };
      }
    }

    const { count, rows } = await Article.findAndCountAll(condition);
    success(res, '查询文章列表成功。', {
      articles: rows,
      pagination: {
        total: count,
        currentPage,
        pageSize,
      },
    });
  } catch (err) {
    failure(res, err);
  }
});

/**
 * 查询文章详情
 *
 * GET /admin/articles/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const article = await getArticle(req);
    success(res, '查询文章成功。', { article });
  } catch (err) {
    failure(res, err);
  }
});

/**
 * 创建文章
 *
 * POST /admin/articles
 */
router.post('/', async function (req, res) {
  try {
    const body = filterBody(req);
    const article = await Article.create(body);
    success(res, '创建文章成功。', { article }, 201);
  } catch (err) {
    failure(res, err);
  }
});

/**
 * 删除文章
 *
 * DELETE /admin/articles/:id
 */
router.delete('/:id', async function (req, res) {
  try {
    const article = await getArticle(req);
    await article.destroy();
    success(res, '文章删除成功。');
  } catch (err) {
    failure(res, err);
  }
});

/**
 * 更新文章
 *
 * PUT /admin/articles/:id
 */
router.put('/:id', async function (req, res) {
  try {
    const body = filterBody(req);
    const article = await getArticle(req);
    await article.update(body);
    success(res, '文章更新成功', { article });
  } catch (err) {
    failure(res, err);
  }
});

/**
 * 白名单过滤：仅允许 title 和 content 字段通过
 *
 * @param {object} req - Express 请求对象
 * @returns {{title: string, content: string}}
 */
function filterBody(req) {
  return {
    title: req.body.title,
    content: req.body.content,
  };
}

/**
 * 查询当前文章
 *
 * 通用方法，被查询详情、更新、删除复用。
 *
 * @param {object} req - Express 请求对象，需包含 req.params.id
 * @returns {Promise<import('sequelize').Model>}
 */
async function getArticle(req) {
  const { id } = req.params;
  const article = await Article.findByPk(id);
  if (!article) {
    throw createError(404, `ID: ${id}的文章没有找到。`);
  }
  return article;
}

module.exports = router;
