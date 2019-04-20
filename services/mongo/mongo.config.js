const config = {
    /**
     *  ECS自建MongoDB环境配置
     */
    HOST: '106.14.149.225',
    PORT: '8848',
    /**
     *  阿里云数据库 MongoDB
     */
    PRIMARY_HOST: 'dds-uf67431e240ac7941.mongodb.rds.aliyuncs.com',
    PRIMARY_PORT: 3717,
    SECONDARY_HOST: 'dds-uf67431e240ac7942.mongodb.rds.aliyuncs.com',
    SECONDARY_PORT: 3717,
    REPLICA_SET_NAME: 'mgset-13022571',
    DATABASE_NAME_ADMIN: 'admin',
    USER_ADMIN: 'butler',
    PASSWORD_ADMIN: 'BigUp@2019'
};

module.exports = {
    PARAMS: config
};