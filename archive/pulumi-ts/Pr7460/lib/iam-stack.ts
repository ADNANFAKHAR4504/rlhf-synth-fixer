/**
 * IAM Stack - Creates cross-account IAM roles for multi-phase migration.
 *
 * Roles:
 * - DMS VPC management role
 * - Cross-account assume roles for each migration phase
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface IamStackArgs {
  environmentSuffix: string;
  migrationPhase: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class IamStack extends pulumi.ComponentResource {
  public readonly dmsVpcRoleArn: pulumi.Output<string>;
  public readonly crossAccountRoleArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: IamStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:migration:IamStack', name, args, opts);

    const tags = args.tags || {};

    // Create DMS VPC management role
    const dmsVpcRole = new aws.iam.Role(
      `dms-vpc-role-${args.environmentSuffix}`,
      {
        name: `dms-vpc-mgmt-role-${args.environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'dms.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: {
          ...tags,
          Name: `dms-vpc-role-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Attach AWS managed policy for DMS VPC management
    new aws.iam.RolePolicyAttachment(
      `dms-vpc-policy-${args.environmentSuffix}`,
      {
        role: dmsVpcRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AmazonDMSVPCManagementRole',
      },
      { parent: this }
    );

    // Get current account ID dynamically
    const currentAccount = pulumi.output(aws.getCallerIdentity({}));

    // Create cross-account assume role for migration phases
    // This allows the current account to assume this role
    const crossAccountRole = new aws.iam.Role(
      `cross-account-role-${args.environmentSuffix}`,
      {
        name: `migration-cross-account-${args.environmentSuffix}`,
        assumeRolePolicy: currentAccount.apply(account =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: {
                  AWS: `arn:aws:iam::${account.accountId}:root`,
                },
                Action: 'sts:AssumeRole',
                Condition: {
                  StringEquals: {
                    'sts:ExternalId': `migration-${args.migrationPhase}`,
                  },
                },
              },
            ],
          })
        ),
        tags: {
          ...tags,
          Name: `cross-account-role-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Attach policy for cross-account access
    new aws.iam.RolePolicy(
      `cross-account-policy-${args.environmentSuffix}`,
      {
        name: `cross-account-policy-${args.environmentSuffix}`,
        role: crossAccountRole.id,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'dms:DescribeReplicationInstances',
                'dms:DescribeReplicationTasks',
                'dms:StartReplicationTask',
                'dms:StopReplicationTask',
                'rds:DescribeDBInstances',
                'rds:DescribeDBSnapshots',
                'secretsmanager:GetSecretValue',
                'cloudwatch:GetMetricStatistics',
                'cloudwatch:DescribeAlarms',
              ],
              Resource: '*',
            },
          ],
        }),
      },
      { parent: this }
    );

    // Export outputs
    this.dmsVpcRoleArn = dmsVpcRole.arn;
    this.crossAccountRoleArn = crossAccountRole.arn;

    this.registerOutputs({
      dmsVpcRoleArn: this.dmsVpcRoleArn,
      crossAccountRoleArn: this.crossAccountRoleArn,
    });
  }
}
