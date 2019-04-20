const __PARKING_CONTROLLER__ = require('/mnt/parking/diandi-parking/controller/parking.controller.js');

module.exports.handler = function (event, context, callback) {
    const appid = process.env['ALIPAY_APPID'];

    __PARKING_CONTROLLER__
        .queryMerchant(appid, context)
        .then(res => {
            callback(null, res.result);
        })
        .catch(exception => {
            console.error(exception);
            callback(exception);
        });
};