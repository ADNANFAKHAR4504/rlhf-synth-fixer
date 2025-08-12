export interface RegionConfig {
  region: string;
  availabilityZones: string[];
  vpcCidr: string;
  publicSubnetCidrs: string[];
  privateSubnetCidrs: string[];
}

export interface EnvironmentConfig {
  environment: string;
  environmentSuffix: string;
  project: string;
  costCenter: string;
  owner: string;
  regions: RegionConfig[];
  crossAccountRoleArn?: string;
  trustedAccountId?: string;
  createNatGateways?: boolean;
}

export const getEnvironmentConfig = (
  env: string = 'dev',
  environmentSuffix: string = 'dev'
): EnvironmentConfig => {
  const baseConfig = {
    project: 'tap-infrastructure',
    costCenter: 'engineering',
    owner: 'platform-team',
    environmentSuffix,
  };

  const configs: Record<string, EnvironmentConfig> = {
    dev: {
      ...baseConfig,
      environment: 'dev',
      trustedAccountId: '123456789012',
      createNatGateways: true,
      regions: [
        {
          region: 'us-east-1',
          availabilityZones: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
          vpcCidr: '10.0.0.0/16',
          publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24'],
          privateSubnetCidrs: ['10.0.11.0/24', '10.0.12.0/24', '10.0.13.0/24'],
        },
        {
          region: 'eu-west-1',
          availabilityZones: ['eu-west-1a', 'eu-west-1b', 'eu-west-1c'],
          vpcCidr: '10.1.0.0/16',
          publicSubnetCidrs: ['10.1.1.0/24', '10.1.2.0/24', '10.1.3.0/24'],
          privateSubnetCidrs: ['10.1.11.0/24', '10.1.12.0/24', '10.1.13.0/24'],
        },
        {
          region: 'ap-southeast-2',
          availabilityZones: [
            'ap-southeast-2a',
            'ap-southeast-2b',
            'ap-southeast-2c',
          ],
          vpcCidr: '10.2.0.0/16',
          publicSubnetCidrs: ['10.2.1.0/24', '10.2.2.0/24', '10.2.3.0/24'],
          privateSubnetCidrs: ['10.2.11.0/24', '10.2.12.0/24', '10.2.13.0/24'],
        },
      ],
    },
    prod: {
      ...baseConfig,
      environment: 'prod',
      trustedAccountId: '987654321098',
      createNatGateways: true,
      regions: [
        {
          region: 'us-east-1',
          availabilityZones: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
          vpcCidr: '172.16.0.0/16',
          publicSubnetCidrs: [
            '172.16.1.0/24',
            '172.16.2.0/24',
            '172.16.3.0/24',
          ],
          privateSubnetCidrs: [
            '172.16.11.0/24',
            '172.16.12.0/24',
            '172.16.13.0/24',
          ],
        },
        {
          region: 'eu-west-1',
          availabilityZones: ['eu-west-1a', 'eu-west-1b', 'eu-west-1c'],
          vpcCidr: '172.17.0.0/16',
          publicSubnetCidrs: [
            '172.17.1.0/24',
            '172.17.2.0/24',
            '172.17.3.0/24',
          ],
          privateSubnetCidrs: [
            '172.17.11.0/24',
            '172.17.12.0/24',
            '172.17.13.0/24',
          ],
        },
        {
          region: 'ap-southeast-2',
          availabilityZones: [
            'ap-southeast-2a',
            'ap-southeast-2b',
            'ap-southeast-2c',
          ],
          vpcCidr: '172.18.0.0/16',
          publicSubnetCidrs: [
            '172.18.1.0/24',
            '172.18.2.0/24',
            '172.18.3.0/24',
          ],
          privateSubnetCidrs: [
            '172.18.11.0/24',
            '172.18.12.0/24',
            '172.18.13.0/24',
          ],
        },
      ],
    },
  };

  return configs[env] || configs.dev;
};

export const getCommonTags = (config: EnvironmentConfig, region: string) => ({
  Environment: config.environment,
  Project: config.project,
  CostCenter: config.costCenter,
  Owner: config.owner,
  Region: region,
  ManagedBy: 'terraform',
  CreatedAt: new Date().toISOString().split('T')[0],
});
