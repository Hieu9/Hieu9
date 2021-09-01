const axios = require('axios'),
	{ redis } = require('../libs/db'),
	objectConfigs = require('../configs/object');

const Expired_Redis = 3600;

exports.getData = async (object, key) => {
	try{
		let newPost = {
			token: process.env.BCCP_TOKEN,
			data: objectConfigs.object[object],
			key: process.env.BCCP_KEY
		};
		const resp = await axios.post(process.env.BCCP_URL, newPost, { headers: { 'Content-Type': 'application/json' } });
		return resp.data;
	}catch (e){
		console.log(e.stack);
		await redis.s(`${process.env.REDIS_KEYPREFIX}:fail:job:${new Date().toISOString().slice(0,10)}:pullBccpData:${e.message}-${Date.now()}`, {
			error: e.stack,
			name: e.name
		}, Expired_Redis);
	}
}