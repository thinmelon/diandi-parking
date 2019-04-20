/**
 * 开发者ID(AppID)
 * 开发者ID是公众号开发识别码，配合开发者密码可调用公众号的接口能力
 */
const __APPID__ = 'wx7770629fee66dd93';

/**
 * 开发者密码
 * 开发者密码是校验公众号开发者身份的密码，具有极高的安全性
 * 切记勿把密码直接交给第三方开发者或直接存储在代码中
 * 如需第三方代开发公众号，请使用授权方式接入
 */
const __APP_SECRET__ = 'b78783f2143e19a476d7df073fe12e89';

/**
 * 网页授权域名
 */
const __REDIRECT_URI__ = 'https://www.pusudo.cn/platform/public/oauth/wechat';

/**
 * 模版ID: W7jo7K9e2g685HSeMP1etr-EKAGmu-dVxmoQmtQDOOc    开发者调用模版消息接口时需提供模版ID
 * 标题       车辆入场通知
 * 行业       IT科技 - IT软件与服务
 * 详细内容
 *      {{first.DATA}}
 *      时间：{{keyword1.DATA}}
 *      车牌：{{keyword2.DATA}}
 *      停车场：{{keyword3.DATA}}
 *      {{remark.DATA}}
 *      在发送时，需要将内容中的参数（{{.DATA}}内为参数）赋值替换为需要的信息
 */
const __MSG_CAR_ENTER_TEMPLATE_ID__ = 'W7jo7K9e2g685HSeMP1etr-EKAGmu-dVxmoQmtQDOOc';

/**
 * 标题:  车辆出场通知
 * 行业:  IT科技 - IT软件与服务
 * 详细内容:
 *    {{first.DATA}}
 *    车牌号：{{keyword1.DATA}}
 *    停车场：{{keyword2.DATA}}
 *    实付车费：{{keyword3.DATA}}
 *    优惠车费：{{keyword4.DATA}}
 *    离场时间：{{keyword5.DATA}}
 *    {{remark.DATA}}
 *    在发送时，需要将内容中的参数（{{.DATA}}内为参数）赋值替换为需要的信息
 */
const __MSG_CAR_EXIT_TEMPLATE_ID__ = 'Rh2WkwsmCi-cOy33yycrXHDOIfLP_IC7rjFJ9YT9Zg0';

/**
 * 令牌(Token)
 */
const __TOKEN__ = 'DIANDI';
/**
 * 消息加解密密钥
 */
const __SYMMETRIC_KEY__ = 'BUJsswd4DFQt2eEs0R8bJpeWuA1z82FZxJPVbCnrkqF';
/**
 * 解密算法
 */
const __ALGORITHM__ = 'aes-256-cbc';

module.exports = {
    __APPID__: __APPID__,
    __APP_SECRET__: __APP_SECRET__,
    __REDIRECT_URI__: __REDIRECT_URI__,
    __MSG_CAR_ENTER_TEMPLATE_ID__: __MSG_CAR_ENTER_TEMPLATE_ID__,
    __MSG_CAR_EXIT_TEMPLATE_ID__: __MSG_CAR_EXIT_TEMPLATE_ID__,
    __TOKEN__: __TOKEN__,
    __SYMMETRIC_KEY__: __SYMMETRIC_KEY__,
    __ALGORITHM__: __ALGORITHM__
};
