'use strict';

/** 创建课程表及分类、讲师查询索引。 @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // likesCount 与 chaptersCount 是为列表查询准备的冗余计数器。
    await queryInterface.createTable('Courses', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER.UNSIGNED,
      },
      categoryId: {
        allowNull: false,
        type: Sequelize.INTEGER.UNSIGNED,
      },
      userId: {
        allowNull: false,
        type: Sequelize.INTEGER.UNSIGNED,
      },
      name: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      image: {
        type: Sequelize.STRING,
      },
      recommended: {
        allowNull: false,
        defaultValue: false,
        type: Sequelize.BOOLEAN,
      },
      introductory: {
        allowNull: false,
        defaultValue: false,
        type: Sequelize.BOOLEAN,
      },
      content: {
        type: Sequelize.TEXT,
      },
      likesCount: {
        allowNull: false,
        defaultValue: 0,
        type: Sequelize.INTEGER.UNSIGNED,
      },
      chaptersCount: {
        allowNull: false,
        defaultValue: 0,
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
    await queryInterface.addIndex('Courses', {
      fields: ['categoryId'],
    });
    await queryInterface.addIndex('Courses', {
      fields: ['userId'],
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('Courses');
  },
};
