const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const COS_SDK = require('cos-nodejs-sdk-v5');
const { success, failure } = require('../utils/responses');
const createError = require('http-errors');
const { Attachment } = require('../models');

/**
 * 允许上传的文件 MIME 类型白名单
 *
 * 仅允许 JPG 和 PNG 格式图片。
 */
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png'];

/**
 * Multer 内存存储配置
 *
 * 将文件暂存到内存中，后续直接上传到腾讯云 COS。
 */
const storage = multer.memoryStorage();

/**
 * Multer 文件过滤：检查 MIME 类型
 */
function fileFilter(req, file, cb) {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(createError(400, `不支持的文件类型：${file.mimetype}。仅允许 JPG/PNG 格式图片。`));
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1, // 单次只允许上传一个文件
  },
});

/**
 * 生成唯一文件名（保留原始扩展名）
 *
 * @param {object} file - multer 文件对象（含 originalname）
 * @returns {string} 唯一文件名
 */
function generateFileName(file) {
  const ext = path.extname(file.originalname).toLowerCase();
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${random}${ext}`;
}

/**
 * 上传文件到腾讯云 COS
 *
 * 从内存 buffer 直接上传，不上写到本地磁盘。
 *
 * @param {object} file - multer 文件对象
 * @param {string} fileName - 存储文件名
 * @returns {Promise<string>} 可公开访问的 URL
 */
async function uploadToCos(file, fileName) {
  if (!process.env.COS_ACCESS_KEY_ID || !process.env.COS_ACCESS_KEY_SECRET) {
    throw createError(500, '文件上传服务未配置，请联系管理员。');
  }

  const cos = new COS_SDK({
    SecretId: process.env.COS_ACCESS_KEY_ID,
    SecretKey: process.env.COS_ACCESS_KEY_SECRET,
  });

  const key = `uploads/images/${fileName}`;

  const params = {
    Bucket: process.env.COS_BUCKET,
    Region: process.env.COS_REGION,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    CacheControl: 'public, max-age=31536000, immutable',
  };

  try {
    await cos.putObject(params);
  } catch (err) {
    console.error('COS 上传失败:', err);
    throw createError(500, '文件上传至云端失败。');
  }

  return `https://${params.Bucket}.cos.${params.Region}.myqcloud.com/${key}`;
}

/**
 * 上传图片文件
 *
 * 上传至腾讯云 COS，文件名自动生成（防止冲突和路径穿越）。
 * 仅支持 JPG 和 PNG 格式，单文件不超过 10MB。
 * 上传成功后自动记录附件信息到数据库。
 *
 * POST /uploads/oss
 *
 * 请求：multipart/form-data，字段名 "file"
 * 响应：{ url: "https://...", attachment: {...} }
 */
router.post('/oss', async function (req, res) {
  try {
    // 手动调用 multer 中间件并捕获其错误
    await new Promise((resolve, reject) => {
      upload.single('file')(req, res, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    if (!req.file) {
      throw createError(400, '请选择要上传的文件。');
    }

    const file = req.file;
    const fileName = generateFileName(file);
    const url = await uploadToCos(file, fileName);

    // 获取上传者 userId（前台用 req.userId，后台用 req.user.id）
    const userId = req.userId || req.user?.id;

    // 记录附件信息到数据库
    const attachment = await Attachment.create({
      userId,
      originalname: file.originalname,
      filename: fileName,
      mimetype: file.mimetype,
      size: String(file.size),
      path: `uploads/images/${fileName}`,
      fullpath: url,
      url,
    });

    success(res, '文件上传成功。', { url });
  } catch (error) {
    failure(res, error);
  }
});

module.exports = router;
