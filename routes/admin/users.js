/**
 * 管理员用户路由。
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const createError = require('http-errors');
const { Op } = require('sequelize');
const { Course, User } = require('../../models');
const { invalidateUsers } = require('../../utils/cache');
const { success } = require('../../utils/responses');
const { asyncRoute, findByPkOrFail, paginate, pickFields } = require('../../utils/routes');

const router = express.Router();
const PROFILE_FIELDS = [
  'email',
  'username',
  'nickname',
  'avatar',
  'gender',
  'company',
  'introduce',
];
const CREATE_FIELDS = [...PROFILE_FIELDS, 'password', 'role'];

router.get(
  '/',
  asyncRoute(async (req, res) => {
    const where = {};
    // 邮箱、用户名和角色使用精确匹配。
    if (req.query.email) where.email = req.query.email;
    if (req.query.username) where.username = req.query.username;
    if (req.query.role !== undefined && req.query.role !== '') where.role = req.query.role;

    // 昵称适合模糊搜索，先去除首尾空白。
    const nickname = req.query.nickname ? String(req.query.nickname).trim() : '';
    if (nickname) where.nickname = { [Op.like]: `%${nickname}%` };

    const data = await paginate(User, req.query, { where, order: [['id', 'DESC']] }, 'users');
    success(res, '查询用户列表成功。', data);
  }),
);

router.get(
  '/me',
  asyncRoute(async (req, res) => {
    // req.user 来自管理员认证，安全序列化确保密码哈希不会进入响应。
    success(res, '查询当前用户信息成功。', { user: req.user.toSafeJSON() });
  }),
);

router.get(
  '/:id',
  asyncRoute(async (req, res) => {
    const user = await findByPkOrFail(User, req.params.id, {}, '用户');
    success(res, '查询用户成功。', { user });
  }),
);

router.post(
  '/',
  asyncRoute(async (req, res) => {
    // 管理员创建用户时可以显式指定角色，其余字段仍受白名单保护。
    const user = await User.create(pickFields(req.body, CREATE_FIELDS));
    success(res, '创建用户成功。', { user: user.toSafeJSON() }, 201);
  }),
);

router.put(
  '/:id',
  asyncRoute(async (req, res) => {
    const body = pickFields(req.body, PROFILE_FIELDS);
    // 修改任意用户密码前，必须验证当前管理员自己的密码。
    if (req.body.password) {
      if (!req.body.currentPassword) {
        throw createError(400, '修改密码需提供当前密码。');
      }
      if (!bcrypt.compareSync(req.body.currentPassword, req.user.password)) {
        throw createError(403, '当前密码错误，不允许修改密码。');
      }
      body.password = req.body.password;
    }

    const user = await findByPkOrFail(User, req.params.id, {}, '用户');
    await user.update(body);
    await invalidateUsers([user.id]);

    success(res, '用户更新成功', { user: user.toSafeJSON() });
  }),
);

router.delete(
  '/:id',
  asyncRoute(async (req, res) => {
    const user = await findByPkOrFail(User, req.params.id, {}, '用户');
    // 管理员不能删除当前正在使用的账号。
    if (Number(user.id) === Number(req.user.id)) {
      throw createError(400, '不能删除自己的账号。');
    }

    // 至少保留一位管理员，避免后台永久失去入口。
    if (user.role === 100) {
      const adminCount = await User.count({ where: { role: 100 } });
      if (adminCount <= 1) {
        throw createError(400, '至少保留一位管理员账号。');
      }
    }

    // 有授课课程的用户不能删除；数据库外键提供最终保护。
    const courseCount = await Course.count({ where: { userId: user.id } });
    if (courseCount > 0) {
      throw createError(409, '该用户还有关联的课程，无法删除。');
    }

    await user.destroy();
    await invalidateUsers([user.id]);
    success(res, '用户删除成功。');
  }),
);

module.exports = router;
