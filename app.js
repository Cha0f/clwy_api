/**
 * 服务启动入口
 *
 * 配置 Express 应用、加载中间件（安全头、CORS、日志、JSON 解析）、
 * 挂载前台和后台路由、添加限流、全局错误兜底。
 */
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const adminAuth = require('./middlewares/admin-auth');
const userAuth = require('./middlewares/user-auth');

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
// 后台路由
const adminArticlesRouter = require('./routes/admin/articles');
const adminCategoriesRouter = require('./routes/admin/categories');
const adminSettingsRouter = require('./routes/admin/settings');
const adminUsersRouter = require('./routes/admin/users');
const adminCoursesRouter = require('./routes/admin/courses');
const adminChaptersRouter = require('./routes/admin/chapters');
const adminChartsRouter = require('./routes/admin/charts');
const adminAuthRouter = require('./routes/admin/auth');

const app = express();

// --- 安全与解析中间件 ---
// helmet: 设置安全相关的 HTTP 头（X-Content-Type-Options、CSP、HSTS 等）
app.use(helmet());
// CORS: 仅允许前端已知来源（开发环境两个常见端口）
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'], credentials: true }));
// morgan: HTTP 请求日志（dev 格式输出方法、路径、状态码和耗时）
app.use(logger('dev'));
// 解析 JSON 请求体（默认 100kb 上限）
app.use(express.json());
// 解析 URL-encoded 请求体（表单提交）
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// 静态文件服务（public/ 目录）
app.use(express.static(path.join(__dirname, 'public')));

// --- 前台路由 ---
app.use('/', indexRouter);
app.use('/categories', categoriesRouter);
app.use('/courses', coursesRouter);
app.use('/chapters', chaptersRouter);
app.use('/articles', articlesRouter);
app.use('/settings', settingsRouter);
app.use('/search', searchRouter);

// 登录接口加频率限制：15 分钟最多 20 次，防止暴力枚举
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { status: 429, message: '请求过于频繁，请15分钟后再试。' },
});
app.use('/auth', authLimiter, authRouter);
// 需登录的前台接口（userAuth 中间件解析并校验 JWT Token）
app.use('/users', userAuth, usersRouter);
app.use('/likes', userAuth, likesRouter);
app.use('/uploads', userAuth, uploadsRouter);

// --- 后台路由（adminAuth 中间件校验管理员身份） ---
app.use('/admin/articles', adminAuth, adminArticlesRouter);
app.use('/admin/categories', adminAuth, adminCategoriesRouter);
app.use('/admin/settings', adminAuth, adminSettingsRouter);
app.use('/admin/users', adminAuth, adminUsersRouter);
app.use('/admin/courses', adminAuth, adminCoursesRouter);
app.use('/admin/chapters', adminAuth, adminChaptersRouter);
app.use('/admin/charts', adminAuth, adminChartsRouter);
// 管理员登录不需要认证中间件
app.use('/admin/auth', adminAuthRouter);
// 文件上传（前台用户 + 后台管理员均可访问）
app.use('/admin/uploads', adminAuth, uploadsRouter);

// 全局 404 兜底：前面所有路由未匹配的请求落在这里
app.use((req, res) => {
  res.status(404).json({
    status: 404,
    message: '接口不存在。',
  });
});

// 全局错误处理：捕获路由中 try/catch 未处理的异常（保险网兜底）
app.use((err, req, res, next) => {
  console.error('未捕获的错误:', err);
  res.status(500).json({
    status: 500,
    message: '服务器错误。',
    errors: process.env.NODE_ENV === 'development' ? [err.message] : [],
  });
});

module.exports = app;
