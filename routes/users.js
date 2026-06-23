const express = require('express');
const router = express.Router();
const { User } = require('../models');
const { success, failure } = require('../utils/responses');
const createError = require('http-errors');
const bcrypt = require('bcryptjs');
const { setKey, getKey, delKey } = require('../utils/redis');

/**
 * 查询当前登录用户详情
 *
 * 通过 userAuth 中间件设置的 req.userId 查询用户，
 * 自动排除 password 字段。
 *
 * GET /users/me
 */
router.get('/me', async function (req, res) {
  try {
    let user = await getKey(`user:${req.userId}`);
    if (!user) {
      user = await getUser(req);
      await setKey(`user:${req.userId}`, user);
    }
    success(res, '查询当前用户信息成功。', { user });
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 更新用户信息
 *
 * 允许修改：头像、昵称、性别、公司、简介。
 * 密码修改请使用 PUT /users/account。
 *
 * PUT /users/info
 */
router.put('/info', async function (req, res) {
  try {
    const body = {
      avatar: req.body.avatar,
      nickname: req.body.nickname,
      gender: req.body.gender,
      company: req.body.company,
      introduce: req.body.introduce,
    };

    const user = await getUser(req);
    await user.update(body);
    await clearCache(user);
    success(res, '更新用户信息成功。', { user });
  } catch (err) {
    failure(res, err);
  }
});

/**
 * 更新账户信息
 *
 * 可修改：邮箱、用户名、密码。
 * 必须提供 currentPassword 验证身份，password 和 passwordConfirmation 需一致。
 * 查询时传 showPassword = true 以获取加密密码用于比对。
 *
 * PUT /users/account
 */
router.put('/account', async function (req, res) {
  try {
    const body = {
      email: req.body.email,
      username: req.body.username,
      currentPassword: req.body.currentPassword,
      password: req.body.password,
      passwordConfirmation: req.body.passwordConfirmation,
    };

    if (!body.currentPassword) {
      throw createError(400, '当前密码必须填写。');
    }

    if (body.password !== body.passwordConfirmation) {
      throw createError(400, '两次输入的密码不一致。');
    }

    // 获取用户时包含密码字段，用于比对
    const user = await getUser(req, true);

    // 验证当前密码是否正确
    const isPasswordValid = bcrypt.compareSync(body.currentPassword, user.password);
    if (!isPasswordValid) {
      throw createError(400, '当前密码不正确。');
    }

    await user.update(body);
    // 更新后删除密码再返回（不泄露哈希值）
    delete user.dataValues.password;
    await clearCache(user);
    success(res, '更新账户成功。', { user });
  } catch (err) {
    failure(res, err);
  }
});

/**
 * 公共方法：查询当前用户
 *
 * @param {object} req - Express 请求对象，需包含 req.userId
 * @param {boolean} showPassword - 是否返回 password 字段（默认 false）
 * @returns {Promise<import('sequelize').Model>}
 */
async function getUser(req, showPassword = false) {
  const id = req.userId;
  let condition = {};
  if (!showPassword) {
    condition = {
      attributes: { exclude: ['password'] },
    };
  }
  const user = await User.findByPk(id, condition);

  if (!user) {
    throw createError(404, `ID: ${id}的用户未找到。`);
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
