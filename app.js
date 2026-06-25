/**
 * 服务启动入口
 *
 * 配置 Express 应用、加载中间件（安全头、CORS、日志、JSON 解析）、
 * 挂载前台和后台路由、添加限流、全局错误兜底。
 */
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const morganLogger = require('morgan');
const logger = require('./utils/logger');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const env = require('./config/env');
// 启动邮件消费者
const { mailConsumer } = require('./utils/rabbit-mq');
mailConsumer().catch((err) =>
  logger.error('邮件消费者启动失败：', { error: err.message, stack: err.stack }),
);
const { adminAuth, userAuth } = require('./middlewares/auth');
const { failure } = require('./utils/responses');

// 前台路由
const indexRouter = require('./routes/index');
const categoriesRouter = require('./routes/categories');
const coursesRouter = require('./routes/courses');
const chaptersRouter = require('./routes/chapters');
const articlesRouter = require('./routes/articles');
const settingsRouter = require('./routes/settings');
const searchRouter = require('./routes/search');
const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');
const likesRouter = require('./routes/likes');
const uploadsRouter = require('./routes/uploads');
const captchaRouter = require('./routes/captcha');
// 后台路由
const adminArticlesRouter = require('./routes/admin/articles');
const adminCategoriesRouter = require('./routes/admin/categories');
const adminSettingsRouter = require('./routes/admin/settings');
const adminUsersRouter = require('./routes/admin/users');
const adminCoursesRouter = require('./routes/admin/courses');
const adminChaptersRouter = require('./routes/admin/chapters');
const adminChartsRouter = require('./routes/admin/charts');
const adminAuthRouter = require('./routes/admin/auth');
const adminAttachmentsRouter = require('./routes/admin/attachments');
const adminLogsRouter = require('./routes/admin/logs');

const app = express();

// Helmet 在业务路由前统一写入 CSP、HSTS、X-Frame-Options 等安全响应头。
app.use(helmet());
// CORS 使用明确的来源白名单，并允许前端携带认证信息。
app.use(
  cors({
    origin: env.cors.origins,
    credentials: true,
  }),
);
// Morgan 的 dev 格式记录方法、路径、状态码和耗时，便于开发期排查请求。
app.use(morganLogger('dev'));
// 按顺序解析 JSON、表单和 Cookie，后续路由可直接读取 req.body/req.cookies。
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// public 目录存在时由 Express 直接提供静态资源。
app.use(express.static(path.join(__dirname, 'public')));

// --- 前台路由 ---
app.use('/', indexRouter);
app.use('/categories', categoriesRouter);
app.use('/courses', coursesRouter);
app.use('/chapters', chaptersRouter);
app.use('/articles', articlesRouter);
app.use('/settings', settingsRouter);
app.use('/search', searchRouter);
app.use('/captcha', captchaRouter);

// 前台认证路由共享限流器：同一 IP 在 15 分钟内最多请求 20 次。
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { status: 429, message: '请求过于频繁，请15分钟后再试。' },
});
app.use('/auth', authLimiter, authRouter);
// 前台私有路由先校验 JWT，再进入用户、点赞和上传处理器。
app.use('/users', userAuth, usersRouter);
app.use('/likes', userAuth, likesRouter);
app.use('/uploads', userAuth, uploadsRouter);

// 后台业务路由统一先校验 JWT、用户存在性和管理员角色。
app.use('/admin/articles', adminAuth, adminArticlesRouter);
app.use('/admin/categories', adminAuth, adminCategoriesRouter);
app.use('/admin/settings', adminAuth, adminSettingsRouter);
app.use('/admin/users', adminAuth, adminUsersRouter);
app.use('/admin/courses', adminAuth, adminCoursesRouter);
app.use('/admin/chapters', adminAuth, adminChaptersRouter);
app.use('/admin/charts', adminAuth, adminChartsRouter);
app.use('/admin/logs', adminAuth, adminLogsRouter);
// 管理员登录用于签发 Token，因此不能提前挂载 adminAuth。
app.use('/admin/auth', adminAuthRouter);
app.use('/admin/uploads', adminAuth, uploadsRouter);
app.use('/admin/attachments', adminAuth, adminAttachmentsRouter);

// 所有路由都未匹配时返回稳定的 JSON 404，而不是 Express 默认 HTML。
app.use((req, res) => {
  res.status(404).json({
    status: 404,
    message: '接口不存在。',
  });
});

// 保险网：非 asyncRoute 中间件抛出的异常同样复用统一错误响应。
app.use((error, req, res, _next) => {
  failure(res, error, req);
});

// --- 全局未捕获异常处理 ---

/**
 * 捕获未被 Promise 链 catch 的异步异常。
 * 记录日志后进程继续运行，但建议业务代码始终自行 try-catch。
 */
process.on('unhandledRejection', (reason) => {
  logger.error('未捕获的 Promise 拒绝：', {
    error: reason instanceof Error ? reason.message : reason,
    stack: reason instanceof Error ? reason.stack : undefined,
  });
});

/**
 * 捕获未在 try-catch 中处理的同步异常。
 * 记录日志后退出进程，因为出现 uncaughtException 时应用状态已不可信。
 */
process.on('uncaughtException', (error) => {
  logger.error('未捕获的异常：', { error: error.message, stack: error.stack });
  // 安全退出，防止出现不可恢复的状态
  process.exit(1);
});

module.exports = app;
