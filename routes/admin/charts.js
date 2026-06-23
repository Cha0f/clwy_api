/**
 * 管理员统计图表路由。
 */
const express = require('express');
const { User, sequelize } = require('../../models');
const { success } = require('../../utils/responses');
const { asyncRoute } = require('../../utils/routes');

const router = express.Router();

/**
 * 获取用户性别分布统计。
 * @returns {Array} [{ value: number, name: string }] 男性/女性/未选择数量
 */
router.get(
  '/gender',
  asyncRoute(async (req, res) => {
    // 三个性别分组互不依赖，并行统计减少总等待时间。
    const [male, female, unknown] = await Promise.all([
      User.count({ where: { gender: 1 } }),
      User.count({ where: { gender: 2 } }),
      User.count({ where: { gender: 0 } }),
    ]);

    success(res, '查询用户性别成功。', [
      { value: male, name: '男性' },
      { value: female, name: '女性' },
      { value: unknown, name: '未选择' },
    ]);
  }),
);

/**
 * 获取每月注册用户数量。
 * @returns {Object} { months: string[], values: number[] }
 */
router.get(
  '/user',
  asyncRoute(async (req, res) => {
    // MySQL DATE_FORMAT 在数据库端完成按月聚合，避免把全部用户加载到内存。
    const [rows] = await sequelize.query(
      `SELECT DATE_FORMAT(\`createdAt\`, '%Y-%m') AS \`month\`, COUNT(*) AS \`value\` FROM \`${User.getTableName()}\` GROUP BY \`month\` ORDER BY \`month\` ASC`,
    );
    // 图表库通常需要相互对齐的横轴和数值数组。
    const data = rows.reduce(
      (result, row) => {
        result.months.push(row.month);
        result.values.push(row.value);
        return result;
      },
      { months: [], values: [] },
    );

    success(res, '查询每月用户数量成功。', data);
  }),
);

module.exports = router;
