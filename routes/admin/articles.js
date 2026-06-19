const express = require('express');
const router = express.Router();
const { Article } = require('../../models');

/**
 * 查询文章列表
 * GET /admin/articles
 */
router.get('/', async function (req, res) {
  try {
    // 定义查询条件
    const condition = {
      order: [['id', 'DESC']],
    };

    // 查询数据
    const articles = await Article.findAll({ order: [['id', 'DESC']] });

    // 返回查询结果
    res.json({
      status: 200,
      message: '查询文章列表成功',
      data: articles,
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
  try {
    const article = await Article.create(req.body);

    res.status(201).json({
      status: 200,
      message: '创建文章成功',
      data: article,
    });
  } catch (err) {
    res.status(500).json({
      status: 500,
      message: '文章创建失败',
      errors: [err.message],
    });
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
  try {
    const { id } = req.params;
    const article = await Article.findByPk(id);

    if (article) {
      await article.update(req.body);
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

module.exports = router;
