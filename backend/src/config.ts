// Mapper for environment variables
export const environment = process.env.NODE_ENV;
export const port = process.env.PORT;

export const db = {
  uri: process.env.DATABASE_URL || '',
};

export const corsUrl = process.env.CORS_URL;

export const tokenInfo = {
  accessTokenValidityDays: parseInt(process.env.ACCESS_TOKEN_VALIDITY_SEC || '0'),
  refreshTokenValidityDays: parseInt(process.env.REFRESH_TOKEN_VALIDITY_SEC || '0'),
  issuer: process.env.TOKEN_ISSUER || '',
  audience: process.env.TOKEN_AUDIENCE || '',
};

export const logDirectory = process.env.LOG_DIR;

export const redis = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
};

export const newRelic = {
  appName: process.env.NEW_RELIC_APP_NAME || 'ride-hailing-platform',
  licenseKey: process.env.NEW_RELIC_LICENSE_KEY || '',
};

export const fareRates = {
  ECONOMY: parseFloat(process.env.FARE_RATE_ECONOMY || '1.0'), // $1 per km
  PREMIUM: parseFloat(process.env.FARE_RATE_PREMIUM || '2.0'), // $2 per km
};

