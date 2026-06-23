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
