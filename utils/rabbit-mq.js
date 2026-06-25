const amqp = require('amqplib');
const sendMail = require('./mail');
const logger = require('./logger');

const QUEUE_MAIL = 'mail_queue';

// 创建全局的 RabbitMQ 连接和通道
let connection;
let channel;
let connecting = false;

/**
 * 连接到 RabbitMQ
 * @returns {Promise<*>}
 */
const connectToRabbitMQ = async () => {
  if (channel) return; // 已经就绪
  if (connecting) return; // 正在连接中，避免并发
  connecting = true;

  try {
    connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertQueue(QUEUE_MAIL, { durable: true });

    connection.on('close', () => {
      channel = null;
      connecting = false;
    });
  } catch (error) {
    channel = null;
    connecting = false;
    throw error; // 向上传播，让调用方决定处理策略
  }
};

/**
 * 邮件队列生产者（发送消息）
 */
const mailProducer = async (msg) => {
  try {
    await connectToRabbitMQ();
    channel.sendToQueue(QUEUE_MAIL, Buffer.from(JSON.stringify(msg)), {
      persistent: true,
    });
  } catch (error) {
    // HTTP 响应已发送，此处只日志不抛，避免触发全局未捕获异常
    logger.error('邮件队列生产者错误：', { error: error.message, stack: error.stack, msg });
  }
};

/**
 * 邮件队列消费者（接收消息）
 */
const mailConsumer = async () => {
  await connectToRabbitMQ();

  channel.consume(
    QUEUE_MAIL,
    async (msg) => {
      try {
        const message = JSON.parse(msg.content.toString());
        await sendMail(message.to, message.subject, message.html);
      } catch (error) {
        logger.error('邮件队列消费者错误：', { error: error.message, stack: error.stack, msg: msg.content.toString() });
      }
    },
    { noAck: true },
  );

  logger.info('邮件消费者已启动');
};

module.exports = {
  mailProducer,
  mailConsumer,
};
