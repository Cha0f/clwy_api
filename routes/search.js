/**
 * 课程搜索路由。
 */
const express = require('express');
const { Op } = require('sequelize');
const { Course } = require('../models');
const { success } = require('../utils/responses');
const { asyncRoute, paginate } = require('../utils/routes');

const router = express.Router();

/**
 * GET /search
 * 搜索课程（按名称模糊匹配）。
 * @query {string} name - 课程名称（模糊搜索）
 * @query {number} page - 当前页
 * @query {number} pageSize - 每页数量
 * @returns {Object} { courses, pagination: { total, currentPage, pageSize } }
 */
router.get(
  '/',
  asyncRoute(async (req, res) => {
    // 把任意输入规范为字符串并去除首尾空白。
    const name = req.query.name ? String(req.query.name).trim() : '';
    // 空关键词不添加 where，保持原有“返回全部课程”的行为。
    const where = name ? { name: { [Op.like]: `%${name}%` } } : undefined;
    const data = await paginate(
      Course,
      req.query,
      {
        attributes: { exclude: ['content'] },
        where,
        order: [['id', 'DESC']],
      },
      'courses',
    );

    success(res, '搜索课程成功。', data);
  }),
);

module.exports = router;
