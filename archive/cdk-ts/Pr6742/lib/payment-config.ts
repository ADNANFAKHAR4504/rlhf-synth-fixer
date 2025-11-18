/**
 * Environment-specific configuration for payment processing infrastructure
 */
export interface EnvironmentConfig {
  /** VPC CIDR block for the environment */
  vpcCidr: string;
  /** RDS instance type */
  dbInstanceType: string;
  /** SQS message retention period in days */
  messageRetentionDays: number;
  /** S3 lifecycle expiration in days */
  s3LifecycleDays: number;
  /** Environment name */
  environment: string;
  /** Custom domain name (if applicable) */
  customDomain?: string;
}

/**
 * Configuration for each environment
 * Maps environment suffix to specific configuration values
 */
export const ENV_CONFIGS: Record<string, EnvironmentConfig> = {
  dev: {
    vpcCidr: '10.0.0.0/16',
    dbInstanceType: 'db.t3.medium',
    messageRetentionDays: 1,
    s3LifecycleDays: 7,
    environment: 'dev',
  },
  staging: {
    vpcCidr: '10.1.0.0/16',
    dbInstanceType: 'db.r5.large',
    messageRetentionDays: 7,
    s3LifecycleDays: 30,
    environment: 'staging',
  },
  prod: {
    vpcCidr: '10.2.0.0/16',
    dbInstanceType: 'db.r5.xlarge',
    messageRetentionDays: 14,
    s3LifecycleDays: 90,
    environment: 'prod',
  },
  pr6742: {
    vpcCidr: '10.3.0.0/16',
    dbInstanceType: 'db.t3.medium',
    messageRetentionDays: 1,
    s3LifecycleDays: 7,
    environment: 'pr6742',
  },
};

/**
 * Validates that the environment configuration exists
 * @param environmentSuffix The environment suffix to validate
 * @throws Error if configuration not found
 */
export function validateEnvironmentConfig(environmentSuffix: string): void {
  if (!ENV_CONFIGS[environmentSuffix]) {
    throw new Error(
      `Environment configuration not found for: ${environmentSuffix}. ` +
        `Available environments: ${Object.keys(ENV_CONFIGS).join(', ')}`
    );
  }
}

/**
 * Gets configuration for a specific environment
 * @param environmentSuffix The environment suffix
 * @returns The environment configuration
 */
export function getEnvironmentConfig(
  environmentSuffix: string
): EnvironmentConfig {
  validateEnvironmentConfig(environmentSuffix);
  return ENV_CONFIGS[environmentSuffix];
}
