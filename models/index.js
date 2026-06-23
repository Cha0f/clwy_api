'use strict';

/**
 * Sequelize 模型注册入口。
 * 负责读取环境配置、创建数据库连接、自动加载模型并建立关联。
 */

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const env = require('../config/env');
const basename = path.basename(__filename);
const config = require('../config/config.js')[env.nodeEnv];
const db = {};

// config/config.js 已完成环境变量与默认值合并，这里只负责建立 Sequelize 实例。
const sequelize = new Sequelize(config.database, config.username, config.password, config);

// 自动加载 models/ 目录下所有模型文件
fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

// 在所有模型加载完毕后，执行每个模型的 associate() 方法建立关联关系
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
