import dotenv from 'dotenv';
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
  SQUARE_ENVIRONMENT: getRequiredEnvironmentVariable('SQUARE_ENVIRONMENT'),
  INTRO_CLASS_CATALOG_OBJECT_ID: getRequiredEnvironmentVariable('INTRO_CLASS_CATALOG_OBJECT_ID'),
  DROP_IN_CATALOG_OBJECT_ID: getRequiredEnvironmentVariable('DROP_IN_CATALOG_OBJECT_ID'),
};