const Q = require('q');
const __MOMENT__ = require('moment');
const __ERROR_CODE__ = require('../utility/error.code');
// const __LOGGER__ = require('../services/log4js.service').getLogger('parking.api.js');
/**
 *      MONGO
 */
const __MONGO_BASIC__ = require('../services/mongo/mongo.basic');
const __PARKING_STATUS__ = {
    WAITING_FOR_PARKING: 0,
    PARKING: 1,
    PAID: 2,
    EXIT: 3
};
const __PARKING_SCENE__ = {
    UNPAID: 0,
    PAID_NOT_TIME_OUT: 1,
    PAID_TIME_OUT: 2
};

/**
 * 构建传入参数
 * @param request
 * @returns {{authenticationDatabase: (string|*), user, password, databaseName: string, collectionName: string}}
 */
function constructParameter(request) {
    return {
        authenticationDatabase: request.authenticationDatabase || 'admin',          //  授权数据库
        user: request.user || 'butler',                                             //  角色
        password: request.password || 'BigUp@2019',                                 //  密码
        databaseName: 'parking',                                                    //  访问数据库
        collectionName: request.collectionName || 'record'                          //  collection
    }
}

/*************************************************************************************************************/
/*****************************************          停车场             ****************************************/
/*************************************************************************************************************/

/**
 * 记录车辆入场信息
 *
 * @param request
 * @returns {*|promise|C}
 */
function addEnterRecord(request) {
    const deferred = Q.defer();

    console.debug('====== addEnterRecord ======');
    //  构建参数
    request.collectionName = 'parking';
    const __PARAMETER__ = constructParameter(request);
    __PARAMETER__.findOne = {
        _id: request.parking_id
    };

    __MONGO_BASIC__.setupConnection({
        params: __PARAMETER__,
        result: {}
    })
        .then(__MONGO_BASIC__.findOne)
        .then(one => {
            "use strict";
            const next = Q.defer();
            if (one.result) {
                one.params.collectionName = 'record';
                one.params.findOneAndUpdateWhere = {
                    parkingId: request.parking_id,
                    carNumber: request.car_number,
                    status: __PARKING_STATUS__.PARKING
                };
                one.params.findOneAndUpdate = {
                    $set: {
                        parkingId: request.parking_id,
                        carNumber: request.car_number,
                        parkingName: one.result.parkingName,
                        inTime: request.in_time,
                        timeOut: one.result.timeOut || 0,
                        status: __PARKING_STATUS__.PARKING,
                        payable: 0,
                        paid: 0,
                        discount: 0,
                        payRecord: [],
                        coupons: []
                    }
                };
                one.params.findOneAndUpdateOptions = {
                    upsert: true,                                                              //  未找到添加
                    returnOriginal: false                                                      //  返回更新后数据集
                };
                next.resolve(one);
            } else {
                next.reject({
                    code: -400,
                    msg: '未找到车场信息'
                })
            }
            return next.promise;
        })
        .then(__MONGO_BASIC__.findOneAndUpdate)
        .then(__MONGO_BASIC__.close)
        .then(res => {
            "use strict";
            deferred.resolve({
                code: 0,
                msg: '成功记录用户入场信息',
                data: res.result.value
            })
        })
        .catch(err => {
            "use strict";
            deferred.reject(err)
        });

    return deferred.promise;
}

/**
 * 抬杆离场前检查停车费用是否有缴足，是否支付后未在规定时间内离场
 *
 * @param request
 * @returns {*}
 */
function checkParkingFee(request) {
    const deferred = Q.defer();

    console.debug('====== checkParkingFee ======', request.parking_id, request.car_number);
    //  构建参数
    const __PARAMETER__ = constructParameter(request);
    __PARAMETER__.findOne = {
        'parkingId': request.parking_id,
        'carNumber': request.car_number
    };
    __PARAMETER__.findOneProjection = {
        sort: {
            _id: -1
        }
    };

    __MONGO_BASIC__.setupConnection({
        params: __PARAMETER__,
        result: {}
    })
        .then(__MONGO_BASIC__.findOne)
        .then(__MONGO_BASIC__.close)
        .then(res => {
            "use strict";
            console.debug(res.result);
            if (res.result && (res.result.status === __PARKING_STATUS__.PARKING || res.result.status === __PARKING_STATUS__.PAID)) {
                deferred.resolve(res.result);
            } else {
                deferred.reject({
                    code: __ERROR_CODE__.notFoundError,
                    msg: '未找到停车记录'
                })
            }
        })
        .catch(err => {
            "use strict";
            deferred.reject(err)
        });

    return deferred.promise;
}

/**
 * 记录车辆离场信息
 *
 * @param request
 * @returns {*|promise|C}
 */
function addExitRecord(request) {
    const deferred = Q.defer();

    console.debug('====== addExitRecord ======');
    //  构建参数
    const __PARAMETER__ = constructParameter(request);
    __PARAMETER__.findOneAndUpdateWhere = {
        'parkingId': request.parking_id,
        'carNumber': request.car_number
    };
    __PARAMETER__.findOneAndUpdate = {
        $set: {
            status: __PARKING_STATUS__.EXIT,
            outTime: request.out_time
        }
    };
    __PARAMETER__.findOneAndUpdateOptions = {
        sort: {
            _id: -1
        },
        upsert: false,                                                             //  未找到添加
        returnOriginal: false                                                      //  返回更新后数据集
    };

    __MONGO_BASIC__.setupConnection({
        params: __PARAMETER__,
        result: {}
    })
        .then(__MONGO_BASIC__.findOneAndUpdate)
        .then(__MONGO_BASIC__.close)
        .then(res => {
            "use strict";
            console.debug(res.result);
            if (res.result.value && res.result.lastErrorObject.updatedExisting) {
                deferred.resolve({
                    code: __ERROR_CODE__.success,
                    data: res.result
                })
            } else {
                deferred.reject({
                    code: __ERROR_CODE__.notFoundError,
                    msg: '记录车辆离场信息失败'
                })
            }
        })
        .catch(err => {
            "use strict";
            deferred.reject(err)
        });

    return deferred.promise;
}

module.exports = {
    __PARKING_STATUS__: __PARKING_STATUS__,
    __PARKING_SCENE__: __PARKING_SCENE__,
    addEnterRecord: addEnterRecord,
    checkParkingFee: checkParkingFee,
    addExitRecord: addExitRecord
};
