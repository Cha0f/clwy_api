'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Like extends Model {
    static associate(models) {
      // Like 属于一个课程
      models.Like.belongsTo(models.Course, { as: 'course' });
      // Like 属于一个用户
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
            // 验证引用的课程确实存在
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
            // 验证引用的用户确实存在
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
      // (courseId, userId) 复合唯一索引，防止重复点赞
      indexes: [{ unique: true, fields: ['courseId', 'userId'] }],
    },
  );
  return Like;
};
