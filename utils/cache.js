/**
 * 业务缓存模块。
 *
 * Redis 的底层读写留在 redis.js；这里提供路由真正需要的高层接口：
 * 统一缓存键、cache-aside 查询，以及按精确键或模式批量失效。
 */
const { delKey, getKey, getKeysByPattern, setKey } = require('./redis');

/**
 * 所有缓存键集中定义，调用方不再手写字符串。
 * 公共用户和私有用户使用不同命名空间，防止字段集合不同导致数据串用。
 */
const cacheKeys = {
  index: 'index',
  categories: 'categories',
  category: (id) => `category:${id}`,
  setting: 'setting',
  article: (id) => `article:${id}`,
  articleList: (page, pageSize) => `articles:${page}:${pageSize}`,
  articleLists: 'articles:*',
  course: (id) => `course:${id}`,
  courseSummary: (id) => `courses:summary:${id}`,
  courseList: (categoryId, page, pageSize) => `courses:${categoryId}:${page}:${pageSize}`,
  courseLists: 'courses:*',
  chapter: (id) => `chapter:${id}`,
  chapters: (courseId) => `chapters:${courseId}`,
  publicUser: (id) => `users:public:${id}`,
  privateUser: (id) => `users:private:${id}`,
  captcha: (uuid) => `captcha:${uuid}`,
};

/**
 * 标准 cache-aside：命中直接返回，未命中调用 loader 并写入 Redis。
 *
 * @param {string} key 缓存键
 * @param {Function} loader 未命中时的数据加载函数
 * @param {number|null} ttl 秒级有效期；null 表示不主动过期
 * @returns {Promise<any>}
 */
async function remember(key, loader, ttl = null) {
  // 先读取 Redis，避免重复访问数据库。
  const cachedValue = await getKey(key);
  if (cachedValue !== null) {
    return cachedValue;
  }

  // 缓存未命中时只调用一次加载函数。
  const loadedValue = await loader();
  // null 通常表示资源不存在，不缓存它以免掩盖后续创建的数据。
  if (loadedValue !== null && loadedValue !== undefined) {
    await setKey(key, loadedValue, ttl);
  }
  return loadedValue;
}

/**
 * 同时清理精确键和通配模式匹配到的键。
 *
 * @param {{keys?: Array<string|string[]>, patterns?: string[]}} options 失效规则
 */
async function invalidate({ keys = [], patterns = [] } = {}) {
  // 展平调用方传入的键数组，并过滤空值。
  const exactKeys = keys.flat(Infinity).filter(Boolean);
  // 逐个模式查询 Redis；模式数量很少，按顺序执行可避免瞬时放大请求。
  for (const pattern of patterns) {
    const matchedKeys = await getKeysByPattern(pattern);
    exactKeys.push(...matchedKeys);
  }
  // 去重后一次 DEL，减少 Redis 往返次数。
  await delKey([...new Set(exactKeys)]);
}

/**
 * 课程内容、章节数或点赞数变化时清理所有受影响缓存。
 *
 * @param {Array<string|number>} courseIds 发生变化的课程 ID
 * @param {Array<string|number>} chapterIds 发生变化的章节 ID
 */
async function invalidateCourses(courseIds = [], chapterIds = []) {
  const uniqueCourseIds = [...new Set(courseIds.map(Number).filter(Number.isSafeInteger))];
  const uniqueChapterIds = [...new Set(chapterIds.map(Number).filter(Number.isSafeInteger))];

  await invalidate({
    keys: [
      cacheKeys.index,
      uniqueCourseIds.map(cacheKeys.course),
      uniqueCourseIds.map(cacheKeys.courseSummary),
      uniqueCourseIds.map(cacheKeys.chapters),
      uniqueChapterIds.map(cacheKeys.chapter),
    ],
    patterns: [cacheKeys.courseLists],
  });
}

/**
 * 用户资料变化时同时失效私有资料、公开讲师资料和包含讲师信息的首页。
 */
async function invalidateUsers(userIds = []) {
  const uniqueUserIds = [...new Set(userIds.map(Number).filter(Number.isSafeInteger))];
  await invalidate({
    keys: [
      cacheKeys.index,
      uniqueUserIds.map(cacheKeys.privateUser),
      uniqueUserIds.map(cacheKeys.publicUser),
    ],
  });
}

module.exports = {
  cacheKeys,
  invalidate,
  invalidateCourses,
  invalidateUsers,
  remember,
};
