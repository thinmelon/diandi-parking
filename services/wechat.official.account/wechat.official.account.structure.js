/**
 *  获取素材列表
 * @param request
 * @returns {{type: string, offset: number, count: number}}
 */
function constructGetMaterialListParams(request) {
    return {
        type: request.type || 'news',
        offset: request.offset || 0,
        count: request.count || 1
    };
}

/**
 * 获取永久素材
 * @param request
 * @returns {{media_id: *}}
 */
function constructGetMaterialParams(request) {
    return {
        media_id: request.media_id
    };
}

function constructUploadTempMaterialParams(request) {
    return {
        formData: request.form
    };
}

/**
 * 发送模板消息POST数据说明
 * {
           "touser":"OPENID",
           "template_id":"ngqIpbwh8bUfcSsECmogfXcV14J0tQlEpBO27izEYtY",
           "url":"http://weixin.qq.com/download",
           "miniprogram":{
             "appid":"xiaochengxuappid12345",
             "pagepath":"index?foo=bar"
           },
           "data":{
                   "first": {
                       "value":"恭喜你购买成功！",
                       "color":"#173177"
                   },
                   "keyword1":{
                       "value":"巧克力",
                       "color":"#173177"
                   },
                   "keyword2": {
                       "value":"39.8元",
                       "color":"#173177"
                   },
                   "keyword3": {
                       "value":"2014年9月22日",
                       "color":"#173177"
                   },
                   "remark":{
                       "value":"欢迎再次购买！",
                       "color":"#173177"
                   }
           }
       }
 * @param request
 * @returns {{touser: *, template_id: *, url, miniprogram: *, data}}
 */
function constructSendTemplateMessageParams(request) {
    return {
        touser: request.toUser,
        template_id: request.templateId,
        url: request.url,
        miniprogram: request.miniprogram,
        data: request.data
    }
}

/**
 *  发送图文消息（点击跳转到图文消息页面）
 *  图文消息条数限制在1条以内
 *  注意，如果图文数超过1，则将会返回错误码45008。
 * @param request
 * @returns {{}}
 */
function constructSendCustomMessageParams(request) {
    return {
        "touser": request.openid,
        "msgtype": "mpnews",
        "mpnews": {
            "media_id": request.media_id
        }
    }
}

module.exports = {
    constructGetMaterialListParams: constructGetMaterialListParams,
    constructGetMaterialParams: constructGetMaterialParams,
    constructUploadTempMaterialParams: constructUploadTempMaterialParams,
    constructSendTemplateMessageParams: constructSendTemplateMessageParams,
    constructSendCustomMessageParams: constructSendCustomMessageParams
};
