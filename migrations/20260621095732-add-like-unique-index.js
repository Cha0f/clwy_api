'use strict';

/** 保证同一用户对同一课程最多存在一条点赞关系。 @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // 添加 courseId + userId 复合唯一索引，防止重复点赞
    await queryInterface.addIndex('Likes', {
      fields: ['courseId', 'userId'],
      unique: true,
    });
  },
  async down(queryInterface) {
    await queryInterface.removeIndex('Likes', ['courseId', 'userId']);
  },
};
