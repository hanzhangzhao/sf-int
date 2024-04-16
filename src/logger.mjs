import config from 'config';
import pino from 'pino';

const loggerConfig = config.get('logger');

const logger = pino({
  ...loggerConfig,
});

export { logger };
