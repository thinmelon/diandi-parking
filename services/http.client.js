const Q = require('q');
const __HTTP__ = require('http');
const __HTTPS__ = require('https');
const __URL_PARSER__ = require('url');
const __QUERY_STRING__ = require('querystring');
const __REQUEST__ = require('request');
// const __LOGGER__ = require('../services/log4js.service').getLogger('http.client.js');

/**
 * GET 请求 -- HTTPS
 * @param url
 * @param callback
 * @param encoding
 */
function doHttpsGet(url, callback, encoding) {
    console.info('doHttpsGet ==> ' + url);
    __HTTPS__.get(url, function (response) {
        let data = '';
        if (encoding) {
            response.setEncoding(encoding);
        }
        response.on('data', function (chunk) {
            data += chunk;
        });
        response.on('end', function () {
            // console.debug('=====  返回结果：' + data);
            callback(data);
            console.info('===== 结束【doHttpsGet】 =====');
        });
    }).on('error', function (error) {
        console.error(error);
    });
}

/**
 * HTTPS GET 方法 Promise 化
 * @param request
 * @returns {*|C|promise}
 */
function httpsGetPromisify(request) {
    const deferred = Q.defer();

    console.info('httpsGetPromisify ==> ', request);
    __HTTPS__.get(request, function (response) {
        let data = '';
        // if (encoding) {
        //     response.setEncoding(encoding);
        // }
        response.on('data', function (chunk) {
            data += chunk;
        });
        response.on('end', function () {
            // console.debug('=====  返回结果：' + data);
            deferred.resolve(data);
            console.info('===== 结束【httpsGetPromisify】 =====');
        });
    }).on('error', function (error) {
        console.error(error);
        deferred.reject(error);
    });

    return deferred.promise;
}

/**
 * GET 请求 -- HTTPS
 * @param url
 * @param callback
 */
function doHttpGet(url, callback) {
    console.info('doHttpGet ==> ' + url);
    __HTTP__.get(url, function (response) {
        let data = '';
        response.on('data', function (chunk) {
            data += chunk;
        });
        response.on('end', function () {
            // console.debug('=====  返回结果：' + data);
            callback(data);
            console.info('===== 结束【doHttpGet】 =====');
        });
    }).on('error', function (error) {
        console.error(error);
    });
}

/**
 * 将请求URL转化为HTTPS协议
 * @param url
 * @param callback
 */
function transferToHttpsGet(url, callback) {
    const tmp = __URL_PARSER__.parse(url);
    const newUrl = 'https://' + tmp.hostname + tmp.path;
    doHttpsGet(newUrl, callback);
}

/**
 * POST 请求 -- HTTPS
 * @param url
 * @param data
 * @param callback
 * @param agentOptions
 */
function doHttpsPost(url, data, callback, agentOptions) {
    const tmp = __URL_PARSER__.parse(url);
    // 对于微信支付开发接口，提交和返回数据都为XML格式，根节点名为xml
    const postData = agentOptions && agentOptions.hasOwnProperty('wechatPay') && agentOptions.wechatPay ? data : JSON.stringify(data);
    const isHttp = tmp.protocol === 'http:';
    const options = {
        host: tmp.hostname,
        port: tmp.port || (isHttp ? 80 : 443),
        path: tmp.path,
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData)
        }
    };
    if (agentOptions) {
        options.pfx = agentOptions.pfx;
        options.passphrase = agentOptions.passphrase;
    }
    console.info('=====  doHttpsPost ==> URL: ' + url);
    //console.info('=====  doHttpsPost ==> options: ' + JSON.stringify(options));
    const req = __HTTPS__.request(options, function (res) {
        let data = '';
        res.on('data', function (chunk) {
            data += chunk;
        });
        res.on('end', function () {
            console.debug('=====  返回结果：' + data);
            callback(data);
            console.info('===== 结束【doHttpsPost】=====');
        });
    });
    req.on('error', function (e) {
        console.error(e);
        console.error(e.message);
    });
    req.write(postData);
    req.end();
}

/**
 * POST请求 -- HTTP
 * @param host
 * @param port
 * @param data
 * @param callback
 */
function doHttpPost(host, port, data, callback) {
    const postData = __QUERY_STRING__.stringify(data);
    const options = {
        host: host,
        port: port,
        path: '',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData)
        }
    };
    //console.info('=====  doHttpPost ==> options: ' + JSON.stringify(options));
    const req = __HTTP__.request(options, function (res) {
        let data = '';
        res.on('data', function (chunk) {
            data += chunk;
        });
        res.on('end', function () {
            console.debug('=====  返回结果：' + data);
            callback(data);
            console.info('===== 结束【doHttpPost】 =====');
        });
    });
    req.on('error', function (e) {
        console.error(e.message);
    });
    req.write(postData);
    req.end();
}

/**
 * 从NODE上传文件至其它服务器
 * @param url
 * @param formData
 * @param callback
 */
function uploadFile(url, formData, callback) {
    const options = {
        url: url,
        formData: formData,
        method: 'POST',
        json: true
    };

    console.debug('=====  uploadFile ==> URL:', url);
    __REQUEST__
        .post(options, function (err, httpResponse, body) {
            if (err) {
                console.error('Upload failed:', err);
                throw err;
            }
            console.debug('Upload successful!  Server responded with:', body);
            callback(body);
        })
        .on('response', function (response) {
            console.debug('statusCode ==> ', response.statusCode);                  // 200
            console.debug('Content-Type ==> ', response.headers['content-type']);     // 'text/plain'
        });
}

module.exports = {
    doHttpGet: doHttpGet,
    doHttpsGet: doHttpsGet,
    httpsGetPromisify: httpsGetPromisify,
    doHttpPost: doHttpPost,
    doHttpsPost: doHttpsPost,
    transferToHttpsGet: transferToHttpsGet,
    uploadFile: uploadFile
};
