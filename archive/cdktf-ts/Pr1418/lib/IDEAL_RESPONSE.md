# CDKTF TypeScript Infrastructure Solution

## lib/secure-infra-stack.ts

```typescript
import { Construct } from 'constructs';
import { TerraformStack, TerraformOutput, Fn } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketPolicy } from '@cdktf/provider-aws/lib/s3-bucket-policy';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { DynamodbTable } from '@cdktf/provider-aws/lib/dynamodb-table';
import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';

const commonTags = {
  Project: 'SecureInfra',
  Environment: 'Prod',
  Owner: 'Akshat Jain',
};

export class SecureInfraStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    new AwsProvider(this, 'AWS', { region: 'us-east-1' });

    const uniqueSuffix = Fn.substr(Fn.uuid(), 0, 8);
    const callerIdentity = new DataAwsCallerIdentity(this, 'Deployer');

    // --- BACKEND RESOURCES ---
    const backendKmsKey = new KmsKey(this, 'BackendKmsKey', {
      description: 'KMS key for Terraform state bucket',
      enableKeyRotation: true,
      tags: commonTags,
    });

    const stateBucket = new S3Bucket(this, 'TerraformStateBucket', {
      bucket: `secure-infra-tfstate-bucket-${uniqueSuffix}`,
      tags: commonTags,
    });

    new S3BucketPublicAccessBlock(this, 'StateBucketPublicAccessBlock', {
      bucket: stateBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    new S3BucketServerSideEncryptionConfigurationA(
      this,
      'StateBucketEncryption',
      {
        bucket: stateBucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: backendKmsKey.id,
            },
          },
        ],
      }
    );

    new S3BucketVersioningA(this, 'StateBucketVersioning', {
      bucket: stateBucket.id,
      versioningConfiguration: { status: 'Enabled' },
    });

    const stateBucketPolicyDoc = new DataAwsIamPolicyDocument(
      this,
      'StateBucketPolicyDoc',
      {
        statement: [
          {
            effect: 'Deny',
            principals: [{ type: '*', identifiers: ['*'] }],
            actions: ['s3:*'],
            resources: [stateBucket.arn, `${stateBucket.arn}/*`],
            condition: [
              {
                test: 'Bool',
                variable: 'aws:SecureTransport',
                values: ['false'],
              },
            ],
          },
        ],
      }
    );

    new S3BucketPolicy(this, 'StateBucketPolicy', {
      bucket: stateBucket.id,
      policy: stateBucketPolicyDoc.json,
    });

    const lockTable = new DynamodbTable(this, 'TerraformLockTable', {
      name: `secure-infra-terraform-locks-${uniqueSuffix}`,
      billingMode: 'PAY_PER_REQUEST',
      hashKey: 'LockID',
      attribute: [{ name: 'LockID', type: 'S' }],
      tags: commonTags,
    });

    // --- IAM & STORAGE RESOURCES ---
    const kmsKey = new KmsKey(this, 'SensitiveDataKmsKey', {
      description: 'KMS key for sensitive data S3 bucket',
      enableKeyRotation: true,
      deletionWindowInDays: 10,
      tags: commonTags,
    });

    const sensitiveDataBucket = new S3Bucket(this, 'SensitiveDataBucket', {
      bucket: `sensitive-data-bucket-${uniqueSuffix}`,
      tags: commonTags,
    });

    const limitedAccessRole = new IamRole(this, 'S3LimitedAccessRole', {
      name: `S3LimitedAccessRole-${uniqueSuffix}`,
      assumeRolePolicy: new DataAwsIamPolicyDocument(this, 'RoleTrustPolicy', {
        statement: [
          {
            effect: 'Allow',
            actions: ['sts:AssumeRole'],
            principals: [
              {
                type: 'AWS',
                identifiers: [`arn:aws:iam::${callerIdentity.accountId}:root`],
              },
            ],
          },
        ],
      }).json,
      tags: commonTags,
    });

    new S3BucketVersioningA(this, 'SensitiveDataBucketVersioning', {
      bucket: sensitiveDataBucket.id,
      versioningConfiguration: { status: 'Enabled' },
    });

    new S3BucketServerSideEncryptionConfigurationA(
      this,
      'SensitiveDataBucketEncryption',
      {
        bucket: sensitiveDataBucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: kmsKey.id,
            },
          },
        ],
      }
    );

    new S3BucketPublicAccessBlock(this, 'SensitiveDataPublicAccessBlock', {
      bucket: sensitiveDataBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    const bucketPolicyDocument = new DataAwsIamPolicyDocument(
      this,
      'SensitiveDataBucketPolicyDoc',
      {
        statement: [
          {
            effect: 'Deny',
            principals: [{ type: '*', identifiers: ['*'] }],
            actions: ['s3:*'],
            resources: [
              sensitiveDataBucket.arn,
              `${sensitiveDataBucket.arn}/*`,
            ],
            condition: [
              {
                test: 'StringNotEquals',
                variable: 'aws:PrincipalArn',
                values: [limitedAccessRole.arn, callerIdentity.arn],
              },
            ],
          },
          {
            effect: 'Deny',
            principals: [{ type: '*', identifiers: ['*'] }],
            actions: ['s3:*'],
            resources: [
              sensitiveDataBucket.arn,
              `${sensitiveDataBucket.arn}/*`,
            ],
            condition: [
              {
                test: 'Bool',
                variable: 'aws:SecureTransport',
                values: ['false'],
              },
            ],
          },
        ],
      }
    );

    new S3BucketPolicy(this, 'SensitiveDataBucketPolicy', {
      bucket: sensitiveDataBucket.id,
      policy: bucketPolicyDocument.json,
    });

    const accessPolicyDocument = new DataAwsIamPolicyDocument(
      this,
      'S3AccessPolicyDoc',
      {
        statement: [
          {
            effect: 'Allow',
            actions: ['s3:GetObject', 's3:PutObject'],
            resources: [`${sensitiveDataBucket.arn}/*`],
          },
          {
            effect: 'Allow',
            actions: ['s3:ListBucket'],
            resources: [sensitiveDataBucket.arn],
          },
          {
            effect: 'Allow',
            // FIX: Add the missing kms:GenerateDataKey permission
            actions: ['kms:Decrypt', 'kms:Encrypt', 'kms:GenerateDataKey'],
            resources: [kmsKey.arn],
          },
        ],
      }
    );

    const s3AccessPolicy = new IamPolicy(this, 'S3AccessPolicy', {
      name: `S3LimitedAccessPolicy-${uniqueSuffix}`,
      policy: accessPolicyDocument.json,
      tags: commonTags,
    });

    new IamRolePolicyAttachment(this, 'RolePolicyAttachment', {
      role: limitedAccessRole.name,
      policyArn: s3AccessPolicy.arn,
    });

    new TerraformOutput(this, 'StateBucketName', { value: stateBucket.bucket });
    new TerraformOutput(this, 'LockTableName', { value: lockTable.name });
    new TerraformOutput(this, 'SensitiveDataBucketName', {
      value: sensitiveDataBucket.bucket,
    });
  }
}
```
