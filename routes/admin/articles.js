const express = require('express');
const router = express.Router();
const { Article } = require('../../models');
const { Op } = require('sequelize');
const createError = require('http-errors');
const { success, failure } = require('../../utils/responses');
const { getPagination } = require('../../utils/pagination');
const { getKeyByPattern, delKey } = require('../../utils/redis');

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

    // 查询被软删除的数据
    if (query.deleted === 'true') {
      condition.paranoid = false;
      condition.where.deletedAt = {
        [Op.not]: null,
      };
    }

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
    await clearCache();
    success(res, '创建文章成功。', { article }, 201);
  } catch (err) {
    failure(res, err);
  }
});

/**
 * 删除到回收站
 * POST /admin/articles/delete
 */
router.post('/delete', async function (req, res) {
  try {
    const { id } = req.body;

    await Article.destroy({ where: { id: id } });
    await clearCache(id);
    success(res, '已删除到回收站。');
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 从回收站恢复
 * POST /admin/articles/restore
 */
router.post('/restore', async function (req, res) {
  try {
    const { id } = req.body;

    await Article.restore({ where: { id: id } });
    await clearCache(id);
    success(res, '已恢复成功。');
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 彻底删除
 * POST /admin/articles/force_delete
 */
router.post('/force_delete', async function (req, res) {
  try {
    const { id } = req.body;

    await Article.destroy({
      where: { id: id },
      force: true,
    });
    await clearCache(id);
    success(res, '已彻底删除。');
  } catch (error) {
    failure(res, error);
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
    await clearCache(article.id);
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

/**
 * 清除缓存
 * @returns {Promise<void>}
 */
async function clearCache(id) {
  // 清除所有文章列表缓存
  const keys = await getKeyByPattern('articles:*');

  if (keys.length !== 0) {
    await delKey(keys);
  }

  // 如果传递了id，则通过id清除文章详情缓存
  if (id) {
    // 如果是数组，则遍历
    const keys = Array.isArray(id) ? id.map((item) => `article:${item}`) : `article:${id}`;
    await delKey(keys);
  }
}

module.exports = router;
