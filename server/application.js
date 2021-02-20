/**
 * 应用列表
 */
var fs = require('fs');//文件模块
const MongoDB = require('./mongodb');

const collection = 'applications';

async function getAppListController(ctx) {
    if (ctx.path === '/getApps') {
        let res = await MongoDB.find('buildList', {appBundle: 'com.baijia.ei'}).catch(err => {
            ctx.body = getRenderData({
                code: 1,
                data: err
            });
        });
        ctx.body = getRenderData({
            code: 200,
            data: res
        });
    }
}

async function createAppController(ctx) {
    if (ctx.path === '/createApps') {
        // applications 结构
        // appBundle appName appIcon appDesc
        let uploads_path = `http://${ctx.request.host}/uploads/`;

        // appIcon上传
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
        }
        // 拼接appIcon Url
        let appIconUrl = `${uploads_path}${nextPath.slice(nextPath.lastIndexOf('/') + 1)}`;
        console.log(appIconUrl);

        let body = ctx.request.body;
        body.appIcon = appIconUrl;
        let bundle = body.appBundle;
        let find_res = await MongoDB.find(collection, {appBundle: bundle});
        if (find_res.length<=0) {
            let res = await MongoDB.insert(collection, body) .catch(err => {
                ctx.body = getRenderData({
                    code: 0,
                    data: err
                });
            });
            ctx.body = getRenderData({
                code: 200,
                data: res
            });
        }
        else {
            ctx.body = getRenderData({
                code: 0,
                msg: '该条目已存在!'
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

module.exports = {getAppListController, createAppController};