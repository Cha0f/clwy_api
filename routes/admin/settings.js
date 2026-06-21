const express = require('express');
const router = express.Router();
const { Setting } = require('../../models');
// 引入封装工具
const { NotFoundError } = require('../../utils/errors');
const { success, failure } = require('../../utils/responses');

/**
 * 查询系统设置详情
 * GET /admin/settings
 */
router.get('/', async (req, res) => {
  try {
    // 查询数据
    const setting = await getSettings();
    // 返回查询结果
    success(res, '查询系统设置成功。', { setting });
  } catch (err) {
    failure(res, err);
  }
});

/**
 * 更新系统设置
 * PUT /admin/settings
 */
router.put('/', async function (req, res) {
  try {
    // 白名单过滤
    const body = filterBody(req);
    // 查询系统设置
    const setting = await getSettings(req);
    // 更新系统设置
    await setting.update(body);
    // 返回系统设置更新的结果
    success(res, '系统设置更新成功', { setting });
  } catch (err) {
    failure(res, err);
  }
});

/**
 * 公共方法: 白名单过滤
 * @param req
 * @return {{name,icp:(string|DocumentFragment|*),copyright: (string|*)}}
 */
function filterBody(req) {
  return {
    name: req.body.name,
    icp: req.body.icp,
    copyright: req.body.copyright,
  };
}

/**
 * 公共方法: 查询当前系统设置
 */
async function getSettings(req) {
  // 查询系统设置
  const settings = await Setting.findOne();
  // 如果没有找到
  if (!settings) {
    throw new NotFoundError(`初始系统设置没有找到，请运行种子文件。`);
  }
  return settings;
}

module.exports = router;
