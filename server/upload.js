/**
 * 上传服务
 */
var path = require('path');
var fs = require('fs');//文件模块
var qr = require('qr-image');
var plist = require('plist');
const MongoDB = require('./mongodb');
const { resolve } = require('path');
const { rejects } = require('assert');
const { Int32 } = require('mongodb');

var port = process.env.PORT || '8100';//默认端口8100
var uploadHost = `http://172.20.110.150:${port}/uploads/`;//图片可访问地址

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
            //ctx.body = getRenderData({
            //    data: `${uploadHost}${nextPath.slice(nextPath.lastIndexOf('/') + 1)}`
            //});
            // 以字符串 形式输出上传文件地址
            // ctx.body = `${uploadHost}${nextPath.slice(nextPath.lastIndexOf('/') + 1)}`

            // 生成plist
            var data = fs.readFileSync(`${__dirname}/manifest_tmp.plist`, 'utf-8')
            var obj = plist.parse(data, 'utf-8')
            obj.items[0].assets[0].url = `${uploadHost}${nextPath.slice(nextPath.lastIndexOf('/') + 1)}`
            obj = plist.build(obj)
            fs.writeFile(`${__dirname}/../static/uploads/manifest.plist`, obj, err => {
                if (err) {
                    // 错误处理
                }
            })
            // 直接扫码安装
            //生成二维码
            var qr_svg = qr.image(`itms-services://?action=download-manifest&url=${uploadHost}manifest.plist`, { type: 'png' });
            //将二维码输出到文件流，并生成png文件
            qr_svg.pipe(require('fs').createWriteStream(`${__dirname}/../static/uploads/qr.png`));

            // buildNum自增
            createCounter();

            // 数据入库 buildNum buildTimeota buildDesc appId appName appVersion appDownloadUrl appPlatform
            var body = ctx.request.body
            var buildNum = await getBuildNum()
            var myobj = {
                appName: body.appName,
                appBundle: body.appBundle,
                appVersion: body.appVersion,
                appDownloadUrl: `${uploadHost}${nextPath.slice(nextPath.lastIndexOf('/') + 1)}`,
                appPlatform: body.appPlatform,
                buildNum: parseInt(buildNum)+1,
                buildTime: new Date(),
                buildDesc: body.buildDesc,
            };
            const res = await MongoDB.insert('buildList', myobj);
            console.log(res);
            ctx.response.body = getRenderData({
                code: 0,
                data: res
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

/**
 * 建立自增表
 */
async function createCounter() {
    // 如果
    const counter_res = await MongoDB.find('counter', {_id:"counterID"});
    if (!counter_res) {
        await MongoDB.insert('counter', {_id:"counterID", buildNum:0});
    }
}

/**
 * 获取自增字段buildNum
 */
function getBuildNum() {
    return new Promise((resolve, reject) => {
        MongoDB.findAndModify('counter', {_id:'counterID'}, {$inc:{buildNum:1}}).then(res => {
            console.log('自增字段'+res);
            resolve(res.buildNum);
        });
    });
}

module.exports = uploadController;