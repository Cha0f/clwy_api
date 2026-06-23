const test = require('node:test');
const assert = require('node:assert/strict');
const { cacheKeys } = require('../utils/cache');

test('不同数据形状使用不同缓存命名空间', () => {
  assert.notEqual(cacheKeys.publicUser(1), cacheKeys.privateUser(1));
  assert.notEqual(cacheKeys.course(1), cacheKeys.courseSummary(1));
});

test('列表缓存键包含规范化分页维度', () => {
  assert.equal(cacheKeys.articleList(2, 20), 'articles:2:20');
  assert.equal(cacheKeys.courseList(3, 2, 20), 'courses:3:2:20');
});
