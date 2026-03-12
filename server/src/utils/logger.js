const fs = require('fs');
const path = require('path');

const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logFile = path.join(logDir, 'app.log');

const formatLog = (level, message, data) => {
  const timestamp = new Date().toISOString();
  const extra = data ? ' ' + JSON.stringify(data) : '';
  const logMessage = `[${timestamp}] [${level}] ${message}${extra}\n`;
  
  // Append to file
  fs.appendFileSync(logFile, logMessage);
  
  return logMessage;
};

const logger = {
  info: (msg, data) => { process.stdout.write(formatLog('INFO', msg, data)); },
  warn: (msg, data) => { process.stdout.write(formatLog('WARN', msg, data)); },
  error: (msg, data) => { process.stderr.write(formatLog('ERROR', msg, data)); },
};

module.exports = { logger };
