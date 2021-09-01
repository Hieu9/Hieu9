// 0: error, 1: warn, 2: info, 3: verbose, 4: debug, 5: silly
var path = require('path');
var winston = require('winston');
var moment = require('moment-timezone');
require('winston-daily-rotate-file');

var transport = new (winston.transports.DailyRotateFile)({
  filename: path.join('./', 'logs', '%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '500m',
  maxFiles: '7d'
});

// instantiate a new Winston Logger with the settings defined above
const MESSAGE = Symbol.for('message');

const jsonFormatter = (logEntry) => {
  const base = { timestamp: moment(new Date()).tz("Asia/Ho_Chi_Minh").format("DD-MM-YYYY HH:mm:ss Z") };
  const json = Object.assign(base, logEntry)
  logEntry[MESSAGE] = JSON.stringify(json);
  return logEntry;
}

var logger = winston.createLogger({
  format: winston.format(jsonFormatter)(),
  transports: [
    transport
  ],
  exitOnError: false, // do not exit on handled exceptions
});

if (process.env.NODE_ENV !== 'prod') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// create a stream object with a 'write' function that will be used by `morgan`
logger.stream = {
  write: function(message, encoding) {
    // logger.info(message);
    // logger.info('------------***--------------');
  },
};

module.exports = logger;