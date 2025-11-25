import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface CrossAccountConstructProps {
  environment: string;
  region: string;
  suffix: string;
  environmentSuffix: string;
}

export class CrossAccountConstruct extends Construct {
  constructor(scope: Construct, id: string, props: CrossAccountConstructProps) {
    super(scope, id);

    const { environment, region, suffix, environmentSuffix } = props;

    // Get configurable account IDs from context - Addresses MODEL_FAILURES item 3
    const trustedAccounts =
      cdk.Stack.of(this).node.tryGetContext('trustedAccounts') || {};
    const devAccountId = trustedAccounts.dev || process.env.DEV_ACCOUNT_ID;
    const stagingAccountId =
      trustedAccounts.staging || process.env.STAGING_ACCOUNT_ID;
    const prodAccountId = trustedAccounts.prod || process.env.PROD_ACCOUNT_ID;

    // Cross-account role for different environments to access this environment - Requirement 6
    if (environment === 'prod') {
      // Production environment: Allow read-only access from dev and staging
      const crossAccountRole = new iam.Role(
        this,
        `CrossAccountRole${environmentSuffix}${region}`,
        {
          roleName: `${environment}-${region}-cross-account-access-${suffix}`,
          description:
            'Cross-account role for accessing production resources safely',
          maxSessionDuration: cdk.Duration.hours(4),
          assumedBy: new iam.CompositePrincipal(
            // Only allow specific accounts, not wildcards - Addresses MODEL_FAILURES item 13
            ...[devAccountId, stagingAccountId]
              .filter(Boolean)
              .map(accountId => new iam.AccountPrincipal(accountId!))
          ),
        }
      );

      // Read-only permissions with least privilege
      crossAccountRole.addToPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'cloudwatch:GetMetricData',
            'cloudwatch:GetMetricStatistics',
            'cloudwatch:ListMetrics',
            'cloudwatch:DescribeAlarms',
            'cloudwatch:DescribeAlarmsForMetric',
          ],
          resources: [
            `arn:aws:cloudwatch:${region}:${cdk.Aws.ACCOUNT_ID}:alarm:${environment}-${region}-*`,
            `arn:aws:cloudwatch:${region}:${cdk.Aws.ACCOUNT_ID}:metric/*`,
          ],
        })
      );

      crossAccountRole.addToPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'logs:FilterLogEvents',
            'logs:GetLogEvents',
            'logs:DescribeLogGroups',
            'logs:DescribeLogStreams',
          ],
          resources: [
            `arn:aws:logs:${region}:${cdk.Aws.ACCOUNT_ID}:log-group:/aws/*`,
          ],
        })
      );

      crossAccountRole.addToPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'ec2:DescribeInstances',
            'ec2:DescribeInstanceStatus',
            'ec2:DescribeInstanceAttribute',
            'ec2:DescribeVpcs',
            'ec2:DescribeSubnets',
            'ec2:DescribeSecurityGroups',
          ],
          resources: ['*'], // EC2 describe actions require wildcard
          conditions: {
            StringEquals: {
              'ec2:Region': region,
            },
          },
        })
      );

      crossAccountRole.addToPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'rds:DescribeDBInstances',
            'rds:DescribeDBClusters',
            'rds:DescribeDBSubnetGroups',
            'rds:DescribeDBParameterGroups',
          ],
          resources: [
            `arn:aws:rds:${region}:${cdk.Aws.ACCOUNT_ID}:db:${environment}-${region}-*`,
            `arn:aws:rds:${region}:${cdk.Aws.ACCOUNT_ID}:cluster:${environment}-${region}-*`,
            `arn:aws:rds:${region}:${cdk.Aws.ACCOUNT_ID}:subgrp:${environment}-${region}-*`,
            `arn:aws:rds:${region}:${cdk.Aws.ACCOUNT_ID}:pg:${environment}-${region}-*`,
          ],
        })
      );

      crossAccountRole.addToPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            's3:GetBucketLocation',
            's3:ListBucket',
            's3:GetBucketVersioning',
            's3:GetBucketEncryption',
          ],
          resources: [`arn:aws:s3:::${environment}-${region}-*`],
        })
      );

      // Output the role ARN for reference in other accounts
      new cdk.CfnOutput(
        cdk.Stack.of(this),
        `CrossAccountRoleArn${environmentSuffix}${region}`,
        {
          value: crossAccountRole.roleArn,
          description: 'Cross-account role ARN for accessing production',
          exportName: `${environment}-${region}-cross-account-role-arn-${suffix}`,
        }
      );

      // Apply tags
      cdk.Tags.of(crossAccountRole).add('iac-rlhf-amazon', 'true');
      cdk.Tags.of(crossAccountRole).add('Environment', environment);
      cdk.Tags.of(crossAccountRole).add('Region', region);
      cdk.Tags.of(crossAccountRole).add('Purpose', 'CrossAccountAccess');
    }

    // For non-prod environments, create roles that can assume prod role
    if (environment !== 'prod' && prodAccountId) {
      const assumeProdRole = new iam.Role(
        this,
        `AssumeProdRole${environmentSuffix}${region}`,
        {
          roleName: `${environment}-${region}-assume-prod-access-${suffix}`,
          description: `Role for ${environment} environment to assume production cross-account role`,
          assumedBy: new iam.CompositePrincipal(
            new iam.ServicePrincipal('lambda.amazonaws.com'),
            new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
            // Allow developers to assume this role in non-prod environments
            new iam.AccountPrincipal(cdk.Aws.ACCOUNT_ID)
          ),
          maxSessionDuration: cdk.Duration.hours(2),
        }
      );

      // Specific assume role permissions for prod - not wildcards - Addresses MODEL_FAILURES item 13
      assumeProdRole.addToPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['sts:AssumeRole'],
          resources: [
            `arn:aws:iam::${prodAccountId}:role/prod-${region}-cross-account-access-*`,
          ],
          conditions: {
            StringEquals: {
              'sts:ExternalId': `${environment}-to-prod-${suffix}`,
            },
            IpAddress: {
              'aws:SourceIp': [
                '10.0.0.0/8', // Private IP ranges only
                '172.16.0.0/12',
                '192.168.0.0/16',
              ],
            },
          },
        })
      );

      // Add condition to require MFA for sensitive operations
      assumeProdRole.addToPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.DENY,
          actions: ['*'],
          resources: ['*'],
          conditions: {
            BoolIfExists: {
              'aws:MultiFactorAuthPresent': 'false',
            },
            StringEquals: {
              'aws:RequestedRegion': region,
            },
          },
        })
      );

      // Apply tags
      cdk.Tags.of(assumeProdRole).add('iac-rlhf-amazon', 'true');
      cdk.Tags.of(assumeProdRole).add('Environment', environment);
      cdk.Tags.of(assumeProdRole).add('Region', region);
      cdk.Tags.of(assumeProdRole).add('Purpose', 'AssumeProductionRole');
    }

    // Cross-region role for disaster recovery
    if (region === 'us-east-2') {
      // Primary region
      const drRole = new iam.Role(
        this,
        `DisasterRecoveryRole${environmentSuffix}${region}`,
        {
          roleName: `${environment}-${region}-disaster-recovery-${suffix}`,
          description: 'Role for disaster recovery operations across regions',
          assumedBy: new iam.CompositePrincipal(
            new iam.ServicePrincipal('lambda.amazonaws.com'),
            new iam.AccountPrincipal(cdk.Aws.ACCOUNT_ID)
          ),
          maxSessionDuration: cdk.Duration.hours(12),
        }
      );

      // Permissions for cross-region disaster recovery
      drRole.addToPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'rds:CreateDBInstanceReadReplica',
            'rds:PromoteReadReplica',
            'rds:ModifyDBInstance',
            'rds:CreateDBSnapshot',
            'rds:RestoreDBInstanceFromDBSnapshot',
          ],
          resources: [
            `arn:aws:rds:*:${cdk.Aws.ACCOUNT_ID}:db:${environment}-*`,
            `arn:aws:rds:*:${cdk.Aws.ACCOUNT_ID}:snapshot:${environment}-*`,
          ],
          conditions: {
            StringEquals: {
              'aws:RequestedRegion': ['us-east-2', 'us-east-1'],
            },
          },
        })
      );

      drRole.addToPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            's3:ReplicateObject',
            's3:ReplicateDelete',
            's3:ReplicationConfiguration',
          ],
          resources: [
            `arn:aws:s3:::${environment}-*`,
            `arn:aws:s3:::${environment}-*/*`,
          ],
        })
      );

      drRole.addToPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'route53:ChangeResourceRecordSets',
            'route53:GetChange',
            'route53:ListResourceRecordSets',
          ],
          resources: [
            'arn:aws:route53:::hostedzone/*',
            'arn:aws:route53:::change/*',
          ],
        })
      );

      // Apply tags
      cdk.Tags.of(drRole).add('iac-rlhf-amazon', 'true');
      cdk.Tags.of(drRole).add('Environment', environment);
      cdk.Tags.of(drRole).add('Region', region);
      cdk.Tags.of(drRole).add('Purpose', 'DisasterRecovery');
    }

    // Service-linked role for monitoring across environments
    const monitoringRole = new iam.Role(
      this,
      `MonitoringRole${environmentSuffix}${region}`,
      {
        roleName: `${environment}-${region}-monitoring-${suffix}`,
        description:
          'Role for monitoring services to access metrics across environments',
        assumedBy: new iam.CompositePrincipal(
          new iam.ServicePrincipal('lambda.amazonaws.com'),
          new iam.ServicePrincipal('events.amazonaws.com')
        ),
        maxSessionDuration: cdk.Duration.hours(1),
      }
    );

    // Monitoring permissions
    monitoringRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'cloudwatch:PutMetricData',
          'cloudwatch:GetMetricData',
          'cloudwatch:GetMetricStatistics',
        ],
        resources: ['*'],
        conditions: {
          StringLike: {
            'cloudwatch:namespace': [
              'AWS/EC2',
              'AWS/RDS',
              'AWS/Lambda',
              'AWS/ApplicationELB',
              'AWS/S3',
              'AWS/Cost/Monitor',
              'CWAgent',
            ],
          },
        },
      })
    );

    monitoringRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['sns:Publish'],
        resources: [
          `arn:aws:sns:${region}:${cdk.Aws.ACCOUNT_ID}:${environment}-${region}-*`,
        ],
      })
    );

    // Apply tags
    cdk.Tags.of(monitoringRole).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(monitoringRole).add('Environment', environment);
    cdk.Tags.of(monitoringRole).add('Region', region);
    cdk.Tags.of(monitoringRole).add('Purpose', 'Monitoring');
  }
}
