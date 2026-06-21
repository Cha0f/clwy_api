const express = require('express');
const router = express.Router();

/* GET home page. (健康检查) */
router.get('/', function (req, res) {
  res.json({ message: 'API 服务运行正常。' });
});

module.exports = router;
