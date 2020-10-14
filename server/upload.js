/**
 * 上传服务
 */
var path = require('path');
var fs = require('fs');//文件模块

var port = process.env.PORT || '8100';//默认端口8100

var uploadHost = `http://localhost:${port}/uploads/`;//图片可访问地址

async function uploadController(ctx) {
    if (ctx.path === '/upfile') {
        var file = ctx.request.files ? ctx.request.files.file : null; //得到文件对象
        if (file) {

            var path = file.path.replace(/\\/g, '/');
            var fname = file.name; //原文件名称
            var nextPath = '';
            if (file.size > 0 && path) {
                //得到扩展名
                var extArr = fname.split('.');
                var ext = extArr[extArr.length - 1];
                nextPath = path + '.' + ext;
                //重命名文件
                fs.renameSync(path, nextPath);
            }
            //以 json 形式输出上传文件地址
            ctx.body = getRenderData({
                data: `${uploadHost}${nextPath.slice(nextPath.lastIndexOf('/') + 1)}`
            });
        }else {
            ctx.body = getRenderData({
                code:1,
                msg:'file is null'
            });
        }

    }
}

/**
 *
 * @param {设置返回结果} opt
 */
function getRenderData(opt) {
    return Object.assign({
        code:0,
        msg:'',
        data:null
    },opt);
}

module.exports = uploadController;