/**
 * 图片上传路由。
 *
 * 前台和后台共用本路由；挂载位置的认证中间件决定上传者身份来源。
 */
const express = require('express');
const createError = require('http-errors');
const { Attachment } = require('../models');
const { parseImage } = require('../middlewares/image-upload');
const { deleteObject, uploadImage } = require('../utils/cos');
const { success } = require('../utils/responses');
const { asyncRoute } = require('../utils/routes');

const router = express.Router();

// POST /uploads/oss
// @body {file} file - 图片文件（multipart/form-data，仅 JPG/PNG，单文件，最大 10MB）
// @returns {string} url - 上传后的 COS URL
router.post(
  '/oss',
  asyncRoute(async (req, res) => {
    // Multer 完成格式、数量和大小校验后返回内存文件。
    const file = await parseImage(req, res);
    if (!file) {
      throw createError(400, '请选择要上传的文件。');
    }

    // 前台认证写入 req.userId，后台认证写入 req.user.id。
    const userId = req.userId || req.user?.id;
    if (!userId) {
      throw createError(401, '无法识别上传用户。');
    }

    // 先上传云端，再保存可追踪的附件记录。
    const uploaded = await uploadImage(file);
    try {
      await Attachment.create({
        userId,
        originalname: file.originalname,
        filename: uploaded.filename,
        mimetype: file.mimetype,
        size: String(file.size),
        path: uploaded.objectPath,
        fullpath: uploaded.url,
        url: uploaded.url,
      });
    } catch (error) {
      // 数据库失败时回滚云端对象，避免产生无法管理的孤儿文件。
      await deleteObject(uploaded.objectPath).catch(() => {});
      throw error;
    }

    success(res, '文件上传成功。', { url: uploaded.url });
  }),
);

module.exports = router;
