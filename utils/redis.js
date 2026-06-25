/**
 * Redis 底层适配器。
 *
 * 本文件只负责连接和原子读写；业务缓存键与失效规则位于 cache.js。
 */
const { createClient } = require('redis');
const env = require('../config/env');
const logger = require('./logger');

let client;

/**
 * 获取已连接的单例 Redis 客户端。
 */
async function redisClient() {
  // 已打开的连接可以安全复用，避免每个请求创建新 TCP 连接。
  if (client?.isOpen) {
    return client;
  }

  // 第一次调用或连接已关闭时重新创建客户端。
  client = createClient({ url: env.redis.url });
  // 连接建立后的异步错误不会进入当前 Promise，因此单独监听并记录。
  client.on('error', (error) =>
    logger.error('Redis 连接失败：', {
      error: error.message,
      stack: error.stack,
      code: error.code,
      errno: error.errno,
      syscall: error.syscall,
    }),
  );
  // connect 完成后再把客户端交给调用方。
  await client.connect();
  return client;
}

/**
 * 写入可 JSON 序列化的数据。
 *
 * @param {string} key 缓存键
 * @param {any} value 缓存值
 * @param {number|null} ttl 秒级有效期；null 表示不主动过期
 */
async function setKey(key, value, ttl = null) {
  const connection = await redisClient();
  const serialized = JSON.stringify(value);
  if (ttl !== null) {
    // SET EX 在一条命令中同时写值和有效期，不存在 SET/EXPIRE 中间窗口。
    await connection.set(key, serialized, { EX: ttl });
    return;
  }
  await connection.set(key, serialized);
}

/**
 * 读取并反序列化缓存；键不存在时返回 null。
 */
async function getKey(key) {
  const connection = await redisClient();
  const value = await connection.get(key);
  return value === null ? null : JSON.parse(value);
}

/**
 * 删除一个或多个缓存键。
 */
async function delKey(key) {
  const connection = await redisClient();
  const keys = Array.isArray(key) ? key : [key];
  // Redis DEL 不接受空参数，因此空数组直接结束。
  if (keys.length === 0) {
    return;
  }
  await connection.del(keys);
}

/**
 * 返回匹配给定模式的缓存键。
 *
 * 当前键空间只保存本应用缓存且规模较小，因此使用 KEYS；
 * 如果未来进入大规模共享 Redis，应改用增量 SCAN。
 */
async function getKeysByPattern(pattern) {
  const connection = await redisClient();
  return connection.keys(pattern);
}

/**
 * 清空当前 Redis 实例中的全部数据库。
 */
async function flushAll() {
  const connection = await redisClient();
  await connection.flushAll();
}

module.exports = {
  delKey,
  flushAll,
  getKey,
  getKeysByPattern,
  redisClient,
  setKey,
};
