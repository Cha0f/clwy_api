/**
 * 环境变量唯一入口。
 *
 * 整个进程只在这里调用 dotenv.config()。其他模块导入本文件读取配置，
 * Node.js 模块缓存会保证 .env 每个进程只解析一次。
 */
const path = require('path');
const dotenv = require('dotenv');

// 使用项目绝对路径，避免从其他工作目录启动时找不到 .env。
dotenv.config({
  path: path.resolve(__dirname, '..', '.env'),
  // dotenv 17 默认输出提示信息；配置加载属于内部细节，不写入应用日志。
  quiet: true,
});

/**
 * 使用 getter 保留 process.env 的运行时覆盖能力，也方便测试临时替换变量。
 */
module.exports = {
  get nodeEnv() {
    return process.env.NODE_ENV || 'development';
  },
  get port() {
    return process.env.PORT || '3000';
  },
  jwt: {
    get secret() {
      return process.env.SECRET_KEY;
    },
    get expiresIn() {
      return process.env.JWT_EXPIRES_IN;
    },
  },
  database: {
    get username() {
      return process.env.DB_USERNAME || 'root';
    },
    get password() {
      return process.env.DB_PASSWORD || null;
    },
    get name() {
      return process.env.DB_DATABASE;
    },
    get host() {
      return process.env.DB_HOST || '127.0.0.1';
    },
  },
  redis: {
    get url() {
      return process.env.REDIS_URL || 'redis://localhost:6379';
    },
  },
  cos: {
    get accessKeyId() {
      return process.env.COS_ACCESS_KEY_ID;
    },
    get accessKeySecret() {
      return process.env.COS_ACCESS_KEY_SECRET;
    },
    get bucket() {
      return process.env.COS_BUCKET;
    },
    get region() {
      return process.env.COS_REGION;
    },
  },
};
