/**
 * 管理员课程路由。
 */
const express = require('express');
const createError = require('http-errors');
const { Op } = require('sequelize');
const { Category, Chapter, Course, User } = require('../../models');
const { invalidateCourses } = require('../../utils/cache');
const { success } = require('../../utils/responses');
const { asyncRoute, findByPkOrFail, paginate, pickFields } = require('../../utils/routes');

const router = express.Router();
const COURSE_FIELDS = [
  'categoryId',
  'userId',
  'name',
  'image',
  'recommended',
  'introductory',
  'content',
];

function listAssociations() {
  return [
    { model: Category, as: 'category', attributes: ['id', 'name'] },
    { model: User, as: 'user', attributes: ['id', 'username', 'avatar'] },
  ];
}

/**
 * GET /admin/courses
 * 获取课程列表（多条件筛选）。
 * @query {number} categoryId - 分类 ID（精确筛选）
 * @query {number} userId - 讲师 ID（精确筛选）
 * @query {string} name - 课程名称（模糊搜索）
 * @query {boolean} recommended - 推荐课程
 * @query {boolean} introductory - 入门课程
 * @query {number} page - 当前页
 * @query {number} pageSize - 每页数量
 * @returns {Object} { courses, pagination: { total, currentPage, pageSize } }
 */
router.get(
  '/',
  asyncRoute(async (req, res) => {
    const where = {};
    // 精确筛选字段仅在请求实际提供时添加。
    if (req.query.categoryId) where.categoryId = req.query.categoryId;
    if (req.query.userId) where.userId = req.query.userId;

    // 名称筛选先规范化字符串，再构造 LIKE 条件。
    const name = req.query.name ? String(req.query.name).trim() : '';
    if (name) where.name = { [Op.like]: `%${name}%` };

    // 查询字符串需要显式转换成布尔值；未提供时不参与筛选。
    if (req.query.recommended) where.recommended = req.query.recommended === 'true';
    if (req.query.introductory) where.introductory = req.query.introductory === 'true';

    const data = await paginate(
      Course,
      req.query,
      {
        where,
        include: listAssociations(),
        order: [['id', 'DESC']],
      },
      'courses',
    );

    success(res, '查询课程列表成功。', data);
  }),
);

/**
 * GET /admin/courses/:id
 * 获取课程详情（含分类、讲师和章节）。
 * @param {number} id - 课程 ID
 * @returns {Object} { course }（含分类、讲师和章节列表）
 */
router.get(
  '/:id',
  asyncRoute(async (req, res) => {
    const course = await findByPkOrFail(
      Course,
      req.params.id,
      {
        include: [
          ...listAssociations(),
          { model: Chapter, as: 'chapter', attributes: ['id', 'title', 'rank', 'createdAt'] },
        ],
        // 关联章节使用完整别名路径排序，确保 Sequelize 生成有效 ORDER BY。
        order: [
          [{ model: Chapter, as: 'chapter' }, 'rank', 'ASC'],
          [{ model: Chapter, as: 'chapter' }, 'id', 'DESC'],
        ],
      },
      '课程',
    );

    success(res, '查询课程成功。', { course });
  }),
);

/**
 * POST /admin/courses
 * 创建课程。
 * @body {number} categoryId - 分类 ID
 * @body {number} userId - 讲师 ID
 * @body {string} name - 课程名称
 * @body {string} image - 课程封面 URL
 * @body {boolean} recommended - 是否推荐
 * @body {boolean} introductory - 是否入门
 * @body {string} content - 课程介绍
 */
router.post(
  '/',
  asyncRoute(async (req, res) => {
    const course = await Course.create(pickFields(req.body, COURSE_FIELDS));
    await invalidateCourses([course.id]);

    success(res, '创建课程成功。', { course }, 201);
  }),
);

/**
 * PUT /admin/courses/:id
 * 更新课程。
 * @param {number} id - 课程 ID
 * @body {number} categoryId - 新分类 ID
 * @body {number} userId - 新讲师 ID
 * @body {string} name - 新名称
 * @body {string} image - 新封面
 * @body {boolean} recommended
 * @body {boolean} introductory
 * @body {string} content - 新介绍
 */
router.put(
  '/:id',
  asyncRoute(async (req, res) => {
    const course = await findByPkOrFail(Course, req.params.id, {}, '课程');
    await course.update(pickFields(req.body, COURSE_FIELDS));
    await invalidateCourses([course.id]);

    success(res, '课程更新成功', { course });
  }),
);

/**
 * DELETE /admin/courses/:id
 * 删除课程（需无可关联章节）。
 * @param {number} id - 课程 ID（需无可关联章节）
 */
router.delete(
  '/:id',
  asyncRoute(async (req, res) => {
    const course = await findByPkOrFail(Course, req.params.id, {}, '课程');
    // 应用层给出友好提示，数据库外键负责阻止并发插入造成的孤儿数据。
    await Course.sequelize.transaction(async (transaction) => {
      const chapterCount = await Chapter.count({
        where: { courseId: course.id },
        transaction,
      });
      if (chapterCount > 0) {
        throw createError(409, '当前课程有章节，无法删除。');
      }
      await course.destroy({ transaction });
    });
    await invalidateCourses([course.id]);

    success(res, '课程删除成功。');
  }),
);

module.exports = router;
