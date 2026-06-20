const express = require('express');
const router = express.Router();
const { Category, Course } = require('../../models');
const { Op } = require('sequelize');
// 引入错误类
const { NotFondError, success, failure } = require('../../utils/response');

/**
 * 查询分类列表
 * GET /admin/categories
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
      order: [['id', 'ASC']],
      // 在查询条件中添加offset和pageSize
      limit: pageSize,
      offset,
    };

    // 如果有name查询参数，就添加到where条件中
    if (query.name) {
      condition.where = {
        name: {
          [Op.like]: `%${query.name}%`,
        },
      };
    }

    // 查询数据
    // 将findAll方法改为findAndCountAll方法
    // findAndCountAll方法会返回一个对象，对象中有两个属性，一个是count，一个是rows
    // count 是查询到的数据的总数， rows 中才是查询到的数据
    const { count, rows } = await Category.findAndCountAll(condition);
    // 返回查询结果
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
 * GET /admin/categories/:id
 */
router.get('/:id', async (req, res) => {
  try {
    // 查询数据
    const category = await getCategory(req);
    // 返回查询结果
    success(res, '查询分类成功。', { category });
  } catch (err) {
    failure(res, err);
  }
});

/**
 * 创建分类
 * POST /admin/categories
 */
router.post('/', async function (req, res) {
  try {
    // 白名单过滤
    const body = filterBody(req);
    // 创建分类
    const category = await Category.create(body);
    // 返回创建分类的结果
    success(res, '创建分类成功。', { category }, 201);
  } catch (err) {
    failure(res, err);
  }
});

/**
 * 删除分类
 * DELETE /admin/category/:id
 */
router.delete('/:id', async function (req, res) {
  try {
    // 查询分类
    const category = await getCategory(req);
    // 查询对应课程数量
    const count = await Course.count({ where: { categoryId: req.params.id } });
    // 判断数量
    if (count > 0) {
      throw new Error('当前分类有课程，无法删除。');
    }
    // 删除分类
    await category.destroy();
    // 返回删除分类的结果
    success(res, '分类删除成功。');
  } catch (err) {
    failure(res, err);
  }
});

/**
 * 更新分类
 * PUT /admin/categories/:id
 */
router.put('/:id', async function (req, res) {
  try {
    // 白名单过滤
    const body = filterBody(req);
    // 查询分类
    const category = await getCategory(req);
    // 更新分类
    await category.update(body);
    // 返回分类更新的结果
    success(res, '分类更新成功', { category });
  } catch (err) {
    failure(res, err);
  }
});

/**
 * 公共方法: 白名单过滤
 * @param req
 * @return {{name, rank: *}}
 */
function filterBody(req) {
  return {
    name: req.body.name,
    rank: req.body.rank,
  };
}

/**
 * 公共方法: 查询当前分类
 */
async function getCategory(req) {
  // 获取分类id
  const { id } = req.params;
  // 查询当前分类
  const categories = await Category.findByPk(id);
  // 如果没有找到
  if (!categories) {
    throw new NotFondError(`ID: ${id}的分类没有找到。`);
  }
  return categories;
}

module.exports = router;
