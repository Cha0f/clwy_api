/**
 * 腾讯云 COS 文件操作模块。
 *
 * COS 客户端创建、配置检查、文件命名、上传和删除都集中在这里，
 * 上传路由与附件管理路由不再各自理解 SDK 参数。
 */
const path = require('path');
const createError = require('http-errors');
const COS = require('cos-nodejs-sdk-v5');
const env = require('../config/env');

function getConfig() {
  const config = {
    secretId: env.cos.accessKeyId,
    secretKey: env.cos.accessKeySecret,
    bucket: env.cos.bucket,
    region: env.cos.region,
  };

  // 四个配置缺少任意一个都无法构造合法请求。
  if (!config.secretId || !config.secretKey || !config.bucket || !config.region) {
    throw createError(500, '文件上传服务未配置，请联系管理员。');
  }
  return config;
}

function createClient(config) {
  // 每次操作创建轻量 SDK 客户端，密钥不会暴露给调用方。
  return new COS({ SecretId: config.secretId, SecretKey: config.secretKey });
}

function createFileName(originalName) {
  // 仅保留扩展名，原文件名不会进入对象路径，因此不存在路径穿越。
  const extension = path.extname(originalName).toLowerCase();
  // 时间戳便于定位上传时间，随机段降低同毫秒冲突概率。
  const random = Math.random().toString(36).slice(2, 10);
  return `${Date.now()}-${random}${extension}`;
}

/**
 * 上传 Multer 文件并返回数据库需要保存的对象信息。
 */
async function uploadImage(file) {
  const config = getConfig();
  const client = createClient(config);
  const filename = createFileName(file.originalname);
  const objectPath = `uploads/images/${filename}`;

  try {
    // Buffer 直接传给 COS，Content-Type 与上传白名单保持一致。
    await client.putObject({
      Bucket: config.bucket,
      Region: config.region,
      Key: objectPath,
      Body: file.buffer,
      ContentType: file.mimetype,
      CacheControl: 'public, max-age=31536000, immutable',
    });
  } catch (error) {
    console.error('COS 上传失败:', error);
    throw createError(500, '文件上传至云端失败。');
  }

  // COS 默认域名可由 Bucket、Region 和对象路径稳定推导。
  const url = `https://${config.bucket}.cos.${config.region}.myqcloud.com/${objectPath}`;
  return { filename, objectPath, url };
}

/**
 * 删除一个 COS 对象；失败时抛错，让调用方决定是否删除数据库记录。
 */
async function deleteObject(objectPath) {
  if (!objectPath) {
    return;
  }
  const config = getConfig();
  const client = createClient(config);

  try {
    await client.deleteObject({
      Bucket: config.bucket,
      Region: config.region,
      Key: objectPath,
    });
  } catch (error) {
    console.error('COS 文件删除失败:', error);
    throw createError(502, '云端文件删除失败，请稍后重试。');
  }
}

module.exports = {
  createFileName,
  deleteObject,
  uploadImage,
};
