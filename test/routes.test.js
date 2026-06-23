const test = require('node:test');
const assert = require('node:assert/strict');
const createError = require('http-errors');
const { asyncRoute, findByPkOrFail, paginate, pickFields } = require('../utils/routes');

test('pickFields 只复制白名单字段', () => {
  const result = pickFields({ name: '课程', role: 100, ignored: true }, ['name', 'role']);
  assert.deepEqual(result, { name: '课程', role: 100 });
});

test('findByPkOrFail 返回资源并把空结果转换为 404', async () => {
  const resource = { id: 1 };
  assert.equal(await findByPkOrFail({ findByPk: async () => resource }, 1), resource);
  await assert.rejects(() => findByPkOrFail({ findByPk: async () => null }, 2, {}, '课程'), {
    status: 404,
    message: 'ID: 2的课程没有找到。',
  });
});

test('paginate 注入 limit/offset 并生成标准分页结构', async () => {
  let receivedOptions;
  const Model = {
    async findAndCountAll(options) {
      receivedOptions = options;
      return { count: 3, rows: [{ id: 2 }] };
    },
  };
  const result = await paginate(Model, { currentPage: '2', pageSize: '1' }, { where: {} }, 'items');

  assert.deepEqual(receivedOptions, { where: {}, limit: 1, offset: 1 });
  assert.deepEqual(result, {
    items: [{ id: 2 }],
    pagination: { total: 3, currentPage: 2, pageSize: 1 },
  });
});

test('asyncRoute 使用统一格式返回业务异常', async () => {
  let statusCode;
  let responseBody;
  const response = {
    status(value) {
      statusCode = value;
      return this;
    },
    json(value) {
      responseBody = value;
    },
  };
  const handler = asyncRoute(async () => {
    throw createError(403, '没有权限。');
  });

  await handler({}, response, () => {});
  assert.equal(statusCode, 403);
  assert.deepEqual(responseBody, {
    status: 403,
    message: '禁止访问。',
    errors: ['没有权限。'],
  });
});
