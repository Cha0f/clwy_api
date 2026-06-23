/**
 * 前台用户中心路由。
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const createError = require('http-errors');
const { User } = require('../models');
const { cacheKeys, invalidateUsers, remember } = require('../utils/cache');
const { success } = require('../utils/responses');
const { asyncRoute, findByPkOrFail, pickFields } = require('../utils/routes');

const router = express.Router();

/**
 * GET /users/me
 * 获取当前用户资料。
 * @returns {Object} { user }
 */
router.get(
  '/me',
  asyncRoute(async (req, res) => {
    // 私有资料使用独立命名空间，绝不与公开讲师资料缓存混用。
    const user = await remember(cacheKeys.privateUser(req.userId), () =>
      findByPkOrFail(User, req.userId, {}, '用户'),
    );

    success(res, '查询当前用户信息成功。', { user });
  }),
);

/**
 * PUT /users/info
 * 更新用户资料。
 * @body {string} avatar - 头像 URL
 * @body {string} nickname - 昵称
 * @body {number} gender - 性别（0/1/2）
 * @body {string} company - 公司
 * @body {string} introduce - 简介
 * @returns {Object} { user }
 */
router.put(
  '/info',
  asyncRoute(async (req, res) => {
    // 资料接口只能修改展示信息，账号字段由 /account 单独处理。
    const body = pickFields(req.body, ['avatar', 'nickname', 'gender', 'company', 'introduce']);
    const user = await findByPkOrFail(User, req.userId, {}, '用户');
    // 模型校验通过后写入数据库。
    await user.update(body);
    // 同时清理私有资料和公开讲师资料，避免不同页面看到旧数据。
    await invalidateUsers([user.id]);

    success(res, '更新用户信息成功。', { user: user.toSafeJSON() });
  }),
);

/**
 * PUT /users/account
 * 更新用户账户信息（邮箱、用户名、密码）。
 * @body {string} currentPassword - 当前密码（必填）
 * @body {string} password - 新密码
 * @body {string} passwordConfirmation - 确认新密码
 * @body {string} email - 新邮箱
 * @body {string} username - 新用户名
 * @returns {Object} { user }
 */
router.put(
  '/account',
  asyncRoute(async (req, res) => {
    const { currentPassword, password, passwordConfirmation } = req.body;
    // 修改邮箱、用户名或密码前必须验证当前密码。
    if (!currentPassword) {
      throw createError(400, '当前密码必须填写。');
    }
    if (password !== passwordConfirmation) {
      throw createError(400, '两次输入的密码不一致。');
    }

    // 显式读取密码哈希，仅在本次服务端校验中使用。
    const user = await findByPkOrFail(User.scope('withPassword'), req.userId, {}, '用户');
    if (!bcrypt.compareSync(currentPassword, user.password)) {
      throw createError(400, '当前密码不正确。');
    }

    // currentPassword 和 passwordConfirmation 从不传给 Sequelize。
    const body = pickFields(req.body, ['email', 'username', 'password']);
    await user.update(body);
    await invalidateUsers([user.id]);

    success(res, '更新账户成功。', { user: user.toSafeJSON() });
  }),
);

module.exports = router;
