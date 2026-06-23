'use strict';
const { Model } = require('sequelize');

/**
 * 附件模型。
 * 保存 COS 对象路径、公开 URL、原文件信息和上传用户。
 */
module.exports = (sequelize, DataTypes) => {
  class Attachment extends Model {
    static associate(models) {
      // 附件属于上传用户，显式外键避免 Sequelize 自动生成 UserId。
      models.Attachment.belongsTo(models.User, { as: 'user', foreignKey: 'userId' });
    }
  }
  Attachment.init(
    {
      userId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      originalname: DataTypes.STRING,
      filename: DataTypes.STRING,
      mimetype: DataTypes.STRING,
      size: DataTypes.STRING,
      path: DataTypes.STRING,
      fullpath: DataTypes.STRING,
      url: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: 'Attachment',
    },
  );
  return Attachment;
};
