'use strict';

/** 创建用户与课程的点赞关系表。 @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 先创建单列索引；业务复合唯一索引由下一条迁移添加。
    await queryInterface.createTable('Likes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER.UNSIGNED,
      },
      courseId: {
        allowNull: false,
        type: Sequelize.INTEGER.UNSIGNED,
      },
      userId: {
        allowNull: false,
        type: Sequelize.INTEGER.UNSIGNED,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
    await queryInterface.addIndex('Likes', {
      fields: ['courseId'],
    });
    await queryInterface.addIndex('Likes', {
      fields: ['userId'],
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('Likes');
  },
};
