# Security-Hardened S3 Data Lake with IAM - Pulumi TypeScript Implementation

This implementation creates a security-hardened S3 data lake with KMS encryption, IAM roles, and CloudWatch logging.

## File: lib/tap-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly bucketName: pulumi.Output<string>;
  public readonly dataAnalystRoleArn: pulumi.Output<string>;
  public readonly dataEngineerRoleArn: pulumi.Output<string>;
  public readonly dataAdminRoleArn: pulumi.Output<string>;
  public readonly kmsKeyId: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    const defaultTags = {
      Environment: environmentSuffix,
      Department: 'DataEngineering',
      CostCenter: 'Finance',
      ...tags,
    };

    // KMS Key for encryption
    const kmsKey = new aws.kms.Key(`datalake-kms-key-${environmentSuffix}`, {
      description: 'KMS key for S3 data lake encryption',
      enableKeyRotation: true,
      tags: defaultTags,
    }, { parent: this });

    const kmsKeyAlias = new aws.kms.Alias(`datalake-kms-alias-${environmentSuffix}`, {
      name: `alias/datalake-${environmentSuffix}`,
      targetKeyId: kmsKey.keyId,
    }, { parent: this });

    // CloudWatch Log Group for S3 access logging (ERROR: Missing encryption)
    const logGroup = new aws.cloudwatch.LogGroup(`datalake-logs-${environmentSuffix}`, {
      name: `/aws/s3/datalake-${environmentSuffix}`,
      retentionInDays: 30,
      tags: defaultTags,
    }, { parent: this });

    // S3 Bucket
    const bucket = new aws.s3.Bucket(`datalake-bucket-${environmentSuffix}`, {
      bucket: `financial-datalake-${environmentSuffix}`,
      tags: defaultTags,
    }, { parent: this });

    // S3 Bucket Versioning (ERROR: MFA delete not enabled)
    const bucketVersioning = new aws.s3.BucketVersioningV2(`datalake-versioning-${environmentSuffix}`, {
      bucket: bucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    }, { parent: this });

    // S3 Bucket Encryption
    const bucketEncryption = new aws.s3.BucketServerSideEncryptionConfigurationV2(
      `datalake-encryption-${environmentSuffix}`,
      {
        bucket: bucket.id,
        rules: [{
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'aws:kms',
            kmsMasterKeyId: kmsKey.arn,
          },
          bucketKeyEnabled: true,
        }],
      },
      { parent: this }
    );

    // S3 Bucket Public Access Block
    const bucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(
      `datalake-public-access-block-${environmentSuffix}`,
      {
        bucket: bucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // S3 Lifecycle Configuration (ERROR: Missing abort incomplete multipart uploads)
    const bucketLifecycle = new aws.s3.BucketLifecycleConfigurationV2(
      `datalake-lifecycle-${environmentSuffix}`,
      {
        bucket: bucket.id,
        rules: [{
          id: 'glacier-transition',
          status: 'Enabled',
          transitions: [{
            days: 90,
            storageClass: 'GLACIER',
          }],
        }],
      },
      { parent: this }
    );

    // IAM Role for DataAnalyst (ERROR: Missing maxSessionDuration)
    const dataAnalystRole = new aws.iam.Role(`data-analyst-role-${environmentSuffix}`, {
      name: `DataAnalyst-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Principal: {
            AWS: [
              'arn:aws:iam::123456789012:root',
            ],
          },
          Action: 'sts:AssumeRole',
        }],
      }),
      tags: defaultTags,
    }, { parent: this });

    // DataAnalyst Policy (ERROR: Uses wildcards instead of explicit ARNs)
    const dataAnalystPolicy = new aws.iam.RolePolicy(`data-analyst-policy-${environmentSuffix}`, {
      role: dataAnalystRole.id,
      policy: pulumi.all([bucket.arn]).apply(([bucketArn]) => JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Action: [
            's3:GetObject',
            's3:ListBucket',
          ],
          Resource: [
            `${bucketArn}/*`,
            bucketArn,
          ],
        }, {
          Effect: 'Allow',
          Action: [
            'kms:Decrypt',
          ],
          Resource: '*',
        }],
      })),
    }, { parent: this });

    // IAM Role for DataEngineer
    const dataEngineerRole = new aws.iam.Role(`data-engineer-role-${environmentSuffix}`, {
      name: `DataEngineer-${environmentSuffix}`,
      maxSessionDuration: 3600,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Principal: {
            AWS: [
              'arn:aws:iam::123456789012:root',
            ],
          },
          Action: 'sts:AssumeRole',
        }],
      }),
      tags: defaultTags,
    }, { parent: this });

    // DataEngineer Policy (ERROR: Missing source IP condition)
    const dataEngineerPolicy = new aws.iam.RolePolicy(`data-engineer-policy-${environmentSuffix}`, {
      role: dataEngineerRole.id,
      policy: pulumi.all([bucket.arn, kmsKey.arn]).apply(([bucketArn, keyArn]) => JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Action: [
            's3:GetObject',
            's3:PutObject',
            's3:DeleteObject',
            's3:ListBucket',
          ],
          Resource: [
            `${bucketArn}/*`,
            bucketArn,
          ],
        }, {
          Effect: 'Allow',
          Action: [
            'kms:Decrypt',
            'kms:Encrypt',
            'kms:GenerateDataKey',
          ],
          Resource: keyArn,
        }],
      })),
    }, { parent: this });

    // IAM Role for DataAdmin
    const dataAdminRole = new aws.iam.Role(`data-admin-role-${environmentSuffix}`, {
      name: `DataAdmin-${environmentSuffix}`,
      maxSessionDuration: 3600,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Principal: {
            AWS: [
              'arn:aws:iam::123456789012:root',
            ],
          },
          Action: 'sts:AssumeRole',
        }],
      }),
      tags: defaultTags,
    }, { parent: this });

    // DataAdmin Policy
    const dataAdminPolicy = new aws.iam.RolePolicy(`data-admin-policy-${environmentSuffix}`, {
      role: dataAdminRole.id,
      policy: pulumi.all([bucket.arn, kmsKey.arn]).apply(([bucketArn, keyArn]) => JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Action: 's3:*',
          Resource: [
            `${bucketArn}/*`,
            bucketArn,
          ],
          Condition: {
            IpAddress: {
              'aws:SourceIp': ['10.0.0.0/8'],
            },
          },
        }, {
          Effect: 'Allow',
          Action: 'kms:*',
          Resource: keyArn,
          Condition: {
            IpAddress: {
              'aws:SourceIp': ['10.0.0.0/8'],
            },
          },
        }],
      })),
    }, { parent: this });

    // S3 Bucket Policy (ERROR: Doesn't enforce HTTPS properly)
    const bucketPolicy = new aws.s3.BucketPolicy(`datalake-policy-${environmentSuffix}`, {
      bucket: bucket.id,
      policy: pulumi.all([bucket.arn]).apply(([bucketArn]) => JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Sid: 'DenyUnencryptedObjectUploads',
          Effect: 'Deny',
          Principal: '*',
          Action: 's3:PutObject',
          Resource: `${bucketArn}/*`,
          Condition: {
            StringNotEquals: {
              's3:x-amz-server-side-encryption': 'aws:kms',
            },
          },
        }],
      })),
    }, { parent: this });

    // Export outputs
    this.bucketName = bucket.id;
    this.dataAnalystRoleArn = dataAnalystRole.arn;
    this.dataEngineerRoleArn = dataEngineerRole.arn;
    this.dataAdminRoleArn = dataAdminRole.arn;
    this.kmsKeyId = kmsKey.keyId;

    this.registerOutputs({
      bucketName: this.bucketName,
      dataAnalystRoleArn: this.dataAnalystRoleArn,
      dataEngineerRoleArn: this.dataEngineerRoleArn,
      dataAdminRoleArn: this.dataAdminRoleArn,
      kmsKeyId: this.kmsKeyId,
    });
  }
}
```

## File: index.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from './lib/tap-stack';

const config = new pulumi.Config();
const environmentSuffix = config.get('environmentSuffix') || 'dev';

const stack = new TapStack('datalake-stack', {
  environmentSuffix: environmentSuffix,
  tags: {
    Project: 'DataLake',
    ManagedBy: 'Pulumi',
  },
});

export const bucketName = stack.bucketName;
export const dataAnalystRoleArn = stack.dataAnalystRoleArn;
export const dataEngineerRoleArn = stack.dataEngineerRoleArn;
export const dataAdminRoleArn = stack.dataAdminRoleArn;
export const kmsKeyId = stack.kmsKeyId;
```

## Deployment Instructions

1. Install dependencies:
```bash
npm install @pulumi/pulumi @pulumi/aws
```

2. Configure AWS region:
```bash
pulumi config set aws:region ap-northeast-2
```

3. Set environment suffix:
```bash
pulumi config set environmentSuffix dev
```

4. Deploy the stack:
```bash
pulumi up
```

5. View outputs:
```bash
pulumi stack output
```
