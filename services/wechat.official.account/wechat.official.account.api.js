/**
 * 基础支持中的access_token
 * access_token（有效期7200秒，开发者必须在自己的服务全局缓存access_token）
 * 该access_token用于调用其他接口
 */
const __GET_ACCESS_TOKEN__ = 'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=%s&secret=%s';
/**
 *  微信网页授权
 */
const __AUTHORIZER_CODE__ = 'https://open.weixin.qq.com/connect/oauth2/authorize?appid=%s&redirect_uri=%s&response_type=code&scope=%s&state=%s#wechat_redirect';
const __ACCESS_TOKEN__ = 'https://api.weixin.qq.com/sns/oauth2/access_token?appid=%s&secret=%s&code=%s&grant_type=authorization_code';
const __USER_INFO__ = 'https://api.weixin.qq.com/sns/userinfo?access_token=%s&openid=%s&lang=zh_CN';
/**
 *  调用微信JS-SDK接口    -   自定义菜单
 */
const __CREATE_MENU__ = 'https://api.weixin.qq.com/cgi-bin/menu/create?access_token=%s';
const __DELETE_MENU__ = 'https://api.weixin.qq.com/cgi-bin/menu/delete?access_token=%s';
/**
 *  调用微信JS-SDK接口    -   素材
 */
const __GET_MATERIAL_LIST__ = 'https://api.weixin.qq.com/cgi-bin/material/batchget_material?access_token=%s';
const __GET_MATERIAL__ = 'https://api.weixin.qq.com/cgi-bin/material/get_material?access_token=%s';
const __UPLOAD_TEMP_MATERIAL__ = 'https://api.weixin.qq.com/cgi-bin/media/upload?access_token=%s&type=%s';
const __ADD_MATERIAL__ = 'https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=%s&type=%s';
/**
 *  调用微信JS-SDK接口    -   模版消息
 */
const __GET_TEMPLATE_INDUSTRY__ = 'https://api.weixin.qq.com/cgi-bin/template/get_industry?access_token=%s';
const __GET_ALL_PRIVATE_TEMPLATES__ = 'https://api.weixin.qq.com/cgi-bin/template/get_all_private_template?access_token=%s';
const __SEND_TEMPLATE_MESSAGE__ = 'https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=%s';
/**
 *
 */
const __SEND_CUSTOM_MESSAGE__ = 'https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=%s';

module.exports = {
    __GET_ACCESS_TOKEN__: __GET_ACCESS_TOKEN__,
    __AUTHORIZER_CODE__: __AUTHORIZER_CODE__,
    __ACCESS_TOKEN__: __ACCESS_TOKEN__,
    __USER_INFO__: __USER_INFO__,
    __CREATE_MENU__: __CREATE_MENU__,
    __DELETE_MENU__: __DELETE_MENU__,
    __GET_MATERIAL_LIST__: __GET_MATERIAL_LIST__,
    __GET_MATERIAL__: __GET_MATERIAL__,
    __UPLOAD_TEMP_MATERIAL__: __UPLOAD_TEMP_MATERIAL__,
    __ADD_MATERIAL__: __ADD_MATERIAL__,
    __GET_TEMPLATE_INDUSTRY__: __GET_TEMPLATE_INDUSTRY__,
    __GET_ALL_PRIVATE_TEMPLATES__: __GET_ALL_PRIVATE_TEMPLATES__,
    __SEND_TEMPLATE_MESSAGE__: __SEND_TEMPLATE_MESSAGE__,
    __SEND_CUSTOM_MESSAGE__: __SEND_CUSTOM_MESSAGE__
};