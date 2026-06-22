'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Setting extends Model {
  }
  Setting.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: '站点名称必须填写。' },
          notEmpty: { msg: '站点名称不能为空。' },
        },
      },
      icp: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: 'ICP备案号必须填写。' },
          notEmpty: { msg: 'ICP备案号不能为空。' },
        },
      },
      copyright: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: '版权信息必须填写。' },
          notEmpty: { msg: '版权信息不能为空。' },
        },
      },
    },
    {
      sequelize,
      modelName: 'Setting',
      // 单例约束：只允许一行记录，通过 beforeCreate 钩子防止第二行
      hooks: {
        beforeCreate: async () => {
          const count = await sequelize.models.Setting.count();
          if (count >= 1) {
            throw new Error('系统设置已存在，请使用更新接口进行修改。');
          }
        },
      },
    },
  );
  return Setting;
};