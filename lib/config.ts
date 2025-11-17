import * as pulumi from '@pulumi/pulumi';

export interface MigrationConfig {
  environmentSuffix: string;
  region: string;
  legacyAccountId: string;
  productionAccountId: string;
  stagingAccountId: string;
  developmentAccountId: string;
  centralAccountId: string;
  maxSessionDuration: number;
  isDryRun: boolean;
  legacyVpcCidr: string;
  productionVpcCidr: string;
  stagingVpcCidr: string;
  developmentVpcCidr: string;
  secondaryRegion: string;
}

export function getConfig(): MigrationConfig {
  const config = new pulumi.Config();

  // Get environment suffix - required for resource naming
  const environmentSuffix = config.require('environmentSuffix');

  // Get region configuration
  const region = config.get('region') || 'us-east-1';
  const secondaryRegion = config.get('secondaryRegion') || 'us-east-2';

  // Get account IDs - support single-account mode for testing
  // If only legacyAccountId is provided, use it for all accounts
  const legacyAccountId = config.require('legacyAccountId');
  const productionAccountId =
    config.get('productionAccountId') || legacyAccountId;
  const stagingAccountId = config.get('stagingAccountId') || legacyAccountId;
  const developmentAccountId =
    config.get('developmentAccountId') || legacyAccountId;
  const centralAccountId = config.get('centralAccountId') || legacyAccountId;

  // Session duration (max 1 hour as per requirements)
  const maxSessionDuration = config.getNumber('maxSessionDuration') || 3600;

  // Dry-run mode support
  const isDryRun = config.getBoolean('isDryRun') || false;

  // VPC CIDR blocks
  const legacyVpcCidr = config.get('legacyVpcCidr') || '10.0.0.0/16';
  const productionVpcCidr = config.get('productionVpcCidr') || '10.1.0.0/16';
  const stagingVpcCidr = config.get('stagingVpcCidr') || '10.2.0.0/16';
  const developmentVpcCidr = config.get('developmentVpcCidr') || '10.3.0.0/16';

  return {
    environmentSuffix,
    region,
    legacyAccountId,
    productionAccountId,
    stagingAccountId,
    developmentAccountId,
    centralAccountId,
    maxSessionDuration,
    isDryRun,
    legacyVpcCidr,
    productionVpcCidr,
    stagingVpcCidr,
    developmentVpcCidr,
    secondaryRegion,
  };
}

export function isSingleAccountMode(config: MigrationConfig): boolean {
  return (
    config.legacyAccountId === config.productionAccountId &&
    config.legacyAccountId === config.stagingAccountId &&
    config.legacyAccountId === config.developmentAccountId &&
    config.legacyAccountId === config.centralAccountId
  );
}

export function validateConfig(config: MigrationConfig): void {
  if (config.maxSessionDuration > 3600) {
    throw new Error('maxSessionDuration must not exceed 3600 seconds (1 hour)');
  }

  if (!config.environmentSuffix) {
    throw new Error('environmentSuffix is required for resource naming');
  }

  // Validate CIDR blocks don't overlap
  const cidrs = [
    config.legacyVpcCidr,
    config.productionVpcCidr,
    config.stagingVpcCidr,
    config.developmentVpcCidr,
  ];
  const uniqueCidrs = new Set(cidrs);
  if (!isSingleAccountMode(config) && uniqueCidrs.size !== cidrs.length) {
    throw new Error('VPC CIDR blocks must not overlap in multi-account mode');
  }
}
