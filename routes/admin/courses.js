const express = require('express');
const router = express.Router();
const { Course, Category, User } = require('../../models');
const { Op } = require('sequelize');
// 引入错误类
const { NotFondError, success, failure } = require('../../utils/response');

/**
 * 查询课程列表
 * GET /admin/courses
 */
router.get('/', async function (req, res) {
  try {
    // 定义查询参数
    const query = req.query;
    // 获取current_page和page_seize
    const currentPage = Math.abs(Number(query.currentPage)) || 1;
    const pageSize = Math.abs(Number(query.pageSize)) || 10;
    // 计算offset
    const offset = (currentPage - 1) * pageSize;
    // 定义查询条件
    const condition = {
      ...getCondition(),
      order: [['id', 'DESC']],
      // 在查询条件中添加offset和pageSize
      limit: pageSize,
      offset,
    };

    // 如果有title查询参数，就添加到where条件中
    if (query.categoryId) {
      condition.where = {
        categoryId: {
          [Op.eq]: query.categoryId,
        },
      };
    }

    if (query.userId) {
      condition.where = {
        userId: {
          [Op.eq]: query.userId,
        },
      };
    }

    if (query.name) {
      condition.where = {
        name: {
          [Op.like]: `%${query.name}%`,
        },
      };
    }

    if (query.recommended) {
      condition.where = {
        recommended: {
          // 需要转布尔值
          [Op.eq]: query.recommended === 'true',
        },
      };
    }

    if (query.introductory) {
      condition.where = {
        introductory: {
          [Op.eq]: query.introductory === 'true',
        },
      };
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
    const course = await getCourses(req);
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
 * DELETE /admin/course/:id
 */
router.delete('/:id', async function (req, res) {
  try {
    // 查询课程
    const course = await getCourses(req);
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
    const course = await getCourses(req);
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
async function getCourses(req) {
  // 获取课程id
  const { id } = req.params;
  const condition = getCondition();
  // 查询当前课程
  const courses = await Course.findByPk(id, condition);
  // 如果没有找到
  if (!courses) {
    throw new NotFondError(`ID: ${id}的课程没有找到。`);
  }
  return courses;
}

module.exports = router;
