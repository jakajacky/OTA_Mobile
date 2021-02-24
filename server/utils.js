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

module.exports = {getRenderData}