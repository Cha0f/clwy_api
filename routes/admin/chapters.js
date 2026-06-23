const express = require('express');
const router = express.Router();
const { Chapter, Course } = require('../../models');
const createError = require('http-errors');
const { Op } = require('sequelize');
const { success, failure } = require('../../utils/responses');
const { getPagination } = require('../../utils/pagination');
const { delKey } = require('../../utils/redis');

/**
 * 查询章节列表（后台）
 *
 * 必填参数 courseId，按 rank 权重升序、id 升序排列。
 * 支持 title 模糊搜索，自动关联课程信息。
 *
 * GET /admin/chapters?courseId=&title=&currentPage=&pageSize=
 */
router.get('/', async function (req, res) {
  try {
    const query = req.query;
    if (!query.courseId) {
      throw createError(400, '获取章节列表失败，课程ID不能为空。');
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

    // title 模糊搜索（String 转换 + trim 防类型绕过）
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
 * 使用事务同步更新课程的 chaptersCount。
 * 创建前验证 courseId 引用的课程存在，防止孤儿记录。
 *
 * POST /admin/chapters
 */
router.post('/', async function (req, res) {
  try {
    const body = filterBody(req);

    // 验证引用的课程存在
    const course = await Course.findByPk(body.courseId);
    if (!course) {
      throw createError(400, '创建章节失败，课程不存在。');
    }

    // 在事务中：创建章节 + 课程 chaptersCount + 1
    const chapter = await Chapter.sequelize.transaction(async (t) => {
      const ch = await Chapter.create(body, { transaction: t });
      await Course.increment('chaptersCount', {
        where: { id: ch.courseId },
        transaction: t,
      });
      return ch;
    });
    await clearCache(chapter);
    success(res, '创建章节成功。', { chapter }, 201);
  } catch (err) {
    failure(res, err);
  }
});

/**
 * 删除章节
 *
 * 使用事务同步更新课程的 chaptersCount。
 *
 * DELETE /admin/chapters/:id
 */
router.delete('/:id', async function (req, res) {
  try {
    const chapter = await getChapter(req);
    // 在事务中：删除章节 + 课程 chaptersCount - 1
    await Chapter.sequelize.transaction(async (t) => {
      await chapter.destroy({ transaction: t });
      await Course.decrement('chaptersCount', {
        where: { id: chapter.courseId },
        transaction: t,
      });
    });
    await clearCache(chapter);
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
    await clearCache(chapter);
    success(res, '章节更新成功', { chapter });
  } catch (err) {
    failure(res, err);
  }
});

/**
 * 白名单过滤：仅允许 courseId、title、content、video、rank 字段通过
 * 防止 mass assignment 攻击。
 *
 * @param {object} req - Express 请求对象
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
 * 章节关联配置
 *
 * 自动关联所属课程（course），排除 CourseId 外键冗余字段。
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
 * 通用方法，被查询详情、更新、删除复用。
 *
 * @param {object} req - Express 请求对象，需包含 req.params.id
 * @returns {Promise<import('sequelize').Model>}
 */
async function getChapter(req) {
  const { id } = req.params;
  const condition = getCondition();
  const chapter = await Chapter.findByPk(id, condition);
  if (!chapter) {
    throw createError(404, `ID: ${id}的章节没有找到。`);
  }
  return chapter;
}

/**
 * 清除缓存
 * @param chapter
 * @returns {Promise<void>}
 */
async function clearCache(chapter) {
  await delKey(`chapters:${chapter.courseId}`);
  await delKey(`chapter:${chapter.id}`);
}

module.exports = router;
