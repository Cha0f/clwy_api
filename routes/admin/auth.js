const express = require('express');
const router = express.Router();
const { User } = require('../../models');
const { Op } = require('sequelize');
const createError = require('http-errors');
const { success, failure } = require('../../utils/responses');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { rateLimit } = require('express-rate-limit');

/**
 * 管理员登录限流中间件
 *
 * 同一 IP 每 15 分钟最多 10 次登录尝试。
 * 防止暴力破解管理员账号。
 */
const signInLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    status: 429,
    message: '请求过于频繁，请稍后再试。',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * 管理员登录
 *
 * 通过邮箱或用户名查找用户，验证密码后检查 role === 100。
 * 全部验证通过后签发 JWT Token（存入 userId），过期时间由环境变量控制。
 *
 * POST /admin/auth/sign_in
 */
router.post('/sign_in', signInLimiter, async (req, res) => {
  try {
    const { login, password } = req.body;
    if (!login) {
      throw createError(400, '邮箱/用户名必须填写。');
    }
    if (!password || !password.length) {
      throw createError(400, '密码必须填写。');
    }

    const condition = {
      where: {
        [Op.or]: [{ email: login }, { username: login }],
      },
    };

    // 通过 email 或 username 查找用户
    const user = await User.findOne(condition);
    if (!user) {
      throw createError(404, '用户不存在。');
    }

    // bcrypt 比对密码
    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      throw createError(401, '密码错误。');
    }

    // 必须是管理员角色才能登录后台
    if (user.role !== 100) {
      throw createError(401, '您没有权限登录管理员后台。');
    }

    // 签发 JWT
    const token = jwt.sign(
      {
        userId: user.id,
      },
      process.env.SECRET_KEY,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h', algorithm: 'HS256' },
    );

    success(res, '登录成功。', { token });
  } catch (error) {
    failure(res, error);
  }
});

module.exports = router;
