/**
 * 前台章节详情路由。
 */
const express = require('express');
const createError = require('http-errors');
const { Chapter, Course, User } = require('../models');
const { cacheKeys, remember } = require('../utils/cache');
const { success } = require('../utils/responses');
const { asyncRoute, findByPkOrFail } = require('../utils/routes');

const router = express.Router();

// GET /chapters/:id
// @param {number} id - 章节 ID
// @returns {Object} { chapter, course, user, chapters }
router.get(
  '/:id',
  asyncRoute(async (req, res) => {
    const { id } = req.params;
    // 当前章节包含正文，使用独立详情缓存。
    const chapter = await remember(cacheKeys.chapter(id), () =>
      findByPkOrFail(Chapter, id, {}, '章节'),
    );
    // 章节页只需要课程摘要，不能与完整课程详情复用不同形状的缓存。
    const course = await remember(cacheKeys.courseSummary(chapter.courseId), () =>
      Course.findByPk(chapter.courseId, { attributes: ['id', 'name', 'userId'] }),
    );
    if (!course) {
      throw createError(404, '章节所属课程不存在。');
    }

    // 讲师资料和同课程目录互不依赖，并行加载。
    const [user, chapters] = await Promise.all([
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

    success(res, '查询章节成功。', { chapter, course, user, chapters });
  }),
);

module.exports = router;
