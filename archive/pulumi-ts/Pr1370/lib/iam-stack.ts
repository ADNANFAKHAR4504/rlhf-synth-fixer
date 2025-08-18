/**
 * iam-stack.ts
 *
 * This module defines the IAMStack component for creating IAM roles and policies
 * with restricted S3 access following the principle of least privilege.
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';

export interface IAMStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
  namePrefix: string;
  bucketArn: pulumi.Input<string>;
  region: string;
}

export class IAMStack extends pulumi.ComponentResource {
  public readonly roleArn: pulumi.Output<string>;

  constructor(name: string, args: IAMStackArgs, opts?: ResourceOptions) {
    super('tap:iam:IAMStack', name, args, opts);

    const s3AccessRoleName = `${args.namePrefix}-iam-role-s3-access-${args.environmentSuffix}`;

    // IAM Role with restricted S3 access
    const s3AccessRole = new aws.iam.Role(
      s3AccessRoleName,
      {
        name: s3AccessRoleName,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
            },
          ],
        }),
        tags: {
          ...args.tags,
          ResourceType: 'IAMRole',
          Purpose: 'S3BucketAccess',
        },
      },
      { parent: this, provider: opts?.provider }
    );

    // IAM Policy for restricted S3 bucket access (principle of least privilege)
    const s3AccessPolicyName = `${args.namePrefix}-iam-policy-s3-restricted-${args.environmentSuffix}`;
    const s3AccessPolicy = new aws.iam.Policy(
      s3AccessPolicyName,
      {
        name: s3AccessPolicyName,
        description: 'Restricted access policy for specific S3 bucket',
        policy: pulumi.all([args.bucketArn]).apply(([bucketArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'S3BucketAccess',
                Effect: 'Allow',
                Action: [
                  's3:GetObject',
                  's3:PutObject',
                  's3:DeleteObject',
                  's3:GetObjectVersion',
                  's3:ListBucket',
                ],
                Resource: [bucketArn, `${bucketArn}/*`],
                Condition: {
                  StringEquals: {
                    's3:ExistingObjectTag/Environment': args.environmentSuffix,
                  },
                },
              },
              {
                Sid: 'KMSAccess',
                Effect: 'Allow',
                Action: [
                  'kms:Decrypt',
                  'kms:GenerateDataKey',
                  'kms:DescribeKey',
                ],
                Resource: 'arn:aws:kms:*:*:key/*',
                Condition: {
                  StringEquals: {
                    'kms:ViaService': `s3.${args.region}.amazonaws.com`,
                  },
                  StringLike: {
                    'kms:EncryptionContext:aws:s3:arn': `${bucketArn}/*`,
                  },
                },
              },
            ],
          })
        ),
        tags: {
          ...args.tags,
          ResourceType: 'IAMPolicy',
          Purpose: 'S3BucketAccess',
        },
      },
      { parent: this, provider: opts?.provider }
    );

    // Attach policy to role
    new aws.iam.RolePolicyAttachment(
      's3-policy-attachment',
      {
        role: s3AccessRole.name,
        policyArn: s3AccessPolicy.arn,
      },
      { parent: this, provider: opts?.provider }
    );

    this.roleArn = s3AccessRole.arn;

    this.registerOutputs({
      roleArn: this.roleArn,
    });
  }
}
