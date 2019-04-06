import Server from './server';
import logger from './logger';

const server = new Server({ port: 3000 });

server
  .setCreateSession(defaultSession => defaultSession)
  .setHookAfterSessionCreation(() => {})
  .setHookAfterSocketInitialization(() => {})
  .on('dummyEvent', session => (payload) => {
    logger.info(`${session}: ${payload}`);
    throw new Error('This is test error');
  }, (err, { session, payload }) => {
    logger.info(`${err}, ${session}, ${payload}`);
    throw err;
  })
  .on('errorEvent', () => () => {
    throw new Error('This is error in errorEvent');
  })
  .start();
