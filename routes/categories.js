/**
 * 前台分类路由。
 */
const express = require('express');
const { Category } = require('../models');
const { cacheKeys, remember } = require('../utils/cache');
const { success } = require('../utils/responses');
const { asyncRoute } = require('../utils/routes');

const router = express.Router();

router.get(
  '/',
  asyncRoute(async (req, res) => {
    // 分类变化频率低，读取时优先复用完整分类列表缓存。
    const categories = await remember(cacheKeys.categories, () =>
      Category.findAll({
        // rank 决定人工排序；相同 rank 时新分类排在前面。
        order: [
          ['rank', 'ASC'],
          ['id', 'DESC'],
        ],
      }),
    );

    success(res, '查询分类成功。', { categories });
  }),
);

module.exports = router;
