/**
 * 管理员附件路由。
 */
const express = require('express');
const { Op } = require('sequelize');
const { Attachment, User } = require('../../models');
const { deleteObject } = require('../../utils/cos');
const { success } = require('../../utils/responses');
const { asyncRoute, findByPkOrFail, paginate } = require('../../utils/routes');

const router = express.Router();

router.get(
  '/',
  asyncRoute(async (req, res) => {
    // 文件名先转为字符串并去除空白，空值不添加筛选条件。
    const originalname = req.query.originalname ? String(req.query.originalname).trim() : '';
    const where = originalname ? { originalname: { [Op.like]: `%${originalname}%` } } : undefined;
    const data = await paginate(
      Attachment,
      req.query,
      {
        attributes: { exclude: ['fullpath'] },
        where,
        include: [{ model: User, as: 'user', attributes: ['id', 'username', 'nickname'] }],
        order: [['id', 'DESC']],
      },
      'attachments',
    );

    success(res, '查询附件列表成功。', data);
  }),
);

router.post(
  '/',
  asyncRoute(async (req, res) => {
    // 附件元数据必须由实际上传流程创建，禁止伪造不存在的云端对象。
    success(res, '请通过上传接口创建附件。');
  }),
);

router.delete(
  '/:id',
  asyncRoute(async (req, res) => {
    const attachment = await findByPkOrFail(Attachment, req.params.id, {}, '附件');
    // 先删除云端对象；失败时保留数据库记录，便于稍后重试。
    await deleteObject(attachment.path);
    // 云端确认删除后再移除本地元数据。
    await attachment.destroy();

    success(res, '附件删除成功。');
  }),
);

module.exports = router;
