const express = require('express');
const router = express.Router();
const { Article } = require('../../models');
const { Op } = require('sequelize');

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

    // 如果有title查询参数，就添加到where条件中
    if (query.title) {
      condition.where = {
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
    res.json({
      status: 200,
      message: '查询文章列表成功',
      data: {
        articles: rows,
        pagination: {
          total: count,
          currentPage,
          pageSize,
        },
      },
    });
  } catch (err) {
    res.json({
      status: 500,
      message: '查询文章列表失败。',
      errors: [err.message],
    });
  }
});

/**
 * 查询文章详情
 * GET /admin/articles/:id
 */
router.get('/:id', async (req, res) => {
  try {
    // 获取文章id
    const { id } = req.params;
    // 查询数据
    const article = await Article.findByPk(id);
    // 返回查询结果
    if (article) {
      res.json({
        status: 200,
        message: '查询文章详情成功。',
        data: article,
      });
    } else {
      res.status(404).json({
        status: 404,
        message: '文章未找到。',
      });
    }
  } catch (err) {
    res.status(500).json({
      status: 500,
      message: '查询文章详情失败。',
      errors: [err.message],
    });
  }
});

/**
 * 创建文章
 * POST /admin/articles
 */
router.post('/', async function (req, res) {
  // 白名单过滤
  const body = filterBody(req);
  try {
    // 创建文章
    const article = await Article.create(body);
    // 返回创建文章的结果
    res.status(201).json({
      status: 200,
      message: '创建文章成功',
      data: article,
    });
  } catch (err) {
    if (err.name === 'SequelizeValidationError') {
      const errors = err.errors.map((e) => e.message);
      res.status(400).json({
        status: 400,
        message: '请求参数错误。',
        errors,
      });
    } else {
      res.status(500).json({
        status: 500,
        message: '创建文章失败。',
        errors: [err.message],
      });
    }
  }
});

/**
 * 删除文章
 * DELETE /admin/article/:id
 */
router.delete('/:id', async function (req, res) {
  try {
    // 获取文章id
    const { id } = req.params;
    // 查询文章
    const article = await Article.findByPk(id);
    // 判断是否查到文章返回相应数据
    if (article) {
      // 删除文章
      await article.destroy();
      // 返回删除文章的结果
      res.status(200).json({
        status: 200,
        message: '文章删除成功。',
      });
    } else {
      res.status(404).json({
        status: 404,
        message: '文章未找到。',
      });
    }
  } catch (err) {
    res.status(500).json({
      status: 500,
      message: '文章删除失败。',
      errors: [err.message],
    });
  }
});

/**
 * 更新文章
 * PUT /admin/articles/:id
 */
router.put('/:id', async function (req, res) {
  // 白名单过滤
  const body = filterBody(req);
  try {
    // 获取文章的id
    const { id } = req.params;
    // 查询文章
    const article = await Article.findByPk(id);
    // 根据查询文章的结果做判断
    if (article) {
      // 更新文章
      await article.update(body);
      // 返回文章更新的结果
      res.status(200).json({
        status: 200,
        message: '文章更新成功',
      });
    } else {
      res.status(404).json({
        status: 404,
        message: '文章未找到。',
      });
    }
  } catch (err) {
    res.status(500).json({
      status: 500,
      message: '文章修改失败。',
      errors: [err.message],
    });
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

module.exports = router;
