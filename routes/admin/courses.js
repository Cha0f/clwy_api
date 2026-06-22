const express = require('express');
const router = express.Router();
const { Course, Category, User, Chapter } = require('../../models');
const { Op } = require('sequelize');
const createError = require('http-errors');
const { success, failure } = require('../../utils/responses');
const { getPagination } = require('../../utils/pagination');

/**
 * 查询课程列表
 *
 * 支持多条件筛选：categoryId、userId、name（模糊）、recommended、introductory。
 *
 * GET /admin/courses?categoryId=&userId=&name=&recommended=&introductory=&currentPage=&pageSize=
 */
router.get('/', async function (req, res) {
  try {
    const query = req.query;
    const { currentPage, pageSize, offset } = getPagination(query);

    const condition = {
      ...getCondition(),
      order: [['id', 'DESC']],
      limit: pageSize,
      offset,
      where: {},
    };

    // 按分类筛选
    if (query.categoryId) {
      condition.where.categoryId = { [Op.eq]: query.categoryId };
    }

    // 按讲师筛选
    if (query.userId) {
      condition.where.userId = { [Op.eq]: query.userId };
    }

    // 按名称模糊搜索（输入净化）
    if (query.name) {
      const name = String(query.name).trim();
      if (name) {
        condition.where.name = { [Op.like]: `%${name}%` };
      }
    }

    // 是否推荐（URL 参数为字符串，需转布尔值）
    if (query.recommended) {
      condition.where.recommended = { [Op.eq]: query.recommended === 'true' };
    }

    // 是否入门课程
    if (query.introductory) {
      condition.where.introductory = { [Op.eq]: query.introductory === 'true' };
    }

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
 * 附带关联的分类和用户信息。
 *
 * GET /admin/courses/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const course = await getCourse(req);
    success(res, '查询课程成功。', { course });
  } catch (err) {
    failure(res, err);
  }
});

/**
 * 创建课程
 *
 * POST /admin/courses
 */
router.post('/', async function (req, res) {
  try {
    const body = filterBody(req);
    const course = await Course.create(body);
    success(res, '创建课程成功。', { course }, 201);
  } catch (err) {
    failure(res, err);
  }
});

/**
 * 删除课程
 *
 * 删除前检查是否有章节关联（有则禁止删除）。
 *
 * DELETE /admin/courses/:id
 */
router.delete('/:id', async function (req, res) {
  try {
    const course = await getCourse(req);

    // 在事务中检查章节关联并删除课程，防止竞态
    const sequelize = Course.sequelize;
    await sequelize.transaction(async (t) => {
      const count = await Chapter.count({
        where: { courseId: req.params.id },
        transaction: t,
      });
      if (count > 0) {
        throw createError(400, '当前课程有章节，无法删除。');
      }

      await course.destroy({ transaction: t });
    });
    success(res, '课程删除成功。');
  } catch (err) {
    failure(res, err);
  }
});

/**
 * 更新课程
 *
 * PUT /admin/courses/:id
 */
router.put('/:id', async function (req, res) {
  try {
    const body = filterBody(req);
    const course = await getCourse(req);
    await course.update(body);
    success(res, '课程更新成功', { course });
  } catch (err) {
    failure(res, err);
  }
});

/**
 * 白名单过滤：允许课程相关字段通过
 *
 * @param {object} req
 * @returns {{categoryId: number, userId: number, name: string, image: string, recommended: boolean, introductory: boolean, content: string}}
 */
function filterBody(req) {
  return {
    categoryId: req.body.categoryId,
    userId: req.body.userId,
    name: req.body.name,
    image: req.body.image,
    recommended: req.body.recommended,
    introductory: req.body.introductory,
    content: req.body.content,
  };
}

/**
 * 课程列表关联配置：关联分类和用户（讲师）
 *
 * @returns {{include: [{as: string, model, attributes: string[]}], attributes: {exclude: string[]}}}
 */
function getCondition() {
  return {
    attributes: { exclude: ['CategoryId', 'UserId'] },
    include: [
      { model: Category, as: 'category', attributes: ['id', 'name'] },
      { model: User, as: 'user', attributes: ['id', 'username', 'avatar'] },
    ],
  };
}

/**
 * 查询当前课程（含关联分类和用户）
 *
 * @param {object} req
 * @returns {Promise<import('sequelize').Model>}
 */
async function getCourse(req) {
  const { id } = req.params;
  const condition = getCondition();
  const course = await Course.findByPk(id, condition);
  if (!course) {
    throw createError(404, `ID: ${id}的课程没有找到。`);
  }
  return course;
}

module.exports = router;
