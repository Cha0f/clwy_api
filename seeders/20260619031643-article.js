'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const articles = [
      {
        title: '深入理解 JavaScript 闭包',
        content:
          '闭包（closure）是 JavaScript 中最核心、也最常被误解的概念之一。简单来说，闭包就是一个函数能够记住并访问其词法作用域（lexical scope）的能力，即使这个函数在其词法作用域之外执行。\n\n## 什么是闭包\n\n当一个函数内部定义了另一个函数，并且内部函数引用了外部函数的变量，就形成了闭包。\n\n```javascript\nfunction createCounter() {\n  let count = 0;\n  return function() {\n    count++;\n    return count;\n  };\n}\n\nconst counter = createCounter();\nconsole.log(counter()); // 1\nconsole.log(counter()); // 2\n```\n\n## 闭包的实际应用\n\n1. **数据私有化**：模拟私有变量\n2. **柯里化（Currying）**：将多参数函数转换为单参数函数链\n3. **函数工厂**：根据参数生成不同的函数\n\n## 注意事项\n\n闭包会保留对外部变量的引用，可能导致内存无法释放。在不需要时应将引用设为 null。',
        createdAt: new Date('2026-02-01'),
        updatedAt: new Date('2026-02-01'),
      },
      {
        title: 'CSS Grid 布局完全指南',
        content:
          'CSS Grid 是 CSS 中最强大的布局系统。与 Flexbox（一维布局）不同，Grid 是二维布局系统，可以同时处理行和列。\n\n## 基本概念\n\nGrid 布局由网格容器（grid container）和网格项（grid items）组成。\n\n```css\n.container {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  gap: 20px;\n}\n```\n\n## 常用属性\n\n- `grid-template-columns`：定义列\n- `grid-template-rows`：定义行\n- `gap`：间距\n- `grid-column` / `grid-row`：项目定位\n\n## 实战技巧\n\n使用 `auto-fit` 和 `minmax` 实现响应式布局无需媒体查询：\n\n```css\n.container {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));\n}\n```',
        createdAt: new Date('2026-02-10'),
        updatedAt: new Date('2026-02-10'),
      },
      {
        title: 'Node.js 异步编程进化史',
        content:
          'Node.js 的异步编程模型经历了从回调地狱到 async-await 的演变。理解这段历史对掌握现代 JavaScript 至关重要。\n\n## 第一阶段：回调函数\n\n早期的 Node.js 完全依赖回调函数处理异步操作。嵌套过深就形成了"回调地狱"（Callback Hell）。\n\n## 第二阶段：Promise\n\nPromise 提供了更清晰的组织方式：\n\n```javascript\nfetchUser(id)\n  .then(user => fetchPosts(user.id))\n  .then(posts => renderPosts(posts))\n  .catch(err => console.error(err));\n```\n\n## 第三阶段：async-await\n\nasync-await 是 Promise 的语法糖，让异步代码看起来像同步代码：\n\n```javascript\nasync function loadUserPosts(id) {\n  const user = await fetchUser(id);\n  const posts = await fetchPosts(user.id);\n  renderPosts(posts);\n}\n```\n\n## 错误处理\n\n始终使用 try-catch 包裹 async 函数：\n\n```javascript\nasync function safeLoad() {\n  try {\n    await riskyOperation();\n  } catch (error) {\n    console.error(\"操作失败:\", error);\n  }\n}\n```',
        createdAt: new Date('2026-02-20'),
        updatedAt: new Date('2026-03-01'),
      },
      {
        title: 'MySQL 索引优化实战',
        content:
          '索引是数据库性能调优的核心。一个合适的索引可以让查询速度提升几个数量级。\n\n## 索引类型\n\n- **B+ Tree 索引**：InnoDB 默认索引结构，适合范围查询\n- **哈希索引**：精确匹配极快，但不支持范围查询\n- **全文索引**：适合文本搜索\n\n## 最左前缀原则\n\n对于联合索引 `(a, b, c)`，以下查询可以使用索引：\n- `WHERE a = 1`\n- `WHERE a = 1 AND b = 2`\n- `WHERE a = 1 AND b = 2 AND c = 3`\n\n以下查询不能使用索引：\n- `WHERE b = 2`（跳过了第一列）\n\n## 常见优化手段\n\n1. 使用 EXPLAIN 分析查询计划\n2. 避免 SELECT *，只取需要的列\n3. 为 WHERE 和 ORDER BY 涉及的列建索引\n4. 避免在索引列上使用函数或计算',
        createdAt: new Date('2026-03-05'),
        updatedAt: new Date('2026-03-05'),
      },
      {
        title: 'Docker 容器化部署最佳实践',
        content:
          '容器化部署已成为现代应用交付的标准方式。以下是一些关键的最佳实践。\n\n## 镜像优化\n\n使用多阶段构建减小镜像体积：\n\n```dockerfile\n# 构建阶段\nFROM node:20-alpine AS builder\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci --only=production\n\n# 运行阶段\nFROM node:20-alpine\nCOPY --from=builder /app/node_modules ./node_modules\nCOPY . .\nCMD [\"node\", \"app.js\"]\n```\n\n## 安全建议\n\n1. 不要以 root 用户运行容器\n2. 使用只读文件系统（`readonly: true`）\n3. 定期扫描镜像漏洞\n\n## 日志管理\n\n应用日志应输出到 stdout/stderr，由 Docker 的日志驱动收集，而不是写入文件。',
        createdAt: new Date('2026-03-15'),
        updatedAt: new Date('2026-03-20'),
      },
      {
        title: 'Vue 3 Composition API 入门',
        content:
          'Vue 3 引入的 Composition API 是对 Vue 逻辑复用方式的一次革命性改进。\n\n## 为什么需要 Composition API\n\n在 Options API 中，同一个逻辑的代码分散在 data、methods、computed 等选项中。Composition API 允许按逻辑组织代码。\n\n## 核心函数\n\n```javascript\nimport { ref, computed, watch, onMounted } from \"vue\";\n\nexport function useCounter() {\n  const count = ref(0);\n  const double = computed(() => count.value * 2);\n\n  function increment() {\n    count.value++;\n  }\n\n  watch(count, (newVal) => {\n    console.log(`count 变为了 ${newVal}`);\n  });\n\n  return { count, double, increment };\n}\n```\n\n## 自定义 Hooks\n\n将可复用的逻辑提取为函数，跨组件共享：\n\n```javascript\n// useMousePosition.js\nexport function useMousePosition() {\n  const x = ref(0);\n  const y = ref(0);\n\n  onMounted(() => {\n    window.addEventListener(\"mousemove\", (e) => {\n      x.value = e.pageX;\n      y.value = e.pageY;\n    });\n  });\n\n  return { x, y };\n}\n```',
        createdAt: new Date('2026-03-20'),
        updatedAt: new Date('2026-04-01'),
      },
      {
        title: 'RESTful API 设计规范',
        content:
          '一套良好的 API 设计规范能让前后端协作变得更高效。\n\n## URL 设计\n\n- 使用名词复数形式：`/api/users` 而非 `/api/getUser`\n- 用 HTTP 方法表达动作：GET/POST/PUT/DELETE\n- 嵌套表示资源关系：`/api/users/1/posts`\n\n## 响应格式\n\n统一响应结构：\n\n```json\n{\n  \"status\": 200,\n  \"message\": \"操作成功\",\n  \"data\": { ... }\n}\n```\n\n## 错误处理\n\n返回适当的 HTTP 状态码：\n- 400：参数错误\n- 401：未认证\n- 403：无权限\n- 404：资源不存在\n- 409：冲突\n- 429：请求太频繁\n- 500：服务器错误\n\n## 版本管理\n\n通过 URL 前缀管理 API 版本：`/api/v1/users`',
        createdAt: new Date('2026-04-01'),
        updatedAt: new Date('2026-04-01'),
      },
      {
        title: 'Git 团队协作工作流对比',
        content:
          '选择合适的 Git 工作流对团队协作效率影响巨大。\n\n## Git Flow\n\n适合有固定发布周期的项目：\n- main：生产分支\n- develop：开发主分支\n- feature/*：功能分支\n- release/*：发布分支\n- hotfix/*：紧急修复\n\n## GitHub Flow\n\n适合持续部署的项目：\n- main 始终可部署\n- 新功能从 main 创建分支\n- 通过 PR 发起代码审查\n- 合并后立即部署\n\n## GitLab Flow\n\n结合环境分支：\n- main → pre-production → production\n- 通过环境分支控制发布节奏',
        createdAt: new Date('2026-04-10'),
        updatedAt: new Date('2026-04-15'),
      },
      {
        title: 'React Native 性能优化指南',
        content:
          'React Native 应用性能优化涉及多个层面。\n\n## JS 线程优化\n\n- 使用 `useMemo` 和 `useCallback` 减少不必要的渲染\n- 列表使用 FlatList 而非 ScrollView\n- 避免在渲染函数中执行耗时操作\n\n## 原生线程优化\n\n- 使用 `InteractionManager` 延迟非关键操作\n- 图片使用合适的尺寸，避免过大\n- 使用 `Image.getSize()` 预取图片尺寸\n\n## 启动速度\n\n- 使用 Hermes 引擎\n- 减少 bundle 体积\n- 懒加载非关键模块\n\n## 内存管理\n\n- 及时清除定时器和监听器\n- 使用 `InteractionManager.runAfterInteractions()`',
        createdAt: new Date('2026-04-15'),
        updatedAt: new Date('2026-04-20'),
      },
      {
        title: 'Flutter vs React Native 技术选型',
        content:
          '跨平台移动开发框架的技术选型是个常见难题。\n\n## Flutter 优势\n\n- 高性能：Skia 引擎直接渲染，无需 JS 桥接\n- UI 一致性：各平台效果完全一致\n- 开发效率：热重载体验优秀\n- 组件丰富：Material Design 开箱即用\n\n## React Native 优势\n\n- 生态成熟：npm 生态可以直接使用\n- 社区庞大：遇到问题更容易找到答案\n- 与 Web 技能复用：React 开发者快速上手\n- 灵活桥接：可随时编写原生模块\n\n## 选型建议\n\n- 团队有前端背景 → React Native\n- 需要极致 UI 一致性 → Flutter\n- 已有 React 项目 → React Native\n- 全新项目且团队可学新语言 → Flutter',
        createdAt: new Date('2026-04-20'),
        updatedAt: new Date('2026-04-25'),
      },
      {
        title: 'HTTPS 与 SSL/TLS 协议详解',
        content:
          'HTTPS 是现代 Web 安全的基础。理解其工作原理有助于更好地配置和排错。\n\n## TLS 握手过程\n\n1. ClientHello：客户端发送支持的加密套件\n2. ServerHello：服务端选择加密套件并发送证书\n3. 证书验证：客户端验证服务端证书有效性\n4. 密钥交换：使用非对称加密交换对称密钥\n5. 加密通信：开始使用对称加密传输数据\n\n## 证书类型\n\n- DV（域名验证）：仅验证域名所有权\n- OV（组织验证）：验证企业信息\n- EV（扩展验证）：显示绿色地址栏\n\n## 最佳实践\n\n- 使用 Let\'s Encrypt 免费证书\n- 启用 HSTS 强制 HTTPS\n- 配置 OSCP Stapling 提升性能\n- 定期检查证书到期时间',
        createdAt: new Date('2026-05-01'),
        updatedAt: new Date('2026-05-05'),
      },
      {
        title: 'Redis 缓存常见问题与解决方案',
        content:
          '使用缓存时经常会遇到三个经典问题：缓存穿透、缓存击穿、缓存雪崩。\n\n## 缓存穿透\n\n查询一个不存在的数据，缓存和数据库中都没有，每次请求都打到数据库。\n\n**解决方案**：缓存空值并设置较短的过期时间；使用布隆过滤器。\n\n## 缓存击穿\n\n热点 key 在过期瞬间，大量请求同时打到数据库。\n\n**解决方案**：热点数据不过期；使用互斥锁（Mutex Key）。\n\n## 缓存雪崩\n\n大量缓存同时过期，或 Redis 宕机，所有请求直接打到数据库。\n\n**解决方案**：过期时间加随机值；缓存多级部署；限流降级。\n\n## 总结\n\n```\n穿透 → 空值缓存 / 布隆过滤器\n击穿 → 互斥锁 / 逻辑过期\n雪崩 → 随机过期 / 限流降级\n```',
        createdAt: new Date('2026-05-10'),
        updatedAt: new Date('2026-05-15'),
      },
      {
        title: 'Kubernetes 入门：Pod 与 Deployment',
        content:
          'Kubernetes 是目前最流行的容器编排平台。Pod 和 Deployment 是最基础的两个概念。\n\n## Pod\n\nPod 是 K8s 中最小的部署单元，包含一个或多个容器。同一 Pod 内的容器共享网络和存储。\n\n```yaml\napiVersion: v1\nkind: Pod\nmetadata:\n  name: my-app\nspec:\n  containers:\n  - name: app\n    image: my-app:latest\n    ports:\n    - containerPort: 3000\n```\n\n## Deployment\n\nDeployment 管理 Pod 的声明式更新和扩缩容：\n\n```yaml\napiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: my-app-deployment\nspec:\n  replicas: 3\n  selector:\n    matchLabels:\n      app: my-app\n  template:\n    metadata:\n      labels:\n        app: my-app\n    spec:\n      containers:\n      - name: app\n        image: my-app:latest\n```\n\n## 常用操作\n\n- `kubectl get pods`：查看 Pod\n- `kubectl logs pod-name`：查看日志\n- `kubectl scale deployment my-app --replicas=5`：扩缩容',
        createdAt: new Date('2026-05-15'),
        updatedAt: new Date('2026-05-20'),
      },
      {
        title: '设计模式：观察者模式在 Node.js 中的应用',
        content:
          '观察者模式（Observer Pattern）是 JavaScript 中最常用的设计模式之一。\n\n## 定义\n\n观察者模式定义了对象之间的一对多依赖关系，当一个对象状态发生变化时，所有依赖它的对象都会得到通知。\n\n## Node.js 中的实现\n\nNode.js 的 EventEmitter 就是观察者模式的经典实现：\n\n```javascript\nconst EventEmitter = require(\"events\");\n\nclass OrderService extends EventEmitter {\n  createOrder(order) {\n    // 创建订单...\n    this.emit(\"orderCreated\", order);\n  }\n}\n\nconst orderService = new OrderService();\n\n// 通知服务\norderService.on(\"orderCreated\", (order) => {\n  sendEmail(order.userId);\n});\n\n// 日志服务\norderService.on(\"orderCreated\", (order) => {\n  logOrder(order);\n});\n\n// 统计服务\norderService.on(\"orderCreated\", (order) => {\n  incrementOrderCount();\n});\n```\n\n## 与发布-订阅模式的区别\n\n观察者模式是事件源直接通知观察者；发布-订阅模式通过中间层（消息队列）解耦。',
        createdAt: new Date('2026-05-20'),
        updatedAt: new Date('2026-06-01'),
      },
      {
        title: 'TypeScript 类型体操入门',
        content:
          'TypeScript 的类型系统非常强大，掌握高级类型可以让你的代码更安全、更优雅。\n\n## 基础工具类型\n\n```typescript\n// Partial：所有属性变为可选\ntype PartialUser = Partial<User>;\n\n// Pick：选取部分属性\ntype UserName = Pick<User, \"name\" | \"email\">;\n\n// Omit：排除部分属性\ntype UserWithoutPassword = Omit<User, \"password\">;\n\n// Record：构造对象类型\ntype PageMap = Record<string, number>;\n```\n\n## 条件类型\n\n```typescript\ntype IsString<T> = T extends string ? \"yes\" : \"no\";\ntype Result = IsString<string>; // \"yes\"\ntype Result2 = IsString<number>; // \"no\"\n```\n\n## infer 关键字\n\n```typescript\ntype ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;\n```\n\n## 实战：深度 Partial\n\n```typescript\ntype DeepPartial<T> = {\n  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];\n};\n```',
        createdAt: new Date('2026-06-01'),
        updatedAt: new Date('2026-06-05'),
      },
    ];

    await queryInterface.bulkInsert('Articles', articles, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Articles', null, {});
  },
};
