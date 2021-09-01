const redis = {
	host: process.env.BCCP_REDIS_HOST || '183.91.11.56',
	port: process.env.BCCP_REDIS_PORT || 6379,
	db: process.env.BCCP_PULL_REDIS_DB || 2,
	password: process.env.BCCP_REDIS_PASSWORD || 'CMCts@2019',
	keyPrefix: process.env.BCCP_REDIS_KEYPREFIX || 'VNP'
};

const redisKue = {
	prefix: process.env.BCCP_KUE_REDIS_KEYPREFIX || 'VNP_JOB' , 
	redis: {
		host: process.env.BCCP_REDIS_HOST || '183.91.11.56',
		port: process.env.BCCP_REDIS_PORT || 6379,
		db: process.env.BCCP_PULL_REDIS_DB_JOB || 6,
		auth: process.env.BCCP_REDIS_PASSWORD || 'CMCts@2019'
	}
};

const redisSf = {
	host: process.env.BCCP_REDIS_HOST || '183.91.11.56',
	port: process.env.BCCP_REDIS_PORT || 6379,
	db: process.env.BCCP_SF_REDIS_DB || 11,
	password: process.env.BCCP_REDIS_PASSWORD || 'CMCts@2019',
	keyPrefix: process.env.BCCP_REDIS_KEYPREFIX || 'VNP'
};

const redisSfKue = {
	prefix: process.env.BCCP_KUE_REDIS_KEYPREFIX || 'VNP_JOB' , 
	redis: {
		host: process.env.BCCP_REDIS_HOST || '183.91.11.56',
		port: process.env.BCCP_REDIS_PORT || 6379,
		db: process.env.BCCP_SF_KUE_REDIS_DB_JOB || 12,
		auth: process.env.BCCP_REDIS_PASSWORD || 'CMCts@2019'
	}
};

const pg = {
	host: process.env.BCCP_PG_HOST || '183.91.11.56',
	port: process.env.BCCP_PG_PORT || 5432,
	database: process.env.BCCP_PG_DATABASE || 'vnp_gateway',
	user: process.env.BCCP_PG_USER || 'postgres',
    password: process.env.BCCP_PG_PASSWORD || 'CMCSI@2018'
}

module.exports = {
    redis,
    pg,
	redisKue,
	redisSf,
	redisSfKue
}
