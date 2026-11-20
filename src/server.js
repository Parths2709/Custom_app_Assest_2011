'use strict';

const app = require('./app');
const config = require('./config');

const server = app.listen(config.port, () => {
  console.log(
    `[server] F1-US01-CRUD Backend running on port ${config.port} (${config.env})`
  );
  console.log(
    `[server] API docs → http://localhost:${config.port}/api-docs`
  );
  console.log(
    `[server] Health   → http://localhost:${config.port}${config.apiPrefix}/health`
  );
});

process.on('SIGTERM', () => {
  server.close(() => {
    console.log('[server] Graceful shutdown complete');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  server.close(() => {
    console.log('[server] Graceful shutdown complete');
    process.exit(0);
  });
});
