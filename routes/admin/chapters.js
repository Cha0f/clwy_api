/**
 * 管理员章节路由。
 */
const express = require('express');
const createError = require('http-errors');
const { Op } = require('sequelize');
const { Chapter, Course } = require('../../models');
const { invalidateCourses } = require('../../utils/cache');
const { success } = require('../../utils/responses');
const { asyncRoute, findByPkOrFail, paginate, pickFields } = require('../../utils/routes');

const router = express.Router();
const CHAPTER_FIELDS = ['courseId', 'title', 'content', 'video', 'rank'];

function chapterQueryOptions() {
  return {
    include: [{ model: Course, as: 'course', attributes: ['id', 'name'] }],
  };
}

// GET /admin/chapters?courseId=&title=&page=&pageSize=
// @query {number} courseId - 课程 ID（必填）
// @query {string} title - 章节标题（模糊搜索）
// @query {number} page - 当前页
// @query {number} pageSize - 每页数量
// @returns {Object} { chapters, pagination: { total, currentPage, pageSize } }
router.get(
  '/',
  asyncRoute(async (req, res) => {
    // 章节列表必须限定课程，避免跨课程混排。
    if (!req.query.courseId) {
      throw createError(400, '获取章节列表失败，课程ID不能为空。');
    }
    const title = req.query.title ? String(req.query.title).trim() : '';
    const where = { courseId: req.query.courseId };
    if (title) where.title = { [Op.like]: `%${title}%` };

    const data = await paginate(
      Chapter,
      req.query,
      {
        ...chapterQueryOptions(),
        where,
        order: [
          ['rank', 'ASC'],
          ['id', 'ASC'],
        ],
      },
      'chapters',
    );

    success(res, '查询章节列表成功。', data);
  }),
);

// GET /admin/chapters/:id
// @param {number} id - 章节 ID
// @returns {Object} { chapter }
router.get(
  '/:id',
  asyncRoute(async (req, res) => {
    const chapter = await findByPkOrFail(Chapter, req.params.id, chapterQueryOptions(), '章节');
    success(res, '查询章节成功。', { chapter });
  }),
);

// POST /admin/chapters
// @body {number} courseId - 课程 ID（必填）
// @body {string} title - 章节标题
// @body {string} content - 章节内容
// @body {string} video - 视频 URL
// @body {number} rank - 排序权重
router.post(
  '/',
  asyncRoute(async (req, res) => {
    const body = pickFields(req.body, CHAPTER_FIELDS);
    // 提前检查课程可返回清晰错误；外键约束仍是最终保护。
    await findByPkOrFail(Course, body.courseId, {}, '课程');

    const chapter = await Chapter.sequelize.transaction(async (transaction) => {
      // 创建章节与增加冗余计数必须同时提交或同时回滚。
      const created = await Chapter.create(body, { transaction });
      await Course.increment('chaptersCount', {
        where: { id: created.courseId },
        transaction,
      });
      return created;
    });
    await invalidateCourses([chapter.courseId], [chapter.id]);

    success(res, '创建章节成功。', { chapter }, 201);
  }),
);

// PUT /admin/chapters/:id
// @param {number} id - 章节 ID
// @body {number} courseId - 新课程 ID（跨课程移动时同步双方计数器）
// @body {string} title - 新标题
// @body {string} content - 新内容
// @body {string} video - 新视频 URL
// @body {number} rank - 新排序权重
router.put(
  '/:id',
  asyncRoute(async (req, res) => {
    const body = pickFields(req.body, CHAPTER_FIELDS);
    const chapter = await findByPkOrFail(Chapter, req.params.id, {}, '章节');
    const previousCourseId = chapter.courseId;
    const nextCourseId = body.courseId ?? previousCourseId;

    await Chapter.sequelize.transaction(async (transaction) => {
      if (Number(nextCourseId) !== Number(previousCourseId)) {
        // 按主键升序锁定两门课程，降低并发移动章节时的死锁概率。
        const courseIds = [previousCourseId, nextCourseId].sort((a, b) => Number(a) - Number(b));
        const courses = await Course.findAll({
          where: { id: { [Op.in]: courseIds } },
          order: [['id', 'ASC']],
          transaction,
          lock: transaction.LOCK.UPDATE,
        });
        if (courses.length !== 2) {
          throw createError(400, '更新章节失败，课程不存在。');
        }

        // 更新章节归属，并同步旧课程与新课程计数器。
        await chapter.update(body, { transaction });
        await Course.decrement('chaptersCount', {
          where: { id: previousCourseId },
          transaction,
        });
        await Course.increment('chaptersCount', {
          where: { id: nextCourseId },
          transaction,
        });
        return;
      }

      // 课程未变化时无需修改计数器。
      await chapter.update(body, { transaction });
    });
    await invalidateCourses([previousCourseId, nextCourseId], [chapter.id]);

    success(res, '章节更新成功', { chapter });
  }),
);

// DELETE /admin/chapters/:id
// @param {number} id - 章节 ID（删除后减少所属课程章节数）
router.delete(
  '/:id',
  asyncRoute(async (req, res) => {
    const chapter = await findByPkOrFail(Chapter, req.params.id, {}, '章节');
    await Chapter.sequelize.transaction(async (transaction) => {
      // 删除章节与减少课程计数必须保持原子性。
      await chapter.destroy({ transaction });
      await Course.decrement('chaptersCount', {
        where: { id: chapter.courseId },
        transaction,
      });
    });
    await invalidateCourses([chapter.courseId], [chapter.id]);

    success(res, '章节删除成功。');
  }),
);

module.exports = router;
