const express = require('express');
const router = express.Router();
const { Course } = require('../models');
const { success, failure } = require('../utils/responses');
const { Op } = require('sequelize');
const { getPagination } = require('../utils/pagination');

/**
 * 搜索课程
 * GET /search
 */
router.get('/', async function (req, res) {
  try {
    const query = req.query;
    const { currentPage, pageSize, offset } = getPagination(query);

    const condition = {
      attributes: { exclude: ['CategoryId', 'UserId', 'content'] },
      order: [['id', 'DESC']],
      limit: pageSize,
      offset: offset,
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
