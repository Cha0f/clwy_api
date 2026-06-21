const express = require('express');
const router = express.Router();
const { Course } = require('../models');
const { success, failure } = require('../utils/responses');
const { Op } = require('sequelize');
const { getPagination } = require('../utils/pagination');

/**
 * 搜索课程
 *
 * 根据课程名称进行模糊查询（LIKE），支持分页。
 * 搜索关键词经 String/.trim 净化后使用，防止类型绕过。
 * 未传 name 参数时返回全部课程。
 *
 * GET /search?name=&currentPage=&pageSize=
 */
router.get('/', async function (req, res) {
  try {
    const query = req.query;
    const { currentPage, pageSize, offset } = getPagination(query);

    const condition = {
      attributes: { exclude: ['CategoryId', 'UserId', 'content'] },
      order: [['id', 'DESC']],
      limit: pageSize,
      offset,
    };

    if (query.name) {
      const name = String(query.name).trim();
      if (name) {
        condition.where = {
          name: {
            [Op.like]: `%${name}%`,
          },
        };
      }
    }

    const { count, rows } = await Course.findAndCountAll(condition);
    success(res, '搜索课程成功。', {
      courses: rows,
      pagination: {
        total: count,
        currentPage,
        pageSize,
      },
    });
  } catch (error) {
    failure(res, error);
  }
});

module.exports = router;
