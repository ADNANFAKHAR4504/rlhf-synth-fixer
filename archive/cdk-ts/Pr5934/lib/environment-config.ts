export interface EnvironmentConfig {
  vpcCidr: string;
  maxAzs: number;
  rdsInstanceClass: string;
  rdsBackupRetention: number;
  rdsMultiAz: boolean;
  lambdaMemorySize: number;
  logRetention: number;
  s3Versioning: boolean;
  dynamodbBillingMode: 'PAY_PER_REQUEST' | 'PROVISIONED';
  dynamodbReadCapacity?: number;
  dynamodbWriteCapacity?: number;
}

const configs: Record<string, EnvironmentConfig> = {
  dev: {
    vpcCidr: '10.0.0.0/16',
    maxAzs: 2,
    rdsInstanceClass: 'db.t3.micro',
    rdsBackupRetention: 7,
    rdsMultiAz: false,
    lambdaMemorySize: 512,
    logRetention: 7,
    s3Versioning: false,
    dynamodbBillingMode: 'PAY_PER_REQUEST',
  },
  staging: {
    vpcCidr: '10.1.0.0/16',
    maxAzs: 2,
    rdsInstanceClass: 'db.t3.small',
    rdsBackupRetention: 14,
    rdsMultiAz: false,
    lambdaMemorySize: 1024,
    logRetention: 30,
    s3Versioning: true,
    dynamodbBillingMode: 'PAY_PER_REQUEST',
  },
  prod: {
    vpcCidr: '10.2.0.0/16',
    maxAzs: 2,
    rdsInstanceClass: 'db.r5.large',
    rdsBackupRetention: 30,
    rdsMultiAz: true,
    lambdaMemorySize: 2048,
    logRetention: 90,
    s3Versioning: true,
    dynamodbBillingMode: 'PROVISIONED',
    dynamodbReadCapacity: 5,
    dynamodbWriteCapacity: 5,
  },
};

// FIX 5: Environment validation with proper error message
export function getEnvironmentConfig(env: string): EnvironmentConfig {
  const validEnvironments = ['dev', 'staging', 'prod'];
  if (!validEnvironments.includes(env)) {
    throw new Error(
      `Invalid environment: ${env}. Valid values: ${validEnvironments.join(', ')}`
    );
  }
  return configs[env];
}
