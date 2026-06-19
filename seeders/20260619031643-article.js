'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
     */

    const articles = [];
    const count = 100;

    for (let i = 0; i < count; i++) {
      const article = {
        title: `文章的标题 ${i + 1}`,
        content: `文章的内容 ${i + 1}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      articles.push(article);
    }
    await queryInterface.bulkInsert('Articles', articles, {});
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete('Articles', null, {});
  },
};
