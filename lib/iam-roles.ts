import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { MigrationConfig } from './config';

export interface IamRoles {
  legacyAccountRole: aws.iam.Role;
  productionAccountRole: aws.iam.Role;
  stagingAccountRole: aws.iam.Role;
  developmentAccountRole: aws.iam.Role;
  migrationOrchestratorRole: aws.iam.Role;
  migrationOrchestratorPolicy: aws.iam.RolePolicy;
}

export function createIamRoles(config: MigrationConfig): IamRoles {
  // Get current caller identity
  const caller = aws.getCallerIdentity({});

  // Migration orchestrator role (in central account)
  const migrationOrchestratorRole = new aws.iam.Role(
    `migration-orchestrator-role-${config.environmentSuffix}`,
    {
      assumeRolePolicy: pulumi.all([caller]).apply(([_callerData]) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: [
                  'states.amazonaws.com',
                  'events.amazonaws.com',
                  'lambda.amazonaws.com',
                ],
              },
              Action: 'sts:AssumeRole',
            },
            {
              Effect: 'Allow',
              Principal: {
                AWS: `arn:aws:iam::${config.centralAccountId}:root`,
              },
              Action: 'sts:AssumeRole',
            },
          ],
        })
      ),
      maxSessionDuration: config.maxSessionDuration,
      tags: {
        Name: `migration-orchestrator-role-${config.environmentSuffix}`,
        Environment: config.environmentSuffix,
        MigrationComponent: 'orchestrator',
      },
    }
  );

  // Policy for orchestrator to assume cross-account roles
  const migrationOrchestratorPolicy = new aws.iam.RolePolicy(
    `migration-orchestrator-policy-${config.environmentSuffix}`,
    {
      role: migrationOrchestratorRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['sts:AssumeRole'],
            Resource: [
              `arn:aws:iam::${config.legacyAccountId}:role/migration-*`,
              `arn:aws:iam::${config.productionAccountId}:role/migration-*`,
              `arn:aws:iam::${config.stagingAccountId}:role/migration-*`,
              `arn:aws:iam::${config.developmentAccountId}:role/migration-*`,
            ],
          },
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
              'logs:DescribeLogStreams',
              'logs:DescribeLogGroups',
              'logs:CreateLogDelivery',
              'logs:GetLogDelivery',
              'logs:UpdateLogDelivery',
              'logs:DeleteLogDelivery',
              'logs:ListLogDeliveries',
              'logs:PutResourcePolicy',
              'logs:DescribeResourcePolicies',
            ],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: [
              'ssm:GetParameter',
              'ssm:GetParameters',
              'ssm:PutParameter',
            ],
            Resource: `arn:aws:ssm:*:*:parameter/migration-${config.environmentSuffix}/*`,
          },
          {
            Effect: 'Allow',
            Action: ['events:PutEvents', 'events:PutRule', 'events:PutTargets'],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: [
              'states:StartExecution',
              'states:StopExecution',
              'states:DescribeExecution',
              'states:CreateStateMachine',
              'states:UpdateStateMachine',
              'states:DeleteStateMachine',
              'states:DescribeStateMachine',
              'states:ListExecutions',
            ],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: [
              'xray:PutTraceSegments',
              'xray:PutTelemetryRecords',
              'xray:GetSamplingRules',
              'xray:GetSamplingTargets',
            ],
            Resource: '*',
          },
        ],
      }),
    }
  );

  // Cross-account role for legacy account
  const legacyAccountRole = new aws.iam.Role(
    `migration-legacy-role-${config.environmentSuffix}`,
    {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              AWS: `arn:aws:iam::${config.centralAccountId}:root`,
            },
            Action: 'sts:AssumeRole',
            Condition: {
              StringEquals: {
                'sts:ExternalId': `migration-${config.environmentSuffix}`,
              },
            },
          },
        ],
      }),
      maxSessionDuration: config.maxSessionDuration,
      tags: {
        Name: `migration-legacy-role-${config.environmentSuffix}`,
        Environment: config.environmentSuffix,
        MigrationComponent: 'legacy',
        Account: 'legacy',
      },
    }
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _legacyAccountPolicy = new aws.iam.RolePolicy(
    `migration-legacy-policy-${config.environmentSuffix}`,
    {
      role: legacyAccountRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'ec2:Describe*',
              'ec2:CreateTags',
              'rds:Describe*',
              'rds:ListTagsForResource',
              'rds:AddTagsToResource',
              'ecs:Describe*',
              'ecs:ListTagsForResource',
              'ecs:TagResource',
              'elasticloadbalancing:Describe*',
              'elasticloadbalancing:AddTags',
            ],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: [
              'ram:GetResourceShareAssociations',
              'ram:AcceptResourceShareInvitation',
            ],
            Resource: '*',
          },
        ],
      }),
    }
  );

  // Cross-account role for production account
  const productionAccountRole = new aws.iam.Role(
    `migration-production-role-${config.environmentSuffix}`,
    {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              AWS: `arn:aws:iam::${config.centralAccountId}:root`,
            },
            Action: 'sts:AssumeRole',
            Condition: {
              StringEquals: {
                'sts:ExternalId': `migration-${config.environmentSuffix}`,
              },
            },
          },
        ],
      }),
      maxSessionDuration: config.maxSessionDuration,
      tags: {
        Name: `migration-production-role-${config.environmentSuffix}`,
        Environment: config.environmentSuffix,
        MigrationComponent: 'production',
        Account: 'production',
      },
    }
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _productionAccountPolicy = new aws.iam.RolePolicy(
    `migration-production-policy-${config.environmentSuffix}`,
    {
      role: productionAccountRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'ec2:*',
              'rds:*',
              'ecs:*',
              'elasticloadbalancing:*',
              'route53:*',
            ],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: [
              'ram:GetResourceShareAssociations',
              'ram:AcceptResourceShareInvitation',
            ],
            Resource: '*',
          },
        ],
      }),
    }
  );

  // Cross-account role for staging account
  const stagingAccountRole = new aws.iam.Role(
    `migration-staging-role-${config.environmentSuffix}`,
    {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              AWS: `arn:aws:iam::${config.centralAccountId}:root`,
            },
            Action: 'sts:AssumeRole',
            Condition: {
              StringEquals: {
                'sts:ExternalId': `migration-${config.environmentSuffix}`,
              },
            },
          },
        ],
      }),
      maxSessionDuration: config.maxSessionDuration,
      tags: {
        Name: `migration-staging-role-${config.environmentSuffix}`,
        Environment: config.environmentSuffix,
        MigrationComponent: 'staging',
        Account: 'staging',
      },
    }
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _stagingAccountPolicy = new aws.iam.RolePolicy(
    `migration-staging-policy-${config.environmentSuffix}`,
    {
      role: stagingAccountRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'ec2:*',
              'rds:*',
              'ecs:*',
              'elasticloadbalancing:*',
              'route53:*',
            ],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: [
              'ram:GetResourceShareAssociations',
              'ram:AcceptResourceShareInvitation',
            ],
            Resource: '*',
          },
        ],
      }),
    }
  );

  // Cross-account role for development account
  const developmentAccountRole = new aws.iam.Role(
    `migration-development-role-${config.environmentSuffix}`,
    {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              AWS: `arn:aws:iam::${config.centralAccountId}:root`,
            },
            Action: 'sts:AssumeRole',
            Condition: {
              StringEquals: {
                'sts:ExternalId': `migration-${config.environmentSuffix}`,
              },
            },
          },
        ],
      }),
      maxSessionDuration: config.maxSessionDuration,
      tags: {
        Name: `migration-development-role-${config.environmentSuffix}`,
        Environment: config.environmentSuffix,
        MigrationComponent: 'development',
        Account: 'development',
      },
    }
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _developmentAccountPolicy = new aws.iam.RolePolicy(
    `migration-development-policy-${config.environmentSuffix}`,
    {
      role: developmentAccountRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'ec2:*',
              'rds:*',
              'ecs:*',
              'elasticloadbalancing:*',
              'route53:*',
            ],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: [
              'ram:GetResourceShareAssociations',
              'ram:AcceptResourceShareInvitation',
            ],
            Resource: '*',
          },
        ],
      }),
    }
  );

  return {
    legacyAccountRole,
    productionAccountRole,
    stagingAccountRole,
    developmentAccountRole,
    migrationOrchestratorRole,
    migrationOrchestratorPolicy,
  };
}

export function getRoleArn(
  role: aws.iam.Role,
  accountId: string
): pulumi.Output<string> {
  return pulumi.interpolate`arn:aws:iam::${accountId}:role/${role.name}`;
}
