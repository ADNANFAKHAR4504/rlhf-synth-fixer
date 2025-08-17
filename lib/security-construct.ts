import { Construct } from 'constructs';
import { VpcConstruct } from './vpc-construct';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';

interface SecurityConstructProps {
  prefix: string;
  vpc: VpcConstruct;
}

export class SecurityConstruct extends Construct {
  public readonly kmsKeys: Record<string, KmsKey> = {};
  public readonly iamRoles: Record<string, IamRole> = {};
  public readonly securityGroups: Record<string, IamRole[]> = {};

  constructor(scope: Construct, id: string, props: SecurityConstructProps) {
    super(scope, id);

    // For each region, create KMS key, IAM roles with least privilege, security groups
    Object.keys(props.vpc.vpcs).forEach(region => {
      // KMS Key
      const kmsKeyInstance = new KmsKey(this, `${props.prefix}-kms-${region}`, {
        provider: props.vpc.providers[region],
        description: `KMS key for ${props.prefix} ${region} encryption`,
        keyUsage: 'ENCRYPT_DECRYPT',
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'Enable IAM User Permissions',
              Effect: 'Allow',
              Principal: { AWS: 'arn:aws:iam::*:root' },
              Action: 'kms:*',
              Resource: '*',
            },
          ],
        }),
        tags: {
          Name: `${props.prefix}-kms-key-${region}`,
          Environment: props.prefix,
        },
      });
      this.kmsKeys[region] = kmsKeyInstance;
      // IAM Role (EC2)
      const ec2RoleInstance = new IamRole(
        this,
        `${props.prefix}-ec2-role-${region}`,
        {
          provider: props.vpc.vpcs[region].provider,
          name: `${props.prefix}-ec2-role-${region}`,
          assumeRolePolicy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Action: 'sts:AssumeRole',
                Effect: 'Allow',
                Principal: { Service: 'ec2.amazonaws.com' },
              },
            ],
          }),
          tags: {
            Name: `${props.prefix}-ec2-role-${region}`,
            Environment: props.prefix,
          },
        }
      );
      this.iamRoles[region] = ec2RoleInstance;
      // Attach least privilege policy to EC2
      new IamRolePolicy(this, `${props.prefix}-ec2-policy-${region}`, {
        provider: props.vpc.vpcs[region].provider,
        name: `${props.prefix}-ec2-policy-${region}`,
        role: ec2RoleInstance.id,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              Resource: `arn:aws:logs:${region}:*:*`,
            },
            {
              Effect: 'Allow',
              Action: ['kms:Decrypt', 'kms:DescribeKey'],
              Resource: kmsKeyInstance.arn,
            },
          ],
        }),
      });
      // IAM Role (Lambda)
      const lambdaRoleInstance = new IamRole(
        this,
        `${props.prefix}-lambda-role-${region}`,
        {
          provider: props.vpc.vpcs[region].provider,
          name: `${props.prefix}-lambda-role-${region}`,
          assumeRolePolicy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Action: 'sts:AssumeRole',
                Effect: 'Allow',
                Principal: { Service: 'lambda.amazonaws.com' },
              },
            ],
          }),
          tags: {
            Name: `${props.prefix}-lambda-role-${region}`,
            Environment: props.prefix,
          },
        }
      );
      // Attach least privilege policy to Lambda
      new IamRolePolicy(this, `${props.prefix}-lambda-policy-${region}`, {
        provider: props.vpc.vpcs[region].provider,
        name: `${props.prefix}-lambda-policy-${region}`,
        role: lambdaRoleInstance.id,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              Resource: `arn:aws:logs:${region}:*:*`,
            },
            {
              Effect: 'Allow',
              Action: ['kms:Decrypt', 'kms:DescribeKey'],
              Resource: kmsKeyInstance.arn,
            },
            {
              Effect: 'Allow',
              Action: [
                'ec2:CreateNetworkInterface',
                'ec2:DescribeNetworkInterfaces',
                'ec2:DeleteNetworkInterface',
              ],
              Resource: '*',
            },
          ],
        }),
      });
    });
  }
}
