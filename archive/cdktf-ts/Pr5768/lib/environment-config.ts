export interface EnvironmentConfig {
  environment: string;
  bucketLifecycleDays: number;
  dynamodbBillingMode: 'PAY_PER_REQUEST' | 'PROVISIONED';
  dynamodbReadCapacity?: number;
  dynamodbWriteCapacity?: number;
  alarmThresholdMultiplier: number;
  snsEmail: string;
  enableCrossRegionReplication: boolean;
  replicationRegion?: string;
  costCenter: string;
}

export function getEnvironmentConfig(
  environmentSuffix: string
): EnvironmentConfig {
  // Default to dev configuration for all environments
  const config: EnvironmentConfig = {
    environment: environmentSuffix,
    bucketLifecycleDays: 30,
    dynamodbBillingMode: 'PAY_PER_REQUEST',
    alarmThresholdMultiplier: 0.75,
    snsEmail: `alerts-${environmentSuffix}@example.com`,
    enableCrossRegionReplication: false,
    costCenter: 'engineering',
  };

  return config;
}

export function validateEnvironmentConfig(config: EnvironmentConfig): void {
  // Validate provisioned billing has required capacity settings
  if (config.dynamodbBillingMode === 'PROVISIONED') {
    if (!config.dynamodbReadCapacity || !config.dynamodbWriteCapacity) {
      throw new Error(
        'PROVISIONED billing mode must specify read and write capacity'
      );
    }
  }

  // Validate cross-region replication has replication region
  if (config.enableCrossRegionReplication && !config.replicationRegion) {
    throw new Error('Cross-region replication must specify replication region');
  }
}
