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
  // Get environment suffix - required for resource naming
  const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

  // Get region configuration
  const region = process.env.AWS_REGION || 'us-east-1';
  const secondaryRegion = 'us-east-2';

  // Get account IDs - support single-account mode for testing
  // If only legacyAccountId is provided, use it for all accounts
  const legacyAccountId = process.env.CURRENT_ACCOUNT_ID || '123456789012';
  const productionAccountId = legacyAccountId;
  const stagingAccountId = legacyAccountId;
  const developmentAccountId = legacyAccountId;
  const centralAccountId = legacyAccountId;

  // Session duration (max 1 hour as per requirements)
  const maxSessionDuration = 3600;

  // Dry-run mode support
  const isDryRun = false;

  // VPC CIDR blocks
  const legacyVpcCidr = '10.0.0.0/16';
  const productionVpcCidr = '10.1.0.0/16';
  const stagingVpcCidr = '10.2.0.0/16';
  const developmentVpcCidr = '10.3.0.0/16';

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
