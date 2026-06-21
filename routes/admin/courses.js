const express = require('express');
const router = express.Router();
const { Course, Category, User, Chapter } = require('../../models');
const { Op } = require('sequelize');
const { NotFoundError, BadRequestError } = require('../../utils/errors');
const { success, failure } = require('../../utils/responses');
const { getPagination } = require('../../utils/pagination');

/**
 * 查询课程列表
 * GET /admin/courses
 */
router.get('/', async function (req, res) {
  try {
    // 定义查询参数
    const query = req.query;
    const { currentPage, pageSize, offset } = getPagination(query);

    const condition = {
      ...getCondition(),
      order: [['id', 'DESC']],
      limit: pageSize,
      offset,
      where: {},
    };

    if (query.categoryId) {
      condition.where.categoryId = { [Op.eq]: query.categoryId };
    }

    if (query.userId) {
      condition.where.userId = { [Op.eq]: query.userId };
    }

    if (query.name) {
      const name = String(query.name).trim();
      if (name) {
        condition.where.name = { [Op.like]: `%${name}%` };
      }
    }

    if (query.recommended) {
      condition.where.recommended = { [Op.eq]: query.recommended === 'true' };
    }

    if (query.introductory) {
      condition.where.introductory = { [Op.eq]: query.introductory === 'true' };
    }

    // 查询数据
    // 将findAll方法改为findAndCountAll方法
    // findAndCountAll方法会返回一个对象，对象中有两个属性，一个是count，一个是rows
    // count 是查询到的数据的总数， rows 中才是查询到的数据
    const { count, rows } = await Course.findAndCountAll(condition);
    // 返回查询结果
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
 * GET /admin/courses/:id
 */
router.get('/:id', async (req, res) => {
  try {
    // 查询数据
    const course = await getCourse(req);
    // 返回查询结果
    success(res, '查询课程成功。', { course });
  } catch (err) {
    failure(res, err);
  }
});

/**
 * 创建课程
 * POST /admin/courses
 */
router.post('/', async function (req, res) {
  try {
    // 白名单过滤
    const body = filterBody(req);
    // 创建课程
    const course = await Course.create(body);
    // 返回创建课程的结果
    success(res, '创建课程成功。', { course }, 201);
  } catch (err) {
    failure(res, err);
  }
});

/**
 * 删除课程
 * DELETE /admin/courses/:id
 */
router.delete('/:id', async function (req, res) {
  try {
    // 查询课程
    const course = await getCourse(req);
    // 查询课程是否有章节
    const count = await Chapter.count({ where: { courseId: req.params.id } });
    if (count > 0) {
      throw new BadRequestError('当前课程有章节，无法删除。');
    }
    // 删除课程
    await course.destroy();
    // 返回删除课程的结果
    success(res, '课程删除成功。');
  } catch (err) {
    failure(res, err);
  }
});

/**
 * 更新课程
 * PUT /admin/courses/:id
 */
router.put('/:id', async function (req, res) {
  try {
    // 白名单过滤
    const body = filterBody(req);
    // 查询课程
    const course = await getCourse(req);
    // 更新课程
    await course.update(body);
    // 返回课程更新的结果
    success(res, '课程更新成功', { course });
  } catch (err) {
    failure(res, err);
  }
});

/**
 * 公共方法: 白名单过滤
 * @param req
 * @returns {{image: *, name, introductory: (boolean|*), userId: (number|*), categoryId: (number|*), content, recommended: (boolean|*)}}
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
 * 公共方法：关联分类，用户数据
 * @returns {{include: [{as: string,model,attributes: string[]}],attributes: {exclude: string[]}}}
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
 * 公共方法: 查询当前课程
 */
async function getCourse(req) {
  // 获取课程id
  const { id } = req.params;
  const condition = getCondition();
  // 查询当前课程
  const course = await Course.findByPk(id, condition);
  // 如果没有找到
  if (!course) {
    throw new NotFoundError(`ID: ${id}的课程没有找到。`);
  }
  return course;
}

module.exports = router;
