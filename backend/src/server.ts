// New Relic must be first import
import 'newrelic';

import Logger from './core/Logger';
import { port } from './config';
import app from './app';

const server = app
  .listen(port, () => {
    Logger.info(`server running on port : ${port}`);
  })
  .on('error', (e) => Logger.error(e));

process.on('uncaughtException', (e) => {
  Logger.error(e);
});

process.on('SIGTERM', () => {
  Logger.info('SIGTERM received');
  server.close();
});
