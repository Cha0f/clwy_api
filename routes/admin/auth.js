/**
 * 管理员登录路由。
 */
const express = require('express');
const createError = require('http-errors');
const { rateLimit } = require('express-rate-limit');
const { authenticateCredentials, signUserToken } = require('../../middlewares/auth');
const { success } = require('../../utils/responses');
const { asyncRoute } = require('../../utils/routes');
const validateCaptcha = require('../../middlewares/validate-captcha');

const router = express.Router();

// 管理员入口使用更严格的独立限流器，降低暴力破解风险。
const signInLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { status: 429, message: '请求过于频繁，请稍后再试。' },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /admin/auth/sign_in
// @body {string} login - 邮箱或用户名
// @body {string} password - 密码
// @body {string} captchaKey - 验证码 key
// @body {string} captchaText - 验证码文本
// @returns {string} token - JWT Token
router.post(
  '/sign_in',
  validateCaptcha,
  signInLimiter,
  asyncRoute(async (req, res) => {
    const { login, password } = req.body;
    // 复用前后台一致的参数检查、账号查询和密码比对。
    const user = await authenticateCredentials(login, password);
    // 普通用户即使凭据正确也不能取得后台 Token。
    if (user.role !== 100) {
      throw createError(401, '您没有权限登录管理员后台。');
    }

    // 后台默认有效期为 1 小时；角色仍由每次后台请求实时查询。
    const token = signUserToken(user.id, '1h');

    success(res, '登录成功。', { token });
  }),
);

module.exports = router;
