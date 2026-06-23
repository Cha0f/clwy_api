'use strict';

/** 为十四门示例课程写入章节目录。 @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // 各课程先独立维护章节数组，最后统一 bulkInsert。
    const chapters = [];

    // ===== Course 1: CSS 入门 (10 chapters) =====
    const cssChapters = [
      {
        courseId: 1,
        title: 'CSS 课程介绍',
        content:
          'CSS 的全名是层叠样式表（Cascading Style Sheets）。它负责网页的"颜值"——布局、颜色、字体、动画。本课程将从最基础的选择器开始，一步步带你掌握 CSS 的核心概念。',
        video: '',
        rank: 1,
      },
      {
        courseId: 1,
        title: 'CSS 选择器详解',
        content:
          '选择器是 CSS 的基础。本章将系统讲解元素选择器、类选择器、ID 选择器、属性选择器、伪类与伪元素，以及组合选择器的用法，让你能精准选中页面中的任意元素。',
        video: '',
        rank: 2,
      },
      {
        courseId: 1,
        title: '盒模型与布局基础',
        content:
          '理解盒模型（Box Model）是掌握 CSS 布局的关键。本章深入讲解 content、padding、border、margin 的关系，以及 box-sizing 属性的作用。',
        video: '',
        rank: 3,
      },
      {
        courseId: 1,
        title: '浮动与定位',
        content:
          '浮动（float）和定位（position）是传统布局的重要手段。本章讲解浮动的工作原理、清除浮动的方法，以及相对/绝对/固定/粘性定位的使用场景。',
        video: '',
        rank: 4,
      },
      {
        courseId: 1,
        title: 'Flexbox 弹性布局',
        content:
          'Flexbox 是现代 CSS 布局的核心。本章由浅入深讲解主轴与交叉轴、flex 属性、对齐方式，通过实战案例掌握弹性盒子布局。',
        video: '',
        rank: 5,
      },
      {
        courseId: 1,
        title: 'Grid 网格布局',
        content:
          'CSS Grid 是更强大的二维布局系统。本章讲解网格轨道、网格线、网格区域、隐式网格等概念，并与 Flexbox 对比选择合适的场景。',
        video: '',
        rank: 6,
      },
      {
        courseId: 1,
        title: '响应式设计与媒体查询',
        content:
          '一套代码适配多端是现代前端的基本要求。本章讲解媒体查询、断点策略、响应式图片、移动端适配方案。',
        video: '',
        rank: 7,
      },
      {
        courseId: 1,
        title: 'CSS 动画与过渡',
        content:
          '给页面添加动效，让用户体验更流畅。本章讲解 transition、keyframes animation、transform 变换，以及常见的性能优化技巧。',
        video: '',
        rank: 8,
      },
      {
        courseId: 1,
        title: '预处理器：Sass 基础',
        content:
          'Sass 让 CSS 更强大：变量、嵌套、混合（mixin）、继承、函数。本章讲解如何使用 Sass 提升样式代码的组织能力和复用性。',
        video: '',
        rank: 9,
      },
      {
        courseId: 1,
        title: '综合实战：个人博客首页',
        content:
          '综合运用所学知识，从零搭建一个响应式个人博客页面。包括导航栏、文章列表、侧边栏、页脚的完整布局与美化。',
        video: '',
        rank: 10,
      },
    ];
    cssChapters.forEach((c) => {
      chapters.push({ ...c, createdAt: new Date('2026-01-20'), updatedAt: new Date('2026-03-15') });
    });

    // ===== Course 2: JavaScript 核心进阶 (12 chapters) =====
    const jsChapters = [
      {
        courseId: 2,
        title: '变量与作用域',
        content:
          'var、let、const 的区别，全局作用域与函数作用域，变量提升（hoisting），暂时性死区（TDZ）。',
        video: '',
        rank: 1,
      },
      {
        courseId: 2,
        title: '原型链与继承',
        content:
          'JavaScript 的原型继承机制：prototype、__proto__、constructor，ES6 class 语法糖，以及几种继承模式的实现。',
        video: '',
        rank: 2,
      },
      {
        courseId: 2,
        title: '闭包与高阶函数',
        content:
          '闭包是 JS 最核心也最容易被误解的概念。本章通过多个实例讲解闭包的形成原理、内存管理、以及实际应用场景。',
        video: '',
        rank: 3,
      },
      {
        courseId: 2,
        title: 'this 指向与绑定规则',
        content: 'this 的四种绑定规则（默认/隐式/显式/new）、箭头函数的 this、绑定优先级。',
        video: '',
        rank: 4,
      },
      {
        courseId: 2,
        title: '事件循环与异步编程',
        content:
          '理解微任务与宏任务、事件循环机制、回调函数的历史演变，为学习 Promise 和 async-await 打好基础。',
        video: '',
        rank: 5,
      },
      {
        courseId: 2,
        title: 'Promise 深入浅出',
        content:
          'Promise A+ 规范、链式调用、错误处理、静态方法（all/race/allSettled/any）、微任务队列。',
        video: '',
        rank: 6,
      },
      {
        courseId: 2,
        title: 'async-await 与异步迭代',
        content:
          'async-await 的本质是 Promise 的语法糖。本章讲解如何优雅处理异步流、并发控制、异步迭代器。',
        video: '',
        rank: 7,
      },
      {
        courseId: 2,
        title: 'ES6+ 常用新特性',
        content:
          '解构赋值、展开运算符、模板字符串、Symbol、Map/Set、Proxy、Reflect、可选链、空值合并等实用特性。',
        video: '',
        rank: 8,
      },
      {
        courseId: 2,
        title: '模块化：ES Module',
        content:
          'JavaScript 模块化演进：CommonJS vs ESM，export/import 语法、动态导入、Tree Shaking。',
        video: '',
        rank: 9,
      },
      {
        courseId: 2,
        title: '错误处理与调试技巧',
        content: 'try-catch 最佳实践、自定义错误类型、Source Map 调试、浏览器 DevTools 使用技巧。',
        video: '',
        rank: 10,
      },
      {
        courseId: 2,
        title: '性能优化与内存管理',
        content: '避免内存泄漏、性能检测工具（Performance API）、防抖与节流、懒加载、代码分割。',
        video: '',
        rank: 11,
      },
      {
        courseId: 2,
        title: '综合实战：TodoMVC',
        content:
          '用原生 JS 实现一个完整的 TodoMVC 应用，涵盖 CRUD、数据持久化（localStorage）、状态管理。',
        video: '',
        rank: 12,
      },
    ];
    jsChapters.forEach((c) => {
      chapters.push({ ...c, createdAt: new Date('2026-02-01'), updatedAt: new Date('2026-04-10') });
    });

    // ===== Course 3: Vue 3 实战教程 (5 chapters, sample) =====
    const vueChapters = [
      {
        courseId: 3,
        title: 'Vue 3 开发环境搭建',
        content: '使用 Vite 创建 Vue 3 + TypeScript 项目、目录结构解析、ESLint + Prettier 配置。',
        video: '',
        rank: 1,
      },
      {
        courseId: 3,
        title: 'Composition API 核心',
        content: 'ref 与 reactive、computed 与 watch、生命周期 Hooks、自定义 Hooks（组合式函数）。',
        video: '',
        rank: 2,
      },
      {
        courseId: 3,
        title: 'Pinia 状态管理',
        content: 'Pinia 替代 Vuex 成为官方推荐。讲解 Store 定义、Getters、Actions、插件机制。',
        video: '',
        rank: 3,
      },
      {
        courseId: 3,
        title: 'Vue Router 与路由守卫',
        content: '路由配置、动态路由、嵌套路由、导航守卫、路由元信息、权限控制实现。',
        video: '',
        rank: 4,
      },
      {
        courseId: 3,
        title: '实战：后台管理系统首页',
        content: '从零搭建后台管理系统框架：Layout 布局、侧边栏导航、Tags View、权限管理。',
        video: '',
        rank: 5,
      },
    ];
    vueChapters.forEach((c) => {
      chapters.push({ ...c, createdAt: new Date('2026-03-10'), updatedAt: new Date('2026-05-20') });
    });

    // ===== Course 4: Node.js 项目实践 (6 chapters, sample) =====
    const nodeChapters = [
      {
        courseId: 4,
        title: 'Node.js 课程介绍',
        content:
          '本课程定位是使用 JS 来全栈开发项目。从零基础开始，学习接口开发、数据库入门、再到完整的真实项目。',
        video: '',
        rank: 1,
      },
      {
        courseId: 4,
        title: '安装 Node.js',
        content:
          '安装 Node.js 最简单办法是官网下载，但更好的方案是使用 nvm（Node Version Manager）管理多版本。',
        video: '',
        rank: 2,
      },
      {
        courseId: 4,
        title: 'Express 框架入门',
        content: 'Express 是最流行的 Node.js Web 框架。学习路由、中间件机制、请求响应处理。',
        video: '',
        rank: 3,
      },
      {
        courseId: 4,
        title: 'Sequelize ORM 与数据库设计',
        content: '使用 Sequelize 操作 MySQL、模型定义、迁移、关联查询、事务处理。',
        video: '',
        rank: 4,
      },
      {
        courseId: 4,
        title: 'JWT 认证与授权',
        content: 'JWT 原理、Token 签发与验证、Refresh Token 策略、角色权限中间件设计。',
        video: '',
        rank: 5,
      },
      {
        courseId: 4,
        title: '文件上传与静态资源',
        content: 'Multer 中间件使用、文件存储策略（本地/OSS/CDN）、图片压缩处理。',
        video: '',
        rank: 6,
      },
    ];
    nodeChapters.forEach((c) => {
      chapters.push({ ...c, createdAt: new Date('2026-02-15'), updatedAt: new Date('2026-05-01') });
    });

    // ===== Course 5: Python Flask 快速入门 (5 chapters) =====
    const flaskChapters = [
      {
        courseId: 5,
        title: 'Flask 环境搭建与 Hello World',
        content: '安装 Python 和 Flask，创建第一个 Web 应用，理解路由与视图函数。',
        video: '',
        rank: 1,
      },
      {
        courseId: 5,
        title: '模板引擎 Jinja2',
        content: 'HTML 模板渲染、变量插值、控制结构、模板继承、宏、过滤器。',
        video: '',
        rank: 2,
      },
      {
        courseId: 5,
        title: 'Flask-SQLAlchemy 数据库操作',
        content: 'ORM 模型定义、数据库迁移（Flask-Migrate）、CRUD 操作、关系映射。',
        video: '',
        rank: 3,
      },
      {
        courseId: 5,
        title: '表单验证与 WTForms',
        content: '使用 WTForms 做表单验证、CSRF 保护、自定义验证器。',
        video: '',
        rank: 4,
      },
      {
        courseId: 5,
        title: 'Flask REST API 开发',
        content: '构建 RESTful API、JSON 序列化、错误处理、API 文档自动生成。',
        video: '',
        rank: 5,
      },
    ];
    flaskChapters.forEach((c) => {
      chapters.push({ ...c, createdAt: new Date('2026-03-01'), updatedAt: new Date('2026-04-05') });
    });

    // ===== Course 6: Go 语言基础与 Web 开发 (5 chapters) =====
    const goChapters = [
      {
        courseId: 6,
        title: 'Go 语言环境与基础语法',
        content: 'Go 安装、GOPATH 与 Module 模式、变量/常量/流程控制、函数与包管理。',
        video: '',
        rank: 1,
      },
      {
        courseId: 6,
        title: '并发编程：goroutine 与 channel',
        content: 'goroutine 启动、channel 通信、select 多路复用、sync 包（WaitGroup/Mutex/Once）。',
        video: '',
        rank: 2,
      },
      {
        courseId: 6,
        title: 'Gin 框架与 RESTful API',
        content: 'Gin 路由、中间件、参数绑定与验证、错误处理、分组路由。',
        video: '',
        rank: 3,
      },
      {
        courseId: 6,
        title: 'GORM 数据库操作',
        content: 'GORM 模型定义、自动迁移、关联查询、钩子方法、事务处理。',
        video: '',
        rank: 4,
      },
      {
        courseId: 6,
        title: '项目部署与性能优化',
        content: 'Go 编译部署、Docker 镜像构建、pprof 性能分析、GOMAXPROCS 调优。',
        video: '',
        rank: 5,
      },
    ];
    goChapters.forEach((c) => {
      chapters.push({ ...c, createdAt: new Date('2026-04-20'), updatedAt: new Date('2026-06-10') });
    });

    // ===== Course 7-14: remaining courses (3 chapters each, simplified) =====
    const remainingCourses = [
      {
        courseId: 7,
        title: 'React Native 核心概念',
        content:
          'React Native 的核心思想是"Learn Once, Write Anywhere"，用 React 组件风格开发原生移动应用。',
        rank: 1,
        created: '2026-03-20',
        updated: '2026-05-15',
      },
      {
        courseId: 7,
        title: '导航与路由配置',
        content: '使用 React Navigation 实现 Stack、Tab、Drawer 三种导航模式，路由传参与参数配置。',
        rank: 2,
        created: '2026-03-20',
        updated: '2026-05-15',
      },
      {
        courseId: 7,
        title: '发布上线流程',
        content: 'iOS App Store 与 Google Play 发布流程、CodePush 热更新、证书管理与 CI 集成。',
        rank: 3,
        created: '2026-03-20',
        updated: '2026-05-15',
      },
      {
        courseId: 8,
        title: 'Dart 语言基础',
        content: 'Dart 语法、面向对象、异步编程（Future/Stream）、类型系统。',
        rank: 1,
        created: '2026-04-05',
        updated: '2026-05-25',
      },
      {
        courseId: 8,
        title: 'Widget 体系与布局',
        content:
          'Flutter 一切皆 Widget。掌握 StatelessWidget / StatefulWidget、常用布局组件（Row/Column/Stack/Container）。',
        rank: 2,
        created: '2026-04-05',
        updated: '2026-05-25',
      },
      {
        courseId: 8,
        title: '状态管理 Provider',
        content:
          'Provider 作为官方推荐的状态管理方案，讲解 ChangeNotifier、Consumer、MultiProvider。',
        rank: 3,
        created: '2026-04-05',
        updated: '2026-05-25',
      },
      {
        courseId: 9,
        title: '数据库设计与表结构',
        content: '范式化设计、ER 图、字段类型选择、字符集与排序规则。',
        rank: 1,
        created: '2026-02-10',
        updated: '2026-04-30',
      },
      {
        courseId: 9,
        title: '索引原理与优化',
        content: 'B+ 树索引结构、聚簇索引与二级索引、联合索引最左前缀原则、Explain 执行计划分析。',
        rank: 2,
        created: '2026-02-10',
        updated: '2026-04-30',
      },
      {
        courseId: 9,
        title: '事务与锁机制',
        content:
          'ACID 特性、隔离级别（读未提交/读已提交/可重复读/串行化）、MVCC、行锁与表锁、死锁排查。',
        rank: 3,
        created: '2026-02-10',
        updated: '2026-04-30',
      },
      {
        courseId: 10,
        title: 'Redis 数据结构精讲',
        content: 'String、Hash、List、Set、Sorted Set，以及 Bitmaps、HyperLogLog、GEO 的高级用法。',
        rank: 1,
        created: '2026-03-25',
        updated: '2026-05-10',
      },
      {
        courseId: 10,
        title: '缓存策略与高并发',
        content: '缓存穿透/击穿/雪崩的原因与解决方案、本地缓存与 Redis 结合、缓存预热与失效策略。',
        rank: 2,
        created: '2026-03-25',
        updated: '2026-05-10',
      },
      {
        courseId: 10,
        title: 'Redis 集群高可用',
        content: '主从复制、Sentinel 哨兵模式、Redis Cluster 分片集群、数据迁移与扩容。',
        rank: 3,
        created: '2026-03-25',
        updated: '2026-05-10',
      },
      {
        courseId: 11,
        title: 'Docker 基础与镜像构建',
        content: 'Docker 架构、镜像与容器概念、Dockerfile 编写、镜像分层与缓存、私有仓库搭建。',
        rank: 1,
        created: '2026-04-01',
        updated: '2026-05-20',
      },
      {
        courseId: 11,
        title: 'Docker Compose 编排',
        content:
          '使用 Docker Compose 管理多服务应用（前端+后端+数据库），环境变量配置、网络与卷管理。',
        rank: 2,
        created: '2026-04-01',
        updated: '2026-05-20',
      },
      {
        courseId: 11,
        title: 'CI/CD 流水线集成',
        content: 'GitHub Actions + Docker 自动化构建与部署、滚动更新策略、健康检查与回滚方案。',
        rank: 3,
        created: '2026-04-01',
        updated: '2026-05-20',
      },
      {
        courseId: 12,
        title: 'Linux 常用命令',
        content:
          '文件操作（ls/cp/mv/rm）、文本处理（grep/sed/awk）、进程管理（ps/top/kill）、网络工具（curl/netstat/ss）。',
        rank: 1,
        created: '2026-04-10',
        updated: '2026-05-30',
      },
      {
        courseId: 12,
        title: '用户与权限管理',
        content: '用户/组管理、文件权限（rwx/umask/ACL）、sudo 配置、PAM 认证模块。',
        rank: 2,
        created: '2026-04-10',
        updated: '2026-05-30',
      },
      {
        courseId: 12,
        title: 'Nginx 配置与优化',
        content: "虚拟主机、反向代理、负载均衡、HTTPS 配置（Let's Encrypt）、性能优化参数调优。",
        rank: 3,
        created: '2026-04-10',
        updated: '2026-05-30',
      },
      {
        courseId: 13,
        title: 'Git 基础与工作流',
        content: '初始化仓库、add/commit/log/diff、分支创建与合并、.gitignore 配置。',
        rank: 1,
        created: '2026-01-25',
        updated: '2026-03-01',
      },
      {
        courseId: 13,
        title: '团队协作与 PR 流程',
        content:
          'GitHub Flow 工作流、Fork + Pull Request、Code Review 最佳实践、Git Hooks 自动化检查。',
        rank: 2,
        created: '2026-01-25',
        updated: '2026-03-01',
      },
      {
        courseId: 13,
        title: '冲突解决与历史重写',
        content:
          '合并冲突解决、rebase 交互模式、cherry-pick、reset/revert 的区别、reflog 恢复误操作。',
        rank: 3,
        created: '2026-01-25',
        updated: '2026-03-01',
      },
      {
        courseId: 14,
        title: 'SOLID 原则',
        content:
          '单一职责、开闭原则、里氏替换、接口隔离、依赖反转，通过实际代码示例理解每一条原则。',
        rank: 1,
        created: '2026-05-01',
        updated: '2026-06-15',
      },
      {
        courseId: 14,
        title: '创建型设计模式',
        content: '单例模式、工厂模式、建造者模式、原型模式，以及在实际 Node.js 项目中的实现。',
        rank: 2,
        created: '2026-05-01',
        updated: '2026-06-15',
      },
      {
        courseId: 14,
        title: '行为型设计模式',
        content:
          '观察者模式、策略模式、命令模式、职责链模式，在 Express 中间件和事件驱动架构中的运用。',
        rank: 3,
        created: '2026-05-01',
        updated: '2026-06-15',
      },
    ];
    remainingCourses.forEach((c) => {
      chapters.push({
        courseId: c.courseId,
        title: c.title,
        content: c.content,
        video: '',
        rank: c.rank,
        createdAt: new Date(c.created),
        updatedAt: new Date(c.updated),
      });
    });

    await queryInterface.bulkInsert('Chapters', chapters, {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('Chapters', null, {});
  },
};
