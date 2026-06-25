const { createLogger, format, transports } = require('winston');
const RabbitMQTransport = require('./logger-transport');

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
    // 日志通过 RabbitMQ 异步写入 MySQL，不阻塞主流程。
    new RabbitMQTransport({ queue: 'log_queue' }),
  ],
});

module.exports = logger;
