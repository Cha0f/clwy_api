/**
 * 管理员文章路由。
 */
const express = require('express');
const { Op } = require('sequelize');
const { Article } = require('../../models');
const { cacheKeys, invalidate } = require('../../utils/cache');
const { success } = require('../../utils/responses');
const { asyncRoute, findByPkOrFail, paginate, pickFields } = require('../../utils/routes');

const router = express.Router();

router.get(
  '/',
  asyncRoute(async (req, res) => {
    const title = req.query.title ? String(req.query.title).trim() : '';
    const where = {};
    const options = { where, order: [['id', 'DESC']] };

    // deleted=true 时只查询回收站中的软删除记录。
    if (req.query.deleted === 'true') {
      options.paranoid = false;
      where.deletedAt = { [Op.not]: null };
    }
    // 非空标题使用 LIKE 模糊筛选。
    if (title) {
      where.title = { [Op.like]: `%${title}%` };
    }

    const data = await paginate(Article, req.query, options, 'articles');
    success(res, '查询文章列表成功。', data);
  }),
);

router.get(
  '/:id',
  asyncRoute(async (req, res) => {
    const article = await findByPkOrFail(Article, req.params.id, {}, '文章');
    success(res, '查询文章成功。', { article });
  }),
);

router.post(
  '/',
  asyncRoute(async (req, res) => {
    const article = await Article.create(pickFields(req.body, ['title', 'content']));
    await clearArticleCache(article.id);

    success(res, '创建文章成功。', { article }, 201);
  }),
);

router.post(
  '/delete',
  asyncRoute(async (req, res) => {
    // 先查资源再删除，避免不存在的 ID 仍返回成功。
    const article = await findByPkOrFail(Article, req.body.id, {}, '文章');
    await article.destroy();
    await clearArticleCache(article.id);

    success(res, '已删除到回收站。');
  }),
);

router.post(
  '/restore',
  asyncRoute(async (req, res) => {
    // paranoid=false 才能查询已经软删除的记录。
    const article = await findByPkOrFail(Article, req.body.id, { paranoid: false }, '文章');
    await article.restore();
    await clearArticleCache(article.id);

    success(res, '已恢复成功。');
  }),
);

router.post(
  '/force_delete',
  asyncRoute(async (req, res) => {
    // 彻底删除同时支持回收站记录和仍未软删除的记录。
    const article = await findByPkOrFail(Article, req.body.id, { paranoid: false }, '文章');
    await article.destroy({ force: true });
    await clearArticleCache(article.id);

    success(res, '已彻底删除。');
  }),
);

router.put(
  '/:id',
  asyncRoute(async (req, res) => {
    const article = await findByPkOrFail(Article, req.params.id, {}, '文章');
    await article.update(pickFields(req.body, ['title', 'content']));
    await clearArticleCache(article.id);

    success(res, '文章更新成功', { article });
  }),
);

async function clearArticleCache(articleId) {
  await invalidate({
    keys: [cacheKeys.article(articleId)],
    patterns: [cacheKeys.articleLists],
  });
}

module.exports = router;
