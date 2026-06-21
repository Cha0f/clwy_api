const express = require('express');
const router = express.Router();
const { Article } = require('../../models');
const { Op } = require('sequelize');
// 引入封装工具
const { NotFoundError } = require('../../utils/errors');
const { success, failure } = require('../../utils/responses');

/**
 * 查询文章列表
 * GET /admin/articles
 */
router.get('/', async function (req, res) {
  try {
    // 定义查询参数
    const query = req.query;
    // 获取current_page和page_seize
    const currentPage = Math.abs(Number(query.currentPage)) || 1;
    const pageSize = Math.abs(Number(query.pageSize)) || 10;
    // 计算offset
    const offset = (currentPage - 1) * pageSize;
    // 定义查询条件
    const condition = {
      order: [['id', 'DESC']],
      // 在查询条件中添加offset和pageSize
      limit: pageSize,
      offset,
    };

    // 初始化筛选条件
    condition.where = {};

    // 如果有title查询参数，就添加到where条件中
    if (query.title) {
      condition.where = {
        ...condition.where,
        title: {
          [Op.like]: `%${query.title}%`,
        },
      };
    }

    // 查询数据
    // 将findAll方法改为findAndCountAll方法
    // findAndCountAll方法会返回一个对象，对象中有两个属性，一个是count，一个是rows
    // count 是查询到的数据的总数， rows 中才是查询到的数据
    const { count, rows } = await Article.findAndCountAll(condition);
    // 返回查询结果
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
 * GET /admin/articles/:id
 */
router.get('/:id', async (req, res) => {
  try {
    // 查询数据
    const article = await getArticles(req);
    // 返回查询结果
    success(res, '查询文章成功。', { article });
  } catch (err) {
    failure(res, err);
  }
});

/**
 * 创建文章
 * POST /admin/articles
 */
router.post('/', async function (req, res) {
  try {
    // 白名单过滤
    const body = filterBody(req);
    // 创建文章
    const article = await Article.create(body);
    // 返回创建文章的结果
    success(res, '创建文章成功。', { article }, 201);
  } catch (err) {
    failure(res, err);
  }
});

/**
 * 删除文章
 * DELETE /admin/articles/:id
 */
router.delete('/:id', async function (req, res) {
  try {
    // 查询文章
    const article = await getArticles(req);
    // 删除文章
    await article.destroy();
    // 返回删除文章的结果
    success(res, '文章删除成功。');
  } catch (err) {
    failure(res, err);
  }
});

/**
 * 更新文章
 * PUT /admin/articles/:id
 */
router.put('/:id', async function (req, res) {
  try {
    // 白名单过滤
    const body = filterBody(req);
    // 查询文章
    const article = await getArticles(req);
    // 更新文章
    await article.update(body);
    // 返回文章更新的结果
    success(res, '文章更新成功', { article });
  } catch (err) {
    failure(res, err);
  }
});

/**
 * 公共方法: 白名单过滤
 * @param req
 * @return {{title, content: (string|string|DocumentFragment|*)}}
 */
function filterBody(req) {
  return {
    title: req.body.title,
    content: req.body.content,
  };
}

/**
 * 公共方法: 查询当前文章
 */
async function getArticles(req) {
  // 获取文章id
  const { id } = req.params;
  // 查询当前文章
  const articles = await Article.findByPk(id);
  // 如果没有找到
  if (!articles) {
    throw new NotFoundError(`ID: ${id}的文章没有找到。`);
  }
  return articles;
}

module.exports = router;
