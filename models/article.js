'use strict';
const { Model } = require('sequelize');

/**
 * 文章模型
 *
 * 简单的标题 + 内容两字段文章，前台列表页排除 content 字段以减小传输量。
 */
module.exports = (sequelize, DataTypes) => {
  class Article extends Model {
    static associate(models) {
      // define association here
    }
  }
  Article.init(
    {
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: '标题必须存在。' },
          notEmpty: { msg: '标题不能为空。' },
          len: { args: [2, 45], msg: '标题长度需要在2 ～ 45个字符之间。' },
        },
      },
      content: DataTypes.TEXT,
      deletedAt: {
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      paranoid: true,
      modelName: 'Article',
    },
  );
  return Article;
};
