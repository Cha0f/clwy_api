'use strict';

/** 创建课程章节表及课程目录查询索引。 @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // courseId 标识所属课程，rank 控制同课程内的章节顺序。
    await queryInterface.createTable('Chapters', {
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
      title: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      content: {
        type: Sequelize.TEXT,
      },
      video: {
        type: Sequelize.STRING,
      },
      rank: {
        allowNull: false,
        defaultValue: 1,
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
    await queryInterface.addIndex('Chapters', {
      fields: ['courseId'],
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('Chapters');
  },
};
