const Q = require('q');
const __MOMENT__ = require('moment');
const __ERROR_CODE__ = require('../utility/error.code');
/**
 *      MONGO
 */
const __MONGO_BASIC__ = require('../services/mongo/mongo.basic');

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
        databaseName: 'identity',                                                   //  访问数据库
        collectionName: request.collectionName || 'user'                            //  collection
    }
}

/**
 * 获取某个支付账户信息（简易版）
 * 后端收到微信服务器的支付结果通知后，使用APPID获取支付账户信息
 * 不对外开放接口
 * @param request
 * @returns {*|C|promise}
 */
function getAuthorizerPayInfo(request) {
    const deferred = Q.defer();

    console.debug('====== getAuthorizerPayInfo ======', request.appid);
    //  构建参数
    request.collectionName = 'authorizer';
    const __PARAMETER__ = constructParameter(request);
    __PARAMETER__.findOne = {                                                       // 查询条件
        'appid': request.appid                                                      // APPID
    };
    __PARAMETER__.findOneProjection = {
        projection: {
            _id: 0,
            'manager': 1,
            'wxpay': 1,
            'alipay': 1
        }
    };

    __MONGO_BASIC__.setupConnection({
        params: __PARAMETER__,
        result: {}
    })
        .then(__MONGO_BASIC__.findOne)                                               //  授权方的支付信息
        .then(__MONGO_BASIC__.close)
        .then(authorizer => {
            "use strict";
            if (authorizer.result && (authorizer.result.wxpay || authorizer.result.alipay)) {
                deferred.resolve({
                    code: 0,
                    data: {
                        user_id: authorizer.result.manager,
                        mchid: authorizer.result.wxpay ? authorizer.result.wxpay.mchid : '',
                        apiKey: authorizer.result.wxpay ? authorizer.result.wxpay.apiKey : '',
                        targetFolder: authorizer.result.wxpay ? authorizer.result.wxpay.targetFolder : '',
                        certFilePath: authorizer.result.wxpay ? authorizer.result.wxpay.certFilePath : '',
                        appPrivateKey: authorizer.result.alipay ? authorizer.result.alipay.privateKey : '',
                        appPublicKey: authorizer.result.alipay ? authorizer.result.alipay.publicKey : '',
                        alipayPublicKey: authorizer.result.alipay ? authorizer.result.alipay.alipayPublicKey : ''
                    }
                });
            } else {
                deferred.reject({
                    code: -400,
                    msg: '尚未进行支付配置，请联系官方客服'
                });
            }
        })
        .catch(err => {
            "use strict";
            deferred.reject(err)
        });

    return deferred.promise;
}

/**
 *  通过车牌号获取用户的微信账号openid
 *
 * @param request
 * @returns {*|C|promise}
 */
function getUserByCarNumber(request) {
    const deferred = Q.defer();

    console.debug('====== getUserByCarNumber ======', request.carNumber, request.appid);
    const __PARAMETER__ = constructParameter(request);              //  构建参数
    __PARAMETER__.find = {                          //  查询条件
        'carNumber': request.carNumber,
        'wechat.appid': request.appid
    };
    __PARAMETER__.findOptions = {
        projection: {
            _id: 0,
            'lastLogin': 1,
            'wechat.openid': 1
        }
    };

    __MONGO_BASIC__.setupConnection({
        params: __PARAMETER__,
        result: {}
    })
        .then(__MONGO_BASIC__.find)                      //  用户信息查询
        .then(__MONGO_BASIC__.close)
        .then(user => {
            "use strict";
            // console.debug(user.result);
            let openid = '';                                    //  openid
            let loginTime = '1900-01-01';                       //  起始比较时间
            user.result.map(item => {
                if (__MOMENT__(loginTime).isBefore(item.lastLogin)) {
                    loginTime = item.lastLogin;
                    openid = item.wechat.openid;
                }
            });
            if (openid === '') {
                deferred.reject({
                    code: __ERROR_CODE__.notFoundError,
                    msg: '该车牌号尚未绑定微信账号'
                });
            } else {
                deferred.resolve({
                    code: __ERROR_CODE__.success,
                    data: openid
                });
            }
        })
        .catch(err => {
            "use strict";
            deferred.reject(err)
        });

    return deferred.promise;
}

module.exports = {
    getAuthorizerPayInfo: getAuthorizerPayInfo,
    getUserByCarNumber: getUserByCarNumber
};
