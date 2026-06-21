const express = require('express');
const router = express.Router();
const { Category } = require('../models');
const { success, failure } = require('../utils/responses');

/**
 * 查询分类列表
 *
 * 按 rank（排序权重）升序、id 降序返回全部分类。
 *
 * GET /categories
 */
router.get('/', async (req, res) => {
  try {
    const categories = await Category.findAll({
      order: [
        ['rank', 'ASC'],
        ['id', 'DESC'],
      ],
    });
    success(res, '查询分类成功。', { categories });
  } catch (err) {
    failure(res, err);
  }
});

module.exports = router;
