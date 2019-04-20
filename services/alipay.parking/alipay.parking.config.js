/**
 *
 *      支付宝 - 停车缴费
 *
 */
const __ALIPAY_PARKING_APPID__ = '2019012263122350';
const __SANDBOX_APPID__ = '2016092100559091';

const __GATE_WAY__ = {
    ALIPAY: 'https://openapi.alipay.com/gateway.do',                                        //  支付宝网关
    SANDBOX: 'https://openapi.alipaydev.com/gateway.do'                                     //  沙箱环境网关
};

const __METHOD__ = {
    ALIPAY_PARKING_CONFIG_SET: 'alipay.eco.mycar.parking.config.set',   //  商户结合自身的系统进行停车业务的系统配置
    ALIPAY_PARKING_CONFIG_QUERY: 'alipay.eco.mycar.parking.config.query',   //  商户可以在配置系统信息前查询当前已经配置好的系统信息，确认系统配置是否正确
    ALIPAY_PARKING_LOTINFO_CREATE: 'alipay.eco.mycar.parking.parkinglotinfo.create',   //  用于在停车平台注册停车场信息
    ALIPAY_PARKING_LOTINFO_UPDATE: 'alipay.eco.mycar.parking.parkinglotinfo.update',   //  用于在停车平台修改停车场信息
    ALIPAY_PARKING_LOTINFO_QUERY: 'alipay.eco.mycar.parking.parkinglotinfo.query',   //  停车场信息查询
    ALIPAY_PARKING_ENTERINFO_SYNC: 'alipay.eco.mycar.parking.enterinfo.sync',   //  上传车辆驶入信息，上传信息通过该接口提交到支付宝，支付宝返回对应的信息
    ALIPAY_PARKING_EXITINFO_SYNC: 'alipay.eco.mycar.parking.exitinfo.sync',   //  上传车辆驶出信息，上传信息通过该接口提交到支付宝，支付宝返回对应的信息
    ALIPAY_PARKING_VEHICLE_QUERY: 'alipay.eco.mycar.parking.vehicle.query',   //  商户通过接口调用，获取用户车牌信息
    ALIPAY_PARKING_ORDER_SYNC: 'alipay.eco.mycar.parking.order.sync',   //  商户通过接口调用，回传订单信息给停车平台
    ALIPAY_PARKING_ORDER_UPDATE: 'alipay.eco.mycar.parking.order.update',   //  商户通过接口调用，回传订单状态给停车平台
    ALIPAY_PARKING_USERPAGE_QUERY: 'alipay.eco.mycar.parking.userpage.query'   //  当用户要查询停车费用进行缴费时，支付宝会将用户请求分发到ISV的页面接口上
};

/**
 * 服务商PID
 */
const __PROVIDER_ID__ = '2088221729274411';
/**
 * 支付完成后返回地址
 */
const __RETURN_URL__ = 'https://www.pusudo.cn/parking/wap/paid';           //  手机网站支付
/**
 * 支付完成后由支付宝服务器主动通知商户服务器里指定的页面http/https路径
 */
const __NOTIFY_URL__ = 'https://www.pusudo.cn/parking/payment/alipay';
/**
 * 扫描二维码后的跳转链接
 */
const __QR_CODE_URL__ = 'https://www.pusudo.cn/parking/init?parkingId=%s';
/**
 * 取消支付后的退出页面
 */
const __QUIT_URL__ = 'http://www.pusudo.cn';

const __CITY_CODE__ = {
    PUTIAN: '350300'
};
/**
 * 用户关注微信公众号后，系统自动下发的图文信息 media_id
 */
const __WX_SUBSCRIBE_MEDIA_ID__ = 'n584HX_l4p6cYQBacvvsy3UkKes2h3mkxhk2FAFdlQE';

module.exports = {
    __PROVIDER_ID__: __PROVIDER_ID__,
    __ALIPAY_PARKING_APPID__: __ALIPAY_PARKING_APPID__,
    __SANDBOX_APPID__: __SANDBOX_APPID__,
    __GATE_WAY__: __GATE_WAY__,
    __METHOD__: __METHOD__,
    __RETURN_URL__: __RETURN_URL__,
    __NOTIFY_URL__: __NOTIFY_URL__,
    __QR_CODE_URL__: __QR_CODE_URL__,
    __QUIT_URL__: __QUIT_URL__,
    __CITY_CODE__: __CITY_CODE__,
    __WX_SUBSCRIBE_MEDIA_ID__: __WX_SUBSCRIBE_MEDIA_ID__
};
