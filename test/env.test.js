const test = require('node:test');
const assert = require('node:assert/strict');
const env = require('../config/env');

test('环境配置通过 getter 读取最新的进程变量', () => {
  const previousPort = process.env.PORT;
  const previousRedisUrl = process.env.REDIS_URL;
  try {
    process.env.PORT = '4567';
    process.env.REDIS_URL = 'redis://example.test:6380';

    assert.equal(env.port, '4567');
    assert.equal(env.redis.url, 'redis://example.test:6380');
  } finally {
    restoreEnv('PORT', previousPort);
    restoreEnv('REDIS_URL', previousRedisUrl);
  }
});

test('CORS 来源支持逗号分隔、空格清理和运行时覆盖', () => {
  const previousCorsOrigins = process.env.CORS_ORIGINS;
  try {
    process.env.CORS_ORIGINS = ' http://localhost:5173, http://localhost:3000 ';

    assert.deepEqual(env.cors.origins, ['http://localhost:5173', 'http://localhost:3000']);
  } finally {
    restoreEnv('CORS_ORIGINS', previousCorsOrigins);
  }
});

function restoreEnv(name, value) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }
  process.env[name] = value;
}
