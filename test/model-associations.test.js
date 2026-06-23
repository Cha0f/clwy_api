const test = require('node:test');
const assert = require('node:assert/strict');
const { Attachment, Chapter, Course, User } = require('../models');

test('一对多关联复用显式外键，不生成大小写重复字段', () => {
  assert.equal(Course.associations.chapter.foreignKey, 'courseId');
  assert.equal(Chapter.associations.course.foreignKey, 'courseId');
  assert.equal(User.associations.attachments.foreignKey, 'userId');
  assert.equal(Attachment.associations.user.foreignKey, 'userId');
  assert.equal(Chapter.rawAttributes.CourseId, undefined);
  assert.equal(Attachment.rawAttributes.UserId, undefined);
});
