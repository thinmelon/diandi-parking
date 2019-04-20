const Q = require('q');
const __UTIL__ = require('util');
const __PATH__ = require('path');
const __MOMENT__ = require('moment');
const __FILE_SYSTEM__ = require('fs');
const __HTTP_CLIENT__ = require('../http.client');
/**
 *      API 及 数据结构
 */
const __OFFICIAL_ACCOUNT_API__ = require('./wechat.official.account.api');
const __OFFICIAL_ACCOUNT_STRUCTURE__ = require('./wechat.official.account.structure');
const __OFFICIAL_ACCOUNT_CONFIG__ = require('./wechat.official.account.config');

/**
 *      日志
 */
// const __LOGGER__ = require('../log4js.service').getLogger('wechat.official.account.service.js');

/**
 *      access_token是公众号的全局唯一接口调用凭据
 *
 *  公众号调用各接口时都需使用access_token。开发者需要进行妥善保存。
 *  access_token的存储至少要保留512个字符空间。
 *  access_token的有效期目前为2个小时，需定时刷新，重复获取将导致上次获取的access_token失效。
 *
 *  1. 建议公众号开发者使用中控服务器统一获取和刷新Access_token，
 *     其他业务逻辑服务器所使用的access_token均来自于该中控服务器，不应该各自去刷新，
 *     否则容易造成冲突，导致access_token覆盖而影响业务；
 *  2. 目前Access_token的有效期通过返回的expire_in来传达，目前是7200秒之内的值。
 *     中控服务器需要根据这个有效时间提前去刷新新access_token。在刷新过程中，中控服务器可对外继续输出的老access_token
 *     此时公众平台后台会保证在5分钟内，新老access_token都可用，这保证了第三方业务的平滑过渡。
 *  3. Access_token的有效时间可能会在未来有调整，所以中控服务器不仅需要内部定时主动刷新
 *     还需要提供被动刷新access_token的接口，这样便于业务服务器在API调用获知access_token已超时的情况下，可以触发access_token的刷新流程。
 *
 *  调用接口时，请登录“微信公众平台-开发-基本配置”提前将服务器IP地址添加到IP白名单中，点击查看设置方法，否则将无法调用成功。
 *  小程序无需配置IP白名单。
 */
function refreshAccessToken() {
    const deferred = Q.defer();

    __HTTP_CLIENT__
        .doHttpsGet(
            __UTIL__.format(__OFFICIAL_ACCOUNT_API__.__GET_ACCESS_TOKEN__, __OFFICIAL_ACCOUNT_CONFIG__.__APPID__, __OFFICIAL_ACCOUNT_CONFIG__.__APP_SECRET__),
            function (rawData) {
                let token = JSON.parse(rawData);
                if (token.hasOwnProperty('expires_in')) {
                    //  计算过期时间
                    token.expires_in = Date.now() + (token.expires_in - 600) * 1000;
                    console.debug('AccessToken 将于以下时间后过期 ==> ' + __MOMENT__(new Date(token.expires_in)).format('YYYY-MM-DD HH:mm:ss'));
                    //  写入json文件
                    // console.debug(__FILE_SYSTEM__.readFileSync(__PATH__.join(__dirname, 'wechat.access_token.json')) + '');
                    console.error('=========> 尝试写入');
                    // __FILE_SYSTEM__.writeFileSync(__PATH__.join(__dirname, 'wechat.access_token.json'), JSON.stringify(token));
                    __FILE_SYSTEM__.writeFileSync(__PATH__.join('/tmp', 'wechat.access_token.json'), JSON.stringify(token));
                    console.debug(__FILE_SYSTEM__.readFileSync(__PATH__.join('/tmp', 'wechat.access_token.json')) + '');
                    deferred.resolve(token);
                } else {
                    deferred.reject(rawData);
                }
            }
        );

    return deferred.promise;
}

/**
 *  获取公众号的access_token接口
 *      -   业务服务器在API调用获知access_token已超时的情况下，可以触发access_token的刷新流程
 * @returns {*|promise|C}
 */
function getAccessToken() {
    const deferred = Q.defer();
    let isTokenFileAvailable = false;
    let token;
    let tokenFilePath = __PATH__.join(__dirname, 'wechat.access_token.json');

    console.debug('PATH: ', tokenFilePath);
    if (__FILE_SYSTEM__.existsSync(tokenFilePath)) {
        token = JSON.parse(__FILE_SYSTEM__.readFileSync(tokenFilePath));
        if (token.hasOwnProperty('expires_in') && token.hasOwnProperty('access_token')) {
            console.debug('过期时间：' + __MOMENT__(token.expires_in).format('YYYY-MM-DD HH:mm:ss'));
            console.debug('请求时间：' + __MOMENT__().utcOffset(480).format('YYYY-MM-DD HH:mm:ss'));
            isTokenFileAvailable = true;
        }
    }

    if (!isTokenFileAvailable || token.expires_in < Date.now()) {
        refreshAccessToken()
            .then(result => {
                deferred.resolve(result);
            })
            .catch(exception => {
                deferred.reject(exception);
            });
    } else {
        deferred.resolve(token);
    }

    return deferred.promise;
}

/**
 * 第一步：用户同意授权，获取code
 *
 * 在确保微信公众账号拥有授权作用域（scope参数）的权限的前提下
 * （服务号获得高级接口后，默认拥有scope参数中的snsapi_base和snsapi_userinfo）
 * 引导关注者打开如下页面
 *
 * @param request
 * @returns {string}
 */
function getAuthorizerCodeUrl(request) {
    return __UTIL__.format(__OFFICIAL_ACCOUNT_API__.__AUTHORIZER_CODE__,
        request.appid || __OFFICIAL_ACCOUNT_CONFIG__.__APPID__,
        encodeURIComponent(request.redirectUri || __OFFICIAL_ACCOUNT_CONFIG__.__REDIRECT_URI__),
        request.scope || 'snsapi_base',
        request.state || 'snsapi_base');
}

/**
 *  第二步：通过code换取网页授权access_token
 *
 *  首先请注意，这里通过code换取的是一个特殊的网页授权access_token,与基础支持中的access_token（该access_token用于调用其他接口）不同
 *  公众号可通过下述接口来获取网页授权access_token
 *
 *  如果网页授权的作用域为snsapi_base，则本步骤中获取到网页授权access_token的同时，也获取到了openid，snsapi_base式的网页授权流程即到此为止
 *
 *  尤其注意：
 *  由于公众号的secret和获取到的access_token安全级别都非常高，必须只保存在服务器，不允许传给客户端
 *  后续刷新access_token、通过access_token获取用户信息等步骤，也必须从服务器发起
 *
 *  返回示例：
 * { access_token: '18_LWvdNIfMeg7mtYgcnRxGYvE5ZDJDJig6XmgbcR4Ub7vljLbWZ5pAfxTjf5KG4Gm12WB1ds3HppQpr27EuCi9oQ',
 * expires_in: 7200,
 * refresh_token: '18_UrDZ5FYKh64l-UrlzZdGJGQVabenC1iFeZV7yBrW93QrXJQTMy_AkmzxV0Wx34ya0NtKn6VgWX76NaqubEb9SA',
 * openid: 'oWWirwWI1JI3-gesLZEkjBBIxMzQ',
 * scope: 'snsapi_base' }
 *
 * @param request
 * @returns {*|C|promise}
 */
function getAccessTokenByAuthorizerCode(request) {
    const deferred = Q.defer();

    __HTTP_CLIENT__.doHttpsGet(
        __UTIL__.format(__OFFICIAL_ACCOUNT_API__.__ACCESS_TOKEN__,
            request.appid || __OFFICIAL_ACCOUNT_CONFIG__.__APPID__,
            request.appSecret || __OFFICIAL_ACCOUNT_CONFIG__.__APP_SECRET__,
            request.code),
        function (rawData) {
            let code = JSON.parse(rawData);
            if (code.hasOwnProperty('errcode')) {
                deferred.reject(code.errmsg);
            } else {
                deferred.resolve(code);
            }
        });

    return deferred.promise;
}

/**
 * 第四步：拉取用户信息(需scope为 snsapi_userinfo)
 *
 * @param request
 */
// function getUserInfo(request) {
//
// }

/**
 * 创建菜单
 * @param request
 * @returns {*|promise|C}
 */
function createMenu(request) {
    const deferred = Q.defer();

    __HTTP_CLIENT__.doHttpsPost(
        __UTIL__.format(__OFFICIAL_ACCOUNT_API__.__CREATE_MENU__, request.access_token),
        request.menu,
        function (rawData) {
            deferred.resolve(JSON.parse(rawData));
        },
        null
    );

    return deferred.promise;
}

/**
 * 删除菜单
 * @param request
 * @returns {*|promise|C}
 */
function deleteMenu(request) {
    const deferred = Q.defer();

    __HTTP_CLIENT__.doHttpsPost(
        __UTIL__.format(__OFFICIAL_ACCOUNT_API__.__DELETE_MENU__, request.access_token),
        {},
        function (rawData) {
            deferred.resolve(request);      //  透传参数
        },
        null
    );

    return deferred.promise;
}

/**
 * 获取素材列表
 * 在新增了永久素材后，开发者可以分类型获取永久素材的列表。
 * 请注意：
 *
 * 1、获取永久素材的列表，也包含公众号在公众平台官网素材管理模块中新建的图文消息、语音、视频等素材
 * 2、临时素材无法通过本接口获取
 * 3、调用该接口需https协议
 * @param request
 * @returns {*|promise|C}
 */
function getMaterialList(request) {
    const deferred = Q.defer();

    __HTTP_CLIENT__.doHttpsPost(
        __UTIL__.format(__OFFICIAL_ACCOUNT_API__.__GET_MATERIAL_LIST__, request.access_token),
        __OFFICIAL_ACCOUNT_STRUCTURE__.constructGetMaterialListParams(request),
        function (rawData) {
            deferred.resolve(JSON.parse(rawData));
        },
        null
    );

    return deferred.promise;
}

/**
 * 获取永久素材
 *
 * 请注意：临时素材无法通过本接口获取
 * @param request
 * @returns {*|promise|C}
 */
function getMaterial(request) {
    const deferred = Q.defer();

    __HTTP_CLIENT__.doHttpsPost(
        __UTIL__.format(__OFFICIAL_ACCOUNT_API__.__GET_MATERIAL__, request.access_token),
        __OFFICIAL_ACCOUNT_STRUCTURE__.constructGetMaterialParams(request),
        function (rawData) {
            deferred.resolve(JSON.parse(rawData));
        },
        null
    );

    return deferred.promise;
}

/**
 * 新增临时素材
 * 注意点：
 * 1、临时素材media_id是可复用的
 * 2、媒体文件在微信后台保存时间为3天，即3天后media_id失效
 * 3、上传临时素材的格式、大小限制与公众平台官网一致
 *          图片（image）: 2M，支持PNG\JPEG\JPG\GIF格式
 *          语音（voice）：2M，播放长度不超过60s，支持AMR\MP3格式
 *          视频（video）：10MB，支持MP4格式
 *          缩略图（thumb）：64KB，支持JPG格式
 * 4、需使用https调用本接口
 * @param request
 * @returns {*|promise|C}
 */
function uploadTempMaterial(request) {
    const deferred = Q.defer();

    __HTTP_CLIENT__.uploadFile(
        __UTIL__.format(__OFFICIAL_ACCOUNT_API__.__UPLOAD_TEMP_MATERIAL__, request.access_token, request.media_type),
        request.formData,
        function (rawData) {
            deferred.resolve(rawData);
        }
    );

    return deferred.promise;
}

/**
 * 新增其他类型永久素材
 * 通过POST表单来调用接口，表单id为media，包含需要上传的素材内容，有filename、filelength、content-type等信息。
 * 请注意：图片素材将进入公众平台官网素材管理模块中的默认分组。
 * @param request
 * @returns {*|promise|C}
 */
function addMaterial(request) {
    const deferred = Q.defer();

    __HTTP_CLIENT__.uploadFile(
        __UTIL__.format(__OFFICIAL_ACCOUNT_API__.__ADD_MATERIAL__, request.access_token, request.media_type),
        request.formData,
        function (rawData) {
            deferred.resolve(rawData);
        }
    );

    return deferred.promise;
}

/**
 *  获取设置的行业信息
 *
 *  获取帐号设置的行业信息。可登录微信公众平台，在公众号后台中查看行业信息。为方便第三方开发者，提供通过接口调用的方式来获取帐号所设置的行业信息
 *
 * @param request
 * @returns {*|C|promise}
 */
function getTemplateIndustry(request) {
    const deferred = Q.defer();

    __HTTP_CLIENT__.doHttpsGet(
        __UTIL__.format(__OFFICIAL_ACCOUNT_API__.__GET_TEMPLATE_INDUSTRY__, request.access_token),
        function (rawData) {
            let code = JSON.parse(rawData);
            if (code.hasOwnProperty('errcode')) {
                deferred.reject(code.errmsg);
            } else {
                deferred.resolve(code);
            }
        });

    return deferred.promise;
}

/**
 *  获取模板列表
 *
 *  获取已添加至帐号下所有模板列表，可在微信公众平台后台中查看模板列表信息。为方便第三方开发者，提供通过接口调用的方式来获取帐号下所有模板信息
 * @param request
 * @returns {*|C|promise}
 */
function getAllPrivateTemplates(request) {
    const deferred = Q.defer();

    __HTTP_CLIENT__.doHttpsGet(
        __UTIL__.format(__OFFICIAL_ACCOUNT_API__.__GET_ALL_PRIVATE_TEMPLATES__, request.access_token),
        function (rawData) {
            let code = JSON.parse(rawData);
            if (code.hasOwnProperty('errcode')) {
                deferred.reject(code.errmsg);
            } else {
                deferred.resolve(code);
            }
        });

    return deferred.promise;
}

/**
 * 发送模板消息
 *
 *  模版消息调用时主要需要模版ID和模版中各参数的赋值内容。请注意：
 -   1.模版中参数内容必须以".DATA"结尾，否则视为保留字;
 -   2.模版保留符号"{{ }}"
 *
 * { errcode: 40003,
     errmsg: 'invalid openid hint: [2Zlyza05694107]' }
 * { errcode: 43004,
     errmsg: 'require subscribe hint: [NOvspA05283951]' }
 * @param request
 * @returns {*|C|promise}
 */
function sendTemplateMessage(request) {
    const deferred = Q.defer();

    __HTTP_CLIENT__.doHttpsPost(
        __UTIL__.format(__OFFICIAL_ACCOUNT_API__.__SEND_TEMPLATE_MESSAGE__, request.access_token),
        __OFFICIAL_ACCOUNT_STRUCTURE__.constructSendTemplateMessageParams(request),
        function (rawData) {
            let result = JSON.parse(rawData);
            if (result.hasOwnProperty('errcode') && result.errcode === 0) {
                deferred.resolve(result);
            } else {
                deferred.reject(result);
            }
        },
        null
    );

    return deferred.promise;
}

/**
 * 客服接口 -   发消息
 * @param request
 * @returns {*|promise|C}
 */
function sendCustomMessage(request) {
    const deferred = Q.defer();

    __HTTP_CLIENT__.doHttpsPost(
        __UTIL__.format(__OFFICIAL_ACCOUNT_API__.__SEND_CUSTOM_MESSAGE__, request.access_token),
        __OFFICIAL_ACCOUNT_STRUCTURE__.constructSendCustomMessageParams(request),
        function (rawData) {
            let result = JSON.parse(rawData);
            if (result.hasOwnProperty('errcode') && result.errcode === 0) {
                deferred.resolve(result);
            } else {
                deferred.reject(result);
            }
        },
        null
    );

    return deferred.promise;
}

module.exports = {
    /**
     *  获取公众号 ACCESS_TOKEN 以调用微信JS-SDK
     */
    getAccessToken: getAccessToken,
    /**
     *  微信网页授权
     */
    getAuthorizerCodeUrl: getAuthorizerCodeUrl,
    getAccessTokenByAuthorizerCode: getAccessTokenByAuthorizerCode,
    /**
     *  微信JS-SDK    -   自定义菜单
     */
    createMenu: createMenu,
    deleteMenu: deleteMenu,
    /**
     *  微信JS-SDK    -   永久素材 / 临时素材
     */
    getMaterialList: getMaterialList,
    getMaterial: getMaterial,
    uploadTempMaterial: uploadTempMaterial,
    addMaterial: addMaterial,
    /**
     *  微信JS-SDK    -   模板消息
     */
    getTemplateIndustry: getTemplateIndustry,
    getAllPrivateTemplates: getAllPrivateTemplates,
    sendTemplateMessage: sendTemplateMessage,
    /**
     *  微信JS-SDK    -   客服消息
     */
    sendCustomMessage: sendCustomMessage
};


// getAccessToken()
//     .then(res => {
//         console.log(res)
//     })
//     .catch(err => {
//         "use strict";
//         console.error(err)
//     });

// console.log(getAuthorizerCodeUrl({}))

// getAccessToken()
//     .then(request => {
//         return Q({
//             access_token: request.access_token,
//             menu: {
//                 'button': [
//                     {
//                         "type": "view",
//                         "name": "领取停车券",
//                         "url": "http://mp.weixin.qq.com/bizmall/cardshelf?shelf_id=1&showwxpaytitle=1&biz=MzI0OTIzNjA1Nw==&t=cardticket/shelf_list&scene=1000007#wechat_redirect"
//                     }
//                     // {
//                     //     'type': 'miniprogram',
//                     //     'name': '莆素',
//                     //     'url': 'http://mp.weixin.qq.com',
//                     //     'appid': 'wxc91180e424549fbf',
//                     //     'pagepath': 'pages/shopping/index/index'
//                     // }
//                 ]
//             }
//         });
//     })
//     .then(createMenu)
//     .then(res => {
//         console.log(res);
//     })
//     .catch(err => {
//         console.error(err);
//     });

// deleteMenu({
//     access_token: '12_kjS_g5rT4nkSVe6XyOyEJNId5EkQ9SEfOv7hQhaWC1UmsQ4FHEBjTIYgITfr8EgL3qlozfe7Wkj5DD54fRMajQ3wX1hMQP6OLR9DpkeUTyw'
// })
//     .then(res => {
//         console.log(res);
//     });

// getAccessToken()
//     .then(request => {
//         'use strict';
//         return Q({
//             access_token: request.access_token,
//             offset: 0,
//             count: 5
//         });
//     })
//     .then(getMaterialList)
//     .then(res => {
//         'use strict';
//         //console.log(res.item[0].content.news_item[0].title);
//         res.item.map(item => {
//             console.log(item.content.news_item[0].title);
//         });
//         console.log(res.item);
//     })
//     .catch(error => {
//         'use strict';
//         console.error(error);
//     });

// __SERVICE_ACCESS_TOKEN__
//     .accessToken()
//     .then(request => {
//         return Q({
//             access_token: request.access_token,
//             media_id: 'n584HX_l4p6cYQBacvvsy-bt8K3nMEeVPJ9KVIevOvk'
//         });
//     })
//     .then(getMaterial)
//     .then(res => {
//         console.log(res.news_item[0]);
//     })
//     .catch(error => {
//         console.error(error);
//     });

// console.log(getAuthorizerCodeUrl({}));

// getAccessTokenByAuthorizerCode({
//     code: '021zGsBA11X97c0b5KBA1hQqBA1zGsBd'
// }).then(res => {
//     "use strict";
//     console.log(res);
// }).catch(err => {
//     "use strict";
//     console.error(err);
// })

// getAccessToken()
//     .then(getTemplateIndustry)
//     .then(res => {
//         "use strict";
//         console.log(res)
//     })
//     .catch(err => {
//         "use strict";
//         console.error(err);
//     });

// getAccessToken()
//     .then(getAllPrivateTemplates)
//     .then(res => {
//         "use strict";
//         console.log(res)
//     })
//     .catch(err => {
//         "use strict";
//         console.error(err);
//     });

// getAccessToken()
//     .then(token => {
//         "use strict";
//         return Q({
//             access_token: token.access_token,
//             toUser: 'oWWirwWI1JI3-gesLZEkjBBIxMzQ',
//             templateId: 'W7jo7K9e2g685HSeMP1etr-EKAGmu-dVxmoQmtQDOOc',
//             url: 'https://www.pusudo.cn/parking/init?parkingId=PI1548752295451641803',
//             data: {
//                 first: {
//                     "value": '您好,您的车辆已经进入停车场。',
//                     "color": "#173177"
//                 },
//                 keyword1: {
//                     "value": '2014年7月21日 18:36',
//                     "color": "#173177"
//                 },
//                 keyword2: {
//                     "value": '浙a12345',
//                     "color": "#173177"
//                 },
//                 keyword3: {
//                     "value": '恒隆停车场',
//                     "color": "#173177"
//                 },
//                 remark: {
//                     "value": '车辆离场时将自动扣费！',
//                     "color": "#173177"
//                 }
//             }
//         })
//     })
//     .then(sendTemplateMessage)
//     .then(res => {
//         "use strict";
//         console.log(res)
//     })
//     .catch(err => {
//         "use strict";
//         console.error(err);
//     });

// getAccessToken()
//     .then(request => {
//         'use strict';
//         return Q({
//             access_token: request.access_token,
//             openid: 'oWWirwWI1JI3-gesLZEkjBBIxMzQ',
//             media_id: 'n584HX_l4p6cYQBacvvsy3UkKes2h3mkxhk2FAFdlQE'
//             // media_id: 'n584HX_l4p6cYQBacvvsy0RwBxQwOjNju-a355FwrYA'
//         });
//     })
//     .then(sendCustomMessage)
//     .then(res => {
//         'use strict';
//         console.log(res);
//     })
//     .catch(error => {
//         'use strict';
//         console.error(error);
//     });
