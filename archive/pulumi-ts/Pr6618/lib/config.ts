import * as pulumi from '@pulumi/pulumi';

export interface EnvironmentConfig {
  environment: string;
  region: string;
  instanceType: string;
  dbInstanceCount: number;
  backupRetentionDays: number;
  containerImageTag: string;
  vpcCidr: string;
  availabilityZones: string[];
  publicSubnetCidrs: string[];
  privateSubnetCidrs: string[];
}

export function getEnvironmentConfig(): EnvironmentConfig {
  const environment = pulumi.getStack();

  // Default configurations per environment
  const configs: { [key: string]: EnvironmentConfig } = {
    dev: {
      environment: 'dev',
      region: 'us-east-1',
      instanceType: 't3.medium',
      dbInstanceCount: 1,
      backupRetentionDays: 7,
      containerImageTag: 'latest',
      vpcCidr: '10.0.0.0/16',
      availabilityZones: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
      publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24'],
      privateSubnetCidrs: ['10.0.11.0/24', '10.0.12.0/24', '10.0.13.0/24'],
    },
    staging: {
      environment: 'staging',
      region: 'us-east-1',
      instanceType: 'm5.large',
      dbInstanceCount: 2,
      backupRetentionDays: 14,
      containerImageTag: 'staging-*',
      vpcCidr: '10.1.0.0/16',
      availabilityZones: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
      publicSubnetCidrs: ['10.1.1.0/24', '10.1.2.0/24', '10.1.3.0/24'],
      privateSubnetCidrs: ['10.1.11.0/24', '10.1.12.0/24', '10.1.13.0/24'],
    },
    prod: {
      environment: 'prod',
      region: 'us-east-1',
      instanceType: 'm5.xlarge',
      dbInstanceCount: 3,
      backupRetentionDays: 30,
      containerImageTag: 'v*.*.*',
      vpcCidr: '10.2.0.0/16',
      availabilityZones: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
      publicSubnetCidrs: ['10.2.1.0/24', '10.2.2.0/24', '10.2.3.0/24'],
      privateSubnetCidrs: ['10.2.11.0/24', '10.2.12.0/24', '10.2.13.0/24'],
    },
  };

  return configs[environment] || configs.dev;
}

export function getEnvironmentSuffix(): string {
  const config = new pulumi.Config();
  return config.get('environmentSuffix') || pulumi.getStack();
}
