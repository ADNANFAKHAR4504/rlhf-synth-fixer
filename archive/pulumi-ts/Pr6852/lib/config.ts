import { EnvironmentConfig, ResourceTags } from './types';

/**
 * Environment-specific configurations
 */
export const environmentConfigs: Record<string, EnvironmentConfig> = {
  dev: {
    environment: 'dev',
    vpcCidr: '10.0.0.0/16',
    rdsInstanceClass: 'db.t3.micro',
    apiGatewayRateLimit: 100,
    dynamoReadCapacity: 5,
    dynamoWriteCapacity: 5,
    s3RetentionDays: 7,
    cloudWatchThreshold: 80,
    kmsKeyAlias: 'alias/dev-key',
  },
  staging: {
    environment: 'staging',
    vpcCidr: '10.1.0.0/16',
    rdsInstanceClass: 'db.t3.small',
    apiGatewayRateLimit: 500,
    dynamoReadCapacity: 10,
    dynamoWriteCapacity: 10,
    s3RetentionDays: 30,
    cloudWatchThreshold: 70,
    kmsKeyAlias: 'alias/staging-key',
  },
  prod: {
    environment: 'prod',
    vpcCidr: '10.2.0.0/16',
    rdsInstanceClass: 'db.m5.large',
    apiGatewayRateLimit: 2000,
    dynamoReadCapacity: 50,
    dynamoWriteCapacity: 50,
    s3RetentionDays: 90,
    cloudWatchThreshold: 60,
    kmsKeyAlias: 'alias/prod-key',
  },
};

/**
 * Get configuration for a specific environment
 */
export function getEnvironmentConfig(env: string): EnvironmentConfig {
  const config = environmentConfigs[env];
  if (!config) {
    throw new Error(
      `Unknown environment: ${env}. Valid values: dev, staging, prod`
    );
  }
  return config;
}

/**
 * Generate standard resource tags
 */
export function getResourceTags(environment: string): ResourceTags {
  return {
    Environment: environment,
    ManagedBy: 'Pulumi',
    CostCenter: 'Engineering',
  };
}
