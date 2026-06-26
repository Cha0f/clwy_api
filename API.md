# 长乐未央 API 接口文档

**基础地址**: `http://localhost:3000`（开发环境） / `http://115.159.69.223`（线上测试环境）  
**响应格式**: JSON  
**时间戳格式**: ISO 8601 / `YYYY-MM-DD HH:mm:ss`

---

## 统一响应格式

### 成功响应

```json
{
  "status": 200,
  "message": "操作成功。",
  "data": { ... }
}
```

| 状态码 | 说明 |
|--------|------|
| 200 | 查询/更新成功 |
| 201 | 创建成功 |

### 失败响应

```json
{
  "status": 400,
  "message": "请求参数错误。",
  "errors": ["详细错误信息"]
}
```

| 状态码 | 说明 |
|--------|------|
| 400 | 请求参数错误 |
| 401 | 认证失败 / Token 无效 / Token 过期 |
| 403 | 禁止访问 |
| 404 | 资源不存在 |
| 409 | 操作冲突（数据重复/外键约束） |
| 429 | 请求过于频繁 |
| 500 | 服务器错误 |

---

## 认证方式

### 前台认证

请求头：`Authorization: Bearer <JWT Token>`

需要认证的接口：`/users/*`、`/likes/*`、`/uploads/*`

### 后台认证

请求头：`Authorization: Bearer <JWT Token>`

需要 admin 角色（`role === 100`）的接口：`/admin/*`

---

## 1. 前台接口

### 1.1 首页

#### GET /

获取首页推荐、人气和入门课程。缓存 30 分钟。

**响应**:

```json
{
  "status": 200,
  "message": "查询首页数据成功。",
  "data": {
    "recommendedCourses": [ /* 推荐课程，最多 10 条 */ ],
    "likesCourses": [ /* 按点赞数排序课程，最多 10 条 */ ],
    "introductoryCourses": [ /* 入门课程，最多 10 条 */ ]
  }
}
```

---

### 1.2 分类

#### GET /categories

获取全部分类列表。

**响应**:

```json
{
  "status": 200,
  "message": "查询分类成功。",
  "data": {
    "categories": [
      { "id": 1, "name": "前端开发", "rank": 1, "createdAt": "...", "updatedAt": "..." }
    ]
  }
}
```

---

### 1.3 课程

#### GET /courses

获取课程列表。**需要指定分类 ID**。

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| categoryId | number | 是 | 分类 ID |
| page | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 每页条数，默认 10，最大 100 |

**响应**:

```json
{
  "status": 200,
  "message": "查询课程列表成功。",
  "data": {
    "courses": [
      {
        "id": 1,
        "categoryId": 1,
        "userId": 1,
        "name": "Vue.js 入门",
        "image": "https://...",
        "recommended": true,
        "introductory": false,
        "likesCount": 42,
        "chaptersCount": 10,
        "content": "课程介绍",
        "createdAt": "...",
        "updatedAt": "...",
        "category": { "id": 1, "name": "前端开发" },
        "user": { "id": 1, "username": "admin", "nickname": "管理员", "avatar": null, "company": null }
      }
    ],
    "pagination": { "total": 100, "currentPage": 1, "pageSize": 10 }
  }
}
```

#### GET /courses/:id

获取课程详情（含分类、讲师和章节）。

**响应**:

```json
{
  "status": 200,
  "message": "查询课程成功。",
  "data": {
    "course": {
      "id": 1,
      "categoryId": 1,
      "userId": 1,
      "name": "Vue.js 入门",
      "image": "https://...",
      "recommended": true,
      "introductory": false,
      "likesCount": 42,
      "chaptersCount": 10,
      "content": "课程详细介绍",
      "createdAt": "...",
      "updatedAt": "..."
    },
    "category": { "id": 1, "name": "前端开发", "rank": 1, "createdAt": "...", "updatedAt": "..." },
    "user": { "id": 1, "username": "admin", "nickname": "管理员", "avatar": null, "company": null, "introduce": null },
    "chapters": [
      { "id": 1, "courseId": 1, "title": "第一章", "video": null, "rank": 1, "createdAt": "...", "updatedAt": "..." }
    ]
  }
}
```

---

### 1.4 章节

#### GET /chapters/:id

获取章节详情（含所属课程、讲师和同课程目录）。

**响应**:

```json
{
  "status": 200,
  "message": "查询章节成功。",
  "data": {
    "chapter": {
      "id": 1,
      "courseId": 1,
      "title": "第一章",
      "content": "章节内容",
      "video": "https://...",
      "rank": 1,
      "createdAt": "...",
      "updatedAt": "..."
    },
    "course": { "id": 1, "name": "Vue.js 入门", "userId": 1 },
    "user": { "id": 1, "username": "admin", "nickname": "管理员", "avatar": null, "company": null, "introduce": null },
    "chapters": [
      { "id": 1, "courseId": 1, "title": "第一章", "video": null, "rank": 1, "createdAt": "...", "updatedAt": "..." }
    ]
  }
}
```

---

### 1.5 文章

#### GET /articles

获取文章列表。

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 每页条数，默认 10，最大 100 |

**响应**:

```json
{
  "status": 200,
  "message": "查询文章列表成功。",
  "data": {
    "articles": [
      { "id": 1, "title": "文章标题", "createdAt": "...", "updatedAt": "..." }
    ],
    "pagination": { "total": 50, "currentPage": 1, "pageSize": 10 }
  }
}
```

#### GET /articles/:id

获取文章详情（含正文）。

**响应**:

```json
{
  "status": 200,
  "message": "查询文章成功。",
  "data": {
    "article": {
      "id": 1,
      "title": "文章标题",
      "content": "文章正文内容...",
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```

---

### 1.6 验证码

#### GET /captcha

获取图形验证码（SVG）。缓存 10 分钟。

**响应**:

```json
{
  "status": 200,
  "message": "验证码获取成功。",
  "data": {
    "captchaKey": "captcha:uuid-xxx",
    "captchaData": "<svg>...</svg>"
  }
}
```

---

### 1.7 认证

> 该组路由使用限流器：同一 IP 15 分钟内最多 20 次请求。

#### POST /auth/sign_up

用户注册。

**请求体**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | 是 | 邮箱 |
| username | string | 是 | 用户名（2-45 字符） |
| password | string | 是 | 密码（6-45 字符） |
| nickname | string | 是 | 昵称（2-45 字符） |
| captchaKey | string | 是 | 验证码 key |
| captchaText | string | 是 | 验证码文本 |

**响应**:

```json
{
  "status": 201,
  "message": "创建用户成功",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "username": "demo",
      "nickname": "Demo",
      "avatar": null,
      "gender": 0,
      "company": null,
      "introduce": null,
      "role": 0,
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```

**备注**: 注册成功后异步发送欢迎邮件（RabbitMQ 消息队列）。

#### POST /auth/sign_in

用户登录。

**请求体**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| login | string | 是 | 邮箱或用户名 |
| password | string | 是 | 密码 |
| captchaKey | string | 是 | 验证码 key |
| captchaText | string | 是 | 验证码文本 |

**响应**:

```json
{
  "status": 200,
  "message": "登陆成功。",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**备注**: Token 默认有效期 7 天。

---

### 1.8 用户

> 需要认证：`Authorization: Bearer <Token>`

#### GET /users/me

获取当前登录用户资料。

**响应**:

```json
{
  "status": 200,
  "message": "查询当前用户信息成功。",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "username": "demo",
      "nickname": "Demo",
      "avatar": null,
      "gender": 0,
      "company": null,
      "introduce": null,
      "role": 0,
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```

#### PUT /users/info

更新用户资料。

**请求体**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| avatar | string | 否 | 头像 URL |
| nickname | string | 否 | 昵称 |
| gender | number | 否 | 性别（0=未选择, 1=男性, 2=女性） |
| company | string | 否 | 公司 |
| introduce | string | 否 | 简介 |

**响应**:

```json
{
  "status": 200,
  "message": "更新用户信息成功。",
  "data": {
    "user": { ... }
  }
}
```

#### PUT /users/account

更新账户信息（邮箱、用户名、密码）。

**请求体**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| currentPassword | string | 是 | 当前密码 |
| email | string | 否 | 新邮箱 |
| username | string | 否 | 新用户名 |
| password | string | 否 | 新密码（6-45 字符） |
| passwordConfirmation | string | 否 | 确认新密码 |

**响应**:

```json
{
  "status": 200,
  "message": "更新账户成功。",
  "data": {
    "user": { ... }
  }
}
```

---

### 1.9 点赞

> 需要认证：`Authorization: Bearer <Token>`

#### POST /likes

切换课程点赞状态（已点赞 → 取消赞，未点赞 → 点赞）。使用数据库行锁保证并发安全。

**请求体**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| courseId | number | 是 | 课程 ID |

**响应**:

```json
{
  "status": 200,
  "message": "点赞成功。"
}
```
或
```json
{
  "status": 200,
  "message": "取消赞成功。"
}
```

#### GET /likes

获取当前用户点赞的课程列表。

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 每页条数，默认 10，最大 100 |

**响应**:

```json
{
  "status": 200,
  "message": "查询用户点赞的课程成功。",
  "data": {
    "courses": [ /* 课程列表 */ ],
    "pagination": { "total": 10, "currentPage": 1, "pageSize": 10 }
  }
}
```

---

### 1.10 搜索

#### GET /search

搜索课程（按名称模糊匹配）。

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 否 | 课程名称（模糊搜索） |
| page | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 每页条数，默认 10，最大 100 |

**响应**:

```json
{
  "status": 200,
  "message": "搜索课程成功。",
  "data": {
    "courses": [ /* 课程列表 */ ],
    "pagination": { "total": 5, "currentPage": 1, "pageSize": 10 }
  }
}
```

---

### 1.11 站点设置

#### GET /settings

获取站点设置。

**响应**:

```json
{
  "status": 200,
  "message": "查询系统信息成功。",
  "data": {
    "setting": {
      "id": 1,
      "name": "长乐未央",
      "icp": "京ICP备xxxxxx号",
      "copyright": "© 2024 长乐未央",
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```

---

### 1.12 文件上传

> 需要认证：`Authorization: Bearer <Token>`

#### POST /uploads/oss

上传图片到腾讯云 COS。

**请求体**: `multipart/form-data`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| file | file | 是 | 图片文件（JPG/PNG，单文件，最大 10MB） |

**响应**:

```json
{
  "status": 200,
  "message": "文件上传成功。",
  "data": {
    "url": "https://cos-bucket.cos.ap-guangzhou.myqcloud.com/path/to/file.jpg"
  }
}
```

---

## 2. 后台管理接口

> 所有后台接口需要管理员权限（`role === 100`）  
> `Authorization: Bearer <Token>`

### 2.1 管理员登录

> 使用独立限流器：同一 IP 15 分钟内最多 10 次请求。不校验 adminAuth。

#### POST /admin/auth/sign_in

管理员登录。

**请求体**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| login | string | 是 | 邮箱或用户名 |
| password | string | 是 | 密码 |
| captchaKey | string | 是 | 验证码 key |
| captchaText | string | 是 | 验证码文本 |

**响应**:

```json
{
  "status": 200,
  "message": "登录成功。",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**备注**: Token 默认有效期 1 小时。

---

### 2.2 文章管理

#### GET /admin/articles

获取文章列表。

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 否 | 标题（模糊搜索） |
| deleted | string | 否 | 设为 `"true"` 查询回收站（软删除记录） |
| page | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 每页条数，默认 10，最大 100 |

**响应**:

```json
{
  "status": 200,
  "message": "查询文章列表成功。",
  "data": {
    "articles": [ /* 文章列表，不含 content */ ],
    "pagination": { "total": 50, "currentPage": 1, "pageSize": 10 }
  }
}
```

#### GET /admin/articles/:id

获取文章详情。

**响应**:

```json
{
  "status": 200,
  "message": "查询文章成功。",
  "data": {
    "article": { "id": 1, "title": "...", "content": "...", "createdAt": "...", "updatedAt": "..." }
  }
}
```

#### POST /admin/articles

创建文章。

**请求体**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 是 | 标题（2-45 字符） |
| content | string | 否 | 内容 |

**响应**: `201 Created`

#### PUT /admin/articles/:id

更新文章。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 否 | 新标题 |
| content | string | 否 | 新内容 |

#### POST /admin/articles/delete

将文章软删除到回收站。

**请求体**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | number | 是 | 文章 ID |

#### POST /admin/articles/restore

从回收站恢复文章。

**请求体**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | number | 是 | 文章 ID |

#### POST /admin/articles/force_delete

彻底删除文章。

**请求体**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | number | 是 | 文章 ID |

---

### 2.3 分类管理

#### GET /admin/categories

获取分类列表。

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 否 | 分类名称（模糊搜索） |
| page | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 每页条数，默认 10，最大 100 |

**响应**:

```json
{
  "status": 200,
  "message": "查询分类列表成功。",
  "data": {
    "categories": [
      { "id": 1, "name": "前端开发", "rank": 1, "createdAt": "...", "updatedAt": "..." }
    ],
    "pagination": { "total": 5, "currentPage": 1, "pageSize": 10 }
  }
}
```

#### GET /admin/categories/:id

获取分类详情。

#### POST /admin/categories

创建分类。

**请求体**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 名称（唯一，2-45 字符） |
| rank | number | 是 | 排序权重（正整数） |

#### PUT /admin/categories/:id

更新分类。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 否 | 新名称 |
| rank | number | 否 | 新排序权重 |

#### DELETE /admin/categories/:id

删除分类（需无可关联课程）。

| 参数 | 说明 |
|------|------|
| 409 | 该分类下有关联课程，无法删除 |

---

### 2.4 课程管理

#### GET /admin/courses

获取课程列表（多条件筛选）。

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| categoryId | number | 否 | 分类 ID（精确） |
| userId | number | 否 | 讲师 ID（精确） |
| name | string | 否 | 名称（模糊搜索） |
| recommended | boolean | 否 | 是否推荐 |
| introductory | boolean | 否 | 是否入门 |
| page | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 每页条数，默认 10，最大 100 |

**响应**:

```json
{
  "status": 200,
  "message": "查询课程列表成功。",
  "data": {
    "courses": [
      {
        "id": 1,
        "categoryId": 1,
        "userId": 1,
        "name": "Vue.js 入门",
        "image": "https://...",
        "recommended": true,
        "introductory": false,
        "likesCount": 42,
        "chaptersCount": 10,
        "content": "课程介绍",
        "createdAt": "...",
        "updatedAt": "...",
        "category": { "id": 1, "name": "前端开发" },
        "user": { "id": 1, "username": "admin", "avatar": null }
      }
    ],
    "pagination": { "total": 100, "currentPage": 1, "pageSize": 10 }
  }
}
```

#### GET /admin/courses/:id

获取课程详情（含分类、讲师和章节列表）。

**响应**:

```json
{
  "status": 200,
  "message": "查询课程成功。",
  "data": {
    "course": {
      "id": 1,
      "categoryId": 1,
      "userId": 1,
      "name": "...",
      "image": "...",
      "recommended": true,
      "introductory": false,
      "likesCount": 42,
      "chaptersCount": 10,
      "content": "...",
      "category": { "id": 1, "name": "前端开发" },
      "user": { "id": 1, "username": "admin", "avatar": null },
      "chapter": [
        { "id": 1, "title": "第一章", "rank": 1, "createdAt": "..." }
      ],
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```

#### POST /admin/courses

创建课程。

**请求体**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| categoryId | number | 是 | 分类 ID |
| userId | number | 是 | 讲师 ID |
| name | string | 是 | 名称（2-45 字符） |
| image | string | 否 | 封面 URL |
| recommended | boolean | 否 | 是否推荐，默认 false |
| introductory | boolean | 否 | 是否入门，默认 false |
| content | string | 否 | 课程介绍 |

#### PUT /admin/courses/:id

更新课程。请求体参数同创建。

#### DELETE /admin/courses/:id

删除课程（需无可关联章节）。返回 409 如果有关联章节。

---

### 2.5 章节管理

#### GET /admin/chapters

获取章节列表。**需要指定课程 ID**。

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| courseId | number | 是 | 课程 ID |
| title | string | 否 | 标题（模糊搜索） |
| page | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 每页条数，默认 10，最大 100 |

**响应**:

```json
{
  "status": 200,
  "message": "查询章节列表成功。",
  "data": {
    "chapters": [
      {
        "id": 1,
        "courseId": 1,
        "title": "第一章",
        "content": "...",
        "video": null,
        "rank": 1,
        "createdAt": "...",
        "updatedAt": "...",
        "course": { "id": 1, "name": "Vue.js 入门" }
      }
    ],
    "pagination": { "total": 10, "currentPage": 1, "pageSize": 10 }
  }
}
```

#### GET /admin/chapters/:id

获取章节详情。

#### POST /admin/chapters

创建章节（自动增加课程章节数）。

**请求体**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| courseId | number | 是 | 课程 ID |
| title | string | 是 | 标题（2-45 字符） |
| content | string | 否 | 内容 |
| video | string | 否 | 视频 URL |
| rank | number | 否 | 排序权重，默认 1 |

#### PUT /admin/chapters/:id

更新章节。跨课程移动时自动同步双方章节计数器。

**请求体**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| courseId | number | 否 | 新课程 ID（跨课程移动） |
| title | string | 否 | 新标题 |
| content | string | 否 | 新内容 |
| video | string | 否 | 新视频 URL |
| rank | number | 否 | 新排序权重 |

#### DELETE /admin/chapters/:id

删除章节（自动减少课程章节数）。

---

### 2.6 用户管理

#### GET /admin/users

获取用户列表（多条件筛选）。

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | 否 | 邮箱（精确匹配） |
| username | string | 否 | 用户名（精确匹配） |
| role | number | 否 | 角色（0=普通用户, 100=管理员） |
| nickname | string | 否 | 昵称（模糊搜索） |
| page | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 每页条数，默认 10，最大 100 |

**响应**:

```json
{
  "status": 200,
  "message": "查询用户列表成功。",
  "data": {
    "users": [
      {
        "id": 1,
        "email": "user@example.com",
        "username": "demo",
        "nickname": "Demo",
        "avatar": null,
        "gender": 0,
        "company": null,
        "introduce": null,
        "role": 0,
        "createdAt": "...",
        "updatedAt": "..."
      }
    ],
    "pagination": { "total": 50, "currentPage": 1, "pageSize": 10 }
  }
}
```

#### GET /admin/users/me

获取当前管理员自己的资料。

#### GET /admin/users/:id

获取指定用户详情。

#### POST /admin/users

创建用户。

**请求体**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | 是 | 邮箱 |
| username | string | 是 | 用户名（2-45 字符） |
| nickname | string | 是 | 昵称（2-45 字符） |
| password | string | 是 | 密码（6-45 字符） |
| avatar | string | 否 | 头像 URL |
| gender | number | 否 | 性别，默认 0（0=未选择, 1=男性, 2=女性） |
| company | string | 否 | 公司 |
| introduce | string | 否 | 简介 |
| role | number | 否 | 角色（0=普通用户, 100=管理员） |

#### PUT /admin/users/:id

更新用户。

**请求体**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | 否 | 新邮箱 |
| username | string | 否 | 新用户名 |
| nickname | string | 否 | 新昵称 |
| avatar | string | 否 | 新头像 |
| gender | number | 否 | 新性别 |
| company | string | 否 | 新公司 |
| introduce | string | 否 | 新简介 |
| password | string | 否 | 新密码（需同时提供 currentPassword） |
| currentPassword | string | 否 | 当前管理员密码（修改密码时必填） |

#### DELETE /admin/users/:id

删除用户。

**约束**:
- 不能删除自己的账号
- 至少保留一位管理员
- 有授课课程的用户不能删除

---

### 2.7 系统设置

#### GET /admin/settings

获取系统设置。

**响应**:

```json
{
  "status": 200,
  "message": "查询系统设置成功。",
  "data": {
    "setting": {
      "id": 1,
      "name": "长乐未央",
      "icp": "京ICP备xxxxxx号",
      "copyright": "© 2024 长乐未央",
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```

#### PUT /admin/settings

更新系统设置。

**请求体**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 否 | 站点名称 |
| icp | string | 否 | ICP 备案号 |
| copyright | string | 否 | 版权信息 |

#### GET /admin/settings/flush-all

清空 Redis 所有缓存。谨慎使用。

---

### 2.8 统计图表

#### GET /admin/charts/gender

获取用户性别分布统计。

**响应**:

```json
{
  "status": 200,
  "message": "查询用户性别成功。",
  "data": [
    { "value": 100, "name": "男性" },
    { "value": 80, "name": "女性" },
    { "value": 20, "name": "未选择" }
  ]
}
```

#### GET /admin/charts/user

获取每月注册用户数量。

**响应**:

```json
{
  "status": 200,
  "message": "查询每月用户数量成功。",
  "data": {
    "months": ["2024-01", "2024-02", "2024-03"],
    "values": [10, 25, 40]
  }
}
```

---

### 2.9 附件管理

#### GET /admin/attachments

获取附件列表。

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| originalname | string | 否 | 原文件名（模糊搜索） |
| page | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 每页条数，默认 10，最大 100 |

**响应**:

```json
{
  "status": 200,
  "message": "查询附件列表成功。",
  "data": {
    "attachments": [
      {
        "id": 1,
        "userId": 1,
        "originalname": "photo.jpg",
        "filename": "xxx.jpg",
        "mimetype": "image/jpeg",
        "size": "102400",
        "path": "/uploads/xxx.jpg",
        "url": "https://cos-bucket.cos.ap-guangzhou.myqcloud.com/uploads/xxx.jpg",
        "createdAt": "...",
        "updatedAt": "...",
        "user": { "id": 1, "username": "admin", "nickname": "管理员" }
      }
    ],
    "pagination": { "total": 200, "currentPage": 1, "pageSize": 10 }
  }
}
```

#### POST /admin/attachments

占位接口，提示请通过上传接口创建附件。

#### DELETE /admin/attachments/:id

删除附件（同步删除 COS 文件）。

---

### 2.10 日志管理

#### GET /admin/logs

获取日志列表（按创建时间倒序）。

**响应**:

```json
{
  "status": 200,
  "message": "查询日志列表成功。",
  "data": {
    "logs": [
      {
        "id": 1,
        "level": "info",
        "message": "操作日志",
        "meta": { /* 元数据 JSON 对象 */ },
        "timestamp": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

#### GET /admin/logs/:id

获取日志详情。

#### DELETE /admin/logs/clear

清空全部日志（`TRUNCATE`）。

#### DELETE /admin/logs/:id

删除指定日志。

---

## 接口总表

### 前台接口（无需认证）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/` | 首页 |
| GET | `/categories` | 分类列表 |
| GET | `/courses` | 课程列表（需 categoryId） |
| GET | `/courses/:id` | 课程详情 |
| GET | `/chapters/:id` | 章节详情 |
| GET | `/articles` | 文章列表 |
| GET | `/articles/:id` | 文章详情 |
| GET | `/settings` | 站点设置 |
| GET | `/search` | 课程搜索 |
| GET | `/captcha` | 图形验证码 |
| POST | `/auth/sign_up` | 用户注册 |
| POST | `/auth/sign_in` | 用户登录 |

### 前台接口（需认证）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/users/me` | 当前用户资料 |
| PUT | `/users/info` | 更新用户资料 |
| PUT | `/users/account` | 更新账户信息 |
| POST | `/likes` | 切换点赞 |
| GET | `/likes` | 点赞课程列表 |
| POST | `/uploads/oss` | 上传文件 |

### 后台接口（需管理员认证）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/admin/auth/sign_in` | 管理员登录 |
| GET | `/admin/articles` | 文章列表 |
| GET | `/admin/articles/:id` | 文章详情 |
| POST | `/admin/articles` | 创建文章 |
| PUT | `/admin/articles/:id` | 更新文章 |
| POST | `/admin/articles/delete` | 软删除文章 |
| POST | `/admin/articles/restore` | 恢复文章 |
| POST | `/admin/articles/force_delete` | 彻底删除文章 |
| GET | `/admin/categories` | 分类列表 |
| GET | `/admin/categories/:id` | 分类详情 |
| POST | `/admin/categories` | 创建分类 |
| PUT | `/admin/categories/:id` | 更新分类 |
| DELETE | `/admin/categories/:id` | 删除分类 |
| GET | `/admin/courses` | 课程列表 |
| GET | `/admin/courses/:id` | 课程详情 |
| POST | `/admin/courses` | 创建课程 |
| PUT | `/admin/courses/:id` | 更新课程 |
| DELETE | `/admin/courses/:id` | 删除课程 |
| GET | `/admin/chapters` | 章节列表（需 courseId） |
| GET | `/admin/chapters/:id` | 章节详情 |
| POST | `/admin/chapters` | 创建章节 |
| PUT | `/admin/chapters/:id` | 更新章节 |
| DELETE | `/admin/chapters/:id` | 删除章节 |
| GET | `/admin/users` | 用户列表 |
| GET | `/admin/users/me` | 当前管理员资料 |
| GET | `/admin/users/:id` | 用户详情 |
| POST | `/admin/users` | 创建用户 |
| PUT | `/admin/users/:id` | 更新用户 |
| DELETE | `/admin/users/:id` | 删除用户 |
| GET | `/admin/settings` | 系统设置 |
| PUT | `/admin/settings` | 更新设置 |
| GET | `/admin/settings/flush-all` | 清空缓存 |
| GET | `/admin/charts/gender` | 性别统计 |
| GET | `/admin/charts/user` | 每月注册统计 |
| GET | `/admin/attachments` | 附件列表 |
| POST | `/admin/attachments` | 附件占位接口 |
| DELETE | `/admin/attachments/:id` | 删除附件 |
| GET | `/admin/logs` | 日志列表 |
| GET | `/admin/logs/:id` | 日志详情 |
| DELETE | `/admin/logs/clear` | 清空日志 |
| DELETE | `/admin/logs/:id` | 删除日志 |

---

## 后台文件上传

后台也支持文件上传（路径 `/admin/uploads/oss`），挂载的是前台同一个 `uploadsRouter`，经 `adminAuth` 中间件保护后行为与前台上传一致。

---

## 模型关系图

```
Category ──┬── Course ──┬── Chapter
            │            │
            │            └── User (讲师, belongsTo)
            │
            └── User (点赞者) ──┬── Like
                                └── Course (被点赞, through Like)

User ──┬── Attachment
       │
       └── Course (讲师, hasMany)
```

---

## 限流策略

| 路由组 | 窗口 | 最大请求数 | 说明 |
|--------|------|-----------|------|
| `/auth/*` | 15 分钟 | 20 | 前台注册登录 |
| `/admin/auth/sign_in` | 15 分钟 | 10 | 管理员登录（更严格） |

---

## 关键中间件链

```
请求 → Helmet → CORS → Morgan → JSON解析 → URLEncode → CookieParser → Static
  ├─ 前台路由
  │    ├─ 公开路由（直接进入）
  │    └─ 私有路由（→ userAuth → 业务处理）
  └─ 后台路由
       ├─ /admin/auth （不限，仅限流）
       └─ 其他 /admin/* （→ adminAuth → 业务处理）
```
