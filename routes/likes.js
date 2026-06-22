const express = require('express');
const router = express.Router();
const { Course, Like, User } = require('../models');
const { success, failure } = require('../utils/responses');
const createError = require('http-errors');
const { getPagination } = require('../utils/pagination');

/**
 * 点赞 / 取消赞
 *
 * 幂等接口：检查该用户是否已点赞过该课程。
 *   - 未点赞 → 新增 Like 记录，课程 likesCount + 1
 *   - 已点赞 → 删除 Like 记录，课程 likesCount - 1
 *
 * POST /likes
 */
router.post('/', async function (req, res) {
  try {
    const userId = req.userId;
    const { courseId } = req.body;

    // 验证课程存在
    const course = await Course.findByPk(courseId);
    if (!course) {
      throw createError(404, '课程不存在。');
    }

    // 在事务中执行 check-then-act，避免竞态条件
    const sequelize = Course.sequelize;
    await sequelize.transaction(async (t) => {
      // 查询是否已点赞（在事务内，可重复读）
      const like = await Like.findOne({
        where: { courseId, userId },
        transaction: t,
      });

      if (!like) {
        // 未点赞 → 创建点赞记录
        // 如果数据库唯一索引检测到重复，会抛 UniqueConstraintError，事务自动回滚
        await Like.create({ courseId, userId }, { transaction: t });
        await course.increment('likesCount', { by: 1, transaction: t });
        success(res, '点赞成功。');
      } else {
        // 已点赞 → 删除点赞记录
        await like.destroy({ transaction: t });
        await course.decrement('likesCount', { by: 1, transaction: t });
        success(res, '取消赞成功。');
      }
    });
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 查询用户点赞的课程列表
 *
 * 通过 User 与 Course 的多对多关联（through: Like）查询，
 * 分页返回当前用户点赞过的课程。
 *
 * GET /likes?currentPage=&pageSize=
 */
router.get('/', async function (req, res) {
  try {
    const query = req.query;
    const { currentPage, pageSize, offset } = getPagination(query);

    // 查询当前用户（用于后续的关联查询）
    const user = await User.findByPk(req.userId);

    // 通过多对多关联获取该用户点赞的课程
    const courses = await user.getLikeCourses({
      joinTableAttributes: [],
      attributes: { exclude: ['CategoryId', 'UserId', 'content'] },
      order: [['id', 'DESC']],
      limit: pageSize,
      offset,
    });

    // 获取点赞课程总数
    const count = await user.countLikeCourses();

    success(res, '查询用户点赞的课程成功。', {
      courses,
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
