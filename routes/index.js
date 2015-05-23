var express = require('express');
var router = express.Router();

//这里需要引入一个path模块，专门用来处理目录路径的
var path = require('path');
//第一个参数为当前目录，第二个参数为目标目录
var media = path.join(__dirname,"../public/media");

/* GET home page. */
router.get('/', function(req, res, next) {
	//引入文件系统fs模块
	var fs = require("fs");
	
	//这里是异步读取
	fs.readdir(media,function(err,names){
		if(err){
			//如果有错误，就在控制台打印出错误信息
			console.log(err);
		}else{
			res.render('index', { title: 'HTML5_WebAudio',music:names});
		}
	});
});

module.exports = router;
