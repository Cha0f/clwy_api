/**
 * RabbitMQ Winston Transport。
 *
 * 将日志消息发布到 RabbitMQ 队列，由独立的 logConsumer 异步写入数据库。
 * 连接采用懒加载，首次 log() 调用时建立，失败时回退到控制台输出。
 */
const Transport = require('winston-transport');
const amqp = require('amqplib');

const QUEUE_LOG = 'log_queue';

module.exports = class RabbitMQTransport extends Transport {
  constructor(options = {}) {
    super(options);
    this.queue = options.queue || QUEUE_LOG;
    this.channel = null;
    this.connecting = false;
    this.connection = null;
  }

  /**
   * winston 每次 logger.log/error/info 时调用此方法。
   *
   * @param {object} info 格式化后的日志信息对象
   * @param {Function} callback winston 约定必须调用以继续处理下一个传输器
   */
  async log(info, callback) {
    // winston 要求 transport 首先发出 logged 事件，并在 setImmediate 中执行
    // 以确保上游的写入操作在当前堆栈之后处理。
    setImmediate(() => this.emit('logged', info));

    try {
      if (!this.channel) await this.connect();

      this.channel.sendToQueue(
        this.queue,
        Buffer.from(
          JSON.stringify({
            ...info,
            timestamp: new Date().toISOString(),
          }),
        ),
        { persistent: true },
      );
    } catch (error) {
      // RabbitMQ 不可用时回退到控制台，不崩溃进程。
      // eslint-disable-next-line no-console
      console.error('日志队列生产者失败：', error.message);
    }

    callback();
  }

  /**
   * 懒加载 RabbitMQ 连接和通道，带并发保护。
   */
  async connect() {
    if (this.channel) return;
    if (this.connecting) return;
    this.connecting = true;

    try {
      this.connection = await amqp.connect(process.env.RABBITMQ_URL);
      this.channel = await this.connection.createChannel();
      await this.channel.assertQueue(this.queue, { durable: true });

      this.connection.on('close', () => {
        this.channel = null;
        this.connection = null;
        this.connecting = false;
      });
    } catch (error) {
      this.connecting = false;
      throw error;
    }
  }
};
