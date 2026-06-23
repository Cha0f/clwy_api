/**
 * 首页聚合路由。
 *
 * 一次返回推荐、人气和入门课程；聚合结果缓存 30 分钟。
 */
const express = require('express');
const { Category, Course, User } = require('../models');
const { cacheKeys, remember } = require('../utils/cache');
const { success } = require('../utils/responses');
const { asyncRoute } = require('../utils/routes');

const router = express.Router();

router.get(
  '/',
  asyncRoute(async (req, res) => {
    // 首页三组数据作为一个整体缓存，确保同一次响应来自同一批查询结果。
    const data = await remember(
      cacheKeys.index,
      async () => {
        // 三个查询互不依赖，并行执行可以缩短接口总耗时。
        const [recommendedCourses, likesCourses, introductoryCourses] = await Promise.all([
          Course.findAll({
            attributes: { exclude: ['content'] },
            include: [
              { model: Category, as: 'category', attributes: ['id', 'name'] },
              {
                model: User,
                as: 'user',
                attributes: ['id', 'username', 'nickname', 'avatar', 'company'],
              },
            ],
            where: { recommended: true },
            order: [['id', 'DESC']],
            limit: 10,
          }),
          Course.findAll({
            attributes: { exclude: ['content'] },
            order: [['likesCount', 'DESC']],
            limit: 10,
          }),
          Course.findAll({
            attributes: { exclude: ['content'] },
            where: { introductory: true },
            order: [['id', 'DESC']],
            limit: 10,
          }),
        ]);

        return { recommendedCourses, likesCourses, introductoryCourses };
      },
      30 * 60,
    );

    success(res, '查询首页数据成功。', data);
  }),
);

module.exports = router;
