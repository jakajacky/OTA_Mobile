/**
 * 封装MongoDB操作API
 */
var path = require('path');
var fs = require('fs');//文件模块
var MongoClient = require('mongodb').MongoClient;
const { resolve } = require('path');
const { rejects } = require('assert');

var url = "mongodb://localhost:27017"; // 数据库
var dbName = 'ota'

class MongoDB {
    static getInstance() {
        // 单例，防止多次实例化，实例不共享
        if (!MongoDB.instance) {
            MongoDB.instance = new MongoDB();
        }
        return MongoDB.instance;
    }

    constructor() {
        this.dbClient = ''; // db对象
        this.connect();
    }

    /**
     * 连接数据库
     */
    connect() {
        const that = this
        return new Promise((resolve, reject) => {
            if (!this.dbClient) {
                // 创建并连接mongoDB数据库
                MongoClient.connect(`${url}/${dbName}`, { useUnifiedTopology: true }, function(err, db) {
                    if (err) {
                        console.log("数据库连接失败!");
                        reject(err);
                    }
                    else {
                        console.log("数据库已创建并连接成功!");
                        that.dbClient = db.db(dbName);
                        resolve(that.dbClient);
                    }
                });
            }
            else {
                resolve(this.dbClient);
            }
        });
    }

    /**
     * 新增操作
     * @param {string} collection - 集合
     * @param {object} json - 新增条目
     */
    insert(collection, json) {
        return new Promise((resolve, reject) => {
            this.connect().then(db => {
                db.collection(collection).insertOne(json, function(err, res) {
                    if (err) {
                        // console.log(err);
                        reject(err);
                    }
                    else {
                        // console.log(res.ops[0]);
                        resolve(res.ops[0]);
                    }
                });
            })
        });
    }

    /**
     * 聚合查询 实现group by
     * @param {*} collection
     * @param {*} json
     */
    aggregate(collection, json) {
        return new Promise((resolve, reject) => {
            this.connect().then(db => {
                let res = db.collection(collection).aggregate(json);
                res.toArray((err, docs) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(docs);
                    }
                })
            })
        });
    }

    /**
     * 查询操作
     * @param {string} collection - 集合
     * @param {object} json - 查询条件
     */
    find(collection, json) {
        return new Promise((resolve, reject) => {
            this.connect().then(db => {
                let res = db.collection(collection).find(json);
                res.toArray((err, docs) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(docs);
                    }
                })
            })
        });
    }

    /**
     * 查询并修改
     * @param {string} collection - 集合
     * @param {object} filterJson - 查询条件
     * @param {object} modifyJson - 修改条目
     */
    findAndModify(collection, filterJson, modifyJson) {
        return new Promise((resolve, reject) => {
            this.connect().then(db => {
                db.collection(collection).findOneAndUpdate(filterJson, modifyJson, {}, (err, res) => {
                    console.log(res);
                    if (err) {
                        reject(err);
                    } else {
                        resolve(res.value);
                    }
                });
            })
        });
    }
}

module.exports = MongoDB.getInstance();