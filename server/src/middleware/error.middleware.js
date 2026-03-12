const { logger } = require('../utils/logger.js');

const notFound = (req, res) =>
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });

const globalError = (err, req, res, next) => {
  logger.error(`Unhandled error on ${req.method} ${req.originalUrl}`, err);
  res.status(500).json({ success: false, message: 'Internal server error' });
};

module.exports = { notFound, globalError };
