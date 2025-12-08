export interface RegionConfig {
  region: string;
  vpcCidr: string;
  privateSubnetCidrs: string[];
  publicSubnetCidrs: string[];
  availabilityZones: string[];
}

export interface InfrastructureConfig {
  environmentSuffix: string;
  primaryRegion: RegionConfig;
  secondaryRegion: RegionConfig;
  hostedZoneName: string;
  apiDomainName: string;
  globalDatabaseIdentifier: string;
  databaseName: string;
  databaseUsername: string;
  sessionTableName: string;
  tradeQueueName: string;
  failoverValidationSchedule: string;
}

// Single source of truth for environment suffix to reduce branch complexity
const envSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

export const config: InfrastructureConfig = {
  environmentSuffix: envSuffix,
  primaryRegion: {
    region: 'us-east-1',
    vpcCidr: '10.0.0.0/16',
    privateSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24'],
    publicSubnetCidrs: ['10.0.101.0/24', '10.0.102.0/24', '10.0.103.0/24'],
    availabilityZones: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
  },
  secondaryRegion: {
    region: 'us-east-2',
    vpcCidr: '10.1.0.0/16',
    privateSubnetCidrs: ['10.1.1.0/24', '10.1.2.0/24', '10.1.3.0/24'],
    publicSubnetCidrs: ['10.1.101.0/24', '10.1.102.0/24', '10.1.103.0/24'],
    availabilityZones: ['us-east-2a', 'us-east-2b', 'us-east-2c'],
  },
  hostedZoneName: `trading-platform-${envSuffix}.local`,
  apiDomainName: `api.trading-platform-${envSuffix}.local`,
  globalDatabaseIdentifier: 'trading-platform-global',
  databaseName: 'tradingdb',
  databaseUsername: 'tradingadmin',
  sessionTableName: 'user-sessions',
  tradeQueueName: 'trade-orders',
  failoverValidationSchedule: 'rate(1 hour)',
};
