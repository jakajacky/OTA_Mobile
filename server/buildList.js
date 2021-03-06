/**
 * 构建列表
 */
var fs = require('fs');//文件模块
var qr = require('qr-image');
var plist = require('plist');
const MongoDB = require('./mongodb');
const { ObjectId } = require('mongodb');

async function getBuildListController(ctx) {
    if (ctx.path === '/getBuildDetail') {
        let body = ctx.request.query;
        let res = await MongoDB.find('buildList', {_id: ObjectId(body.buildId)}).catch(err => {
            ctx.body = getRenderData({
                code: 1,
                data: err
            });
        });
        let build = res[0];
        console.log(res);
        res = await MongoDB.aggregate('buildList', [
            { $lookup:{from:"applications", localField:"appBundle", foreignField:"appBundle", as:"application" } },
            { $match:{appBundle:build.appBundle} }
        ]).catch(err => {
            ctx.body = getRenderData({
                code: 1,
                data: err
            });
        });
        res.forEach(element => {
            element.appName = element.application[0].appName;
            element.appDesc = element.application[0].appDesc;
            element.appIcon = element.application[0].appIcon;
            element.application = null;
        });

        ctx.body = getRenderData({
            code: 0,
            data: res
        });
    }
}

async function getFilterBuildListController(ctx) {
    if (ctx.path === '/getBuilds') {
        let body = ctx.request.query;
        console.log(body);
        let res = await MongoDB.aggregate('buildList', [
            { $lookup:{from:"applications", localField:"appBundle", foreignField:"appBundle", as:"application" } },
            { $match:{appBundle:body.appBundle} }
        ]).catch(err => {
            ctx.body = getRenderData({
                code: 1,
                data: err
            });
        });
        res.forEach(element => {
            element.appName = element.application[0].appName;
            element.appDesc = element.application[0].appDesc;
            element.appIcon = element.application[0].appIcon;
            element.application = null;
        });

        ctx.body = getRenderData({
            code: 0,
            data: res
        });
    }
}

async function getBuildsController(ctx) {
    if (ctx.path === '/getBuildCategory') {
        // 部门
        let departments = await MongoDB.find('departments').catch(err => {
            ctx.body = getRenderData({
                code: 1,
                data: err
            });
        });
        let res = new Array();
        // 每个部门
        for (let department of departments) {
            let applications = await MongoDB.find('applications', {appDepartment:department._id.toString()}).catch(err => {
                ctx.body = getRenderData({
                    code: 1,
                    data: err
                });
            });
            let dep = {
                departmentID: department._id,
                departmentName: department.departmentName,
                applications
            }
            res.push(dep);
        }

        ctx.body = getRenderData({
            code: 0,
            data: res
        });
    }
}

// async function getBuildsController(ctx) {
//     if (ctx.path === '/getFilterBuilds') {
//         let res = await MongoDB.aggregate('buildList', [
//             {
//                 $group : {
//                     _id:"$appDepartment",
//                     categorys:{
//                         $addToSet:{
//                             appResourceType:"$appResourceType",
//                         }
//                     },
//                 }
//             }
//         ]).catch(err => {
//             ctx.body = getRenderData({
//                 code: 1,
//                 data: err
//             });
//         });
//         // 继续组织数据
//         for (let element of res) {
//             // 查询departmentName
//             let deps = await MongoDB.find('departments', ObjectId(element._id));
//             element.departmentName = deps[0].departmentName;

//             // 查询categoryItems
//             for (let category of element.categorys) {
//                 let builds = await MongoDB.find('buildList', {
//                     appDepartment: element._id,
//                     appResourceType: category.appResourceType
//                 }).catch(err => {
//                     ctx.body = getRenderData({
//                         code: 1,
//                         data: err
//                     });
//                 });
//                 let one = new Array()
//                 let filter_build = new Array();
//                 builds.forEach(build => {
//                     let appName = build.appName;
//                     let appBundle = build.appBundle;
//                     console.log(build);
//                     if (one.indexOf(appBundle) == -1) {
//                         one.push(appBundle);
//                         filter_build.push({appBundle, appName});
//                     }
//                 });

//                 category.categoryItems = filter_build;
//             }
//         }

//         ctx.body = getRenderData({
//             code: 0,
//             data: res
//         });
//     }
// }

var port = process.env.PORT || '8100';//默认端口8100

async function uploadController(ctx) {
    if (ctx.path === '/createBuilds') {
        var uploadHost = `${ctx.protocol}://${ctx.request.host}/uploads/`;//图片可访问地址
        console.log(ctx.request);
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

            // APP下载地址
            let downloadUrl = `${uploadHost}${nextPath.slice(nextPath.lastIndexOf('/') + 1)}`;

            // 生成plist
            var data = fs.readFileSync(`${__dirname}/manifest_tmp.plist`, 'utf-8')
            var obj = plist.parse(data, 'utf-8')
            obj.items[0].assets[0].url = downloadUrl
            obj = plist.build(obj)
            fs.writeFile(`${__dirname}/../static/uploads/manifest.plist`, obj, err => {
                if (err) {
                    // 错误处理
                }
            })

            // APP安装地址
            let installUrl = `itms-services://?action=download-manifest&url=${uploadHost}manifest.plist`;

            // 直接扫码安装
            // 生成二维码
            var qr_svg = qr.image(installUrl, { type: 'png' });
            //将二维码输出到文件流，并生成png文件
            qr_svg.pipe(require('fs').createWriteStream(`${__dirname}/../static/uploads/qr.png`));

            // buildNum自增
            createCounter();

            // 数据入库 buildNum buildTimeota buildDesc appId appName appVersion appDownloadUrl appPlatform
            var body = ctx.request.body
            var buildNum = await getBuildNum()
            var myobj = {
                appBundle: body.appBundle,
                appVersion: body.appVersion,
                appDownloadUrl: downloadUrl,
                appInstallUrl: installUrl,
                appPlatform: body.appPlatform,
                appResourceType: body.appResourceType,
                buildNum: parseInt(buildNum)+1,
                buildTime: (new Date()).getTime(),
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
            resolve(res.buildNum);
        });
    });
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

module.exports = {getBuildListController, uploadController, getBuildsController, getFilterBuildListController};