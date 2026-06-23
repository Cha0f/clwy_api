'use strict';

/** 为核心业务关系补充数据库级引用完整性。 @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // 课程必须引用存在的分类，且存在课程时分类不能删除。
    await queryInterface.addConstraint('Courses', {
      fields: ['categoryId'],
      type: 'foreign key',
      name: 'fk_courses_category_id',
      references: { table: 'Categories', field: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    });
    // 课程必须引用存在的讲师，且存在课程时讲师不能删除。
    await queryInterface.addConstraint('Courses', {
      fields: ['userId'],
      type: 'foreign key',
      name: 'fk_courses_user_id',
      references: { table: 'Users', field: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    });
    // 有章节的课程禁止删除，防止章节成为孤儿记录。
    await queryInterface.addConstraint('Chapters', {
      fields: ['courseId'],
      type: 'foreign key',
      name: 'fk_chapters_course_id',
      references: { table: 'Courses', field: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    });
    // 删除课程时级联删除无业务价值的点赞关系。
    await queryInterface.addConstraint('Likes', {
      fields: ['courseId'],
      type: 'foreign key',
      name: 'fk_likes_course_id',
      references: { table: 'Courses', field: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
    // 删除用户时同样级联删除其点赞关系。
    await queryInterface.addConstraint('Likes', {
      fields: ['userId'],
      type: 'foreign key',
      name: 'fk_likes_user_id',
      references: { table: 'Users', field: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
    // 有附件记录的用户禁止直接删除，以保留云文件归属信息。
    await queryInterface.addConstraint('Attachments', {
      fields: ['userId'],
      type: 'foreign key',
      name: 'fk_attachments_user_id',
      references: { table: 'Users', field: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    });
  },

  async down(queryInterface) {
    // 按依赖添加的反向顺序移除约束，便于安全回滚。
    await queryInterface.removeConstraint('Attachments', 'fk_attachments_user_id');
    await queryInterface.removeConstraint('Likes', 'fk_likes_user_id');
    await queryInterface.removeConstraint('Likes', 'fk_likes_course_id');
    await queryInterface.removeConstraint('Chapters', 'fk_chapters_course_id');
    await queryInterface.removeConstraint('Courses', 'fk_courses_user_id');
    await queryInterface.removeConstraint('Courses', 'fk_courses_category_id');
  },
};
