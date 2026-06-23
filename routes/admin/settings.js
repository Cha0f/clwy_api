/**
 * 管理员系统设置路由。
 */
const express = require('express');
const createError = require('http-errors');
const { Setting } = require('../../models');
const { cacheKeys, invalidate } = require('../../utils/cache');
const { flushAll } = require('../../utils/redis');
const { success } = require('../../utils/responses');
const { asyncRoute, pickFields } = require('../../utils/routes');

const router = express.Router();

async function getSetting() {
  // Setting 是单例表，读取第一条记录即可。
  const setting = await Setting.findOne();
  if (!setting) {
    throw createError(404, '初始系统设置没有找到，请运行种子文件。');
  }
  return setting;
}

/**
 * GET /admin/settings
 * 获取系统设置。
 * @returns {Object} { setting }
 */
router.get(
  '/',
  asyncRoute(async (req, res) => {
    const setting = await getSetting();
    success(res, '查询系统设置成功。', { setting });
  }),
);

/**
 * PUT /admin/settings
 * 更新系统设置。
 * @body {string} name - 站点名称
 * @body {string} icp - ICP 备案号
 * @body {string} copyright - 版权信息
 */
router.put(
  '/',
  asyncRoute(async (req, res) => {
    // 设置接口只接受站点名称、备案号和版权信息。
    const body = pickFields(req.body, ['name', 'icp', 'copyright']);
    const setting = await getSetting();
    await setting.update(body);
    // 写入成功后让前台设置接口重新读取数据库。
    await invalidate({ keys: [cacheKeys.setting] });

    success(res, '系统设置更新成功', { setting });
  }),
);

/**
 * GET /admin/settings/flush-all
 * 清空 Redis 所有缓存。
 */
router.get(
  '/flush-all',
  asyncRoute(async (req, res) => {
    // FLUSHALL 会影响当前 Redis 实例的所有数据库，调用方必须是管理员。
    await flushAll();
    success(res, '清除所有缓存成功。');
  }),
);

module.exports = router;
