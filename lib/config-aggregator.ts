import * as aws from '@pulumi/aws';
import { MigrationConfig } from './config';
import { IamRoles } from './iam-roles';

export interface ConfigAggregatorResources {
  aggregator: aws.cfg.ConfigurationAggregator;
  aggregatorRole: aws.iam.Role;
}

export function createConfigAggregator(
  config: MigrationConfig,
  _iamRoles: IamRoles
): ConfigAggregatorResources {
  // IAM role for Config Aggregator
  const aggregatorRole = new aws.iam.Role(
    `config-aggregator-role-${config.environmentSuffix}`,
    {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'config.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      managedPolicyArns: ['arn:aws:iam::aws:policy/service-role/ConfigRole'],
      tags: {
        Name: `config-aggregator-role-${config.environmentSuffix}`,
        Environment: config.environmentSuffix,
        MigrationComponent: 'config-aggregator',
      },
    }
  );

  // Additional policy for cross-account access
  const aggregatorPolicy = new aws.iam.RolePolicy(
    `config-aggregator-policy-${config.environmentSuffix}`,
    {
      role: aggregatorRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'config:DescribeConfigurationAggregators',
              'config:DescribeConfigurationAggregatorSourcesStatus',
            ],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: [
              'organizations:ListAccounts',
              'organizations:DescribeOrganization',
            ],
            Resource: '*',
          },
        ],
      }),
    }
  );

  // Get unique account IDs
  const accountIds = [
    config.legacyAccountId,
    config.productionAccountId,
    config.stagingAccountId,
    config.developmentAccountId,
  ];
  const uniqueAccountIds = [...new Set(accountIds)];

  // Config Aggregator
  const aggregator = new aws.cfg.ConfigurationAggregator(
    `migration-config-aggregator-${config.environmentSuffix}`,
    {
      name: `migration-config-aggregator-${config.environmentSuffix}`,
      accountAggregationSource: {
        accountIds: uniqueAccountIds,
        allRegions: false,
        regions: [config.region, config.secondaryRegion],
      },
      tags: {
        Name: `migration-config-aggregator-${config.environmentSuffix}`,
        Environment: config.environmentSuffix,
        MigrationComponent: 'config-aggregator',
      },
    },
    {
      dependsOn: [aggregatorRole, aggregatorPolicy],
    }
  );

  return {
    aggregator,
    aggregatorRole,
  };
}
