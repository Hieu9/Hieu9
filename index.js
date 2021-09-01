process.env.UV_THREADPOOL_SIZE = 128;

require('dotenv').config();

const http = require('http');
const app = require('./app/index');

const port = process.env.PORT || 9001;

const server = http.createServer(app);

server.listen(port);

process.on('uncaughtException', (err) => {
    console.log('------------ BUG EXCEPTION ----------');
    console.log(err);
});

console.log(` ⭐ 🌟  VNPOST GATEWAY System is ONLINE 🌟 ⭐ \n\n  🚂   The VNPOST GATEWAY System is running on port: ${port} `);