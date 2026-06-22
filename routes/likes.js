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
 * 整个 findOne → create/destroy → increment/decrement 序列在事务中执行，
 * 防止并发下的竞态条件。同时 (courseId, userId) 的唯一索引在数据库层做兜底约束。
 *
 * POST /likes
 */
router.post('/', async function (req, res) {
  try {
    const userId = req.userId;
    const { courseId } = req.body;

    // 先验证引用的课程是否存在
    const course = await Course.findByPk(courseId);
    if (!course) {
      throw createError(404, '课程不存在。');
    }

    // 在事务中执行 check-then-act，避免并发竞态
    const sequelize = Course.sequelize;
    await sequelize.transaction(async (t) => {
      // 在事务内查询是否已点赞（事务的隔离级别保证可重复读）
      const like = await Like.findOne({
        where: { courseId, userId },
        transaction: t,
      });

      if (!like) {
        // 未点赞 → 创建点赞记录，并增加课程的点赞数
        await Like.create({ courseId, userId }, { transaction: t });
        await course.increment('likesCount', { by: 1, transaction: t });
        success(res, '点赞成功。');
      } else {
        // 已点赞 → 删除点赞记录，并减少课程的点赞数
        await like.destroy({ transaction: t });
        await course.decrement('likesCount', { by: 1, transaction: t });
        success(res, '取消赞成功。');
      }
    });
    // 事务自动提交：以上任一操作失败则全部回滚（likesCount 与 Like 记录保持一致）
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 查询用户点赞的课程列表
 *
 * 通过 User 与 Course 的多对多关联（through: Like）查询，
 * 分页返回当前用户点赞过的课程，按 id 降序（最新点赞优先）。
 *
 * GET /likes?currentPage=&pageSize=
 */
router.get('/', async function (req, res) {
  try {
    const query = req.query;
    const { currentPage, pageSize, offset } = getPagination(query);

    // 先查用户（用于后续的关联查询）
    const user = await User.findByPk(req.userId);

    // 通过 Sequelize 自动生成的 getLikeCourses 方法查询点赞课程
    const courses = await user.getLikeCourses({
      joinTableAttributes: [],          // 不返回中间表（Like）的字段
      attributes: { exclude: ['CategoryId', 'UserId', 'content'] },
      order: [['id', 'DESC']],
      limit: pageSize,
      offset,
    });

    // 获取点赞课程总数（供前端分页）
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
