/**
 * 图形验证码校验中间件。
 *
 * 从请求体中提取 captchaKey 和 captchaText，与 Redis 中存储的值比对，
 * 忽略大小写，校验通过后删除已用验证码。
 */
const createError = require('http-errors');
const { delKey, getKey } = require('../utils/redis');
const { asyncRoute } = require('../utils/routes');

/**
 * 从请求体中提取并验证验证码缓存键。
 *
 * @param {import('express').Request} req Express 请求
 * @returns {string} 验证码 Redis 键
 */
function extractCaptchaKey(req) {
  const { captchaKey } = req.body;
  if (!captchaKey) {
    throw createError(400, '验证码 key 不能为空。');
  }
  if (typeof captchaKey !== 'string' || !captchaKey.startsWith('captcha:')) {
    throw createError(400, '验证码 key 格式不正确。');
  }
  return captchaKey;
}

/**
 * 从请求体中提取并验证验证码文本。
 *
 * @param {import('express').Request} req Express 请求
 * @returns {string} 验证码文本
 */
function extractCaptchaText(req) {
  const { captchaText } = req.body;
  if (!captchaText || typeof captchaText !== 'string') {
    throw createError(400, '验证码不能为空。');
  }
  return captchaText;
}

/**
 * 从 Redis 获取并校验验证码；已过期时直接返回错误。
 *
 * @param {string} captchaKey 验证码缓存键
 * @returns {Promise<string>} 存储的验证码文本
 */
async function fetchValidCaptcha(captchaKey) {
  const stored = await getKey(captchaKey);
  if (!stored) {
    throw createError(400, '验证码已过期。');
  }
  return stored;
}

/**
 * 比对用户输入与存储值，忽略大小写；不一致时抛出错误。
 *
 * @param {string} input 用户输入的验证码
 * @param {string} stored Redis 中存储的验证码
 */
function assertCaptchaMatch(input, stored) {
  if (stored.toLowerCase() !== input.toLowerCase()) {
    throw createError(400, '验证码不正确。');
  }
}

/**
 * 提取验证码键和文本，从 Redis 读取后比对。
 * 校验通过后立即删除已用验证码，防止同一验证码被重复使用。
 */
const validateCaptcha = asyncRoute(async (req, res, next) => {
  const captchaKey = extractCaptchaKey(req);
  const captchaText = extractCaptchaText(req);

  const stored = await fetchValidCaptcha(captchaKey);
  // 先删除再比对，无论结果如何验证码都已失效，防止重试攻击。
  await delKey(captchaKey);
  assertCaptchaMatch(captchaText, stored);

  next();
});

module.exports = validateCaptcha;
