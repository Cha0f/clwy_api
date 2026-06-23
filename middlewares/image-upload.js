/**
 * 图片上传解析中间件。
 *
 * 负责 MIME 白名单、内存存储、单文件数量和大小限制；
 * 路由只需要调用 parseImage(req, res) 即可取得 req.file。
 */
const createError = require('http-errors');
const multer = require('multer');

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png']);

const upload = multer({
  // 文件直接保存在内存 Buffer，便于上传到 COS，不产生本地临时文件。
  storage: multer.memoryStorage(),
  // 在接收完整文件前检查客户端声明的 MIME 类型。
  fileFilter(req, file, callback) {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return callback(
        createError(400, `不支持的文件类型：${file.mimetype}。仅允许 JPG/PNG 格式图片。`),
      );
    }
    callback(null, true);
  },
  limits: {
    // 单文件最大 10 MB。
    fileSize: 10 * 1024 * 1024,
    // 每次请求只接收一个文件。
    files: 1,
  },
});

/**
 * 把 Multer 的回调接口转换为 Promise，方便 async 路由顺序调用。
 */
function parseImage(req, res) {
  return new Promise((resolve, reject) => {
    upload.single('file')(req, res, (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(req.file);
    });
  });
}

module.exports = { parseImage };
