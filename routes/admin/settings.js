const express = require('express');
const router = express.Router();
const { Setting } = require('../../models');
const createError = require('http-errors');
const { success, failure } = require('../../utils/responses');
const { delKey } = require('../../utils/redis');

/**
 * 查询系统设置详情
 *
 * Setting 为单例表，使用 findOne 取首行。
 *
 * GET /admin/settings
 */
router.get('/', async (req, res) => {
  try {
    const setting = await getSettings();
    success(res, '查询系统设置成功。', { setting });
  } catch (err) {
    failure(res, err);
  }
});

/**
 * 更新系统设置
 *
 * PUT /admin/settings
 */
router.put('/', async function (req, res) {
  try {
    const body = filterBody(req);
    const setting = await getSettings();
    await setting.update(body);
    // 删除缓存
    await delKey('setting');
    success(res, '系统设置更新成功', { setting });
  } catch (err) {
    failure(res, err);
  }
});

/**
 * 白名单过滤：仅允许 name、icp、copyright 字段通过
 *
 * @param {object} req
 * @returns {{name: string, icp: string, copyright: string}}
 */
function filterBody(req) {
  return {
    name: req.body.name,
    icp: req.body.icp,
    copyright: req.body.copyright,
  };
}

/**
 * 查询当前系统设置（单例）
 *
 * 如果未找到（种子文件未运行），抛出 404 错误。
 *
 * @returns {Promise<import('sequelize').Model>}
 */
async function getSettings() {
  const settings = await Setting.findOne();
  if (!settings) {
    throw createError(404, '初始系统设置没有找到，请运行种子文件。');
  }
  return settings;
}

module.exports = router;
