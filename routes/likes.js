/**
 * 用户点赞路由。
 */
const express = require('express');
const createError = require('http-errors');
const { Course, Like, User } = require('../models');
const { invalidateCourses } = require('../utils/cache');
const { getPagination } = require('../utils/pagination');
const { success } = require('../utils/responses');
const { asyncRoute, findByPkOrFail } = require('../utils/routes');

const router = express.Router();

/**
 * POST /likes
 * 切换课程点赞状态。
 * @body {number} courseId - 课程 ID
 */
router.post(
  '/',
  asyncRoute(async (req, res) => {
    const { courseId } = req.body;
    const userId = req.userId;

    // 锁定课程行，把同一课程的点赞切换串行化。
    const message = await Course.sequelize.transaction(async (transaction) => {
      const course = await Course.findByPk(courseId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!course) {
        throw createError(404, '课程不存在。');
      }

      // 课程锁持有期间读取当前用户的点赞状态。
      const like = await Like.findOne({ where: { courseId, userId }, transaction });
      if (like) {
        // 已点赞：删除关系并同步减少冗余计数器。
        await like.destroy({ transaction });
        await course.decrement('likesCount', { by: 1, transaction });
        return '取消赞成功。';
      }

      // 未点赞：创建唯一关系并同步增加冗余计数器。
      await Like.create({ courseId, userId }, { transaction });
      await course.increment('likesCount', { by: 1, transaction });
      return '点赞成功。';
    });

    // 事务提交后清理所有包含 likesCount 的课程缓存。
    await invalidateCourses([courseId]);
    success(res, message);
  }),
);

/**
 * GET /likes
 * 获取用户点赞的课程列表。
 * @query {number} page - 当前页
 * @query {number} pageSize - 每页数量
 * @returns {Object} { courses, pagination: { total, currentPage, pageSize } }
 */
router.get(
  '/',
  asyncRoute(async (req, res) => {
    const { currentPage, pageSize, offset } = getPagination(req.query);
    // 先确认 Token 中的用户仍然存在，避免对 null 调用关联方法。
    const user = await findByPkOrFail(User, req.userId, {}, '用户');
    // 点赞课程和总数互不依赖，可以并行查询。
    const [courses, total] = await Promise.all([
      user.getLikeCourses({
        joinTableAttributes: [],
        attributes: { exclude: ['content'] },
        order: [['id', 'DESC']],
        limit: pageSize,
        offset,
      }),
      user.countLikeCourses(),
    ]);

    success(res, '查询用户点赞的课程成功。', {
      courses,
      pagination: { total, currentPage, pageSize },
    });
  }),
);

module.exports = router;
