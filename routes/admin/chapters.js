const express = require('express');
const router = express.Router();
const { Chapter, Course } = require('../../models');
const { NotFoundError, BadRequestError } = require('../../utils/errors');
const { Op } = require('sequelize');
const { success, failure } = require('../../utils/responses');
const { getPagination } = require('../../utils/pagination');

/**
 * 查询章节列表
 *
 * 必填参数 courseId，按 rank 权重升序、id 升序排列。
 * 支持 title 模糊搜索。
 *
 * GET /admin/chapters?courseId=&title=&currentPage=&pageSize=
 */
router.get('/', async function (req, res) {
  try {
    const query = req.query;
    if (!query.courseId) {
      throw new BadRequestError('获取章节列表失败，课程ID不能为空。');
    }
    const { currentPage, pageSize, offset } = getPagination(query);

    const condition = {
      ...getCondition(),
      order: [
        ['rank', 'ASC'],
        ['id', 'ASC'],
      ],
      limit: pageSize,
      offset,
      where: {
        courseId: { [Op.eq]: query.courseId },
      },
    };

    // title 模糊搜索（输入净化）
    if (query.title) {
      const title = String(query.title).trim();
      if (title) {
        condition.where.title = { [Op.like]: `%${title}%` };
      }
    }

    const { count, rows } = await Chapter.findAndCountAll(condition);
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
 *
 * 附带关联的课程数据。
 *
 * GET /admin/chapters/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const chapter = await getChapter(req);
    success(res, '查询章节成功。', { chapter });
  } catch (err) {
    failure(res, err);
  }
});

/**
 * 创建章节
 *
 * POST /admin/chapters
 */
router.post('/', async function (req, res) {
  try {
    const body = filterBody(req);
    const chapter = await Chapter.create(body);
    await Course.increment('chaptersCount', { where: { id: chapter.courseId } });
    success(res, '创建章节成功。', { chapter }, 201);
  } catch (err) {
    failure(res, err);
  }
});

/**
 * 删除章节
 *
 * DELETE /admin/chapters/:id
 */
router.delete('/:id', async function (req, res) {
  try {
    const chapter = await getChapter(req);
    await chapter.destroy();
    await Course.decrement('chaptersCount', { where: { id: chapter.courseId } });
    success(res, '章节删除成功。');
  } catch (err) {
    failure(res, err);
  }
});

/**
 * 更新章节
 *
 * PUT /admin/chapters/:id
 */
router.put('/:id', async function (req, res) {
  try {
    const body = filterBody(req);
    const chapter = await getChapter(req);
    await chapter.update(body);
    success(res, '章节更新成功', { chapter });
  } catch (err) {
    failure(res, err);
  }
});

/**
 * 白名单过滤：允许 courseId、title、content、video、rank 字段通过
 *
 * @param {object} req
 * @returns {{courseId: number, title: string, content: string, video: string, rank: number}}
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
 * 查询章节关联的课程数据
 *
 * @returns {{include: [{as: string, model, attributes: string[]}], attributes: {exclude: string[]}}}
 */
function getCondition() {
  return {
    attributes: { exclude: ['CourseId'] },
    include: [{ model: Course, as: 'course', attributes: ['id', 'name'] }],
  };
}

/**
 * 查询当前章节（含关联课程）
 *
 * @param {object} req
 * @returns {Promise<import('sequelize').Model>}
 */
async function getChapter(req) {
  const { id } = req.params;
  const condition = getCondition();
  const chapter = await Chapter.findByPk(id, condition);
  if (!chapter) {
    throw new NotFoundError(`ID: ${id}的章节没有找到。`);
  }
  return chapter;
}

module.exports = router;
