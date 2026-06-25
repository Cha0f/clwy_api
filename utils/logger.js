const { createLogger, format, transports } = require('winston');
const MySQLTransport = require('winston-mysql');
const env = require('../config/env');

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.errors({ stack: true }), // 添加错误堆栈信息
    format.json(),
  ),
  defaultMeta: { service: 'clwy-api' },
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(), // 终端中输出彩色的日志信息
        format.simple(),
      ),
    }),
  ],
});

// 所有数据库配置齐备后才将日志写入 MySQL，否则仅以控制台输出。
const dbHost = env.database.host;
const dbUser = env.database.username;
const dbPassword = env.database.password;
const dbName = env.database.name;
if (dbHost && dbUser && dbPassword && dbName) {
  logger.add(
    new MySQLTransport({
      host: dbHost,
      user: dbUser,
      password: dbPassword,
      database: dbName,
      table: 'Logs',
    }),
  );
}

module.exports = logger;
