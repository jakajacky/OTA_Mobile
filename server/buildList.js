/**
 * 构建列表
 */
const MongoDB = require('./mongodb');

async function getBuildListController(ctx) {
    if (ctx.path === '/getBuilds') {
        let res = await MongoDB.find('buildList', {appBundle: 'com.baijia.ei'}).catch(err => {
            ctx.body = getRenderData({
                code: 1,
                data: err
            });
        });
        ctx.body = getRenderData({
            code: 0,
            data: res
        });
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

module.exports = getBuildListController;