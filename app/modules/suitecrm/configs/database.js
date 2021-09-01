const redis = {
	host: process.env.SCRM_REDIS_HOST || '183.91.11.56',
	port: process.env.SCRM_REDIS_PORT || 6379,
	db: process.env.SCRM_REDIS_DB || 10,
	password: process.env.SCRM_REDIS_PASSWORD || 'CMCts@2019',
	keyPrefix: process.env.SCRM_REDIS_KEYPREFIX || 'VNP'
}

const redisKue = {
	prefix: process.env.SCRM_REDIS_KEYPREFIX || 'VNP_JOB' , 
	redis: {
		host: process.env.SCRM_REDIS_HOST || '183.91.11.56',
		port: process.env.SCRM_REDIS_PORT || 6379,
		db: process.env.SCRM_REDIS_DB_JOB || 11,
		auth: process.env.SCRM_REDIS_PASSWORD || 'CMCts@2019'
	}
};

const pg = {
	host: process.env.SCRM_PG_HOST || '183.91.11.56',
	port: process.env.SCRM_PG_PORT || 5432,
	database: process.env.SCRM_PG_DATABASE || 'vnp_gateway',
	user: process.env.SCRM_PG_USER || 'postgres',
    password: process.env.SCRM_PG_PASSWORD || 'CMCSI@2018'
}

const mysql = {
	host: process.env.SCRM_MYSQL_HOST || '183.91.11.54',
	port: process.env.SCRM_MYSQL_PORT || 3306,
	database: process.env.SCRM_MYSQL_DATABASE || 'suitecrm',
	user: process.env.SCRM_MYSQL_USER || 'root',
	password: process.env.SCRM_MYSQL_PASSWORD || 'CMCts.992020'
}

module.exports = {
    redis,
    pg,
    redisKue,
    mysql
}
