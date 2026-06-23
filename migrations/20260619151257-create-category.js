'use strict';

/** 创建课程分类表及名称唯一索引。 @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // rank 保存人工排序权重，数值越小越靠前。
    await queryInterface.createTable('Categories', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER.UNSIGNED,
      },
      name: {
        allowNull: false,
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
    await queryInterface.addIndex('Categories', {
      fields: ['name'],
      unique: true,
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('Categories');
  },
};
