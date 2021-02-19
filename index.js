/**
 * 入口服务
 */
var http = require('http');
var koaStatic = require('koa-static');
var path = require('path');
var koaBody = require('koa-body');//解析 form-data消息体
var fs = require('fs');//文件模块
var Koa = require('koa2');

// 子模块
const uploadController = require('./server/upload');

var app = new Koa();
var port = process.env.PORT || '8100';//默认端口8100

app.use(koaBody({
    formidable: {
        //设置文件的默认保存目录，不设置则保存在系统临时目录下  os
        uploadDir: path.resolve(__dirname, './static/uploads'),
        maxFileSize: 10000 * 1024 * 1024    // 设置上传文件大小最大限制，默认20M
    },
    multipart: true // 支持文件上传,默认不不支持
}));

//开启静态文件访问
app.use(koaStatic(
    path.resolve(__dirname, './static')
));

//二次处理文件，修改名称
app.use(async (ctx) => {
    if (ctx.path === '/upfile') {
        await uploadController(ctx);
    }

});

/**
 * http server
 */
var server = http.createServer(app.callback());
server.listen(port);
console.log('upload file server start ......   ');