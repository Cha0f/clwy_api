/**
 * 前台课程路由。
 */
const express = require('express');
const createError = require('http-errors');
const { Category, Chapter, Course, User } = require('../models');
const { cacheKeys, remember } = require('../utils/cache');
const { getPagination } = require('../utils/pagination');
const { success } = require('../utils/responses');
const { asyncRoute, findByPkOrFail, paginate } = require('../utils/routes');

const router = express.Router();

/**
 * GET /courses
 * 获取课程列表（需指定分类ID）。
 * @query {number} categoryId - 分类 ID（必填）
 * @query {number} page - 当前页
 * @query {number} pageSize - 每页数量
 * @returns {Object} { courses, pagination: { total, currentPage, pageSize } }
 */
router.get(
  '/',
  asyncRoute(async (req, res) => {
    // 课程列表必须属于一个明确分类，避免无条件扫描整张课程表。
    const { categoryId } = req.query;
    if (!categoryId) {
      throw createError(400, '获取课程列表失败，分类ID不能为空。');
    }

    // 规范化分页值后构造稳定缓存键。
    const { currentPage, pageSize } = getPagination(req.query);
    const key = cacheKeys.courseList(categoryId, currentPage, pageSize);
    const data = await remember(key, () =>
      paginate(
        Course,
        req.query,
        {
          attributes: { exclude: ['content'] },
          where: { categoryId },
          order: [['id', 'DESC']],
        },
        'courses',
      ),
    );

    success(res, '查询课程列表成功。', data);
  }),
);

/**
 * GET /courses/:id
 * 获取课程详情（含分类、讲师和章节）。
 * @param {number} id - 课程 ID
 * @returns {Object} { course, category, user, chapters }
 */
router.get(
  '/:id',
  asyncRoute(async (req, res) => {
    const { id } = req.params;
    // 课程主体、分类、公开讲师资料和章节目录分别缓存，便于精确失效。
    const course = await remember(cacheKeys.course(id), () =>
      findByPkOrFail(Course, id, {}, '课程'),
    );
    const [category, user, chapters] = await Promise.all([
      remember(cacheKeys.category(course.categoryId), () => Category.findByPk(course.categoryId)),
      remember(cacheKeys.publicUser(course.userId), () =>
        User.findByPk(course.userId, { attributes: User.publicAttributes }),
      ),
      remember(cacheKeys.chapters(course.id), () =>
        Chapter.findAll({
          attributes: { exclude: ['content'] },
          where: { courseId: course.id },
          order: [
            ['rank', 'ASC'],
            ['id', 'DESC'],
          ],
        }),
      ),
    ]);

    success(res, '查询课程成功。', { course, category, user, chapters });
  }),
);

module.exports = router;
