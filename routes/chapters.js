const express = require('express');
const router = express.Router();
const { Course, Chapter, User } = require('../models');
const { success, failure } = require('../utils/responses');
const createError = require('http-errors');

/**
 * 查询章节详情
 *
 * 返回该章节信息、关联的课程和讲师，以及同属一个课程的其他所有章节。
 * 使用 Sequelize 懒加载（getCourse → getUser）替代深层嵌套 include，
 * 提高查询可读性和灵活性。
 *
 * GET /chapters/:id
 */
router.get('/:id', async function (req, res) {
  try {
    const { id } = req.params;

    // 1. 查询当前章节，排除 CourseId 外键
    const chapter = await Chapter.findByPk(id, {
      attributes: { exclude: ['CourseId'] },
    });

    if (!chapter) {
      throw createError(404, `ID: ${id}的章节未找到。`);
    }

    // 2. 懒加载该章节所属的课程（仅需 id、name、userId 用于下一步）
    const course = await chapter.getCourse({
      attributes: ['id', 'name', 'userId'],
    });

    // 3. 懒加载该课程的讲师信息
    const user = await course.getUser({
      attributes: ['id', 'username', 'nickname', 'avatar', 'company'],
    });

    // 4. 查询同属一个课程的所有章节（供导航或目录使用）
    const chapters = await Chapter.findAll({
      attributes: { exclude: ['CourseId', 'content'] },
      where: { courseId: chapter.courseId },
      order: [
        ['rank', 'ASC'],
        ['id', 'DESC'],
      ],
    });

    success(res, '查询章节成功。', { chapter, course, user, chapters });
  } catch (error) {
    failure(res, error);
  }
});

module.exports = router;
