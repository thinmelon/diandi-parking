const __PARKING_CONTROLLER__ = require('/mnt/parking/diandi-parking/controller/parking.controller.js');

module.exports.handler = function (event, context, callback) {
    __PARKING_CONTROLLER__
        .queryMerchant('2019012263122350', context)
        .then(res => {
            console.log(res);
            callback(null, res.result);
        })
        .catch(exception => {
            console.error(exception);
            callback(exception);
        });
};