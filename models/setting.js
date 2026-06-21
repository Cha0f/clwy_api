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
    },
  );
  return Setting;
};