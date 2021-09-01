const redis = {
	host: process.env.REDIS_HOST,
	port: process.env.REDIS_PORT,
	db: process.env.REDIS_DB,
	password: process.env.REDIS_PASSWORD,
	keyPrefix: process.env.REDIS_KEYPREFIX
}

const redisKue = {
	prefix: process.env.REDIS_KEYPREFIX+'_JOB', 
	redis: {
		host: process.env.REDIS_HOST,
		port: process.env.REDIS_PORT,
		db: process.env.REDIS_DB_JOB,
		auth: process.env.REDIS_PASSWORD
	}
};

const pg = {
	host: process.env.PG_HOST,
	port: process.env.PG_PORT,
	database: process.env.PG_DATABASE,
	user: process.env.PG_USER,
	password: process.env.PG_PASSWORD
}

module.exports = {
    redis,
    pg,
    redisKue
}
