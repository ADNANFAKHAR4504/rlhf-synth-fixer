import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface IamRolesArgs {
  environmentSuffix: string;
  publicBucket: aws.s3.BucketV2;
  internalBucket: aws.s3.BucketV2;
  confidentialBucket: aws.s3.BucketV2;
  kmsKey: aws.kms.Key;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class IamRoles extends pulumi.ComponentResource {
  public readonly developerRole: aws.iam.Role;
  public readonly analystRole: aws.iam.Role;
  public readonly adminRole: aws.iam.Role;

  constructor(
    name: string,
    args: IamRolesArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:iam:IamRoles', name, {}, opts);

    const {
      environmentSuffix,
      publicBucket,
      internalBucket,
      confidentialBucket,
      kmsKey,
      tags,
    } = args;

    // Get current AWS account ID
    const currentAccount = aws.getCallerIdentityOutput();

    // Assume role policy document for all roles
    const assumeRolePolicyDoc = aws.iam.getPolicyDocumentOutput({
      statements: [
        {
          effect: 'Allow',
          principals: [
            {
              type: 'AWS',
              identifiers: [
                currentAccount.accountId.apply(id => `arn:aws:iam::${id}:root`),
              ],
            },
          ],
          actions: ['sts:AssumeRole'],
        },
      ],
    });

    // Developer Role - Read-only access to public and internal buckets
    this.developerRole = new aws.iam.Role(
      `developer-role-${environmentSuffix}`,
      {
        name: `developer-role-${environmentSuffix}`,
        assumeRolePolicy: assumeRolePolicyDoc.json,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          RoleType: 'developer',
        })),
      },
      { parent: this }
    );

    const developerPolicyDoc = aws.iam.getPolicyDocumentOutput({
      statements: [
        {
          sid: 'ReadPublicBucket',
          effect: 'Allow',
          actions: ['s3:GetObject', 's3:ListBucket'],
          resources: [
            publicBucket.arn,
            pulumi.interpolate`${publicBucket.arn}/*`,
          ],
        },
        {
          sid: 'ReadInternalBucket',
          effect: 'Allow',
          actions: ['s3:GetObject', 's3:ListBucket'],
          resources: [
            internalBucket.arn,
            pulumi.interpolate`${internalBucket.arn}/*`,
          ],
        },
      ],
    });

    new aws.iam.RolePolicy(
      `developer-policy-${environmentSuffix}`,
      {
        role: this.developerRole.id,
        policy: developerPolicyDoc.json,
      },
      { parent: this }
    );

    // Analyst Role - Read/write to internal, read-only to confidential
    this.analystRole = new aws.iam.Role(
      `analyst-role-${environmentSuffix}`,
      {
        name: `analyst-role-${environmentSuffix}`,
        assumeRolePolicy: assumeRolePolicyDoc.json,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          RoleType: 'analyst',
        })),
      },
      { parent: this }
    );

    const analystPolicyDoc = aws.iam.getPolicyDocumentOutput({
      statements: [
        {
          sid: 'ReadWriteInternalBucket',
          effect: 'Allow',
          actions: [
            's3:GetObject',
            's3:PutObject',
            's3:DeleteObject',
            's3:ListBucket',
          ],
          resources: [
            internalBucket.arn,
            pulumi.interpolate`${internalBucket.arn}/*`,
          ],
        },
        {
          sid: 'ReadConfidentialBucket',
          effect: 'Allow',
          actions: ['s3:GetObject', 's3:ListBucket'],
          resources: [
            confidentialBucket.arn,
            pulumi.interpolate`${confidentialBucket.arn}/*`,
          ],
        },
        {
          sid: 'UseKmsKey',
          effect: 'Allow',
          actions: ['kms:Decrypt', 'kms:DescribeKey'],
          resources: [kmsKey.arn],
        },
      ],
    });

    new aws.iam.RolePolicy(
      `analyst-policy-${environmentSuffix}`,
      {
        role: this.analystRole.id,
        policy: analystPolicyDoc.json,
      },
      { parent: this }
    );

    // Admin Role - Full access to all buckets
    this.adminRole = new aws.iam.Role(
      `admin-role-${environmentSuffix}`,
      {
        name: `admin-role-${environmentSuffix}`,
        assumeRolePolicy: assumeRolePolicyDoc.json,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          RoleType: 'admin',
        })),
      },
      { parent: this }
    );

    const adminPolicyDoc = aws.iam.getPolicyDocumentOutput({
      statements: [
        {
          sid: 'FullAccessAllBuckets',
          effect: 'Allow',
          actions: ['s3:*'],
          resources: [
            publicBucket.arn,
            pulumi.interpolate`${publicBucket.arn}/*`,
            internalBucket.arn,
            pulumi.interpolate`${internalBucket.arn}/*`,
            confidentialBucket.arn,
            pulumi.interpolate`${confidentialBucket.arn}/*`,
          ],
        },
        {
          sid: 'ManageBucketPolicies',
          effect: 'Allow',
          actions: [
            's3:PutBucketPolicy',
            's3:GetBucketPolicy',
            's3:DeleteBucketPolicy',
          ],
          resources: [
            publicBucket.arn,
            internalBucket.arn,
            confidentialBucket.arn,
          ],
        },
        {
          sid: 'FullKmsAccess',
          effect: 'Allow',
          actions: ['kms:*'],
          resources: [kmsKey.arn],
        },
      ],
    });

    new aws.iam.RolePolicy(
      `admin-policy-${environmentSuffix}`,
      {
        role: this.adminRole.id,
        policy: adminPolicyDoc.json,
      },
      { parent: this }
    );

    this.registerOutputs({
      developerRoleArn: this.developerRole.arn,
      analystRoleArn: this.analystRole.arn,
      adminRoleArn: this.adminRole.arn,
    });
  }
}
