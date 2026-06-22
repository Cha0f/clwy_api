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
 * 创建普通用户（role = 0），密码在 User Model 的 setter 中自动 bcrypt 加密。
 * 注册默认性别为"未选择"（0），普通用户角色（0）。
 * 响应前删除 password 字段，避免泄露哈希值。
 *
 * POST /auth/sign_up
 */
router.post('/sign_up', async (req, res) => {
  try {
    // 手动构建 body（而非直接 user.create(req.body)），防止 mass assignment 注入额外字段
    const body = {
      email: req.body.email,
      username: req.body.username,
      password: req.body.password,
      nickname: req.body.nickname,
      gender: 0,
      role: 0,
    };

    const user = await User.create(body);
    // 注册成功不返回密码 hash
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
 * 验证密码使用 bcrypt.compareSync 与数据库中哈希比对。
 * 登录成功返回 JWT Token，过期时间由 JWT_EXPIRES_IN 控制（默认 7d）。
 * 限流由 app.js 中挂载的 rate-limit 中间件保护（15 分钟最多 20 次）。
 *
 * 安全说明：无论用户是否存在还是密码错误，都返回相同的错误消息，
 * 防止攻击者通过错误消息差异枚举已注册邮箱。
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

    // 通过 email 或 username 查询用户
    const user = await User.findOne(condition);
    // 统一错误消息：将"用户不存在"和"密码错误"合并为同一条消息，避免账号枚举攻击
    if (!user || !bcrypt.compareSync(password, user?.password || '')) {
      throw createError(401, '邮箱/用户名或密码错误。');
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
