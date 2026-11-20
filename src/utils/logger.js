'use strict';

const morgan = require('morgan');
const config = require('../config');

// Use `combined` (Apache format) in production so log aggregators can parse it;
// use `dev` locally for coloured, concise output.
const format = config.env === 'production' ? 'combined' : 'dev';

module.exports = morgan(format);
