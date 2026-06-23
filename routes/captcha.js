/**
 * 验证码路由。
 */
const express = require('express');
const { success } = require('../utils/responses');
const { asyncRoute } = require('../utils/routes');
const svgCaptcha = require('svg-captcha');
const crypto = require('crypto');
const { cacheKeys } = require('../utils/cache');
const { setKey } = require('../utils/redis');

const router = express.Router();

/**
 * 获取图形验证码。
 * @returns {Object} { captchaKey: "captcha:uuid", captchaData: "<svg>..." }
 */
router.get(
  '/',
  asyncRoute(async (req, res) => {
    // 生成验证码
    const captcha = svgCaptcha.create({
      size: 4, // 验证码长度
      ignoreChars: '0O1Il9quv', // 验证码字符中排除 0O1Il9quv
      noise: 3, // 干扰线条数量
      color: true, // 是否有颜色，
      width: 100, // 宽
      height: 40, // 高
    });

    // 将验证码保存在缓存
    const uuid = crypto.randomUUID();
    const captchaKey = cacheKeys.captcha(uuid);
    await setKey(captchaKey, captcha.text, 60 * 10); // 10分钟过期

    success(res, '验证码获取成功。', {
      captchaKey,
      captchaData: captcha.data,
    });
  }),
);

module.exports = router;
