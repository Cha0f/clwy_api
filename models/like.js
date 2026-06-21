'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Like extends Model {
    static associate(models) {
      models.Like.belongsTo(models.Course, { as: 'course' });
      models.Like.belongsTo(models.User, { as: 'user' });
    }
  }
  Like.init(
    {
      courseId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        validate: {
          notNull: { msg: '课程ID必须填写。' },
          notEmpty: { msg: '课程ID不能为空。' },
          async isPresent(value) {
            const course = await sequelize.models.Course.findByPk(value);
            if (!course) {
              throw new Error(`ID为：${value} 的课程不存在。`);
            }
          },
        },
      },
      userId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        validate: {
          notNull: { msg: '用户ID必须填写。' },
          notEmpty: { msg: '用户ID不能为空。' },
          async isPresent(value) {
            const user = await sequelize.models.User.findByPk(value);
            if (!user) {
              throw new Error(`ID为：${value} 的用户不存在。`);
            }
          },
        },
      },
    },
    {
      sequelize,
      modelName: 'Like',
      indexes: [{ unique: true, fields: ['courseId', 'userId'] }],
    },
  );
  return Like;
};
