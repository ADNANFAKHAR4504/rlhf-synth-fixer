import * as aws from '@pulumi/aws';
import { MigrationConfig } from './config';

export interface ParameterStoreResources {
  migrationMetadata: aws.ssm.Parameter;
  legacyAccountMetadata: aws.ssm.Parameter;
  productionAccountMetadata: aws.ssm.Parameter;
  stagingAccountMetadata: aws.ssm.Parameter;
  developmentAccountMetadata: aws.ssm.Parameter;
}

export function createParameterStore(
  config: MigrationConfig
): ParameterStoreResources {
  // Central migration metadata parameter
  const migrationMetadata = new aws.ssm.Parameter(
    `migration-metadata-${config.environmentSuffix}`,
    {
      name: `/migration-${config.environmentSuffix}/metadata`,
      type: 'String',
      value: JSON.stringify({
        environmentSuffix: config.environmentSuffix,
        status: 'initialized',
        progress: 0,
        createdAt: new Date().toISOString(),
        isDryRun: config.isDryRun,
      }),
      description: `Migration metadata for ${config.environmentSuffix}`,
      tags: {
        Name: `migration-metadata-${config.environmentSuffix}`,
        Environment: config.environmentSuffix,
        MigrationComponent: 'parameter-store',
      },
    }
  );

  // Legacy account metadata
  const legacyAccountMetadata = new aws.ssm.Parameter(
    `migration-legacy-metadata-${config.environmentSuffix}`,
    {
      name: `/migration-${config.environmentSuffix}/accounts/legacy`,
      type: 'String',
      value: JSON.stringify({
        accountId: config.legacyAccountId,
        vpcCidr: config.legacyVpcCidr,
        region: config.region,
        status: 'active',
      }),
      description: `Legacy account metadata for ${config.environmentSuffix}`,
      tags: {
        Name: `migration-legacy-metadata-${config.environmentSuffix}`,
        Environment: config.environmentSuffix,
        MigrationComponent: 'parameter-store',
        Account: 'legacy',
      },
    }
  );

  // Production account metadata
  const productionAccountMetadata = new aws.ssm.Parameter(
    `migration-production-metadata-${config.environmentSuffix}`,
    {
      name: `/migration-${config.environmentSuffix}/accounts/production`,
      type: 'String',
      value: JSON.stringify({
        accountId: config.productionAccountId,
        vpcCidr: config.productionVpcCidr,
        region: config.region,
        status: 'pending',
      }),
      description: `Production account metadata for ${config.environmentSuffix}`,
      tags: {
        Name: `migration-production-metadata-${config.environmentSuffix}`,
        Environment: config.environmentSuffix,
        MigrationComponent: 'parameter-store',
        Account: 'production',
      },
    }
  );

  // Staging account metadata
  const stagingAccountMetadata = new aws.ssm.Parameter(
    `migration-staging-metadata-${config.environmentSuffix}`,
    {
      name: `/migration-${config.environmentSuffix}/accounts/staging`,
      type: 'String',
      value: JSON.stringify({
        accountId: config.stagingAccountId,
        vpcCidr: config.stagingVpcCidr,
        region: config.region,
        status: 'pending',
      }),
      description: `Staging account metadata for ${config.environmentSuffix}`,
      tags: {
        Name: `migration-staging-metadata-${config.environmentSuffix}`,
        Environment: config.environmentSuffix,
        MigrationComponent: 'parameter-store',
        Account: 'staging',
      },
    }
  );

  // Development account metadata
  const developmentAccountMetadata = new aws.ssm.Parameter(
    `migration-development-metadata-${config.environmentSuffix}`,
    {
      name: `/migration-${config.environmentSuffix}/accounts/development`,
      type: 'String',
      value: JSON.stringify({
        accountId: config.developmentAccountId,
        vpcCidr: config.developmentVpcCidr,
        region: config.region,
        status: 'pending',
      }),
      description: `Development account metadata for ${config.environmentSuffix}`,
      tags: {
        Name: `migration-development-metadata-${config.environmentSuffix}`,
        Environment: config.environmentSuffix,
        MigrationComponent: 'parameter-store',
        Account: 'development',
      },
    }
  );

  return {
    migrationMetadata,
    legacyAccountMetadata,
    productionAccountMetadata,
    stagingAccountMetadata,
    developmentAccountMetadata,
  };
}
