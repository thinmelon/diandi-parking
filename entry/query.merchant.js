const __PARKING_CONTROLLER__ = require('/mnt/parking/diandi-parking/controller/parking.controller.js');

module.exports.handler = function (event, context, callback) {
    console.log("===> event: " + JSON.stringify(event.toString()));
    event = JSON.parse(event.toString());       //  将event转化为JSON对象
    __PARKING_CONTROLLER__
        .queryMerchant(event.queryParameters.appid, context)
        .then(res => {
            const responseCode = 200;
            const responseBody = res.result;
            //  对body内容进行Base64编码，可根据需要处理
            const base64EncodeStr = new Buffer(JSON.stringify(responseBody)).toString('base64');
            //  FC给API网关返回的格式，须如下所示。isBase64Encoded根据body是否Base64编码情况设置
            const response = {
                isBase64Encoded: true,
                statusCode: responseCode,
                headers: {
                    "X-Custom-Header": "Diandi Parking"
                },
                body: base64EncodeStr
            };
            console.log("response: " + JSON.stringify(response));
            callback(null, response);
        })
        .catch(exception => {
            console.error(exception);
            callback(exception);
        });
};