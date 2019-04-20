const __PARKING_CONTROLLER__ = require('/mnt/parking/diandi-parking/controller/parking.controller.js');

module.exports.handler = function (event, context, callback) {
    __PARKING_CONTROLLER__
        .syncParkingEnterInfo({
            appId: process.env['ALIPAY_APPID'],
            parkingId: 'PI1548752295451641803',
            carNumber: '闽BW1533',
            context: context
        })
        .then(res => {
            callback(null, res);
        })
        .catch(exception => {
            console.error(exception);
            callback(exception);
        });
};