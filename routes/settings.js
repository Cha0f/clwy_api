/**
 * 前台站点设置路由。
 */
const express = require('express');
const createError = require('http-errors');
const { Setting } = require('../models');
const { cacheKeys, remember } = require('../utils/cache');
const { success } = require('../utils/responses');
const { asyncRoute } = require('../utils/routes');

const router = express.Router();

// GET /settings
// @returns {Object} { setting }
router.get(
  '/',
  asyncRoute(async (req, res) => {
    // Setting 是单例表，因此使用固定缓存键和 findOne。
    const setting = await remember(cacheKeys.setting, async () => {
      const value = await Setting.findOne();
      if (!value) {
        throw createError(404, '未找到系统设置，请联系管理员。');
      }
      return value;
    });

    success(res, '查询系统信息成功。', { setting });
  }),
);

module.exports = router;
