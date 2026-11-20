'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./docs/swagger');
const requestLogger = require('./utils/logger');
const router = require('./routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const config = require('./config');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Interactive API docs at /api-docs; raw JSON spec at /api-docs.json
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api-docs.json', (_req, res) => res.json(swaggerSpec));

app.use(config.apiPrefix, router);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
