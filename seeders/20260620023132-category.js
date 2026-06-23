'use strict';

/** 写入课程分类及前台排序。 @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // 按前台展示顺序写入六个课程分类。
    await queryInterface.bulkInsert(
      'Categories',
      [
        { name: '前端开发', rank: 1, createdAt: new Date(), updatedAt: new Date() },
        { name: '后端开发', rank: 2, createdAt: new Date(), updatedAt: new Date() },
        { name: '移动端开发', rank: 3, createdAt: new Date(), updatedAt: new Date() },
        { name: '数据库', rank: 4, createdAt: new Date(), updatedAt: new Date() },
        { name: '服务器运维', rank: 5, createdAt: new Date(), updatedAt: new Date() },
        { name: '公共', rank: 6, createdAt: new Date(), updatedAt: new Date() },
      ],
      {},
    );
  },

  async down(queryInterface) {
    // 回滚时删除本种子涉及的全部分类。
    await queryInterface.bulkDelete('Categories', null, {});
  },
};
