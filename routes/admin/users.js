const express = require('express');
const router = express.Router();
const { User } = require('../../models');
const { Op } = require('sequelize');
const { NotFoundError } = require('../../utils/errors');
const { success, failure } = require('../../utils/responses');
const { getPagination } = require('../../utils/pagination');

/**
 * 查询用户列表
 *
 * 支持 email、username、nickname（模糊）、role 筛选。
 * 默认排除 password 字段。
 *
 * GET /admin/users?email=&username=&nickname=&role=&currentPage=&pageSize=
 */
router.get('/', async function (req, res) {
  try {
    const query = req.query;
    const { currentPage, pageSize, offset } = getPagination(query);

    const condition = {
      order: [['id', 'DESC']],
      attributes: { exclude: ['password'] },
      limit: pageSize,
      offset,
      where: {},
    };

    // 精确匹配 email
    if (query.email) {
      condition.where.email = { [Op.eq]: query.email };
    }

    // 精确匹配 username
    if (query.username) {
      condition.where.username = { [Op.eq]: query.username };
    }

    // 模糊匹配 nickname（输入净化）
    if (query.nickname) {
      const nickname = String(query.nickname).trim();
      if (nickname) {
        condition.where.nickname = { [Op.like]: `%${nickname}%` };
      }
    }

    // 精确匹配 role（0=普通用户，100=管理员）
    if (query.role) {
      condition.where.role = { [Op.eq]: query.role };
    }

    const { count, rows } = await User.findAndCountAll(condition);
    success(res, '查询用户列表成功。', {
      users: rows,
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
 * 查询用户详情
 *
 * 默认排除 password 字段。
 *
 * GET /admin/users/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const user = await getUser(req);
    success(res, '查询用户成功。', { user });
  } catch (err) {
    failure(res, err);
  }
});

/**
 * 创建用户
 *
 * POST /admin/users
 */
router.post('/', async function (req, res) {
  try {
    const body = filterBody(req);
    const user = await User.create(body);
    success(res, '创建用户成功。', { user }, 201);
  } catch (err) {
    failure(res, err);
  }
});

/**
 * 删除用户
 *
 * DELETE /admin/users/:id
 */
router.delete('/:id', async function (req, res) {
  try {
    const user = await getUser(req);
    await user.destroy();
    success(res, '用户删除成功。');
  } catch (err) {
    failure(res, err);
  }
});

/**
 * 更新用户
 *
 * PUT /admin/users/:id
 */
router.put('/:id', async function (req, res) {
  try {
    const body = filterBody(req);
    const user = await getUser(req);
    await user.update(body);
    success(res, '用户更新成功', { user });
  } catch (err) {
    failure(res, err);
  }
});

/**
 * 白名单过滤：允许用户全部字段通过
 *
 * @param {object} req
 * @returns {{email: string, username: string, nickname: string, password: string, avatar: string, gender: number, company: string, introduce: string, role: number}}
 */
function filterBody(req) {
  return {
    email: req.body.email,
    username: req.body.username,
    nickname: req.body.nickname,
    password: req.body.password,
    avatar: req.body.avatar,
    gender: req.body.gender,
    company: req.body.company,
    introduce: req.body.introduce,
    role: req.body.role,
  };
}

/**
 * 查询当前用户
 *
 * @param {object} req
 * @returns {Promise<import('sequelize').Model>}
 */
async function getUser(req) {
  const { id } = req.params;
  const user = await User.findByPk(id, {
    attributes: { exclude: ['password'] },
  });
  if (!user) {
    throw new NotFoundError(`ID: ${id}的用户没有找到。`);
  }
  return user;
}

module.exports = router;
