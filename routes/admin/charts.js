const express = require('express');
const router = express.Router();
const { sequelize, User } = require('../../models');
const { Op } = require('sequelize');
const { NotFoundError, success, failure } = require('../../utils/response');

/**
 * 统计用户性别
 * GET /admin/charts/gender
 */
router.get('/gender', async (req, res) => {
  try {
    const male = await User.count({ where: { gender: 1 } });
    const female = await User.count({ where: { gender: 2 } });
    const unknown = await User.count({ where: { gender: 0 } });

    const data = [
      { value: male, name: '男性' },
      { value: female, name: '女性' },
      { value: unknown, name: '未选择' },
    ];
    success(res, '查询用户性别成功。', data);
  } catch (e) {
    failure(res, e);
  }
});

/**
 * 统计每个月用户数量
 * GET /admin/charts/user
 */
router.get('/user', async (req, res) => {
  try {
    const [result] = await sequelize.query(
      "SELECT DATE_FORMAT(`createdAt`, '%Y-%m') AS `month`, COUNT(*) AS `value` FROM `Users` GROUP BY `month` ORDER BY `month` ASC",
    );
    const data = {
      months: [],
      values: [],
    };
    result.forEach((item) => {
      data.months.push(item.month);
      data.values.push(item.value);
    });

    success(res, '查询每月用户数量成功。', data);
  } catch (e) {
    failure(res, e);
  }
});

module.exports = router;
