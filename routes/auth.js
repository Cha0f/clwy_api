const express = require('express');
const router = express.Router();
const { User } = require('../models');
const { success, failure } = require('../utils/responses');
const createError = require('http-errors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');

/**
 * 用户注册
 *
 * 创建普通用户（role = 0），密码在 User Model 的 setter 中自动加密。
 * 注册响应会排除 password 字段（delete user.dataValues.password）。
 *
 * POST /auth/sign_up
 */
router.post('/sign_up', async (req, res) => {
  try {
    const body = {
      email: req.body.email,
      username: req.body.username,
      password: req.body.password,
      nickname: req.body.nickname,
      gender: 0,
      role: 0,
    };

    const user = await User.create(body);
    delete user.dataValues.password;
    success(res, '创建用户成功', { user }, 201);
  } catch (err) {
    failure(res, err);
  }
});

/**
 * 用户登录
 *
 * 支持邮箱或用户名登录（Op.or 查询）。
 * 验证密码需通过 bcrypt.compareSync。
 * 登录成功返回 JWT Token，过期时间由 JWT_EXPIRES_IN 控制（默认 7d）。
 * 限流由 app.js 中挂载的 rate-limit 中间件保护（15 分钟最多 20 次）。
 *
 * POST /auth/sign_in
 */
router.post('/sign_in', async (req, res) => {
  try {
    const { login, password } = req.body;

    if (!login) {
      throw createError(400, '邮箱/用户名必须填写。');
    }
    if (!password) {
      throw createError(400, '密码必须填写。');
    }

    const condition = {
      where: {
        [Op.or]: [{ email: login }, { username: login }],
      },
    };

    // 通过 email 或 username 查询用户是否存在
    const user = await User.findOne(condition);
    if (!user) {
      throw createError(404, '用户不存在，无法登陆。');
    }

    // 验证密码（与数据库中 bcrypt 哈希比对）
    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      throw createError(401, '密码错误。');
    }

    // 生成 JWT，payload 中存入 userId
    const token = jwt.sign(
      {
        userId: user.id,
      },
      process.env.SECRET_KEY,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d', algorithm: 'HS256' },
    );

    success(res, '登陆成功。', { token });
  } catch (err) {
    failure(res, err);
  }
});

module.exports = router;
