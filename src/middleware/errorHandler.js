'use strict';

const config = require('../config');

module.exports = (err, req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    error: {
      status,
      message,
      ...(config.env !== 'production' && { stack: err.stack }),
    },
  });
};
