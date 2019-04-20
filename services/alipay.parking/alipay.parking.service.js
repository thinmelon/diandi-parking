const Q = require('q');
const __MOMENT__ = require('moment');
// const __LOGGER__ = require('../log4js.service').getLogger('alipay.parking.service.js');
/**
 *      蚂蚁金服开放平台
 */
const __ALI_PAY_SDK__ = require('alipay-sdk').default;
const __ALI_PAY_PARKING_CONFIG__ = require('./alipay.parking.config');

/**
 * 初始化支付宝SDK
 * @param request
 * @returns {*}
 */
function setUpAlipayClient(request) {
    /**
     * 1. 实例化 SDK
     * const alipaySdk = new AlipaySdk(AlipaySdkConfig);
     * AlipaySdkConfig 配置项
     *      -   必选
     *      appId: String 开放平台上创建应用时生成的 appId
     *      privateKey: String 应用私钥
     *      -   可选
     *      alipayPublicKey: String 支付宝公钥，用于开放平台返回值的验签
     *      timeout: Number 网关超时时间，单位毫秒，默认 5000
     *      camelcase: Boolean 是否把服务端返回的数据中的字段名从下划线转为驼峰，默认 true
     */
    console.info('====== setupClient | APPID ======', request.params.appid);
    const alipaySdk = new __ALI_PAY_SDK__({
        appId: request.params.appid,
        privateKey: request.params.privateKey,
        alipayPublicKey: request.params.alipayPublicKey,
        // gateway: process.env['GATEWAY']
        gateway: __ALI_PAY_PARKING_CONFIG__.__GATE_WAY__.ALIPAY                     //  支付宝网关
    });

    return Q({
        alipay: alipaySdk,
        params: request.params,
        result: request.result || {}
    });
}

/**
 * ISV系统配置信息查询
 *
 * @param request
 * @returns {*}
 */
function queryMerchant(request) {
    const deferred = Q.defer();

    console.debug('====== queryMerchant ======');
    request.alipay.exec(
        // process.env['API'],
        __ALI_PAY_PARKING_CONFIG__.__METHOD__.ALIPAY_PARKING_CONFIG_QUERY,
        {},
        {}
    )
        .then(result => {                   // result 为 form 表单
            // console.info(result);
            request.result = result;
            deferred.resolve(request);
        })
        .catch(err => {
            console.error(err);
            deferred.reject(err);
        });

    return deferred.promise;
}

/**
 *  用户车辆驶入停车场车辆信息同步
 *
 * 【场景】在用户驾车进入停车场，通过支付宝停车平台首页查询停车记录的场景下
 *  ISV需要将用户车辆的入场信息同步到支付宝，以便之后用户通过支付宝停车平台首页查询停车记录并判别应该跳转的ISV停车费展示页面的链接。
 *
 * @param request
 * @returns {*}
 */
function syncParkingEnterInfo(request) {
    const deferred = Q.defer();

    console.debug('====== syncParkingEnterInfo ======');
    request.alipay.exec(
        __ALI_PAY_PARKING_CONFIG__.__METHOD__.ALIPAY_PARKING_ENTERINFO_SYNC,
        {
            'bizContent': {
                parkingId: request.params.parking_id,
                carNumber: request.params.car_number,
                inTime: request.params.in_time
            }
        },
        {}
    )
        .then(result => {                   // result 为 form 表单
            console.info(result);
            if (result.code === '10000') {
                request.result = result;
                deferred.resolve(request);
            } else {
                deferred.reject(result);
            }
        })
        .catch(err => {
            console.error(err);
            deferred.reject(err);
        });

    return deferred.promise;
}

function calculateParkingFee(request) {
    console.debug('====== calculateParkingFee ======', request);
    // switch (request.feeCategory) {
    //     case 0:             //  0： 不收费
    //         return 0;
    //     case 1:             //  1： 按次收费
    //         return request.payPerView;              //  返回单次收费金额，以元为单位
    //     case 2:             //  2： 按时收费
    //         const now = __MOMENT__(Date.now());
    //         __LOGGER__.debug('[ NOW ]', now);
    //         __LOGGER__.debug('[ IN TIME ]', __MOMENT__(request.inTime));
    //         const duration = parseInt(__MOMENT__.duration(now - __MOMENT__(request.inTime), 'ms').as('hours'));
    //         __LOGGER__.debug('入场时长（小时）：', duration);
    //         const freeTime = __MOMENT__(request.inTime).add(request.freeTimePeriod, 'm');              //  免费的时间结点
    //         __LOGGER__.debug('免费时间结点：', freeTime, now.isBefore(freeTime));                       //  是否超过免费时间段
    //         if (now.isBefore(freeTime)) {                                                               //  免费时间段
    //             return 0;
    //         } else {
    //             const firstHours = Math.floor(__MOMENT__.duration(__MOMENT__(request.inTime).add(request.freeTimePeriod, 'm').add(request.firstFewTime, 'h') - __MOMENT__(request.inTime), 'ms').as('hours'));
    //             const firstFewTime = __MOMENT__(request.inTime).add(firstHours, 'h');                       //  免费时间段 + 开始计费时间段（以小时计）
    //             __LOGGER__.debug('是否在免费与初始计费的时间段内：', now.isBetween(freeTime, firstFewTime));
    //             if (now.isBetween(freeTime, firstFewTime)) {
    //                 return request.firstFewTimeFee;                                                         //  前XX小时收费金额
    //             } else {
    //                 let leftDays, leftHours, fee;
    //                 leftHours = duration % 24;                                                               //  计算停车期间最后一天的费用
    //                 const circle = leftHours - firstHours;
    //                 const interval = Math.floor(circle / request.circleHours) + 1;
    //                 fee = interval * request.feePerInterval + request.firstFewTimeFee;
    //                 __LOGGER__.debug('当日时长，循环计费时长，当日间隔数，当日金额', leftHours, circle, interval, fee);
    //                 fee = fee > request.mostFeeOneDay ? request.mostFeeOneDay : fee;
    //                 if (duration >= 24 * 3) {                                                               //  超过三天（包括三天）每天按最高48元计算
    //                     leftDays = duration > 48 ? Math.floor((duration - 48) / 24) : 0;
    //                     return request.mostFeeOneDay + request.mostFeeTwoDays + (leftDays * request.mostFeeBeyondThreeDays) + fee;
    //                 } else {
    //                     return (Math.floor(duration / 24) >= 1 ? 1 : 0 ) * request.mostFeeOneDay + Math.floor(duration / 48) * request.mostFeeTwoDays + fee;
    //                 }
    //             }
    //         }
    //         break;
    //     default:
    //         throw new Error('错误的收费类别');
    // }
    return 0;
}

/**
 *  车辆离场信息同步
 *
 *  在用户驾车离开停车场的场景下，ISV需要将用户的车辆离场信息同步到支付宝
 *  完成标识该车辆是否离场的状态，以便用户可以在停车平台查询到车辆历史停车信息。
 * @param request
 * @returns {*}
 */
function syncParkingExitInfo(request) {
    const deferred = Q.defer();

    console.debug('====== syncParkingExitInfo ======');
    request.alipay.exec(
        __ALI_PAY_PARKING_CONFIG__.__METHOD__.ALIPAY_PARKING_EXITINFO_SYNC,
        {
            'bizContent': {
                parkingId: request.params.parking_id,
                carNumber: request.params.car_number,
                outTime: request.params.out_time
            }
        },
        {}
    )
        .then(result => {
            console.info(result);
            if (result.code === '10000') {
                request.result = result;
                deferred.resolve(request);
            } else {
                deferred.reject(result);
            }
        })
        .catch(err => {
            // console.error(err);
            deferred.reject(err);
        });

    return deferred.promise;
}

module.exports = {
    setUpAlipayClient: setUpAlipayClient,
    queryMerchant: queryMerchant,
    syncParkingEnterInfo: syncParkingEnterInfo,
    syncParkingExitInfo: syncParkingExitInfo,
    calculateParkingFee: calculateParkingFee
};
