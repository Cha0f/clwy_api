/**
 * 管理员课程分类路由。
 */
const express = require('express');
const createError = require('http-errors');
const { Op } = require('sequelize');
const { Category, Course } = require('../../models');
const { cacheKeys, invalidate } = require('../../utils/cache');
const { success } = require('../../utils/responses');
const { asyncRoute, findByPkOrFail, paginate, pickFields } = require('../../utils/routes');

const router = express.Router();

router.get(
  '/',
  asyncRoute(async (req, res) => {
    // 规范化名称筛选；空字符串等价于不筛选。
    const name = req.query.name ? String(req.query.name).trim() : '';
    const where = name ? { name: { [Op.like]: `%${name}%` } } : undefined;
    const data = await paginate(
      Category,
      req.query,
      {
        where,
        order: [
          ['rank', 'ASC'],
          ['id', 'ASC'],
        ],
      },
      'categories',
    );

    success(res, '查询分类列表成功。', data);
  }),
);

router.get(
  '/:id',
  asyncRoute(async (req, res) => {
    const category = await findByPkOrFail(Category, req.params.id, {}, '分类');
    success(res, '查询分类成功。', { category });
  }),
);

router.post(
  '/',
  asyncRoute(async (req, res) => {
    // 仅名称和排序权重允许进入模型。
    const category = await Category.create(pickFields(req.body, ['name', 'rank']));
    await clearCategoryCache(category.id);

    success(res, '创建分类成功。', { category }, 201);
  }),
);

router.put(
  '/:id',
  asyncRoute(async (req, res) => {
    const category = await findByPkOrFail(Category, req.params.id, {}, '分类');
    await category.update(pickFields(req.body, ['name', 'rank']));
    await clearCategoryCache(category.id);

    success(res, '分类更新成功', { category });
  }),
);

router.delete(
  '/:id',
  asyncRoute(async (req, res) => {
    const category = await findByPkOrFail(Category, req.params.id, {}, '分类');
    // 检查与删除放在同一事务内；数据库外键提供最终完整性保护。
    await Category.sequelize.transaction(async (transaction) => {
      const courseCount = await Course.count({
        where: { categoryId: category.id },
        transaction,
      });
      if (courseCount > 0) {
        throw createError(409, '当前分类有课程，无法删除。');
      }
      await category.destroy({ transaction });
    });
    await clearCategoryCache(category.id);

    success(res, '分类删除成功。');
  }),
);

async function clearCategoryCache(categoryId) {
  await invalidate({
    keys: [cacheKeys.categories, cacheKeys.category(categoryId), cacheKeys.index],
  });
}

module.exports = router;
