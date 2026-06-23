/**
 * 前台注册与登录路由。
 */
const express = require('express');
const { User } = require('../models');
const { authenticateCredentials, signUserToken } = require('../middlewares/auth');
const { success } = require('../utils/responses');
const { asyncRoute, pickFields } = require('../utils/routes');
const validateCaptcha = require('../middlewares/validate-captcha');

const router = express.Router();

// POST /auth/sign_up
// @body {string} email - 邮箱
// @body {string} username - 用户名
// @body {string} password - 密码
// @body {string} nickname - 昵称
// @body {string} captchaKey - 验证码 key
// @body {string} captchaText - 验证码文本
router.post(
  '/sign_up',
  validateCaptcha,
  asyncRoute(async (req, res) => {
    // 只接受注册所需字段，客户端不能自行设置角色或其他内部属性。
    const body = pickFields(req.body, ['email', 'username', 'password', 'nickname']);
    // 新注册账号使用模型定义的默认性别语义和普通用户角色。
    body.gender = 0;
    body.role = 0;
    // User 的 password setter 会在写入数据库前执行 bcrypt 哈希。
    const user = await User.create(body);

    success(res, '创建用户成功', { user: user.toSafeJSON() }, 201);
  }),
);

// POST /auth/sign_in
// @body {string} login - 邮箱或用户名
// @body {string} password - 密码
// @body {string} captchaKey - 验证码 key
// @body {string} captchaText - 验证码文本
// @returns {string} token - JWT Token
router.post(
  '/sign_in',
  validateCaptcha,
  asyncRoute(async (req, res) => {
    const { login, password } = req.body;
    // 复用认证模块完成参数检查、账号查询和 bcrypt 比对。
    const user = await authenticateCredentials(login, password);
    // 前台默认有效期为 7 天；环境变量可统一覆盖。
    const token = signUserToken(user.id, '7d');

    success(res, '登陆成功。', { token });
  }),
);

module.exports = router;
