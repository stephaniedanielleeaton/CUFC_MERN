import dotenv from 'dotenv';
import { SquareEnvironment } from 'square';
dotenv.config();

const getRequiredEnvironmentVariable = (environmentVariableName: string): string => {
  const value = process.env[environmentVariableName];

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${environmentVariableName}`
    );
  }

  return value;
};

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: Number(process.env.PORT ?? 3000),

  MONGO_URI: getRequiredEnvironmentVariable('MONGO_URI'),

  AUTH0_SECRET: getRequiredEnvironmentVariable('AUTH0_SECRET'),
  AUTH0_DOMAIN: getRequiredEnvironmentVariable('AUTH0_DOMAIN'),
  AUTH0_CLIENT_ID: getRequiredEnvironmentVariable('AUTH0_CLIENT_ID'),
  AUTH0_CLIENT_SECRET: getRequiredEnvironmentVariable('AUTH0_CLIENT_SECRET'),
  AUTH0_AUDIENCE: getRequiredEnvironmentVariable('AUTH0_AUDIENCE'),
  APP_BASE_URL: getRequiredEnvironmentVariable('APP_BASE_URL'),

  SQUARE_ACCESS_TOKEN: getRequiredEnvironmentVariable('SQUARE_ACCESS_TOKEN'),
  SQUARE_RETAIL_LOCATION_ID: getRequiredEnvironmentVariable('SQUARE_RETAIL_LOCATION_ID'),
  SQUARE_ENVIRONMENT: process.env.SQUARE_ENVIRONMENT === 'sandbox' ? SquareEnvironment.Sandbox : SquareEnvironment.Production,
  INTRO_CLASS_CATALOG_OBJECT_ID: getRequiredEnvironmentVariable('INTRO_CLASS_CATALOG_OBJECT_ID'),
  DROP_IN_CATALOG_OBJECT_ID: getRequiredEnvironmentVariable('DROP_IN_CATALOG_OBJECT_ID'),

  EMAIL_ACCOUNT: process.env.EMAIL_ACCOUNT,
  EMAIL_PASS: process.env.EMAIL_PASS,

  SQUARE_SIGNATURE_KEY: process.env.SQUARE_SIGNATURE_KEY ?? '',

  M2_CLIENT_ID: process.env.M2_CLIENT_ID ?? '',
  M2_CLIENT_SECRET: process.env.M2_CLIENT_SECRET ?? '',
  M2_BASE_URL: process.env.M2_BASE_URL ?? 'https://www.meyersquared.com/api/v1',
  M2_AUTH_URL: process.env.M2_AUTH_URL ?? 'https://meyer-squared.us.auth0.com/oauth/token',
  M2_CLUB_ID: Number(process.env.M2_CLUB_ID ?? 10),
  M2_AUDIENCE: process.env.M2_AUDIENCE ?? 'https://meyersquared.com',
  USE_M2_STUB: process.env.USE_M2_STUB === 'true',
};