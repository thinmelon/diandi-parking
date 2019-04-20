const Q = require('q');
// const __OSS__ = require('ali-oss').Wrapper;  //  直接在函数计算内引用，使用Wrapper
const __OSS__ = require('ali-oss');
const __CONFIG__ = require('./aliyun.oss.config');

/**
 *  配置项
 *
 *  [accessKeyId] {String} 通过阿里云控制台创建的access key。
 *  [accessKeySecret] {String} 通过阿里云控制台创建的access secret。
 *  [bucket] {String} 通过控制台创建的bucket, 或通过putBucket创建。
 *  [endpoint] {String} oss 域名。
 *  [region] {String} bucket 所在的区域, 默认 oss-cn-hangzhou。
 *  [internal] {Boolean} 是否使用阿里云内部网访问，比如采用ecs访问oss，设置true, 采用internal的endpoint 会节约费用, 默认false。
 *  [secure] {Boolean} (secure: true) 使用 HTTPS , (secure: false) 则使用 HTTP, 细节请看。
 *  [timeout] {String|Number} 超时时间, 默认 60s。
 */
function setUpOssClient(request) {
    const deferred = Q.defer();

    let client = new __OSS__({
        /**
         * AccessKey，简称 AK，指的是访问身份验证中用到的 AccessKeyId 和AccessKeySecret。
         * OSS 通过使用 AccessKeyId 和 AccessKeySecret 对称加密的方法来验证某个请求的发送者身份。
         * AccessKeyId 用于标识用户，AccessKeySecret 是用户用于加密签名字符串和 OSS 用来验证签名字符串的密钥
         */
        accessKeyId: request.context.credentials.accessKeyId,
        accessKeySecret: request.context.credentials.accessKeySecret,
        stsToken: request.context.credentials.securityToken,
        /**
         * Region 表示 OSS 的数据中心所在的地域，物理位置。用户可以根据费用、请求来源等综合选择数据存储的 Region。
         */
        region: request.region || __CONFIG__.Region,
        /**
         * 存储空间是您用于存储对象（Object）的容器，所有的对象都必须隶属于某个存储空间。
         * 您可以设置和修改存储空间属性用来控制地域、访问权限、生命周期等，这些属性设置直接作用于该存储空间内所有对象
         */
        bucket: request.bucket || __CONFIG__.Bucket,
        endpoint: request.endpoint || __CONFIG__.Endpoint,
        cname: true
    });

    deferred.resolve({
        client: client,
        options: request.options
    });

    return deferred.promise;
}

/**
 * 下载Buffer
 * 用户也可以通过get接口简单地将文件内容下载到Buffer中
 * @param request
 * @returns {*|promise|C}
 */
function getBuffer(request) {
    const deferred = Q.defer();

    request.client
        .get(request.options.resource)
        .then(res => {
            deferred.resolve(res);
        })
        .catch(exception => {
            console.error(exception);
            deferred.reject(exception);
        });

    return deferred.promise;
}

module.exports = {
    setUpOssClient: setUpOssClient,
    getBuffer: getBuffer
};