'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 添加 courseId + userId 复合唯一索引，防止重复点赞
    await queryInterface.addIndex('Likes', {
      fields: ['courseId', 'userId'],
      unique: true,
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('Likes', ['courseId', 'userId']);
  },
};
