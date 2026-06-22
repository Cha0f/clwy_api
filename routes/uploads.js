const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { success, failure } = require('../utils/responses');
const createError = require('http-errors');

/**
 * 上传目标配置（通过环境变量切换）
 *
 * 支持三种模式：
 *   1. "cos"（默认）→ 上传至腾讯云 COS
 *   2. "local"          → 存储到本地 public/uploads/
 *   3. "local-dev"      → 存储到系统临时目录（适合开发测试，重启后自动清理）
 */
const UPLOAD_TARGET = process.env.UPLOAD_TARGET || 'cos';

/**
 * 允许上传的文件 MIME 类型白名单
 */
const ALLOWED_MIME_TYPES = [
  // 图片
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  // 视频
  'video/mp4',
  'video/webm',
  'video/ogg',
  // 文档
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

/**
 * Multer 内存存储配置
 *
 * 将文件暂存到内存中，后续由上传策略决定如何处理（直接发往 COS 或写入磁盘）。
 */
const storage = multer.memoryStorage();

/**
 * Multer 文件过滤：检查 MIME 类型和扩展名
 */
function fileFilter(req, file, cb) {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(createError(400, `不支持的文件类型：${file.mimetype}。允许的类型：图片(jpg/png/gif/webp/svg)、视频(mp4/webm/ogg)、PDF、Word。`));
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
 * 根据 MIME 类型推断上传目录
 *
 * image/* → images/
 * video/* → videos/
 * application/pdf → files/
 * application/msword → files/
 *
 * @param {string} mimetype - 文件 MIME 类型
 * @returns {string} 子目录名
 */
function getSubDir(mimetype) {
  if (mimetype.startsWith('image/')) return 'images';
  if (mimetype.startsWith('video/')) return 'videos';
  return 'files';
}

/**
 * 腾讯云 COS 上传策略
 *
 * 从内存 buffer 直接上传到 COS，不上写到本地磁盘。
 *
 * @param {object} file - multer 文件对象
 * @param {string} fileName - 存储文件名
 * @param {string} subDir - 子目录
 * @returns {Promise<string>} 可公开访问的 URL
 */
async function uploadToCos(file, fileName, subDir) {
  const COS_SDK = require('cos-nodejs-sdk-v5');

  const cos = new COS_SDK({
    SecretId: process.env.COS_ACCESS_KEY_ID,
    SecretKey: process.env.COS_ACCESS_KEY_SECRET,
  });

  const key = `uploads/${subDir}/${fileName}`;

  const params = {
    Bucket: process.env.COS_BUCKET,
    Region: process.env.COS_REGION,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    // 设置客户端缓存 1 年，提升重复访问性能
    CacheControl: 'public, max-age=31536000, immutable',
  };

  return new Promise((resolve, reject) => {
    cos.putObject(params, (err, data) => {
      if (err) {
        console.error('COS 上传失败:', err);
        reject(createError(500, '文件上传至云端失败。'));
        return;
      }
      // 构造可公开访问的 CDN/存储桶 URL
      const url = `https://${params.Bucket}.cos.${params.Region}.myqcloud.com/${key}`;
      resolve(url);
    });
  });
}

/**
 * 本地磁盘上传策略
 *
 * 将文件写入本地 public/uploads/ 目录，适用于无 COS 配置的开发环境。
 *
 * @param {object} file - multer 文件对象
 * @param {string} fileName - 存储文件名
 * @param {string} subDir - 子目录
 * @returns {Promise<string>} 本地可访问的 URL
 */
async function uploadToLocal(file, fileName, subDir) {
  const uploadDir = path.join(__dirname, '../public/uploads', subDir);

  // 确保目录存在
  fs.mkdirSync(uploadDir, { recursive: true });

  const filePath = path.join(uploadDir, fileName);
  fs.writeFileSync(filePath, file.buffer);

  return `/uploads/${subDir}/${fileName}`;
}

/**
 * 上传文件
 *
 * 支持三种上传目标，通过 UPLOAD_TARGET 环境变量切换：
 *   - cos（默认）：上传至腾讯云 COS
 *   - local：存储到 public/uploads/
 *   - local-dev：存储到临时目录
 *
 * POST /uploads/oss
 *
 * 请求：multipart/form-data，字段名 "file"
 * 响应：{ url: "https://..." }
 *
 * 限制：
 *   - 单文件不超过 10MB
 *   - 仅允许图片、视频、PDF 和 Word
 *   - 文件名自动生成（防止冲突和路径穿越）
 */
router.post('/oss', upload.single('file'), async function (req, res) {
  try {
    // 检查文件是否上传成功
    if (!req.file) {
      throw createError(400, '请选择要上传的文件。');
    }

    const file = req.file;
    const fileName = generateFileName(file);
    const subDir = getSubDir(file.mimetype);

    let url;
    if (UPLOAD_TARGET === 'local' || UPLOAD_TARGET === 'local-dev') {
      url = await uploadToLocal(file, fileName, subDir);
    } else {
      // 默认使用 COS
      url = await uploadToCos(file, fileName, subDir);
    }

    success(res, '文件上传成功。', { url });
  } catch (error) {
    failure(res, error);
  }
});

module.exports = router;
