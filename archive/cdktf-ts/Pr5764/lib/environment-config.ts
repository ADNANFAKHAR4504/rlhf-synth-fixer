/**
 * Environment-specific configuration interface
 */
export interface EnvironmentConfig {
  environment: string;
  dynamodbReadCapacity: number;
  dynamodbWriteCapacity: number;
  lambdaMemorySize: number;
  logRetentionDays: number;
}

/**
 * Get configuration for a specific environment
 */
export function getEnvironmentConfig(env: string): EnvironmentConfig {
  const configs: { [key: string]: EnvironmentConfig } = {
    dev: {
      environment: 'dev',
      dynamodbReadCapacity: 5,
      dynamodbWriteCapacity: 5,
      lambdaMemorySize: 128,
      logRetentionDays: 7,
    },
    staging: {
      environment: 'staging',
      dynamodbReadCapacity: 10,
      dynamodbWriteCapacity: 10,
      lambdaMemorySize: 256,
      logRetentionDays: 30,
    },
    prod: {
      environment: 'prod',
      dynamodbReadCapacity: 25,
      dynamodbWriteCapacity: 25,
      lambdaMemorySize: 512,
      logRetentionDays: 90,
    },
  };

  if (!configs[env]) {
    throw new Error(
      `Invalid environment: ${env}. Must be one of: dev, staging, prod`
    );
  }

  return configs[env];
}

/**
 * Validate environment name
 */
export function validateEnvironment(env: string): void {
  const validEnvironments = ['dev', 'staging', 'prod'];
  if (!validEnvironments.includes(env)) {
    throw new Error(
      `Invalid environment: ${env}. Must be one of: ${validEnvironments.join(', ')}`
    );
  }
}
