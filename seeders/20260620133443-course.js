'use strict';

/** 写入覆盖不同分类的课程示例数据。 @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // 外键 ID 依赖用户和分类种子先在空数据库中执行。
    await queryInterface.bulkInsert('Courses', [
      // ===== 前端开发 (categoryId: 1) =====
      {
        categoryId: 1,
        userId: 1,
        name: 'CSS 入门',
        image: 'https://picsum.photos/seed/css/800/450',
        recommended: true,
        introductory: true,
        content:
          'CSS（层叠样式表）是前端开发的基石。本课程从零开始，带你掌握 CSS 的核心概念：选择器、盒模型、浮动与定位、Flexbox、Grid 布局、动画与过渡。学完可独立完成页面布局与美化。',
        likesCount: 28,
        chaptersCount: 10,
        createdAt: new Date('2026-01-20'),
        updatedAt: new Date('2026-03-15'),
      },
      {
        categoryId: 1,
        userId: 1,
        name: 'JavaScript 核心进阶',
        image: 'https://picsum.photos/seed/js/800/450',
        recommended: true,
        introductory: false,
        content:
          '深入理解 JavaScript 核心机制：原型链、闭包、作用域、事件循环、异步编程（Promise/async-await）、模块化、ES6+ 新特性。适合有 JS 基础但想要深入理解的开发者。',
        likesCount: 45,
        chaptersCount: 12,
        createdAt: new Date('2026-02-01'),
        updatedAt: new Date('2026-04-10'),
      },
      {
        categoryId: 1,
        userId: 3,
        name: 'Vue 3 实战教程',
        image: 'https://picsum.photos/seed/vue3/800/450',
        recommended: false,
        introductory: false,
        content:
          '从零搭建 Vue 3 + TypeScript 项目，掌握 Composition API、Pinia 状态管理、Vue Router、组件封装、自定义 Hooks。包含一个完整的后台管理系统实战。',
        likesCount: 32,
        chaptersCount: 5,
        createdAt: new Date('2026-03-10'),
        updatedAt: new Date('2026-05-20'),
      },

      // ===== 后端开发 (categoryId: 2) =====
      {
        categoryId: 2,
        userId: 1,
        name: 'Node.js 项目实践',
        image: 'https://picsum.photos/seed/node/800/450',
        recommended: true,
        introductory: false,
        content:
          '使用 Node.js + Express + Sequelize + MySQL 从零搭建接口项目，覆盖 RESTful API 设计、JWT 鉴权、文件上传、数据库设计与优化、错误处理、单元测试。',
        likesCount: 36,
        chaptersCount: 6,
        createdAt: new Date('2026-02-15'),
        updatedAt: new Date('2026-05-01'),
      },
      {
        categoryId: 2,
        userId: 2,
        name: 'Python  Flask 快速入门',
        image: 'https://picsum.photos/seed/flask/800/450',
        recommended: false,
        introductory: true,
        content:
          '轻量级 Flask 框架入门，涵盖路由、模板、数据库（SQLAlchemy）、表单验证、用户认证、REST API 开发。适合 Python 初学者转向 Web 开发。',
        likesCount: 15,
        chaptersCount: 5,
        createdAt: new Date('2026-03-01'),
        updatedAt: new Date('2026-04-05'),
      },
      {
        categoryId: 2,
        userId: 5,
        name: 'Go 语言基础与 Web 开发',
        image: 'https://picsum.photos/seed/golang/800/450',
        recommended: false,
        introductory: true,
        content:
          'Go 语言入门到 Web 开发，包括语法基础、并发编程（goroutine/channel）、标准库 net/http、Gin 框架、GORM 数据库操作、项目部署。',
        likesCount: 22,
        chaptersCount: 5,
        createdAt: new Date('2026-04-20'),
        updatedAt: new Date('2026-06-10'),
      },

      // ===== 移动端开发 (categoryId: 3) =====
      {
        categoryId: 3,
        userId: 3,
        name: 'React Native 跨端开发',
        image: 'https://picsum.photos/seed/rn/800/450',
        recommended: true,
        introductory: false,
        content:
          '使用 React Native 构建真正的跨平台 App，涵盖导航、状态管理、原生模块桥接、性能优化、发布上线流程。适合有 React 基础的开发者。',
        likesCount: 18,
        chaptersCount: 3,
        createdAt: new Date('2026-03-20'),
        updatedAt: new Date('2026-05-15'),
      },
      {
        categoryId: 3,
        userId: 1,
        name: 'Flutter 从入门到实战',
        image: 'https://picsum.photos/seed/flutter/800/450',
        recommended: false,
        introductory: true,
        content:
          'Google Flutter 框架入门，Dart 语言基础、Widget 体系、布局与动画、状态管理（Provider/BLoC）、本地存储、网络请求、打包发布。',
        likesCount: 12,
        chaptersCount: 3,
        createdAt: new Date('2026-04-05'),
        updatedAt: new Date('2026-05-25'),
      },

      // ===== 数据库 (categoryId: 4) =====
      {
        categoryId: 4,
        userId: 4,
        name: 'MySQL 从入门到优化',
        image: 'https://picsum.photos/seed/mysql/800/450',
        recommended: false,
        introductory: true,
        content:
          'MySQL 核心知识全覆盖：数据类型、表设计、索引原理、SQL 优化、事务与锁、分库分表、备份恢复。通过真实案例理解数据库性能调优。',
        likesCount: 25,
        chaptersCount: 3,
        createdAt: new Date('2026-02-10'),
        updatedAt: new Date('2026-04-30'),
      },
      {
        categoryId: 4,
        userId: 5,
        name: 'Redis 缓存与高并发实践',
        image: 'https://picsum.photos/seed/redis/800/450',
        recommended: true,
        introductory: false,
        content:
          '深入 Redis：五种数据结构、持久化策略、主从/哨兵/集群架构、缓存穿透/击穿/雪崩解决方案、分布式锁、Lua 脚本、实际业务场景应用。',
        likesCount: 30,
        chaptersCount: 3,
        createdAt: new Date('2026-03-25'),
        updatedAt: new Date('2026-05-10'),
      },

      // ===== 服务器运维 (categoryId: 5) =====
      {
        categoryId: 5,
        userId: 4,
        name: 'Docker 与容器化部署',
        image: 'https://picsum.photos/seed/docker/800/450',
        recommended: false,
        introductory: false,
        content:
          'Docker 全面实践：镜像构建、容器管理、Docker Compose 多服务编排、Dockerfile 最佳实践、CI/CD 集成、Kubernetes 基础。每天 30 分钟，两周上手。',
        likesCount: 20,
        chaptersCount: 3,
        createdAt: new Date('2026-04-01'),
        updatedAt: new Date('2026-05-20'),
      },
      {
        categoryId: 5,
        userId: 2,
        name: 'Linux 服务器运维基础',
        image: 'https://picsum.photos/seed/linux/800/450',
        recommended: false,
        introductory: true,
        content:
          'Linux 运维必备技能：常用命令、用户与权限管理、进程管理、网络配置、Shell 脚本、Nginx 配置、SSL 证书、服务器监控与安全加固。',
        likesCount: 14,
        chaptersCount: 3,
        createdAt: new Date('2026-04-10'),
        updatedAt: new Date('2026-05-30'),
      },

      // ===== 公共 (categoryId: 6) =====
      {
        categoryId: 6,
        userId: 1,
        name: 'Git 版本控制完全指南',
        image: 'https://picsum.photos/seed/git/800/450',
        recommended: true,
        introductory: true,
        content:
          '从零掌握 Git：工作区/暂存区/仓库概念、分支策略、合并与变基、团队协作工作流（Git Flow / GitHub Flow）、冲突解决、Hooks 自动化。',
        likesCount: 40,
        chaptersCount: 3,
        createdAt: new Date('2026-01-25'),
        updatedAt: new Date('2026-03-01'),
      },
      {
        categoryId: 6,
        userId: 5,
        name: '软件工程与设计模式',
        image: 'https://picsum.photos/seed/design-pattern/800/450',
        recommended: false,
        introductory: false,
        content:
          '23 种 GoF 设计模式精讲，结合实际项目场景（Node.js 实现），涵盖创建型、结构型、行为型模式，以及 SOLID 原则和架构设计思想。',
        likesCount: 8,
        chaptersCount: 3,
        createdAt: new Date('2026-05-01'),
        updatedAt: new Date('2026-06-15'),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('Courses', null, {});
  },
};
