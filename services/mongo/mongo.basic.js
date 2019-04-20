const Q = require('q');
const __UTIL__ = require('util');
const __MONGO_CONFIG__ = require('./mongo.config');
const __MONGO_CLIENT__ = require('mongodb').MongoClient;

/**
 * 连接 MongoDB
 * Use connect method to connect to the server
 * @param request
 * @returns {promise|jQuery.promise|*}
 */
function setupConnection(request) {
    const deferred = Q.defer();
    let url;

    console.debug('====== SETUP CONNECTION ======');
    url = __UTIL__.format('mongodb://%s:%s@%s:%s/%s',
        request.params.user,
        encodeURIComponent(request.params.password),
        __MONGO_CONFIG__.PARAMS.HOST,
        __MONGO_CONFIG__.PARAMS.PORT,
        // process.env['HOST'],
        // process.env['PORT'],
        request.params.authenticationDatabase
    );
    console.debug(url);
    __MONGO_CLIENT__.connect(url, {useNewUrlParser: request.useNewUrlParser || true}, function (err, db) {
        if (err) {
            console.error('Connection Error:' + err);
            deferred.reject(err);
        } else {
            deferred.resolve({
                mongo: db,
                params: request.params,
                result: request.result
            });
        }
    });

    return deferred.promise;
}

/**
 * 查询数据
 * 可以返回匹配条件的所有数据
 * 如果未指定条件，find() 返回集合中的所有数据
 * @param request
 * @returns {promise|jQuery.promise|*}
 */
function find(request) {
    const deferred = Q.defer();

    console.debug('====== Find ======');
    const name = request.params.databaseName;
    const database = request.mongo.db(name);

    database
        .collection(request.params.collectionName)
        .find(request.params.find || {}, request.params.findOptions || {})
        .toArray(function (err, res) {
            if (err) {
                console.error('find Error ===> ' + err);
                deferred.reject(err);
            } else {
                // console.debug(res);
                request.result = res;
                deferred.resolve(request);
            }
        });
    return deferred.promise;
}

/**
 * 查询数据
 * @param request
 * @returns {promise|jQuery.promise|*}
 */
function findOne(request) {
    const deferred = Q.defer();

    console.debug('====== FindOne ======');
    const name = request.params.databaseName;
    const database = request.mongo.db(name);

    database
        .collection(request.params.collectionName)
        .findOne(request.params.findOne, request.params.findOneProjection, function (err, res) {
            if (err) {
                console.error('findOne Error ===> ' + err);
                deferred.reject(err);
            } else {
                request.result = res;
                deferred.resolve(request);
            }
        });

    return deferred.promise;
}

/**
 * 找出记录并更新
 * db.collection.findOneAndUpdate(
 * <filter>,
 * <update>,
 *    {
          * projection: <document>,
          * sort: <document>,
          * maxTimeMS: <number>,
          * upsert: <boolean>,
          * returnNewDocument: <boolean>,
          * collation: <document>,
          * arrayFilters: [ <filterdocument1>, ... ]
 *    }
 * )
 * @param request
 * @returns {promise|jQuery.promise|*}
 */
function findOneAndUpdate(request) {
    const deferred = Q.defer();
    const name = request.params.databaseName;
    const database = request.mongo.db(name);
    console.debug('====== FindOneAndUpdate ======');
    database
        .collection(request.params.collectionName)
        .findOneAndUpdate(request.params.findOneAndUpdateWhere, request.params.findOneAndUpdate, request.params.findOneAndUpdateOptions, function (err, res) {
            if (err) {
                console.error('findOnaAndUpdate Error ===> ' + err);
                deferred.reject(request);
            } else {
                request.result = res;
                deferred.resolve(request);
            }
        });
    return deferred.promise;
}

/**
 * 关闭连接
 * @param request
 * @returns {promise|jQuery.promise|*}
 */
function close(request) {
    console.debug('====== CLOSE CONNECTION ======');
    request.mongo.close();
    return Q(request);
}

module.exports = {
    setupConnection: setupConnection,
    close: close,
    find: find,
    findOne: findOne,
    findOneAndUpdate: findOneAndUpdate
};
