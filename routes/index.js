const express = require('express');
const router = express.Router();
const { Course, Category, User } = require('../models');
const { success, failure } = require('../utils/responses');

/**
 * 首页数据聚合接口
 *
 * 组合返回三组课程数据，供前端首页展示：
 *   - recommendedCourses: 推荐的课程（焦点图区域）
 *   - likesCourses:       人气课程（按点赞数降序）
 *   - introductoryCourses:入门课程（适合新手）
 *
 * GET /
 */
router.get('/', async (req, res) => {
  try {
    // 1. 焦点图：查询 recommended = true 的课程，关联分类和讲师
    const recommendedCourses = await Course.findAll({
      attributes: { exclude: ['CategoryId', 'UserId', 'content'] },
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'nickname', 'avatar', 'company'],
        },
      ],
      where: { recommended: true },
      order: [['id', 'DESC']],
      limit: 10,
    });

    // 2. 人气课程：按 likesCount 降序取前 10
    const likesCourses = await Course.findAll({
      attributes: { exclude: ['CategoryId', 'UserId', 'content'] },
      order: [['likesCount', 'DESC']],
      limit: 10,
    });

    // 3. 入门课程：查询 introductory = true 的课程
    const introductoryCourses = await Course.findAll({
      attributes: { exclude: ['CategoryId', 'UserId', 'content'] },
      where: { introductory: true },
      order: [['id', 'DESC']],
      limit: 10,
    });

    success(res, '获取首页数据成功。', {
      recommendedCourses,
      likesCourses,
      introductoryCourses,
    });
  } catch (e) {
    failure(res, e);
  }
});

module.exports = router;
