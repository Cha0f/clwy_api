/**
 * 路由层通用操作。
 *
 * 这个模块把每个路由都会重复的四类工作集中到同一个 seam：
 * 1. 捕获异步异常并交给统一响应模块；
 * 2. 从请求体中按白名单选取字段；
 * 3. 按主键查询资源并统一生成 404；
 * 4. 执行 Sequelize 分页并生成标准分页结构。
 */
const createError = require('http-errors');
const { failure } = require('./responses');
const { getPagination } = require('./pagination');

/**
 * 包装异步路由处理器，避免每个处理器重复编写 try/catch。
 *
 * @param {Function} handler 实际业务处理器
 * @returns {Function} Express 可直接挂载的处理器
 */
function asyncRoute(handler) {
  return async function routeHandler(req, res, next) {
    try {
      // 等待业务逻辑完成，确保 Promise rejection 也能被捕获。
      await handler(req, res, next);
    } catch (error) {
      // 所有已知和未知异常都使用相同的响应格式返回。
      failure(res, error, req);
    }
  };
}

/**
 * 从请求体中复制允许写入的字段。
 *
 * 保留值为 undefined 的字段，行为与重构前各路由手写对象一致；
 * Sequelize 在 update 时会忽略 undefined，在 create 时由模型校验必填项。
 *
 * @param {object} source 原始请求体
 * @param {string[]} allowedFields 允许通过的字段列表
 * @returns {object} 仅包含白名单字段的新对象
 */
function pickFields(source, allowedFields) {
  return allowedFields.reduce((result, field) => {
    // 逐个复制白名单字段，杜绝 mass assignment。
    result[field] = source[field];
    return result;
  }, {});
}

/**
 * 按主键查询资源；未找到时抛出统一的 404 错误。
 *
 * @param {import('sequelize').ModelStatic<import('sequelize').Model>} Model Sequelize 模型
 * @param {string|number} id 主键
 * @param {object} options Sequelize 查询参数
 * @param {string} resourceName 面向用户的资源名称
 * @returns {Promise<import('sequelize').Model>}
 */
async function findByPkOrFail(Model, id, options = {}, resourceName = '资源') {
  // 查询参数原样交给 Sequelize，因此 include、attributes、paranoid 等能力仍可使用。
  const resource = await Model.findByPk(id, options);
  if (!resource) {
    // 资源不存在统一返回 404，避免不同路由出现不一致状态码。
    throw createError(404, `ID: ${id}的${resourceName}没有找到。`);
  }
  return resource;
}

/**
 * 执行标准分页查询并按指定集合名称组织响应数据。
 *
 * @param {import('sequelize').ModelStatic<import('sequelize').Model>} Model Sequelize 模型
 * @param {object} query Express 查询参数
 * @param {object} options findAndCountAll 查询参数
 * @param {string} collectionName 响应中的集合字段名
 * @returns {Promise<object>} 集合与 pagination 对象
 */
async function paginate(Model, query, options, collectionName) {
  // 先通过统一分页模块校验参数并计算 offset。
  const { currentPage, pageSize, offset } = getPagination(query);
  // 路由只负责业务条件；limit 和 offset 由本模块统一补充。
  const { count, rows } = await Model.findAndCountAll({
    ...options,
    limit: pageSize,
    offset,
  });

  return {
    [collectionName]: rows,
    pagination: {
      total: count,
      currentPage,
      pageSize,
    },
  };
}

module.exports = {
  asyncRoute,
  findByPkOrFail,
  paginate,
  pickFields,
};
