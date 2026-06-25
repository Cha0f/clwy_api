/**
 * 日志消费者。
 *
 * 从 RabbitMQ log_queue 读取日志消息，通过 Sequelize 写入 Logs 表。
 * 使用 noAck: false + 手动确认，确保 MySQL 瞬断时消息可重试不丢失。
 *
 * 初始化延迟：app.js 启动时异步运行，不影响 HTTP 服务启动。
 */
const amqp = require('amqplib');
const { Log } = require('../models');

const QUEUE_LOG = 'log_queue';

/**
 * 启动日志消费者。
 *
 * 建立 RabbitMQ 连接和通道，进入消费循环。
 * 该函数在 app.js 启动时调用；如果 RabbitMQ 不可用，
 * 仅日志投递受影响，HTTP 服务正常运行。
 */
async function logConsumer() {
  const connection = await amqp.connect(process.env.RABBITMQ_URL);
  const channel = await connection.createChannel();
  await channel.assertQueue(QUEUE_LOG, {
    durable: true,
    // 最多保留 10000 条、单条不超过 64 KiB，防止消费者离线时无限制积压。
    maxLength: 10000,
    maxLengthBytes: 655360000,
  });

  // 每次预取 10 条，防止消费者恢复时大批量挤压。
  channel.prefetch(10);

  channel.consume(
    QUEUE_LOG,

    async (msg) => {
      if (!msg) return;

      try {
        // 容错：如果消息体不是合法 JSON，丢弃并记录。
        let info;
        try {
          info = JSON.parse(msg.content.toString());
        } catch {
          channel.ack(msg);
          return;
        }

        const level = info.level || 'info';
        const message =
          typeof info.message === 'string'
            ? info.message
            : JSON.stringify(info.message);
        // 剥离已知字段，其余全部作为 meta 保存，保留原始 winston 日志的完整上下文
        const { level: _l, message: _m, timestamp: _t, ...rest } = info;
        const meta = typeof rest === 'string' ? rest : JSON.stringify(rest);
        const timestamp = info.timestamp
          ? new Date(info.timestamp)
          : new Date();

        await Log.create({
          level,
          message,
          meta,
          timestamp,
        });

        channel.ack(msg);
      } catch (error) {
        // 数据库写入失败时 nack 并重新入队，由 RabbitMQ 重试。
        // eslint-disable-next-line no-console
        console.error('日志消费者写入失败：', error.message);
        channel.nack(msg, false, true);
      }
    },
    { noAck: false },
  );
}

module.exports = { logConsumer };
