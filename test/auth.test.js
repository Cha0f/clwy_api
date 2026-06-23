const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { getBearerToken, verifyUserId } = require('../middlewares/auth');

test('getBearerToken 支持大小写不敏感的 Bearer 前缀', () => {
  assert.equal(getBearerToken({ headers: { authorization: 'bearer token-value' } }), 'token-value');
  assert.throws(() => getBearerToken({ headers: {} }), { status: 401 });
});

test('verifyUserId 只接受 HS256 且返回 userId', () => {
  const previousSecret = process.env.SECRET_KEY;
  process.env.SECRET_KEY = 'test-secret';
  try {
    const token = jwt.sign({ userId: 42 }, process.env.SECRET_KEY, { algorithm: 'HS256' });
    assert.equal(verifyUserId(token), 42);
    assert.throws(() => verifyUserId(jwt.sign({}, process.env.SECRET_KEY)), { status: 401 });
  } finally {
    if (previousSecret === undefined) {
      delete process.env.SECRET_KEY;
    } else {
      process.env.SECRET_KEY = previousSecret;
    }
  }
});
