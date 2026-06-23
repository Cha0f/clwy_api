const test = require('node:test');
const assert = require('node:assert/strict');
const { User } = require('../models');

test('短密码被识别为客户端参数错误', () => {
  assert.throws(
    () =>
      User.build({
        email: 'test@example.com',
        username: 'tester',
        nickname: '测试用户',
        password: '12345',
        gender: 0,
        role: 0,
      }),
    { status: 400, message: '密码长度必须是6 ~ 45之间。' },
  );
});

test('安全序列化始终删除密码哈希', () => {
  const user = User.build(
    {
      id: 1,
      email: 'safe@example.com',
      username: 'safe-user',
      nickname: '安全用户',
      password: '123456',
      gender: 0,
      role: 0,
    },
    { raw: true },
  );
  user.setDataValue('password', 'hash-value');

  const value = user.toSafeJSON();
  assert.equal(value.email, 'safe@example.com');
  assert.equal('password' in value, false);
});
