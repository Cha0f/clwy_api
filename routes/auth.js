const express = require('express');
const router = express.Router();
const { User } = require('../models');
const { success, failure } = require('../utils/responses');
const { NotFoundError, BadRequestError, UnauthorizedError } = require('../utils/errors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');

/**
 * 用户注册
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
 * 用户登陆
 * POST /auth/sign_in
 */
router.post('/sign_in', async (req, res) => {
  try {
    const { login, password } = req.body;

    if (!login) {
      throw new BadRequestError('邮箱/用户名必须填写。');
    }
    if (!password) {
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
      throw new NotFoundError('用户不存在，无法登陆。');
    }

    // 验证密码
    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('密码错误。');
    }

    // 生成令牌
    const token = jwt.sign(
      {
        userId: user.id,
      },
      process.env.SECRET_KEY,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
    );

    success(res, '登陆成功。', { token });
  } catch (err) {
    failure(res, err);
  }
});

module.exports = router;
