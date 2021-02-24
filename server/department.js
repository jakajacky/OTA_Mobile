/**
 * 部门列表
 */
var fs = require('fs');//文件模块
const MongoDB = require('./mongodb');
var {getRenderData} = require('./utils');

const collection = 'departments';
async function createDepartmentController(ctx) {
    if (ctx.path === '/createDepartments') {
        // departmentID departmentName
        let body = ctx.request.body;
        console.log(body);
        let departmentName = body.departmentName;
        let res = await MongoDB.insert(collection, {departmentName}).catch(err => {
            ctx.body = getRenderData({
                code: 0,
                data: err
            });
        });
        let data = {
            departmentID: res._id,
            departmentName: res.departmentName,
        }
        ctx.body = getRenderData({
            code: 0,
            data
        });
    }
}

async function getDepartmentsController(ctx) {
    if (ctx.path === '/getDepartments') {

    }
}
module.exports = {createDepartmentController, getDepartmentsController};
