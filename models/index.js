'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
require('dotenv').config();
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  // 通过环境变量获取数据库连接字符串（如 JAWSDB_URL）
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  // 优先使用环境变量 DB_PASSWORD 覆盖 config.json 中的密码（避免硬编码）
  const password = process.env.DB_PASSWORD || config.password;
  sequelize = new Sequelize(config.database, config.username, password, config);
}

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
