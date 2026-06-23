'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcryptjs');
const createError = require('http-errors');

/**
 * 用户模型
 *
 * 关键逻辑：
 *   - password 字段使用自定义 setter，在赋值时自动 bcrypt 哈希（不存明文）
 *   - 通过 beforeValidate 钩子在应用层做 email/username 唯一性预检查
 *   - 数据库层有 email、username 唯一索引做兜底约束
 *   - role: 0=普通用户, 100=管理员
 */
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * 公开讲师资料允许返回的字段。
     */
    static get publicAttributes() {
      return ['id', 'username', 'nickname', 'avatar', 'company', 'introduce'];
    }

    static associate(models) {
      // 用户通过 Like 中间表与 Course 建立多对多关联（点赞功能）
      models.User.belongsToMany(models.Course, {
        through: models.Like,
        foreignKey: 'userId',
        as: 'likeCourses',
      });
      models.User.hasMany(models.Attachment, { as: 'attachments', foreignKey: 'userId' });
    }

    /**
     * 返回可安全写入响应或缓存的普通对象。
     * 即使调用方使用了 withPassword scope，也不会意外序列化密码哈希。
     */
    toSafeJSON() {
      // 先复制 plain object，避免 delete 修改 Sequelize 实例自身。
      const value = this.get({ plain: true });
      // 密码哈希只用于服务端校验，任何响应都不应包含它。
      delete value.password;
      return value;
    }
  }
  User.init(
    {
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: '邮箱必须填写。' },
          notEmpty: { msg: '邮箱不能为空。' },
          isEmail: { msg: '邮箱格式不正确。' },
        },
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: '用户名必须填写。' },
          notEmpty: { msg: '用户名不能为空。' },
          len: { args: [2, 45], msg: '用户名长度必须是2 ~ 45之间。' },
        },
      },
      nickname: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: '昵称必须填写。' },
          notEmpty: { msg: '昵称不能为空。' },
          len: { args: [2, 45], msg: '昵称长度必须是2 ~ 45之间。' },
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: '密码必须填写。' },
          notEmpty: { msg: '密码不能为空。' },
        },
        // 自定义 setter：在赋值时自动用 bcrypt 加密密码
        set(value) {
          // undefined 表示更新接口没有修改密码，交给 Sequelize 忽略。
          if (!value) return;
          // 在哈希前验证明文长度；哈希后的固定长度无法反映原密码长度。
          if (value.length < 6 || value.length > 45) {
            throw createError(400, '密码长度必须是6 ~ 45之间。');
          }
          // cost=10 在安全性和在线请求耗时之间取得平衡。
          this.setDataValue('password', bcrypt.hashSync(value, 10));
        },
      },
      avatar: {
        type: DataTypes.STRING,
        validate: {
          isUrl: { msg: '图片地址不正确。' },
        },
      },
      gender: {
        type: DataTypes.TINYINT,
        allowNull: false,
        validate: {
          notNull: { msg: '性别必须填写。' },
          notEmpty: { msg: '性别不能为空。' },
          isIn: { args: [[0, 1, 2]], msg: '性别的值必须是，未选择：0 男性：1 女性：2。' },
        },
      },
      company: DataTypes.STRING,
      introduce: DataTypes.TEXT,
      role: {
        type: DataTypes.TINYINT,
        allowNull: false,
        validate: {
          notNull: { msg: '用户组必须选择。' },
          notEmpty: { msg: '用户组不能为空。' },
          isIn: { args: [[0, 100]], msg: '用户组的值必须是，普通用户：0 管理员：100。' },
        },
      },
    },
    {
      sequelize,
      modelName: 'User',
      // 默认查询不返回密码；登录和改密流程必须显式选择 withPassword scope。
      defaultScope: {
        attributes: { exclude: ['password'] },
      },
      scopes: {
        withPassword: {
          attributes: { include: ['password'] },
        },
      },
      // 数据库索引：email 和 username 唯一索引，role 普通索引用于筛选
      indexes: [
        { unique: true, fields: ['email'] },
        { unique: true, fields: ['username'] },
        { fields: ['role'] },
      ],
      hooks: {
        // beforeValidate：变更 email/username 时提前检查唯一性，
        // 给用户友好提示（比数据库抛 UniqueConstraintError 更友好）
        beforeValidate: async (instance) => {
          // 只有 email 实际变化时才执行额外查询。
          if (instance.changed('email')) {
            const existing = await sequelize.models.User.findOne({
              where: { email: instance.email },
            });
            // 更新当前记录时允许查询结果指向自身。
            if (existing && existing.id !== instance.id) {
              throw createError(409, '邮箱已存在，请直接登录。');
            }
          }
          // username 使用与 email 相同的友好冲突检查。
          if (instance.changed('username')) {
            const existing = await sequelize.models.User.findOne({
              where: { username: instance.username },
            });
            if (existing && existing.id !== instance.id) {
              throw createError(409, '用户名已经存在。');
            }
          }
        },
      },
    },
  );
  return User;
};
