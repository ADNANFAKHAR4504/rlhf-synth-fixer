/**
 * Environment-specific configuration for infrastructure resources.
 * This interface defines all the parameters that vary between environments.
 */
export interface EnvironmentConfig {
  // VPC Configuration
  vpcCidr: string;
  availabilityZones: string[];

  // RDS Configuration
  rdsInstanceClass: string;
  rdsAllocatedStorage: number;
  rdsMultiAz: boolean;
  rdsBackupRetentionDays: number;
  rdsCpuAlarmThreshold: number;

  // S3 Configuration
  s3LifecycleRetentionDays: number;

  // Lambda Configuration
  lambdaMemorySize: number;
  lambdaTimeout: number;

  // CloudWatch Configuration
  logRetentionDays: number;

  // Common Configuration
  environment: string;
  tags: { [key: string]: string };
}

/**
 * Get environment-specific configuration based on the environment suffix.
 * This function validates that all required configuration values are present.
 *
 * @param environmentSuffix - The environment identifier (dev, staging, prod)
 * @returns Environment-specific configuration object
 * @throws Error if required configuration values are missing
 */
export function getEnvironmentConfig(
  environmentSuffix: string
): EnvironmentConfig {
  // Define environment-specific configurations
  const environmentConfigs: { [key: string]: EnvironmentConfig } = {
    dev: {
      vpcCidr: '10.0.0.0/16',
      availabilityZones: ['us-east-1a', 'us-east-1b'],
      rdsInstanceClass: 'db.t3.micro',
      rdsAllocatedStorage: 20,
      rdsMultiAz: false,
      rdsBackupRetentionDays: 1,
      rdsCpuAlarmThreshold: 80,
      s3LifecycleRetentionDays: 7,
      lambdaMemorySize: 128,
      lambdaTimeout: 30,
      logRetentionDays: 7,
      environment: 'dev',
      tags: {
        Environment: 'dev',
        ManagedBy: 'Pulumi',
        CostCenter: 'Engineering',
      },
    },
    staging: {
      vpcCidr: '10.1.0.0/16',
      availabilityZones: ['us-east-1a', 'us-east-1b'],
      rdsInstanceClass: 'db.t3.small',
      rdsAllocatedStorage: 50,
      rdsMultiAz: true,
      rdsBackupRetentionDays: 1,
      rdsCpuAlarmThreshold: 75,
      s3LifecycleRetentionDays: 30,
      lambdaMemorySize: 256,
      lambdaTimeout: 60,
      logRetentionDays: 30,
      environment: 'staging',
      tags: {
        Environment: 'staging',
        ManagedBy: 'Pulumi',
        CostCenter: 'Engineering',
      },
    },
    prod: {
      vpcCidr: '10.2.0.0/16',
      availabilityZones: ['us-east-1a', 'us-east-1b'],
      rdsInstanceClass: 'db.t3.medium',
      rdsAllocatedStorage: 100,
      rdsMultiAz: true,
      rdsBackupRetentionDays: 1,
      rdsCpuAlarmThreshold: 70,
      s3LifecycleRetentionDays: 90,
      lambdaMemorySize: 512,
      lambdaTimeout: 120,
      logRetentionDays: 90,
      environment: 'prod',
      tags: {
        Environment: 'prod',
        ManagedBy: 'Pulumi',
        CostCenter: 'Engineering',
      },
    },
  };

  // Check if we have a direct match for the environment
  let envConfig = environmentConfigs[environmentSuffix];

  // If no direct match, use 'dev' as the base configuration for dynamic environments
  // This supports PR-specific environments like 'synthXXXXXX' or 'prXXXX'
  if (!envConfig) {
    envConfig = { ...environmentConfigs.dev };
    envConfig.environment = environmentSuffix;
    envConfig.tags = {
      ...environmentConfigs.dev.tags,
      Environment: environmentSuffix,
    };
  }

  // Validate that all required configuration values are present
  validateConfig(envConfig);

  return envConfig;
}

/**
 * Validate that all required configuration values are present and valid.
 *
 * @param config - The environment configuration to validate
 * @throws Error if any required values are missing or invalid
 */
export function validateConfig(config: EnvironmentConfig): void {
  const requiredFields: (keyof EnvironmentConfig)[] = [
    'vpcCidr',
    'availabilityZones',
    'rdsInstanceClass',
    'rdsAllocatedStorage',
    'rdsMultiAz',
    'rdsBackupRetentionDays',
    'rdsCpuAlarmThreshold',
    's3LifecycleRetentionDays',
    'lambdaMemorySize',
    'lambdaTimeout',
    'logRetentionDays',
    'environment',
  ];

  const missingFields: string[] = [];

  for (const field of requiredFields) {
    if (config[field] === undefined || config[field] === null) {
      missingFields.push(field);
    }
  }

  if (missingFields.length > 0) {
    throw new Error(
      `Missing required configuration values: ${missingFields.join(', ')}`
    );
  }

  // Validate specific field constraints
  if (config.availabilityZones.length < 2) {
    throw new Error('At least 2 availability zones are required');
  }

  if (config.lambdaMemorySize < 128 || config.lambdaMemorySize > 10240) {
    throw new Error('Lambda memory size must be between 128 and 10240 MB');
  }

  if (config.lambdaTimeout < 1 || config.lambdaTimeout > 900) {
    throw new Error('Lambda timeout must be between 1 and 900 seconds');
  }
}
