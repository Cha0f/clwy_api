const express = require('express');
const router = express.Router();
const { Category, Course } = require('../../models');
const { Op } = require('sequelize');
const createError = require('http-errors');
const { success, failure } = require('../../utils/responses');
const { getPagination } = require('../../utils/pagination');
const { delKey } = require('../../utils/redis');

/**
 * 查询分类列表（后台）
 *
 * 支持按名称（name）模糊搜索，按 rank 权重升序、id 升序排列。
 *
 * GET /admin/categories?name=&currentPage=&pageSize=
 */
router.get('/', async function (req, res) {
  try {
    const query = req.query;
    const { currentPage, pageSize, offset } = getPagination(query);

    const condition = {
      order: [
        ['rank', 'ASC'],
        ['id', 'ASC'],
      ],
      limit: pageSize,
      offset,
      where: {},
    };

    // name 模糊搜索（String 转换 + trim 防止类型绕过）
    if (query.name) {
      const name = String(query.name).trim();
      if (name) {
        condition.where.name = {
          [Op.like]: `%${name}%`,
        };
      }
    }

    const { count, rows } = await Category.findAndCountAll(condition);
    success(res, '查询分类列表成功。', {
      categories: rows,
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
 * 查询分类详情
 *
 * GET /admin/categories/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const category = await getCategory(req);
    success(res, '查询分类成功。', { category });
  } catch (err) {
    failure(res, err);
  }
});

/**
 * 创建分类
 *
 * POST /admin/categories
 */
router.post('/', async function (req, res) {
  try {
    const body = filterBody(req);
    const category = await Category.create(body);
    await clearCache();
    success(res, '创建分类成功。', { category }, 201);
  } catch (err) {
    failure(res, err);
  }
});

/**
 * 删除分类
 *
 * 删除前检查是否有课程关联（有则禁止删除，防止数据不一致）。
 * count 检查和 destroy 在事务中执行，防止并发下的竞态条件。
 *
 * DELETE /admin/categories/:id
 */
router.delete('/:id', async function (req, res) {
  try {
    const category = await getCategory(req);

    // 在事务中检查课程关联并删除分类，防止并发竞态
    const sequelize = Category.sequelize;
    await sequelize.transaction(async (t) => {
      const count = await Course.count({
        where: { categoryId: req.params.id },
        transaction: t,
      });
      if (count > 0) {
        throw createError(409, '当前分类有课程，无法删除。');
      }

      await category.destroy({ transaction: t });
    });
    await clearCache(category);

    success(res, '分类删除成功。');
  } catch (err) {
    failure(res, err);
  }
});

/**
 * 更新分类
 *
 * PUT /admin/categories/:id
 */
router.put('/:id', async function (req, res) {
  try {
    const body = filterBody(req);
    const category = await getCategory(req);
    await category.update(body);
    await clearCache(category);
    success(res, '分类更新成功', { category });
  } catch (err) {
    failure(res, err);
  }
});

/**
 * 白名单过滤：仅允许 name 和 rank 字段通过
 * 防止 mass assignment 攻击（禁止通过请求体注入其他字段）。
 *
 * @param {object} req - Express 请求对象
 * @returns {{name: string, rank: number}}
 */
function filterBody(req) {
  return {
    name: req.body.name,
    rank: req.body.rank,
  };
}

/**
 * 查询当前分类（通用方法）
 *
 * 被查询详情、更新、删除复用。
 *
 * @param {object} req - Express 请求对象，需包含 req.params.id
 * @returns {Promise<import('sequelize').Model>}
 */
async function getCategory(req) {
  const { id } = req.params;
  const category = await Category.findByPk(id);
  if (!category) {
    throw createError(404, `ID: ${id}的分类没有找到。`);
  }
  return category;
}

/**
 * 清除缓存
 * @param category
 * @returns {Promise<void>}
 */
async function clearCache(category = null) {
  await delKey('categories');

  if (category) {
    await delKey(`category:${category.id}`);
  }
}

module.exports = router;
