const redis = {
	host: process.env.PAYPOST_REDIS_HOST || '183.91.11.56',
	port: process.env.PAYPOST_REDIS_PORT || 6379,
	db: process.env.PAYPOST_REDIS_DB || 7,
	password: process.env.PAYPOST_REDIS_PASSWORD || 'CMCts@2019',
	keyPrefix: process.env.PAYPOST_REDIS_KEYPREFIX || 'VNP'
};

const redisKue = {
	prefix: process.env.PAYPOST_REDIS_KUE_KEYPREFIX || 'VNP_JOB' , 
	redis: {
		host: process.env.PAYPOST_REDIS_HOST || '183.91.11.56',
		port: process.env.PAYPOST_REDIS_PORT || 6379,
		db: process.env.PAYPOST_REDIS_DB_JOB || 8,
		auth: process.env.PAYPOST_REDIS_PASSWORD || 'CMCts@2019'
	}
};

const pg = {
	host: process.env.PAYPOST_PG_HOST || '183.91.11.56',
	port: process.env.PAYPOST_PG_PORT || 5432,
	database: process.env.PAYPOST_PG_DATABASE || 'vnp_gateway',
	user: process.env.PAYPOST_PG_USER || 'postgres',
    password: process.env.PAYPOST_PG_PASSWORD || 'CMCSI@2018'
}

module.exports = {
    redis,
    pg,
	redisKue
}
