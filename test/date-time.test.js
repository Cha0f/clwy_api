const test = require('node:test');
const assert = require('node:assert/strict');
const { DATE_TIME_FORMAT, formatTimestamps } = require('../utils/date-time');

test('递归格式化所有层级的 createdAt 和 updatedAt', () => {
  const input = {
    createdAt: new Date(2026, 5, 23, 10, 20, 30),
    updatedAt: new Date(2026, 5, 23, 11, 21, 31),
    courses: [
      {
        id: 1,
        createdAt: '2026-06-22T01:02:03.000Z',
        category: { createdAt: new Date(2026, 5, 21, 8, 9, 10) },
      },
    ],
  };

  const result = formatTimestamps(input);
  assert.equal(DATE_TIME_FORMAT, 'YYYY-MM-DD HH:mm:ss');
  assert.match(result.createdAt, /^2026-06-23 10:20:30$/);
  assert.equal(result.updatedAt, '2026-06-23 11:21:31');
  assert.match(result.courses[0].createdAt, /^2026-06-22 \d{2}:02:03$/);
  assert.equal(result.courses[0].category.createdAt, '2026-06-21 08:09:10');
});

test('保留其他字段、空值和无效时间', () => {
  const input = {
    createdAt: 'not-a-date',
    updatedAt: null,
    deletedAt: new Date(2026, 5, 23, 10, 20, 30),
    child: { createdAt: null },
  };

  const result = formatTimestamps(input);
  assert.equal(result.createdAt, 'not-a-date');
  assert.equal(result.updatedAt, null);
  assert.equal(result.deletedAt, input.deletedAt);
  assert.equal(result.child.createdAt, null);
});
