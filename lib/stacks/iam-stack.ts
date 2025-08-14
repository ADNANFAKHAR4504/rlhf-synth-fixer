/**
 * iam-stack.ts
 *
 * This module defines the IAM stack for creating roles and policies
 * following the principle of least privilege.
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';

export interface IamStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class IamStack extends pulumi.ComponentResource {
  public readonly ec2RoleArn: pulumi.Output<string>;
  public readonly ec2RoleName: pulumi.Output<string>;
  public readonly ec2InstanceProfileName: pulumi.Output<string>;

  constructor(name: string, args: IamStackArgs, opts?: ResourceOptions) {
    super('tap:iam:IamStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // EC2 IAM Role
    const ec2Role = new aws.iam.Role(
      `tap-ec2-role-${environmentSuffix}`,
      {
        name: `tap-ec2-role-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: {
          Name: `tap-ec2-role-${environmentSuffix}`,
          Purpose: 'EC2InstanceExecution',
          ...tags,
        },
      },
      { parent: this }
    );

    // Get current AWS account ID and region for more specific IAM policies
    const currentRegion = aws.getRegion();
    const currentIdentity = aws.getCallerIdentity();

    // EC2 logging policy - FIXED: Restricted to specific log groups with account and region
    new aws.iam.RolePolicy(
      `tap-ec2-logging-policy-${environmentSuffix}`,
      {
        role: ec2Role.id,
        policy: pulumi
          .all([currentRegion, currentIdentity])
          .apply(([region, identity]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    'logs:CreateLogGroup',
                    'logs:CreateLogStream',
                    'logs:PutLogEvents',
                    'logs:DescribeLogStreams',
                  ],
                  Resource: `arn:aws:logs:${region.name}:${identity.accountId}:log-group:/aws/ec2/tap/*`,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // Attach CloudWatch agent policy
    new aws.iam.RolePolicyAttachment(
      `tap-ec2-cloudwatch-policy-${environmentSuffix}`,
      {
        role: ec2Role.name,
        policyArn: 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
      },
      { parent: this }
    );

    // Create instance profile
    const instanceProfile = new aws.iam.InstanceProfile(
      `tap-ec2-profile-${environmentSuffix}`,
      {
        name: `tap-ec2-profile-${environmentSuffix}`,
        role: ec2Role.name,
        tags: {
          Name: `tap-ec2-profile-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    this.ec2RoleArn = ec2Role.arn;
    this.ec2RoleName = ec2Role.name;
    this.ec2InstanceProfileName = instanceProfile.name;

    this.registerOutputs({
      ec2RoleArn: this.ec2RoleArn,
      ec2RoleName: this.ec2RoleName,
      ec2InstanceProfileName: this.ec2InstanceProfileName,
    });
  }
}
