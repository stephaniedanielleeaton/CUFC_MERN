interface Environment {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT?: string;
  SQUARE_ACCESS_TOKEN: string;
  SQUARE_RETAIL_LOCATION_ID: string;
  SINGLE_CLASS_CATALOG_OBJECT_ID: string;
  INTRO_CLASS_CATALOG_OBJECT_ID: string;
  CLIENT_URL: string;
  MERCHANT_SUPPORT_EMAIL: string;
  MONGODB_URI: string;
  AUTH0_DOMAIN: string;
  AUTH0_AUDIENCE: string;
}

// Helper function to get required env var with error
function getRequiredEnv(key: keyof Environment): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value;
}

// Helper function to get optional env var with default
function getOptionalEnv(key: keyof Environment, defaultValue: string = ''): string {
  return process.env[key] || defaultValue;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV as Environment['NODE_ENV'] || 'development',
  PORT: getOptionalEnv('PORT', '3001'),
  SQUARE_ACCESS_TOKEN: getRequiredEnv('SQUARE_ACCESS_TOKEN'),
  SQUARE_RETAIL_LOCATION_ID: getRequiredEnv('SQUARE_RETAIL_LOCATION_ID'),
  SINGLE_CLASS_CATALOG_OBJECT_ID: getRequiredEnv('SINGLE_CLASS_CATALOG_OBJECT_ID'),
  INTRO_CLASS_CATALOG_OBJECT_ID: getRequiredEnv('INTRO_CLASS_CATALOG_OBJECT_ID'),
  CLIENT_URL: getRequiredEnv('CLIENT_URL'),
  MERCHANT_SUPPORT_EMAIL: getRequiredEnv('MERCHANT_SUPPORT_EMAIL'),
  MONGODB_URI: getRequiredEnv('MONGODB_URI'),
  AUTH0_DOMAIN: getRequiredEnv('AUTH0_DOMAIN'),
  AUTH0_AUDIENCE: getRequiredEnv('AUTH0_AUDIENCE'),
};