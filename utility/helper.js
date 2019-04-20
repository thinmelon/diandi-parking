const Q = require('q');
const __UTIL__ = require('util');
const __FILE_SYSTEM__ = require('fs');
const __PATH__ = require('path');
const __MOMENT__ = require('moment');
const __CRYPTO__ = require('crypto');

/**
 * 产生随机字符串
 * @param length
 * @returns {string}
 */
function getNonceStr(length) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const count = chars.length;
    let i, nonceStr = '';
    for (i = 0; i < length; i++) {
        nonceStr += chars.substr(Math.floor(Math.random() * (count - 1) + 1), 1);
    }
    return nonceStr;
}

/**
 * 标准北京时间，时区为东八区，自1970年1月1日 0点0分0秒以来的秒数。
 * 注意：部分系统取到的值为毫秒级，需要转换成秒(10位数字)
 * @returns {string}
 */
function getTimestamp() {
    return parseInt(new Date().getTime() / 1000) + '';
}

/**
 * 生产随机文件名
 * @returns {*}
 */
function generateRandomFileName() {
    const chars = '0123456789';
    const count = chars.length;
    let i, nonceStr = '';
    for (i = 0; i < 8; i++) {
        nonceStr += chars.substr(Math.floor(Math.random() * (count - 1) + 1), 1);
    }
    return __UTIL__.format('%s%s%s', 'ps', __MOMENT__().utcOffset(480).format('YYYYMMDDHHmmss'), nonceStr);
}

/**
 *  按字典顺序排序后连接字符串
 * @param args
 * @returns {string}
 */
function concatSortArgs(args) {
    let values = Object.values(args);

    values = values.sort();
    let string = '';
    values.forEach(function (value) {
        string += value;
    });
    return string;
}

/**
 *
 *      按字典序排序参数
 *
 *  设所有发送或者接收到的数据为集合M
 *  将集合M内非空参数值的参数按照参数名ASCII码从小到大排序（字典序）
 *  使用URL键值对的格式（即key1=value1&key2=value2…）拼接成字符串stringA
 *  参数名ASCII码从小到大排序（字典序）
 *  如果参数的值为空不参与签名；
 *  参数名区分大小写；
 *  验证调用返回或微信主动通知签名时，传送的sign参数不参与签名，将生成的签名与该sign值作校验。
 *  微信接口可能增加字段，验证签名时必须支持增加的扩展字段
 * @param args
 * @returns {string}
 */
function convertToUrlParams(args) {
    let keys = Object.keys(args);
    keys = keys.sort();
    let newArgs = {};
    keys.forEach(function (key) {
        newArgs[key] = args[key];
    });
    let string = '';
    for (let k in newArgs) {
        if (k === 'sign') {
            continue;
        }
        if (k === 'apiKey') {
            continue;
        }
        if (newArgs[k] === '') {
            continue;
        }
        string += '&' + k + '=' + newArgs[k];
    }
    string = string.substr(1);
    return string;
}

/**
 *  Luhn算法/公式，也称“模10算法”
 *  是一种简单的校验公式，常被用于银行卡卡号、IMEI号等证件号码的识别校验。
 *  Luhn算法存在的目的并不是成为一种加密安全的哈希函数。它的目的在于防止意外操作导致的错误，如错误输入，而不是恶意攻击。
 *
 *  Luhn算法被用于最后一位为校验码的一串数字的校验，通过如下规则计算校验码的正确性：
 *  按照从右往左的顺序，从这串数字的右边开始，包含校验码，将偶数位数字乘以2，如果每次乘二操作的结果大于9（如 8 × 2 = 16），然后计算个位和十位数字的和（如 1 ＋ 6 = 7）或者用这个结果减去9（如 16 - 9 ＝ 7）；
 *  第一步、操作过后会得到新的一串数字，计算所有数字的和（包含校验码）；
 *  第二步、操作得到的和进行“模10”运算，如果结果位0，表示校验通过，否则失败。
 *
 *  Luhm校验规则：16位银行卡号（19位通用）:
 *  1.将未带校验位的 15（或18）位卡号从右依次编号 1 到 15（18），位于奇数位号上的数字乘以 2。
 *  2.将奇位乘积的个十位全部相加，再加上所有偶数位上的数字。
 *  3.将加法和加上校验位能被 10 整除。
 * @param bank_no
 * @returns {boolean}
 */
function checkBankNo(bank_no) {
    let lastNum = parseInt(bank_no.substr(bank_no.length - 1, 1));      //  取出最后一位（与luhm进行比较）
    let first15Num = bank_no.substr(0, bank_no.length - 1);   //  前15或18位
    let newArr = [];
    for (let i = first15Num.length - 1; i > -1; i--) {      //  前15或18位倒序存进数组
        newArr.push(first15Num.substr(i, 1));
    }

    let arrJiShu = [];          //  奇数位*2的积 < 9
    let arrJiShu2 = [];         //  奇数位*2的积 > 9
    let arrOuShu = [];          //  偶数位数组
    for (let j = 0; j < newArr.length; j++) {
        if ((j + 1) % 2 === 1) {                    //奇数位
            if (parseInt(newArr[j]) * 2 < 9)
                arrJiShu.push(parseInt(newArr[j]) * 2);
            else
                arrJiShu2.push(parseInt(newArr[j]) * 2);
        }
        else //偶数位
            arrOuShu.push(newArr[j]);
    }

    let jishu_child1 = [];     //  奇数位*2 >9 的分割之后的数组个位数
    let jishu_child2 = [];     //  奇数位*2 >9 的分割之后的数组十位数
    for (let h = 0; h < arrJiShu2.length; h++) {
        jishu_child1.push(parseInt(arrJiShu2[h]) % 10);
        jishu_child2.push(parseInt(arrJiShu2[h]) / 10);
    }

    let sumJiShu = 0; //奇数位*2 < 9 的数组之和
    let sumOuShu = 0; //偶数位数组之和
    let sumJiShuChild1 = 0; //奇数位*2 >9 的分割之后的数组个位数之和
    let sumJiShuChild2 = 0; //奇数位*2 >9 的分割之后的数组十位数之和
    for (let m = 0; m < arrJiShu.length; m++) {
        sumJiShu = sumJiShu + parseInt(arrJiShu[m]);
    }

    for (let n = 0; n < arrOuShu.length; n++) {
        sumOuShu = sumOuShu + parseInt(arrOuShu[n]);
    }

    for (let p = 0; p < jishu_child1.length; p++) {
        sumJiShuChild1 = sumJiShuChild1 + parseInt(jishu_child1[p]);
        sumJiShuChild2 = sumJiShuChild2 + parseInt(jishu_child2[p]);
    }
    //计算总和
    let sumTotal = parseInt(sumJiShu) + parseInt(sumOuShu) + parseInt(sumJiShuChild1) + parseInt(sumJiShuChild2);

    //计算Luhm值
    let k = parseInt(sumTotal) % 10 === 0 ? 10 : parseInt(sumTotal) % 10;
    let luhn = 10 - k;

    return lastNum === luhn;
}

/**
 *  银行编号列表
 */
const BANK_CODE = [
    1002,   //  工商银行
    1005,   //  农业银行
    1026,   //  中国银行
    1003,   //  建设银行
    1001,   //  招商银行
    1066,   //  邮储银行
    1020,   //  交通银行
    1004,   //  浦发银行
    1006,   //  民生银行
    1009,   //  兴业银行
    1010,   //  平安银行
    1021,   //  中信银行
    1025,   //  华夏银行
    1027,   //  广发银行
    1022,   //  光大银行
    1032,   //  北京银行
    1056    //  宁波银行
];

/**
 * 校验银行编号
 * @param bank_code
 * @returns {boolean}
 */
function checkBankCode(bank_code) {
    for (let i = 0; i < BANK_CODE.length; i++) {
        if (BANK_CODE[i] === bank_code) {
            return true;
        }
    }
    return false;
}

/**
 *  将图片数据转换成base64位的字符串
 *
 * @param imgFilePath
 * @returns {String}
 */
function getImageStr(imgFilePath) {
    return __FILE_SYSTEM__.readFileSync(imgFilePath).toString('base64');
}

/**
 * 获取公钥
 * @returns {*|string}
 */
function getPublicKey() {
    return __FILE_SYSTEM__.readFileSync(__PATH__.join(__PATH__.resolve(__dirname, '..'), 'credentials', 'platform', 'rsa_public_key.pem')).toString('utf-8');
}

/**
 * 使用RSA算法公钥加密
 * @param data
 * @returns {string}
 */
function publicEncrypt(data) {
    //  获得公钥
    const publicKey = __FILE_SYSTEM__.readFileSync(__PATH__.join(__PATH__.resolve(__dirname, '..'), 'credentials', 'platform', 'rsa_public_key.pem')).toString('utf-8');
    return __CRYPTO__.publicEncrypt(publicKey, Buffer.from(data, 'base64'));
}

/**
 * 使用RSA算法私钥加密
 * @param encrypted
 * @returns {string}
 */
function privateDecrypt(encrypted) {
    //  获得私钥
    const privateKey = __FILE_SYSTEM__.readFileSync(__PATH__.join(__PATH__.resolve(__dirname, '..'), 'credentials', 'platform', 'rsa_private_key.pem')).toString('utf-8');
    return __CRYPTO__.privateDecrypt(
        {
            key: privateKey,
            /**
             *  RSA_PKCS1_PADDING 填充模式，最常用的模式
             *  要求:
             *  输入：必须 比 RSA 钥模长(modulus) 短至少11个字节, 也就是　RSA_size(rsa) – 11
             *  如果输入的明文过长，必须切割，然后填充
             *
             *  输出：和modulus一样长
             *  根据这个要求，对于512bit的密钥，　block length = 512/8 – 11 = 53 字节
             */
            padding: __CRYPTO__.constants.RSA_PKCS1_PADDING
            /**
             * RSA_PKCS1_OAEP_PADDING
             * 输入：RSA_size(rsa) – 41
             * 输出：和modulus一样长
             */
            // padding: __CRYPTO__.constants.RSA_PKCS1_OAEP_PADDING
            /**
             * RSA_NO_PADDING　　不填充
             * 输入：可以和RSA钥模长一样长，如果输入的明文过长，必须切割，然后填充
             * 输出：和modulus一样长
             */
            // padding: __CRYPTO__.constants.RSA_NO_PADDING
            /**
             * 假如你选择的秘钥长度为1024bit共128个byte：
             *  1.当你在客户端选择RSA_NO_PADDING填充模式时，如果你的明文不够128字节
             *  加密的时候会在你的明文前面，前向的填充零。解密后的明文也会包括前面填充的零，这是服务器需要注意把解密后的字段前向填充的零去掉，才是真正之前加密的明文。
             *
             *  2.当你选择RSA_PKCS1_PADDING填充模式时，如果你的明文不够128字节
             *  加密的时候会在你的明文中随机填充一些数据，所以会导致对同样的明文每次加密后的结果都不一样。
             *  对加密后的密文，服务器使用相同的填充方式都能解密。解密后的明文也就是之前加密的明文。
             *
             *  3.RSA_PKCS1_OAEP_PADDING填充模式没有使用过， 他是PKCS#1推出的新的填充方式，安全性是最高的，和前面RSA_PKCS1_PADDING的区别就是加密前的编码方式不一样。
             */
        },
        Buffer.from(encrypted, 'base64')
    ).toString("utf8");
}

function PKCS7Decoder(buff) {
    let pad = buff[buff.length - 1];
    if (pad < 1 || pad > 32) {
        pad = 0;
    }
    return buff.slice(0, buff.length - pad);
}

function PKCS7Encoder(buff) {
    let blockSize = 32;
    let strSize = buff.length;
    let amountToPad = blockSize - (strSize % blockSize);
    let pad = Buffer.from(amountToPad - 1);
    pad.fill(String.fromCharCode(amountToPad));
    return Buffer.concat([buff, pad]);
}

/**
 * 解密
 *
 * @param encryptedData
 * @param symmetricKey
 * @param algorithm
 * @param appid
 * @returns {string}
 */
function decryptData(encryptedData, symmetricKey, algorithm, appid) {
    // AES密钥：
    // AESKey=Base64_Decode(EncodingAESKey + “=”)，EncodingAESKey尾部填充一个字符的“=”, 用Base64_Decode生成32个字节的AESKey
    let key = Buffer.from(symmetricKey + '=', 'base64');
    let iv = key.slice(0, 16);
    let aesCipher = __CRYPTO__.createDecipheriv(algorithm, key, iv);
    aesCipher.setAutoPadding(false);
    //  AES采用CBC模式，秘钥长度为32个字节（256位），数据采用PKCS#7填充
    //  PKCS#7：K为秘钥字节数（采用32），buf为待加密的内容，N为其字节数。Buf 需要被填充为K的整数倍
    //  在buf的尾部填充(K-N%K)个字节，每个字节的内容 是(K- N%K)
    let decipheredBuff = PKCS7Decoder(Buffer.concat([aesCipher.update(encryptedData, 'base64'), aesCipher.final()]));
    let rawMsg = decipheredBuff.slice(16);
    //  前4位为明文长度
    //  设置明文长度时，应通过Buf.writeUInt32BE写入，并转换为binary字符串
    //  读取时，使用Buf.readUInt32BE
    let msgLength = rawMsg.slice(0, 4).readUInt32BE(0);
    //  明文
    let result = rawMsg.slice(4, msgLength + 4).toString();
    //  第三方平台的APPID
    let appId = rawMsg.slice(msgLength + 4).toString();

    if (appId !== appid) {
        throw 'AppId is invalid';
    }

    return result;
}

/**
 * 消息体签名
 * 为了验证消息体的合法性，开放平台新增消息体签名，开发者可用以验证消息体的真实性，并对验证通过的消息体进行解密。
 * msg_signature=sha1(sort(Token、timestamp、nonce, msg_encrypt))
 *
 * @param token
 * @param timestamp
 * @param nonce
 * @param encrypt
 * @returns {*}
 */
function getSignature(token, timestamp, nonce, encrypt) {
    let rawSignature = [token, timestamp, nonce, encrypt].sort().join('');
    let sha1 = __CRYPTO__.createHash('sha1');
    sha1.update(rawSignature);
    return sha1.digest('hex');
}

/**
 * 消息体解密
 * 开发者先验证消息体签名的正确性，验证通过后，再对消息体进行解密
 *
 * @param msgSignature
 * @param token
 * @param timestamp
 * @param nonce
 * @param encrypt
 * @param symmetricKey
 * @param algorithm
 * @param appid
 * @returns {*|promise|C}
 */
function decryptMessage(msgSignature, timestamp, nonce, encrypt, token, symmetricKey, algorithm, appid) {
    const deferred = Q.defer();

    if (getSignature(token, timestamp, nonce, encrypt) !== msgSignature) {
        deferred.reject('msg_signature is not invalid');
    } else {
        try {
            deferred.resolve(decryptData(encrypt, symmetricKey, algorithm, appid));
        } catch (err) {
            deferred.reject(err);
        }
    }

    return deferred.promise;
}

module.exports = {
    getNonceStr: getNonceStr,
    getTimestamp: getTimestamp,
    generateRandomFileName: generateRandomFileName,
    concatSortArgs: concatSortArgs,
    convertToUrlParams: convertToUrlParams,
    checkBankNo: checkBankNo,
    checkBankCode: checkBankCode,
    getImageStr: getImageStr,
    /**
     *  使用RSA算法私钥加解密
     */
    getPublicKey: getPublicKey,
    publicEncrypt: publicEncrypt,
    privateDecrypt: privateDecrypt,
    /**
     *  消息体加解密
     */
    decryptMessage: decryptMessage
};

// console.log(publicEncrypt(convertToUrlParams({
//     appid: '234985728940723945',
//     timestamp: 15465148446,
//     token: 'sdklfjslkjlskfjlsakfjlsa'
// })))
// console.log(privateDecrypt('Nyp686ym5SPXB2yw+v4pO3S6rdU9IoZoWiPg9DkL/j9BBZfCn2xtLmu54wfxZe4bGoLLS7czaf00Wgxs8kfH9oACFBYPj+XVUenm67Am4hVeQPE8FZCjbqHeNZGXoC3eDO03Gupd/eDQMJMxjaosZNcOJTgOsPgVgpQAi4QjroY='));
// console.log(privateDecrypt('EvhsjRXrderMV6NhagUFZAUWStCk5qyJmoYpTx/P/gWVJ8d52rQgUr1VbDi5lim6GTLfpNvtfMdqSATBH2Fbj65qZLJgDaChzbL2AMXhQUQ0I1P95/b65e2KGqTM87mSVuWMTU6zDsqFUmSr3/1oQhFAeRr4Cd5vn8PcmaYkuOQ='));
// console.log(privateDecrypt('im99rES2sFfFDdiSbfcA88WK/RWe/9Sdxv03DbiqTyh15TBpUal7wGKYlxvOP0B3cwhVPvlaV/44me194d5RUxCoEJKuk3y8S5BvAeGarPQTt3cBkdMB4tMFDGoefcjUhFQ9ZsZ8JLwYsAAICDXvDKW9IG7tg/FaFNb5+JFB93k='));

//console.log(decryptData(
//    'XbuNBYgetGKAQzIQrO3Y1NzuhICBcF+H1xj4UpNDcOrOEz1a/BBWVaxc9PvXEH0cLOeHdD1tj7l0WV9rNTcIYJyp5ujaEscyv7v/JDYtc9GEvo7i/60QlIEsMBlmySaTVmAFpjTxwe3n0XamFFQm3hkqOR2XhZXqo103WykTRAvwNscBVaLPjplTli7rcGcAnbQ5NGwnA6MrbJ0Sgv0dieOg1aF2j3qLq/wBQXRz5YME1iMDgr2IOr/fad7B5yUhc5JX1hlmP05cJO+LCuwikLVTFXx7kS0c36umFo5dbq286ZqFm/cV6GOi2gYBcACrOyNcBSddktyXw9DvxQZJEaJ4f91nvu6Q56XYW3uD9ahfjPi8KGXPzV0+0MY6MCeGx0fhzqiMWMtkzEdyINaFQdH3pP+pMWx1p0O6cji5sUw4Eh3Tw9NneS1LnPMPwX0y/87lsvXethfHRp2OGOQauA=='
//));

// console.log(getSignature(
//     '1532675835',
//     '1418336492',
//     'XbuNBYgetGKAQzIQrO3Y1NzuhICBcF+H1xj4UpNDcOrOEz1a/BBWVaxc9PvXEH0cLOeHdD1tj7l0WV9rNTcIYJyp5ujaEscyv7v/JDYtc9GEvo7i/60QlIEsMBlmySaTVmAFpjTxwe3n0XamFFQm3hkqOR2XhZXqo103WykTRAvwNscBVaLPjplTli7rcGcAnbQ5NGwnA6MrbJ0Sgv0dieOg1aF2j3qLq/wBQXRz5YME1iMDgr2IOr/fad7B5yUhc5JX1hlmP05cJO+LCuwikLVTFXx7kS0c36umFo5dbq286ZqFm/cV6GOi2gYBcACrOyNcBSddktyXw9DvxQZJEaJ4f91nvu6Q56XYW3uD9ahfjPi8KGXPzV0+0MY6MCeGx0fhzqiMWMtkzEdyINaFQdH3pP+pMWx1p0O6cji5sUw4Eh3Tw9NneS1LnPMPwX0y/87lsvXethfHRp2OGOQauA=='
// ))

//decryptMessage(
//    'a6f5e8597e31d7bac2256c95f8187ea5f595699f',
//    '1544787241',
//    '2075577552',
//    '815MaXR9V/199rBLw3H6xAIrsfSySpNRPPE/0/plW3M09c+R80Xu39EAjZZYIkw/2LtSFD5P+PX0eyVnaBVWqnAgtPSwQAn4WKuXypVkiASV0dLoZdweiVrS4MLmjO0FjmIGPmaTnYpv4LMMOJVIMRKJEgz+QrW/MyE13OvvnB6FhFZeDeJcTx/Iq4s89SAvGLu3m40JYgdoQ0/OZaMQVJwLIXl+1IreeTj7biCYCGuA2vXm8LCeiYINfEmsJZCqzbe0j9XPdiuYXPzv+JSuZgnYxAD3qHW86E/zabSUzPmgHpsEGhf4zKvUnPGEY7BUSptVSn+N05eu9k1e54sVUkiX7nz81P9FTYge+DMNY7tD9LaFdgs+PYt6x+c6UTQnlsckhvwdmwA7XwCXxWw64FQdKP/KQv+7xDZHIKXveRr4uVhlbRgDlo/qq9ZvcPW8nyKYTH0YJSeweWwifouw46TeIxuciw1YAV9HthVJS7yPyCrClcfrI+vvoLWXQGtKDHDpSGsdkTN+ZVBitJ66RifMgwoWOool+iKaV33xibjiji+OMEG1BSPzQ/FLLj+3QoU4tnNVWsxVvh4Ybg9U8w6pux1Rvcm86UuSkkl2kucHjU94BQXm6xgLZ+SuJUVv0eYCTggrpdsmEfyAydp/49JFFw3fbMvYTmqPkxeGmmp7Sp7F9f/btTLi68ZFjoXj0oFTK94PJKN1GWomXj0u5vO6iPYrKZGzj1jtlFcefwXg5WNlozinNyCHTEDP4U3cBuN8MW1WO5eCggSdcvNb+AasUrIMAs8mJL349BY5RbPjnEZ3MnwQoNpKdHHNj6ocnprzTrNrZ7EtV86X1kdmcAYVGCVUUPp75NbjANGxlfrytOCjsJGgzrs1yRBiNl1sr5sQGz9aUO3IRNuTrdPnrQF3iS1b1BS4oUAmJ2jmJ4KTptn48SkGb6FwBt69DvYRrUd61DPCnQ6TkqfAz22ltK9GTY/Z0UtzE2yACzFk2pg0Ee/kfmZZ3RgV7r3FWDO8'
//).then(res => {
//    'use strict';
//    console.log(res);
//});

// { xml:
// { appid: 'wx4328d9d4893f7a2f',
//     encrypt:
//     'XbuNBYgetGKAQzIQrO3Y1NzuhICBcF+H1xj4UpNDcOrOEz1a/BBWVaxc9PvXEH0cLOeHdD1tj7l0WV9rNTcIYJyp5ujaEscyv7v/JDYtc9GEvo7i/60QlIEsMBlmySaTVmAFpjTxwe3n0XamFFQm3hkqOR2XhZXqo103WykTRAvwNscBVaLPjplTli7rcGcAnbQ5NGwnA6MrbJ0Sgv0dieOg1aF2j3qLq/wBQXRz5YME1iMDgr2IOr/fad7B5yUhc5JX1hlmP05cJO+LCuwikLVTFXx7kS0c36umFo5dbq286ZqFm/cV6GOi2gYBcACrOyNcBSddktyXw9DvxQZJEaJ4f91nvu6Q56XYW3uD9ahfjPi8KGXPzV0+0MY6MCeGx0fhzqiMWMtkzEdyINaFQdH3pP+pMWx1p0O6cji5sUw4Eh3Tw9NneS1LnPMPwX0y/87lsvXethfHRp2OGOQauA==' } }
// [2018-07-27T15:17:15.651] [DEBUG] backbone.route.js - {}
//     [2018-07-27T15:17:15.652] [DEBUG] backbone.route.js - { signature: 'cf8da8d147285746176c3573e60bfaa057c622de',
//     timestamp: '1532675835',
//     nonce: '1418336492',
//     encrypt_type: 'aes',
//     msg_signature: 'f9d4b135c60bc9ac27b4e2742991a20709283078' }

