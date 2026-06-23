const express = require('express');
const router = express.Router();
const { User, Course } = require('../../models');
const { Op } = require('sequelize');
const createError = require('http-errors');
const { success, failure } = require('../../utils/responses');
const { getPagination } = require('../../utils/pagination');
const { delKey } = require('../../utils/redis');

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
      condition.where.email = query.email;
    }

    // 精确匹配 username
    if (query.username) {
      condition.where.username = query.username;
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
      condition.where.role = query.role;
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
 * 查询当前登陆的用户详情
 *
 * GET /admin/users/me
 */
router.get('/me', async function (req, res) {
  try {
    const user = req.user;
    success(res, '查询当前用户信息成功。', { user });
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
    const body = filterBodyForCreate(req);
    const user = await User.create(body);
    success(res, '创建用户成功。', { user }, 201);
  } catch (err) {
    failure(res, err);
  }
});

/**
 * 删除用户
 *
 * 安全保护：
 *   - 不允许管理员删除自己
 *   - 不允许删除最后一位管理员（防止后台无人管理）
 *
 * DELETE /admin/users/:id
 */
router.delete('/:id', async function (req, res) {
  try {
    const user = await getUser(req);

    // 保护 1：不可自删
    if (parseInt(user.id, 10) === parseInt(req.user.id, 10)) {
      throw createError(400, '不能删除自己的账号。');
    }

    // 保护 2：如果是管理员，检查是否为最后一位
    if (user.role === 100) {
      const adminCount = await User.count({ where: { role: 100 } });
      if (adminCount <= 1) {
        throw createError(400, '至少保留一位管理员账号。');
      }
    }

    // 保护 3：检查用户是否有关联课程（防止挂空引用）
    const courseCount = await Course.count({ where: { userId: req.params.id } });
    if (courseCount > 0) {
      throw createError(409, '该用户还有关联的课程，无法删除。');
    }

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
    const body = filterBodyForUpdate(req);
    const user = await getUser(req);
    await user.update(body);
    await clearCache(user);
    success(res, '用户更新成功', { user });
  } catch (err) {
    failure(res, err);
  }
});

/**
 * 创建用户的白名单过滤
 */
function filterBodyForCreate(req) {
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
 * 更新用户的白名单过滤
 *
 * 更新时不接受 role 字段（防止越权提权）。
 * 修改密码需在 body 中提供 currentPassword 验证当前管理员身份。
 */
function filterBodyForUpdate(req) {
  const body = {
    email: req.body.email,
    username: req.body.username,
    nickname: req.body.nickname,
    avatar: req.body.avatar,
    gender: req.body.gender,
    company: req.body.company,
    introduce: req.body.introduce,
  };

  // 修改密码需要验证当前管理员密码
  if (req.body.password) {
    if (!req.body.currentPassword) {
      throw createError(400, '修改密码需提供当前密码。');
    }
    const bcrypt = require('bcryptjs');
    const admin = req.user;
    if (!bcrypt.compareSync(req.body.currentPassword, admin.password)) {
      throw createError(403, '当前密码错误，不允许修改密码。');
    }
    body.password = req.body.password;
  }

  return body;
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
    throw createError(404, `ID: ${id}的用户没有找到。`);
  }
  return user;
}

/**
 * 清除缓存
 * @param user
 * @returns {Promise<void>}
 */
async function clearCache(user) {
  await delKey(`user:${user.id}`);
}

module.exports = router;
