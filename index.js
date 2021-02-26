/**
 * 入口服务
 */
var http = require('http');
var https = require('https');
var koaStatic = require('koa-static');
var path = require('path');
var koaBody = require('koa-body');//解析 form-data消息体
var fs = require('fs');//文件模块
var Koa = require('koa2');
var cors = require('koa2-cors');

// 子模块
// const uploadController = require('./server/upload');
const {getBuildController, uploadController} = require('./server/buildList');
const {createAppController, getAppListController} = require('./server/application');
const {createDepartmentController, getDepartmentsController} = require('./server/department');

var app = new Koa();
var port = process.env.PORT || '8100';//默认端口8100
var ssl_port = 39001;//默认端口39001

//ssl证书
const options = {
    key: fs.readFileSync(`${__dirname}/static/cer/5208069_www.mengxin.pub.key`),
    cert: fs.readFileSync(`${__dirname}/static/cer/5208069_www.mengxin.pub.pem`)
};

app.use(cors());

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
    if (ctx.path === '/createBuilds') {
        await uploadController(ctx);
    }
    else if (ctx.path === '/getBuilds') {
        await getBuildController(ctx);
    }
    else if (ctx.path === '/createApps') {
        // Post
        // 参数 appBundle appName appDesc appPlatform appVersion appIcon
        await createAppController(ctx);
    }
    else if (ctx.path === '/getApps') {
        // Get
        // 参数 appBundle appPlatform appVersion
        await getAppListController(ctx);
    }
    else if (ctx.path === '/createDepartments') {
        // Post
        // 参数 departmentID departmentName
        await createDepartmentController(ctx);
    }
    else if (ctx.path === '/getDepartments') {
        // Get
        // 参数 departmentID
        await getDepartmentsController(ctx);
    }
});

/**
 * http server
 */
var server = http.createServer(app.callback());
server.listen(port);
/**
 * https server
 */
var https_server = https.createServer(options, app.callback()).listen(ssl_port);
console.log('upload file server start ......   ');