'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Category extends Model {
    static associate(models) {
      // define association here
    }
  }
  Category.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: '名称必须填写。' },
          notEmpty: { msg: '名称不能为空。' },
          len: { args: [2, 45], msg: '长度必须是2 ～ 45之间。' },
        },
      },
      rank: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: { msg: '排序必须写。' },
          notEmpty: { msg: '排序不能为空。' },
          isInt: { msg: '排序必须为整数。' },
          isPositive(value) {
            if (value <= 0) {
              throw new Error('排序必须是正整数。');
            }
          },
        },
      },
    },
    {
      sequelize,
      modelName: 'Category',
      // name 字段加唯一索引，防止重复分类名
      indexes: [{ unique: true, fields: ['name'] }],
      hooks: {
        beforeValidate: async (instance) => {
          // 如果 name 字段有变更，先查数据库是否存在同名分类
          if (instance.changed('name')) {
            const existing = await sequelize.models.Category.findOne({
              where: { name: instance.name },
            });
            // 如果存在且不是当前记录本身，说明有重名
            if (existing && existing.id !== instance.id) {
              throw new Error('名称已经存在，请选择其他名称。');
            }
          }
        },
      },
    },
  );
  return Category;
};
