const express = require('express');
const router = express.Router();

router.get('/json', function (req,res,next) {
  res.json({message: 'Hello World!'});
})

router.get('/newJson',function (req,res,next) {
  res.json({message: 'Hello Node.js'})
})

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
