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
        let departmentName = body.departmentName;
        let res = await MongoDB.insert(collection, {departmentName}).catch(err => {
            ctx.body = getRenderData({
                code: 0,
                data: err
            });
        });
        if (res) {
            let data = {
                departmentID: res._id,
                departmentName: res.departmentName,
            }
            ctx.body = getRenderData({
                code: 200,
                data
            });
        }
    }
}

async function getDepartmentsController(ctx) {
    if (ctx.path === '/getDepartments') {
        let body = ctx.request.body;
        let departmentID = body.departmentID;
        let res = await MongoDB.find(collection, {departmentID}).catch(err => {
            ctx.body = getRenderData({
                code: 0,
                data: err
            });
        });
        if (res) {
            let datas = Array()
            res.forEach(element => {
                let data = {
                    departmentID: element._id,
                    departmentName: element.departmentName,
                }
                datas.push(data);
            });
            ctx.body = getRenderData({
                code: 200,
                data: datas
            });
        }
    }
}
module.exports = {createDepartmentController, getDepartmentsController};
