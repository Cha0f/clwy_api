'use strict';

/** 为文章增加 Sequelize paranoid 所需的软删除字段。 @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // deletedAt 保存软删除时间；null 表示文章仍然可见。
    await queryInterface.addColumn('Articles', 'deletedAt', {
      type: Sequelize.DATE,
    });

    // 回收站查询会按 deletedAt 是否为空筛选，因此补充索引。
    await queryInterface.addIndex('Articles', {
      fields: ['deletedAt'],
    });
  },

  async down(queryInterface) {
    // 删除列时数据库会同步删除依赖该列的索引。
    await queryInterface.removeColumn('Articles', 'deletedAt');
  },
};
