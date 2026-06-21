const express = require('express');
const router = express.Router();
const { Chapter, Course } = require('../../models');
const { NotFoundError } = require('../../utils/errors');
const { Op } = require('sequelize');
// 引入封装工具
const { success, failure } = require('../../utils/responses');

/**
 * 查询章节列表
 * GET /admin/chapters
 */
router.get('/', async function (req, res) {
  try {
    // 定义查询参数
    const query = req.query;
    if (!query.courseId) {
      throw new Error('获取章节列表失败，课程ID不能为空。');
    }
    // 获取current_page和page_seize
    const currentPage = Math.abs(Number(query.currentPage)) || 1;
    const pageSize = Math.abs(Number(query.pageSize)) || 10;
    // 计算offset
    const offset = (currentPage - 1) * pageSize;

    // 定义查询条件
    const condition = {
      ...getCondition(),
      order: [
        ['rank', 'ASC'],
        ['id', 'ASC'],
      ],
      // 在查询条件中添加offset和pageSize
      limit: pageSize,
      offset,
    };
    // 初始化筛选条件，课程ID必填
    condition.where = {
      courseId: {
        [Op.eq]: query.courseId,
      },
    };

    // 如果有title查询参数，就添加到where条件中
    if (query.title) {
      condition.where = {
        ...condition.where,
        title: {
          [Op.like]: `%${query.title}%`,
        },
      };
    }

    // 查询数据
    // 将findAll方法改为findAndCountAll方法
    // findAndCountAll方法会返回一个对象，对象中有两个属性，一个是count，一个是rows
    // count 是查询到的数据的总数， rows 中才是查询到的数据
    const { count, rows } = await Chapter.findAndCountAll(condition);
    // 返回查询结果
    success(res, '查询章节列表成功。', {
      chapters: rows,
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
 * 查询章节详情
 * GET /admin/chapters/:id
 */
router.get('/:id', async (req, res) => {
  try {
    // 查询数据
    const chapter = await getChapters(req);
    // 返回查询结果
    success(res, '查询章节成功。', { chapter });
  } catch (err) {
    failure(res, err);
  }
});

/**
 * 创建章节
 * POST /admin/chapters
 */
router.post('/', async function (req, res) {
  try {
    // 白名单过滤
    const body = filterBody(req);
    // 创建章节
    const chapter = await Chapter.create(body);
    // 返回创建章节的结果
    success(res, '创建章节成功。', { chapter }, 201);
  } catch (err) {
    failure(res, err);
  }
});

/**
 * 删除章节
 * DELETE /admin/chapter/:id
 */
router.delete('/:id', async function (req, res) {
  try {
    // 查询章节
    const chapter = await getChapters(req);
    // 删除章节
    await chapter.destroy();
    // 返回删除章节的结果
    success(res, '章节删除成功。');
  } catch (err) {
    failure(res, err);
  }
});

/**
 * 更新章节
 * PUT /admin/chapters/:id
 */
router.put('/:id', async function (req, res) {
  try {
    // 白名单过滤
    const body = filterBody(req);
    // 查询章节
    const chapter = await getChapters(req);
    // 更新章节
    await chapter.update(body);
    // 返回章节更新的结果
    success(res, '章节更新成功', { chapter });
  } catch (err) {
    failure(res, err);
  }
});

/**
 * 公共方法: 白名单过滤
 * @param req
 * @returns {{rank: (number|*), video: (string|boolean|MediaTrackConstraints|VideoConfiguration|*), title, courseId: (number|*), content}}
 */
function filterBody(req) {
  return {
    courseId: req.body.courseId,
    title: req.body.title,
    content: req.body.content,
    video: req.body.video,
    rank: req.body.rank,
  };
}

/**
 * 公共方法: 关联课程数据
 * @returns {{include: [{as: string, model, attributes: string[]}], attributes: {exclude: string[]}}}
 */
function getCondition() {
  return {
    attributes: { exclude: ['CourseId'] },
    include: [{ model: Course, as: 'course', attributes: ['id', 'name'] }],
  };
}

/**
 * 公共方法: 查询当前章节
 */
async function getChapters(req) {
  // 获取章节id
  const { id } = req.params;
  // 定义查询条件
  const condition = getCondition();
  // 查询当前章节
  const chapters = await Chapter.findByPk(id, condition);
  // 如果没有找到
  if (!chapters) {
    throw new NotFoundError(`ID: ${id}的章节没有找到。`);
  }
  return chapters;
}

module.exports = router;
