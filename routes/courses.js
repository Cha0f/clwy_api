const express = require('express');
const router = express.Router();
const { Course, Category, Chapter, User } = require('../models');
const { success, failure } = require('../utils/responses');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const { getPagination } = require('../utils/pagination');

/**
 * 查询课程列表
 *
 * 必填参数 categoryId，按 id 降序排列。
 * 可选分页参数 currentPage / pageSize。
 *
 * GET /courses?categoryId=&page=&pageSize=
 */
router.get('/', async (req, res) => {
  try {
    const query = req.query;
    const { currentPage, pageSize, offset } = getPagination(query);

    if (!query.categoryId) {
      throw new BadRequestError('获取课程列表失败，分类ID不能为空');
    }

    const condition = {
      attributes: { exclude: ['CategoryId', 'UserId', 'content'] },
      where: { categoryId: query.categoryId },
      order: [['id', 'DESC']],
      limit: pageSize,
      offset,
    };
    const { count, rows } = await Course.findAndCountAll(condition);
    success(res, '查询课程列表成功。', {
      courses: rows,
      pagination: {
        total: count,
        currentPage,
        pageSize,
      },
    });
  } catch (err) {
    failure(res, err);
  }
});

/**
 * 查询课程详情
 *
 * 附带关联的分类、章节列表和讲师信息。
 *
 * GET /courses/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const condition = {
      attributes: { exclude: ['CategoryId', 'UserId'] },
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name'],
        },
        {
          model: Chapter,
          as: 'chapter',
          attributes: ['id', 'title', 'rank', 'createdAt'],
          order: [
            ['rank', 'ASC'],
            ['id', 'DESC'],
          ],
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'nickname', 'avatar', 'company'],
        },
      ],
    };
    const course = await Course.findByPk(id, condition);
    if (!course) {
      throw new NotFoundError(`ID: ${id}的课程未找到。`);
    }

    success(res, '查询课程成功。', { course });
  } catch (err) {
    failure(res, err);
  }
});

module.exports = router;
