/**
 * 响应时间格式化模块。
 *
 * 数据库继续保存 DATE，只有写入 JSON 响应前才格式化创建和更新时间。
 */
const moment = require('moment');

const DATE_TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';
const TIMESTAMP_FIELDS = new Set(['createdAt', 'updatedAt', 'timestamp']);

/**
 * 递归格式化对象、数组和 Sequelize 实例中的 createdAt、updatedAt。
 *
 * @param {any} value 待写入响应的数据
 * @returns {any} 不修改原对象的格式化结果
 */
function formatTimestamps(value) {
  // null、undefined 和基础类型没有可遍历字段，直接返回。
  if (value === null || value === undefined || typeof value !== 'object') {
    return value;
  }
  // 不属于时间字段的 Date 必须保持 Date 实例和原始值。
  if (value instanceof Date) {
    return value;
  }

  // Sequelize 实例先转换为普通对象，Redis 命中数据本身已经是普通对象。
  const plainValue = typeof value.toJSON === 'function' ? value.toJSON() : value;
  // 数组中的每个元素都可能继续包含模型或嵌套关联。
  if (Array.isArray(plainValue)) {
    return plainValue.map(formatTimestamps);
  }

  // 构造新对象，避免格式化过程改变路由仍在使用的模型数据。
  return Object.entries(plainValue).reduce((result, [key, item]) => {
    if (TIMESTAMP_FIELDS.has(key) && item) {
      // 字符串使用严格 ISO 解析，避免 Moment 对异常字符串进行宽松猜测并输出警告。
      const date = typeof item === 'string' ? moment(item, moment.ISO_8601, true) : moment(item);
      // 无效时间保持原值，避免把异常数据静默改成 "Invalid date"。
      result[key] = date.isValid() ? date.format(DATE_TIME_FORMAT) : item;
    } else {
      // 非目标时间字段继续递归，以覆盖关联模型和分页集合。
      result[key] = formatTimestamps(item);
    }
    return result;
  }, {});
}

module.exports = {
  DATE_TIME_FORMAT,
  formatTimestamps,
};
