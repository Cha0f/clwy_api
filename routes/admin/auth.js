const express = require('express');
const router = express.Router();
const { User } = require('../../models');
const { Op } = require('sequelize');
const { BadRequestError, UnauthorizedError, NotFoundError } = require('../../utils/errors');
const { success, failure } = require('../../utils/responses');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { rateLimit } = require('express-rate-limit');

/**
 * 登录限速：同一 IP 每 15 分钟最多 10 次尝试
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
 * POST /admin/auth/sign_in
 */
router.post('/sign_in', signInLimiter, async (req, res) => {
  try {
    const { login, password } = req.body;
    if (!login) {
      throw new BadRequestError('邮箱/用户名必须填写。');
    }
    if (!password || !password.length) {
      throw new BadRequestError('密码必须填写。');
    }

    const condition = {
      where: {
        [Op.or]: [{ email: login }, { username: login }],
      },
    };

    // 通过email或username，查询用户是否存在
    const user = await User.findOne(condition);
    if (!user) {
      throw new NotFoundError('用户不存在，我无法登陆。');
    }

    // 验证密码
    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('密码错误。');
    }

    // 验证是否是管理员
    if (user.role !== 100) {
      throw new UnauthorizedError('您没有权限登陆管理员后台。');
    }

    // 生成身份验证令牌
    const token = jwt.sign(
      {
        userId: user.id,
      },
      process.env.SECRET_KEY,
      { expiresIn: '1h' },
    );

    success(res, '登录成功。', { token });
  } catch (error) {
    failure(res, error);
  }
});

module.exports = router;
