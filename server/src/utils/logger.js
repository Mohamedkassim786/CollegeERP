const fs = require('fs');
const path = require('path');

const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logFile = path.join(logDir, 'app.log');

const formatLog = (level, message, data) => {
  const timestamp = new Date().toISOString();
  let extra = '';
  
  if (data instanceof Error) {
    extra = ` ${data.message}\n${data.stack}`;
  } else if (data) {
    try {
      extra = ' ' + JSON.stringify(data, (key, value) => 
        value instanceof Error ? { message: value.message, stack: value.stack } : value
      );
    } catch (e) {
      extra = ' [unserializable]';
    }
  }
  
  return `[${timestamp}] [${level}] ${message}${extra}\n`;
};

const writeLog = (logMessage) => {
  fs.appendFile(logFile, logMessage, (err) => {
    if (err) {
      process.stderr.write(`Logger error: ${err.message}\n`);
    }
  });
};

const logger = {
  info: (msg, data) => {
    const log = formatLog('INFO', msg, data);
    process.stdout.write(log);
    writeLog(log);
  },
  warn: (msg, data) => {
    const log = formatLog('WARN', msg, data);
    process.stdout.write(log);
    writeLog(log);
  },
  error: (msg, data) => {
    const log = formatLog('ERROR', msg, data);
    process.stderr.write(log);
    writeLog(log);
  }
};

module.exports = { logger };
