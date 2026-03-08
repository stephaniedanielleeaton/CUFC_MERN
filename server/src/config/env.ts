import dotenv from 'dotenv';

dotenv.config();

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
}

export const env = {
  NODE_ENV: (process.env.NODE_ENV ?? 'development') as 'development' | 'production' | 'test',
  PORT: (() => {
    const port = Number(process.env.PORT ?? 3000);
    if (isNaN(port) || port < 1 || port > 65535) {
      throw new Error(`Invalid PORT: ${process.env.PORT ?? 'undefined'}. Must be a number between 1-65535`);
    }
    return port;
  })(),

  // Database
  MONGO_URI: required('MONGO_URI'),

  // Auth0
  AUTH0_SECRET: (() => {
    const secret = required('AUTH0_SECRET');
    if (secret.length < 32) {
      throw new Error('AUTH0_SECRET must be at least 32 characters');
    }
    return secret;
  })(),
  AUTH0_DOMAIN: (() => {
    const domain = required('AUTH0_DOMAIN');
    if (!domain.match(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
      throw new Error(`Invalid AUTH0_DOMAIN format: ${domain}`);
    }
    return domain;
  })(),
  AUTH0_CLIENT_ID: required('AUTH0_CLIENT_ID'),
  AUTH0_CLIENT_SECRET: required('AUTH0_CLIENT_SECRET'),
  AUTH0_AUDIENCE: required('AUTH0_AUDIENCE'),
  APP_BASE_URL: (() => {
    const url = required('APP_BASE_URL');
    try {
      new URL(url);
      return url;
    } catch {
      throw new Error(`Invalid APP_BASE_URL format: ${url}`);
    }
  })(),

  // Square
  SQUARE_ACCESS_TOKEN: required('SQUARE_ACCESS_TOKEN'),
  SQUARE_RETAIL_LOCATION_ID: required('SQUARE_RETAIL_LOCATION_ID'),
  SQUARE_ENVIRONMENT: required('SQUARE_ENVIRONMENT'),
  INTRO_CLASS_CATALOG_OBJECT_ID: required('INTRO_CLASS_CATALOG_OBJECT_ID'),
  DROP_IN_CATALOG_OBJECT_ID: required('DROP_IN_CATALOG_OBJECT_ID'),

  // Optional
  SQUARE_SIGNATURE_KEY: process.env.SQUARE_SIGNATURE_KEY ?? '',
} as const;