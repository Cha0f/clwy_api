'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 模拟用户对课程的点赞数据
    // 种子数据关系：Users(id=2~6) 对 Courses(id=1~14) 的随机点赞
    const likes = [
      // user1 点赞的课程
      { courseId: 1, userId: 2, createdAt: new Date('2026-03-01'), updatedAt: new Date('2026-03-01') },
      { courseId: 2, userId: 2, createdAt: new Date('2026-03-05'), updatedAt: new Date('2026-03-05') },
      { courseId: 4, userId: 2, createdAt: new Date('2026-03-10'), updatedAt: new Date('2026-03-10') },
      { courseId: 7, userId: 2, createdAt: new Date('2026-04-01'), updatedAt: new Date('2026-04-01') },
      { courseId: 13, userId: 2, createdAt: new Date('2026-03-15'), updatedAt: new Date('2026-03-15') },
      { courseId: 10, userId: 2, createdAt: new Date('2026-04-10'), updatedAt: new Date('2026-04-10') },

      // user2 点赞的课程
      { courseId: 2, userId: 3, createdAt: new Date('2026-03-08'), updatedAt: new Date('2026-03-08') },
      { courseId: 4, userId: 3, createdAt: new Date('2026-03-12'), updatedAt: new Date('2026-03-12') },
      { courseId: 5, userId: 3, createdAt: new Date('2026-04-01'), updatedAt: new Date('2026-04-01') },
      { courseId: 6, userId: 3, createdAt: new Date('2026-05-01'), updatedAt: new Date('2026-05-01') },
      { courseId: 9, userId: 3, createdAt: new Date('2026-03-20'), updatedAt: new Date('2026-03-20') },
      { courseId: 14, userId: 3, createdAt: new Date('2026-05-15'), updatedAt: new Date('2026-05-15') },

      // user3 点赞的课程
      { courseId: 1, userId: 4, createdAt: new Date('2026-03-01'), updatedAt: new Date('2026-03-01') },
      { courseId: 3, userId: 4, createdAt: new Date('2026-04-01'), updatedAt: new Date('2026-04-01') },
      { courseId: 4, userId: 4, createdAt: new Date('2026-03-15'), updatedAt: new Date('2026-03-15') },
      { courseId: 7, userId: 4, createdAt: new Date('2026-04-05'), updatedAt: new Date('2026-04-05') },
      { courseId: 8, userId: 4, createdAt: new Date('2026-04-20'), updatedAt: new Date('2026-04-20') },
      { courseId: 13, userId: 4, createdAt: new Date('2026-03-01'), updatedAt: new Date('2026-03-01') },

      // user4 点赞的课程
      { courseId: 4, userId: 5, createdAt: new Date('2026-03-20'), updatedAt: new Date('2026-03-20') },
      { courseId: 9, userId: 5, createdAt: new Date('2026-03-01'), updatedAt: new Date('2026-03-01') },
      { courseId: 10, userId: 5, createdAt: new Date('2026-04-10'), updatedAt: new Date('2026-04-10') },
      { courseId: 11, userId: 5, createdAt: new Date('2026-04-15'), updatedAt: new Date('2026-04-15') },
      { courseId: 12, userId: 5, createdAt: new Date('2026-05-01'), updatedAt: new Date('2026-05-01') },
      { courseId: 13, userId: 5, createdAt: new Date('2026-03-15'), updatedAt: new Date('2026-03-15') },

      // user5 点赞的课程
      { courseId: 1, userId: 6, createdAt: new Date('2026-05-01'), updatedAt: new Date('2026-05-01') },
      { courseId: 2, userId: 6, createdAt: new Date('2026-05-01'), updatedAt: new Date('2026-05-01') },
      { courseId: 5, userId: 6, createdAt: new Date('2026-05-10'), updatedAt: new Date('2026-05-10') },
      { courseId: 6, userId: 6, createdAt: new Date('2026-05-20'), updatedAt: new Date('2026-05-20') },
      { courseId: 13, userId: 6, createdAt: new Date('2026-04-01'), updatedAt: new Date('2026-04-01') },

      // admin 也点赞了一些课程
      { courseId: 1, userId: 1, createdAt: new Date('2026-03-01'), updatedAt: new Date('2026-03-01') },
      { courseId: 4, userId: 1, createdAt: new Date('2026-04-01'), updatedAt: new Date('2026-04-01') },
      { courseId: 13, userId: 1, createdAt: new Date('2026-02-01'), updatedAt: new Date('2026-02-01') },
    ];

    await queryInterface.bulkInsert('Likes', likes, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Likes', null, {});
  },
};
