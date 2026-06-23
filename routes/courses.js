const express = require('express');
const router = express.Router();
const { Course, Category, Chapter, User } = require('../models');
const { success, failure } = require('../utils/responses');
const createError = require('http-errors');
const { getPagination } = require('../utils/pagination');
const { getKey, setKey } = require('../utils/redis');

/**
 * 查询课程列表
 *
 * 必填参数 categoryId，按 id 降序排列。
 * 可选分页参数 currentPage / pageSize。
 *
 * GET /courses?categoryId=&page=&pageSize=
 */
router.get('/', async (req, res) => {
  try {
    const query = req.query;
    const categoryId = query.categoryId;
    const { currentPage, pageSize, offset } = getPagination(query);

    if (!query.categoryId) {
      throw createError(400, '获取课程列表失败，分类ID不能为空');
    }
    const cacheKey = `courses:${categoryId}:${currentPage}:${pageSize}`;
    const data = await getKey(cacheKey);
    if (data) {
      return success(res, '查询课程列表成功。', data);
    }
    const condition = {
      attributes: { exclude: ['CategoryId', 'UserId', 'content'] },
      where: { categoryId: query.categoryId },
      order: [['id', 'DESC']],
      limit: pageSize,
      offset,
    };
    const { count, rows } = await Course.findAndCountAll(condition);

    await setKey(cacheKey, {
      courses: rows,
      pagination: {
        total: count,
        currentPage,
        pageSize,
      },
    });
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
 * 附带关联的分类、章节列表和讲师信息。
 *
 * GET /courses/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 查询课程
    let course = await getKey(`course:${id}`);
    if (!course) {
      course = await Course.findByPk(id, {
        attributes: { exclude: ['CategoryId', 'UserId'] },
      });
      if (!course) {
        throw createError(404, `ID: ${id}的课程未找到。`);
      }
      await setKey(`course:${id}`, course);
    }

    // 查询课程关联的分类
    let category = await getKey(`category:${course.categoryId}`);
    if (!category) {
      category = await Category.findByPk(course.categoryId, {
        attributes: { exclude: ['CategoryId', 'UserId'] },
      });
      await setKey(`category:${course.categoryId}`, category);
    }

    // 查询课程关联的用户
    let user = await getKey(`user:${course.userId}`);
    if (!user) {
      user = await User.findByPk(course.userId, {
        attributes: { exclude: ['password'] },
      });
      await setKey(`user:${course.userId}`, user);
    }

    // 查询课程关联的章节
    let chapters = await getKey(`chapters:${course.id}`);
    if (!chapters) {
      chapters = await Chapter.findAll({
        attributes: { exclude: ['CourseId', 'content'] },
        where: { courseId: course.id },
        order: [
          ['rank', 'ASC'],
          ['id', 'DESC'],
        ],
      });
      await setKey(`chapters:${course.id}`, chapters);
    }

    success(res, '查询课程成功。', { course, category, user, chapters });
  } catch (err) {
    failure(res, err);
  }
});

module.exports = router;
