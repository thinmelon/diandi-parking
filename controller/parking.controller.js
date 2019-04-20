const Q = require('q');
const __UTIL__ = require('util');
const __MOMENT__ = require('moment');
const __ERROR_CODE__ = require('../utility/error.code');
// const __LOGGER__ = require('../services/log4js.service').getLogger('parking.controller.js');
/**
 *      DATABASE
 */
const __IDENTITY_DATABASE__ = require('../database/identity.api');
const __PARKING_DATABASE__ = require('../database/parking.api');
/**
 *      微信公众号
 */
const __SERVICE_WECHAT_OFFICIAL_ACCOUNT__ = require('../services/wechat.official.account/wechat.official.account.service');
const __SERVICE_WECHAT_OFFICIAL_ACCOUNT_CONFIG__ = require('../services/wechat.official.account/wechat.official.account.config');
/**
 *      阿里云开放平台
 */
const __ALIYUN_OSS_SERVICE__ = require('../services/aliyun.oss/aliyun.oss.service');
/**
 *      蚂蚁金服开放平台 -   停车缴费
 */
const __ALI_PAY_PARKING_CONFIG__ = require('../services/alipay.parking/alipay.parking.config');
const __ALI_PAY_PARKING_SERVICE__ = require('../services/alipay.parking/alipay.parking.service');

/**
 * 封装应用私钥及支付宝公钥的获取方式
 * @param request
 * @returns {Promise.<TResult>}
 */
function getAlipayInfoWrapper(request) {
    let userId, appPrivateKey, alipayPublicKeyPath;

    console.info('========   getAlipayInfoWrapper    ========', request.appid);
    return __IDENTITY_DATABASE__.getAuthorizerPayInfo({
        appid: request.appid                                   //  通过APPID获取授权方支付信息
    })
        .then(keys => {
            "use strict";
            userId = keys.data.user_id;
            alipayPublicKeyPath = keys.data.alipayPublicKey;        //  暂存支付宝公钥文件路径
            return Q({
                context: request.context,
                options: {
                    resource: keys.data.appPrivateKey
                }
            });
        })
        .then(__ALIYUN_OSS_SERVICE__.setUpOssClient)
        .then(__ALIYUN_OSS_SERVICE__.getBuffer)
        .then(privateKey => {
            "use strict";
            appPrivateKey = privateKey.content.toString();          //  从OSS上获取应用私钥
            return Q({
                context: request.context,
                options: {
                    resource: alipayPublicKeyPath
                }
            })
        })
        .then(__ALIYUN_OSS_SERVICE__.setUpOssClient)
        .then(__ALIYUN_OSS_SERVICE__.getBuffer)
        .then(alipayPublicKey => {                                              //  从OSS上获取支付宝公钥
            "use strict";
            return Q({
                userId: userId,
                privateKey: appPrivateKey,                                      //  应用私钥
                alipayPublicKey: alipayPublicKey.content.toString()             //  支付宝公钥，用于开放平台返回值的验签
            })
        })
}

/**
 * 查询停车场服务商的信息
 *
 * @param appId
 * @param context
 * @returns {Promise.<TResult>}
 */
function queryMerchant(appId, context) {
    return getAlipayInfoWrapper({
        appid: appId,
        context: context
    })
        .then(info => {
            "use strict";
            return Q({
                params: {
                    appid: appId,                                                   //  APPID
                    privateKey: info.privateKey,                                    //  应用私钥
                    alipayPublicKey: info.alipayPublicKey                           //  支付宝公钥，用于开放平台返回值的验签
                }
            })
        })
        .then(__ALI_PAY_PARKING_SERVICE__.setUpAlipayClient)
        .then(__ALI_PAY_PARKING_SERVICE__.queryMerchant);
}

/**
 * 车辆入场信息同步
 *
 * @param request
 * @returns {Promise.<TResult>}
 */
function syncParkingEnterInfo(request) {
    let parking, parkingName, openid;

    return getAlipayInfoWrapper({
        appid: request.appId,
        context: request.context
    })
        .then(info => {
            "use strict";
            return Q({
                params: {
                    appid: request.appId,                                                   //  APPID
                    privateKey: info.privateKey,                                            //  应用私钥
                    alipayPublicKey: info.alipayPublicKey,                                  //  支付宝公钥，用于开放平台返回值的验签
                    parking_id: request.parkingId,
                    car_number: request.carNumber,
                    in_time: __MOMENT__().utcOffset(480).format('YYYY-MM-DD HH:mm:ss')
                }
            })
        })
        .then(__ALI_PAY_PARKING_SERVICE__.setUpAlipayClient)                                //  初始化ALIPAY SDK
        .then(__ALI_PAY_PARKING_SERVICE__.syncParkingEnterInfo)                             //  同步入场信息至支付宝停车缴费平台
        .then(info => {
            'use strict';
            parking = {
                parking_id: info.params.parking_id,
                car_number: info.params.car_number,
                in_time: info.params.in_time
            };
            return Q(parking);
        })
        .then(__PARKING_DATABASE__.addEnterRecord)                                          //  添加入场记录至MongoDB
    // .then(record => {
    //     parkingName = record.data.parkingName;                                          //  停车场名称
    //     return Q({
    //         appid: __SERVICE_WECHAT_OFFICIAL_ACCOUNT_CONFIG__.__APPID__,
    //         carNumber: parking.car_number
    //     })
    // })
    // .then(__IDENTITY_DATABASE__.getUserByCarNumber)
    // .then(user => {
    //     openid = user.data;
    //     console.debug('OPENID => ', openid);
    //     return Q({});
    // })
    // .then(__SERVICE_WECHAT_OFFICIAL_ACCOUNT__.getAccessToken)
    // .then(token => {
    //     "use strict";
    //     const defaultColor = '#000', markColor = '#FF9800';
    //     return Q({
    //         access_token: token.access_token,
    //         toUser: openid,
    //         templateId: __SERVICE_WECHAT_OFFICIAL_ACCOUNT_CONFIG__.__MSG_CAR_ENTER_TEMPLATE_ID__,
    //         url: __UTIL__.format(__ALI_PAY_PARKING_CONFIG__.__QR_CODE_URL__, parking.parking_id),
    //         data: {
    //             first: {
    //                 "value": '您好,您的爱车已经进入停车场，感谢您使用点滴停车！',
    //                 "color": defaultColor
    //             },
    //             keyword1: {
    //                 "value": parking.in_time,
    //                 "color": defaultColor
    //             },
    //             keyword2: {
    //                 "value": parking.car_number,
    //                 "color": markColor
    //             },
    //             keyword3: {
    //                 "value": parkingName,
    //                 "color": defaultColor
    //             },
    //             remark: {
    //                 "value": '先缴费后离场，点击查询车费详情。',
    //                 "color": markColor
    //             }
    //         }
    //     })
    // })
    // .then(__SERVICE_WECHAT_OFFICIAL_ACCOUNT__.sendTemplateMessage)      //  推送
}

/**
 * 车辆离场信息同步
 *
 * @param request
 * @param response
 */
function syncParkingExitInfo(request) {
    let exitInfo, outTime;

    return __PARKING_DATABASE__.checkParkingFee({                   //  parking_id car_number 判断 payable 是否等于 paid + discount
        parking_id: request.parkingId,
        car_number: request.carNumber
    })
        .then(fee => {
            "use strict";
            const deferred = Q.defer();
            let scene, payable;

            if (fee.status === __PARKING_DATABASE__.__PARKING_STATUS__.PAID) {          //  用户已付款
                console.debug('[ 当前时间 ] ', __MOMENT__(Date.now()).format('YYYY-MM-DD HH:mm:ss'));
                console.debug('[ 支付时间 ] ', fee.payTime);
                const duration = parseInt(__MOMENT__.duration(__MOMENT__(Date.now()) - __MOMENT__(fee.payTime), 'ms').as('minutes'));
                console.debug('[ 距支付完成已过时间（分钟） ] ', duration);
                console.debug('[ 超时时间（分钟） ] ', fee.timeOut);
                if (duration < parseInt(fee.timeOut)) {                                                 //  当前时间与最后付款时间的时间间隔少于 time_out
                    scene = __PARKING_DATABASE__.__PARKING_SCENE__.PAID_NOT_TIME_OUT;                   //  支付完成后未超时
                } else {
                    scene = __PARKING_DATABASE__.__PARKING_SCENE__.PAID_TIME_OUT;                       //  超过支付完成后的离场时间，重新计算费用
                }
            } else {
                scene = __PARKING_DATABASE__.__PARKING_SCENE__.UNPAID;                                  // 用户未付款，计算停车费用
            }

            console.log('[ 当前场景 ]', scene);
            if (scene === __PARKING_DATABASE__.__PARKING_SCENE__.PAID_NOT_TIME_OUT) {
                payable = fee.payable;
            } else {
                payable = __ALI_PAY_PARKING_SERVICE__.calculateParkingFee(fee.inTime);
            }
            console.debug('[ 计算停车费用 ] ', payable, fee.paid, fee.discount);
            if (payable === fee.paid + fee.discount) {                                                  //  如果无需缴纳停车费用，则放行
                deferred.resolve({
                    code: __ERROR_CODE__.success,
                    msg: '满足离场条件',
                    appid: request.appId,
                    context: request.context
                });
            } else {
                if (scene === __PARKING_DATABASE__.__PARKING_SCENE__.PAID_TIME_OUT) {                   //  支付后未在规定时间内离场
                    deferred.reject({
                        code: __ERROR_CODE__.parkingTimeoutError,
                        msg: '支付后未在规定时间内离场，请缴纳剩余停车费'
                    });
                } else {
                    deferred.reject({
                        code: __ERROR_CODE__.parkingFeeUnpaidError,
                        msg: '请缴纳停车费后再离场'
                    });
                }
            }

            return deferred.promise;
        })
        .then(getAlipayInfoWrapper)
        .then(info => {
            "use strict";
            outTime = __MOMENT__().utcOffset(480).format('YYYY-MM-DD HH:mm:ss');
            return Q({
                params: {
                    appid: request.appId,                                           //  APPID
                    privateKey: info.privateKey,                                    //  应用私钥
                    alipayPublicKey: info.alipayPublicKey,                          //  支付宝公钥，用于开放平台返回值的验签
                    parking_id: request.parkingId,
                    car_number: request.carNumber,
                    out_time: outTime
                }
            })
        })
        .then(__ALI_PAY_PARKING_SERVICE__.setUpAlipayClient)
        .then(__ALI_PAY_PARKING_SERVICE__.syncParkingExitInfo)
        .then(info => {
            'use strict';
            exitInfo = info;
            return Q({
                parking_id: info.params.parking_id,
                car_number: info.params.car_number,
                out_time: info.params.out_time
            });
        })
        .then(__PARKING_DATABASE__.addExitRecord);
}

module.exports = {
    queryMerchant: queryMerchant,
    syncParkingEnterInfo: syncParkingEnterInfo,
    syncParkingExitInfo: syncParkingExitInfo
};

// const __PATH__ = require('path');
// const __FILE_SYSTEM__ = require('fs');
//
// let tokenFilePath = __PATH__.join(__dirname, 'wechat.access_token.json');
//
// __LOGGER__.info('============== LOGGER ================')
// console.debug(tokenFilePath);
// if (__FILE_SYSTEM__.existsSync(tokenFilePath)) {
//     const token = JSON.parse(__FILE_SYSTEM__.readFileSync(tokenFilePath));
//     console.debug(token);
// }
// console.log('============== END ================')

__SERVICE_WECHAT_OFFICIAL_ACCOUNT__.getAccessToken()
    .then(token => {
        console.log(token);
    })
    .catch(err => {
        console.error(err)
    });

// queryMerchant('2019012263122350', {})
//     .then(res => {
//         console.log(res)
//     })
//     .catch(err => {
//         console.error(err)
//     })

// syncParkingExitInfo({
//     appId: '2019012263122350',
//     parkingId: 'PI1548752295451641803',
//     carNumber: '闽BW1533',
//     context: {}
// })
//     .then(res => {
//         console.info(res);
//     })
//     .catch(exception => {
//         console.error(exception);
//     });

