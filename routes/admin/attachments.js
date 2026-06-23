const express = require('express');
const router = express.Router();
const { Attachment, User } = require('../../models');
const { Op } = require('sequelize');
const createError = require('http-errors');
const COS_SDK = require('cos-nodejs-sdk-v5');
const { success, failure } = require('../../utils/responses');
const { getPagination } = require('../../utils/pagination');

/**
 * 从腾讯云 COS 删除文件
 *
 * @param {string} filePath - COS 上文件相对路径（如 uploads/images/xxx.jpg）
 * @returns {Promise<void>}
 */
async function deleteFromCos(filePath) {
  if (!filePath) return;

  if (!process.env.COS_ACCESS_KEY_ID || !process.env.COS_ACCESS_KEY_SECRET) {
    console.error('COS 未配置，无法删除远程文件:', filePath);
    return;
  }

  const cos = new COS_SDK({
    SecretId: process.env.COS_ACCESS_KEY_ID,
    SecretKey: process.env.COS_ACCESS_KEY_SECRET,
  });

  const params = {
    Bucket: process.env.COS_BUCKET,
    Region: process.env.COS_REGION,
    Key: filePath,
  };

  try {
    await cos.deleteObject(params);
  } catch (err) {
    // 文件已不存在或删除失败时，仅打印警告，不影响数据库记录删除
    console.error('COS 文件删除失败:', err.message || err);
  }
}

/**
 * 查询附件列表（后台）
 *
 * 支持按文件原名（originalname）模糊搜索，按 id 降序排列。
 * 自动关联上传者信息。
 *
 * GET /admin/attachments?originalname=&currentPage=&pageSize=
 */
router.get('/', async function (req, res) {
  try {
    const query = req.query;
    const { currentPage, pageSize, offset } = getPagination(query);

    const condition = {
      attributes: { exclude: ['fullpath'] },
      order: [['id', 'DESC']],
      limit: pageSize,
      offset,
      where: {},
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'nickname'],
        },
      ],
    };

    // originalname 模糊搜索（输入净化防类型绕过）
    if (query.originalname) {
      const originalname = String(query.originalname).trim();
      if (originalname) {
        condition.where.originalname = {
          [Op.like]: `%${originalname}%`,
        };
      }
    }

    const { count, rows } = await Attachment.findAndCountAll(condition);
    success(res, '查询附件列表成功。', {
      attachments: rows,
      pagination: {
        total: count,
        currentPage,
        pageSize,
      },
    });
  } catch (err) {
    failure(res, err);
  }
});

/**
 * 上传附件记录
 *
 * 上传附件的记录由 routes/uploads.js 在文件上传时自动创建，
 * 此接口暂不启用，实际使用请通过 POST /uploads/oss 上传后自动记录。
 *
 * POST /admin/attachments
 */
router.post('/', async function (req, res) {
  try {
    success(res, '请通过上传接口创建附件。');
  } catch (err) {
    failure(res, err);
  }
});

/**
 * 删除附件
 *
 * 同步删除 COS 上的原始文件和数据库记录。
 *
 * DELETE /admin/attachments/:id
 */
router.delete('/:id', async function (req, res) {
  try {
    const attachment = await getAttachment(req);

    // 同步删除 COS 上的原始文件
    await deleteFromCos(attachment.path);

    await attachment.destroy();
    success(res, '附件删除成功。');
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 查询当前附件
 *
 * @param {object} req - Express 请求对象，需包含 req.params.id
 * @returns {Promise<import('sequelize').Model>}
 */
async function getAttachment(req) {
  const { id } = req.params;
  const attachment = await Attachment.findByPk(id);
  if (!attachment) {
    throw createError(404, `ID: ${id}的附件没有找到。`);
  }
  return attachment;
}

module.exports = router;
