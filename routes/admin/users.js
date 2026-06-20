const express = require('express');
const router = express.Router();
const { User } = require('../../models');
const { Op } = require('sequelize');
// 引入错误类
const { NotFondError, success, failure } = require('../../utils/response');

/**
 * 查询用户列表
 * GET /admin/users
 */
router.get('/', async function (req, res) {
  try {
    // 定义查询参数
    const query = req.query;
    // 获取current_page和page_seize
    const currentPage = Math.abs(Number(query.currentPage)) || 1;
    const pageSize = Math.abs(Number(query.pageSize)) || 10;
    // 计算offset
    const offset = (currentPage - 1) * pageSize;
    // 定义查询条件
    const condition = {
      order: [['id', 'DESC']],
      // 在查询条件中添加offset和pageSize
      limit: pageSize,
      offset,
    };

    // 如果有title查询参数，就添加到where条件中
    if (query.email) {
      condition.where = {
        email: {
          [Op.eq]: query.email,
        },
      };
    }

    if (query.username) {
      condition.where = {
        username: {
          [Op.eq]: query.username,
        },
      };
    }

    if (query.nickname) {
      condition.where = {
        nickname: {
          [Op.like]: `%${query.nickname}%`,
        },
      };
    }

    if (query.role) {
      condition.where = {
        role: {
          [Op.eq]: query.role,
        },
      };
    }

    // 查询数据
    // 将findAll方法改为findAndCountAll方法
    // findAndCountAll方法会返回一个对象，对象中有两个属性，一个是count，一个是rows
    // count 是查询到的数据的总数， rows 中才是查询到的数据
    const { count, rows } = await User.findAndCountAll(condition);
    // 返回查询结果
    success(res, '查询用户列表成功。', {
      users: rows,
      pagination: {
        total: count,
        currentPage,
        pageSize,
      },
    });
  } catch (err) {
    failure(res, err);
  }
});

/**
 * 查询用户详情
 * GET /admin/users/:id
 */
router.get('/:id', async (req, res) => {
  try {
    // 查询数据
    const user = await getUsers(req);
    // 返回查询结果
    success(res, '查询用户成功。', { user });
  } catch (err) {
    failure(res, err);
  }
});

/**
 * 创建用户
 * POST /admin/users
 */
router.post('/', async function (req, res) {
  try {
    // 白名单过滤
    const body = filterBody(req);
    // 创建用户
    const user = await User.create(body);
    // 返回创建用户的结果
    success(res, '创建用户成功。', { user }, 201);
  } catch (err) {
    failure(res, err);
  }
});

/**
 * 删除用户
 * DELETE /admin/user/:id
 */
router.delete('/:id', async function (req, res) {
  try {
    // 查询用户
    const user = await getUsers(req);
    // 删除用户
    await user.destroy();
    // 返回删除用户的结果
    success(res, '用户删除成功。');
  } catch (err) {
    failure(res, err);
  }
});

/**
 * 更新用户
 * PUT /admin/users/:id
 */
router.put('/:id', async function (req, res) {
  try {
    // 白名单过滤
    const body = filterBody(req);
    // 查询用户
    const user = await getUsers(req);
    // 更新用户
    await user.update(body);
    // 返回用户更新的结果
    success(res, '用户更新成功', { user });
  } catch (err) {
    failure(res, err);
  }
});

/**
 * 公共方法: 白名单过滤
 * @param req
 * @return {{password, role: (number|string|*), introduce: ({type: *}|*), sex: ({allowNull: boolean, type: *, validate: {notNull: {msg: string}, notEmpty: {msg: string}, isIn: {args: [number[]], msg: string}}}|{defaultValue: number, allowNull: boolean, type: *}|*), nickname: (string|*), company: ({type: *}|*), avatar: ({type: *, validate: {isUrl: {msg: string}}}|*), email: (string|*), username}}
 */
function filterBody(req) {
  return {
    email: req.body.email,
    username: req.body.username,
    nickname: req.body.nickname,
    password: req.body.password,
    avatar: req.body.avatar,
    gender: req.body.gender,
    company: req.body.company,
    introduce: req.body.introduce,
    role: req.body.role,
  };
}

/**
 * 公共方法: 查询当前用户
 */
async function getUsers(req) {
  // 获取用户id
  const { id } = req.params;
  // 查询当前用户
  const users = await User.findByPk(id);
  // 如果没有找到
  if (!users) {
    throw new NotFondError(`ID: ${id}的用户没有找到。`);
  }
  return users;
}

module.exports = router;
