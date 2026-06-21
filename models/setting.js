'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Setting extends Model {
  }
  Setting.init({
    name: DataTypes.STRING,
    icp: DataTypes.STRING,
    copyright: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Setting',
  });
  return Setting;
};