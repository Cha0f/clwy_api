'use strict';

const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Users', [
      {
        email: 'admin@clwy.cn',
        username: 'admin',
        password: bcrypt.hashSync('123123', 10),
        nickname: '超厉害的管理员',
        avatar: 'https://api.multiavatar.com/admin.svg',
        gender: 0,
        company: '长乐未央科技',
        introduce: '全栈工程师，多年教学经验，专注于 Web 全栈开发与架构设计。',
        role: 100,
        createdAt: new Date('2026-01-15'),
        updatedAt: new Date('2026-06-01'),
      },
      {
        email: 'user1@clwy.cn',
        username: 'user1',
        password: bcrypt.hashSync('123123', 10),
        nickname: '前端小张',
        avatar: 'https://api.multiavatar.com/user1.svg',
        gender: 1,
        company: '字节跳动',
        introduce: '前端开发工程师，React 技术栈，正在学习全栈。',
        role: 0,
        createdAt: new Date('2026-02-20'),
        updatedAt: new Date('2026-05-15'),
      },
      {
        email: 'user2@clwy.cn',
        username: 'user2',
        password: bcrypt.hashSync('123123', 10),
        nickname: '后端小李',
        avatar: 'https://api.multiavatar.com/user2.svg',
        gender: 1,
        company: '阿里巴巴',
        introduce: 'Java 后端开发，最近在学 Node.js 和数据库优化。',
        role: 0,
        createdAt: new Date('2026-03-05'),
        updatedAt: new Date('2026-04-20'),
      },
      {
        email: 'user3@clwy.cn',
        username: 'user3',
        password: bcrypt.hashSync('123123', 10),
        nickname: '全栈小美',
        avatar: 'https://api.multiavatar.com/user3.svg',
        gender: 2,
        company: '腾讯',
        introduce: '喜欢用 Vue.js 和 Python 做全栈开发，热爱开源社区。',
        role: 0,
        createdAt: new Date('2026-03-12'),
        updatedAt: new Date('2026-06-10'),
      },
      {
        email: 'user4@clwy.cn',
        username: 'user4',
        password: bcrypt.hashSync('123123', 10),
        nickname: '运维老王',
        avatar: 'https://api.multiavatar.com/user4.svg',
        gender: 1,
        company: '华为云',
        introduce: '系统运维工程师，擅长 Docker、K8s 和 CI/CD。',
        role: 0,
        createdAt: new Date('2026-04-01'),
        updatedAt: new Date('2026-05-30'),
      },
      {
        email: 'user5@clwy.cn',
        username: 'user5',
        password: bcrypt.hashSync('123123', 10),
        nickname: '实习生阿强',
        avatar: 'https://api.multiavatar.com/user5.svg',
        gender: 1,
        company: '',
        introduce: '计算机专业大三学生，正在努力刷课学习中。',
        role: 0,
        createdAt: new Date('2026-04-15'),
        updatedAt: new Date('2026-06-15'),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', null, {});
  },
};
