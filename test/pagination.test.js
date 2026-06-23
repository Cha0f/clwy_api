const test = require('node:test');
const assert = require('node:assert/strict');
const { getPagination } = require('../utils/pagination');

test('分页参数使用默认值并限制每页最大数量', () => {
  assert.deepEqual(getPagination({}), { currentPage: 1, pageSize: 10, offset: 0 });
  assert.deepEqual(getPagination({ currentPage: '2', pageSize: '200' }), {
    currentPage: 2,
    pageSize: 100,
    offset: 100,
  });
});

test('分页参数拒绝负数、小数、Infinity 和非数字', () => {
  for (const value of ['-1', '1.5', 'Infinity', 'abc']) {
    assert.throws(() => getPagination({ currentPage: value }), { status: 400 });
    assert.throws(() => getPagination({ pageSize: value }), { status: 400 });
  }
});

test('分页参数拒绝超出安全整数范围的 offset', () => {
  assert.throws(
    () => getPagination({ currentPage: String(Number.MAX_SAFE_INTEGER), pageSize: '100' }),
    { status: 400 },
  );
});
