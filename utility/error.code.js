module.exports = {
    /**
     * 成功
     */
    success: 0,
    /**
     * 执行任务失败
     */
    failed: -100,
    badParameter: -101,
    /**
     * 数据库连接失败
     */
    databaseConnectError: -200,
    /**
     * 短信校验失败
     */
    smsCheckError: -300,
    smsTimeoutError: -301,
    /**
     * 查询结果不存在
     */
    notFoundError: -400,
    /**
     * 重复提交
     */
    resubmitError: -500,
    /**
     * 出现未知错误
     */
    unknownError: -600,
    /**
     * 预支付结果签名验证错误
     */
    checkSignError: -700,
    notEnoughBalance: -701,
    /**
     * 登录态失效
     */
    loginStatusError: -800,
    /**
     * 库存不足
     * 提交的库存数量有误
     */
    outOfStockError: -900,
    wrongStockSubmitError: -901,
    /**
     * 绑定手机号失败
     */
    bindMobileError: -1000,
    /**
     * 与预期数值不符
     */
    mismatchError: -1100,
    /**
     * 模板已失效
     */
    templateTimeoutError: -1200,
    /**
     * 停车缴费
     */
    parkingTimeoutError: -1300,
    parkingFeeUnpaidError: -1301,
    parkingRecordNotFoundError: -1302,
    zeroParkingFeeError: -1303,
    rollingTimeoutError: -1304,
    parkingTradeCanceled: -1305,
    parkingPrepayError: -1306,
    unknownClientError: -1307,
    illegalParkingFeeError: -1308,
    noPaymentWithCoupon: -1309,
    consumeParkingCouponError: -1310
};
