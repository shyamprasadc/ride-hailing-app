import { createClient } from 'redis';
import Logger from './Logger';
import { redis as redisConfig } from '../config';

// Redis Client Singleton
let redisClient: ReturnType<typeof createClient> | null = null;

export const getRedisClient = async () => {
  if (!redisClient) {
    redisClient = createClient({
      socket: {
        host: redisConfig.host,
        port: redisConfig.port,
      },
      password: redisConfig.password,
    });

    redisClient.on('error', (err) => {
      Logger.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      Logger.info('Redis Client Connected');
    });

    await redisClient.connect();
  }

  return redisClient;
};

export const closeRedisClient = async () => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
};

export default getRedisClient;
