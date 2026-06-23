/**
 * Sequelize 运行时与 CLI 配置。
 * 环境变量由 env.js 统一加载，本文件只组装不同环境的数据库名和日志选项。
 */
const env = require('./env');

function createDatabaseConfig(defaultDatabase, extra = {}) {
  return {
    username: env.database.username,
    password: env.database.password,
    database: env.database.name || defaultDatabase,
    host: env.database.host,
    dialect: 'mysql',
    timezone: '+08:00',
    ...extra,
  };
}

module.exports = {
  development: createDatabaseConfig('database_development', {
    logQueryParameters: true,
  }),
  test: createDatabaseConfig('database_test'),
  production: createDatabaseConfig('database_production'),
};
