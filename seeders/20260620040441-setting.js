'use strict';

/** 写入唯一一条站点设置。 @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // Setting 是单例表，只写入一条站点基础信息。
    await queryInterface.bulkInsert(
      'Settings',
      [
        {
          name: '长乐未央',
          icp: '鄂ICP备13016268号-11',
          copyright: '© 2013 Changle Weiyang Inc. All Rights Reserved.',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {},
    );
  },

  async down(queryInterface) {
    // 回滚时清空系统设置。
    await queryInterface.bulkDelete('Settings', null, {});
  },
};
