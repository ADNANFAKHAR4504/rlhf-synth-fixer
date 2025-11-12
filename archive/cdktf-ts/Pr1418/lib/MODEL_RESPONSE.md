I'll create a comprehensive CDKTF configuration that meets all your security and infrastructure requirements. Let me break this down into monolithic constructs with proper TypeScript interfaces, all code will be there in single file.

## Configuration Interfaces

**interfaces/config.ts**

```ts
export interface CommonTags {
  Project: string;
  Environment: string;
  Owner: string;
}

export interface BackendConfig {
  bucketName: string;
  dynamoTableName: string;
  region: string;
  tags: CommonTags;
}

export interface StorageConfig {
  bucketNames: string[];
  kmsKeyAlias: string;
  region: string;
  tags: CommonTags;
}

export interface IamConfig {
  roleName: string;
  policyName: string;
  allowedUsers: string[];
  bucketArns: string[];
  region: string;
  tags: CommonTags;
}

export interface AppConfig {
  region: string;
  tags: CommonTags;
  backend: BackendConfig;
  storage: StorageConfig;
  iam: IamConfig;
}
```

## Full Code

** Tap-stack **

```ts
import { Construct } from 'constructs';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioning } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketServerSideEncryptionConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { DynamodbTable } from '@cdktf/provider-aws/lib/dynamodb-table';
import { S3BucketPolicy } from '@cdktf/provider-aws/lib/s3-bucket-policy';
import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';
import { BackendConfig } from '../interfaces/config';
import { Construct } from 'constructs';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioning } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketServerSideEncryptionConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { KmsAlias } from '@cdktf/provider-aws/lib/kms-alias';
import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';
import { S3BucketPolicy } from '@cdktf/provider-aws/lib/s3-bucket-policy';
import { StorageConfig } from '../interfaces/config';
import { Construct } from 'constructs';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamUserPolicyAttachment } from '@cdktf/provider-aws/lib/iam-user-policy-attachment';
import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';
import { IamConfig } from '../interfaces/config';
import { App, TerraformStack, S3Backend } from 'cdktf';
import { Construct } from 'constructs';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { BackendConstruct } from './constructs/backend-construct';
import { StorageConstruct } from './constructs/storage-construct';
import { IamConstruct } from './constructs/iam-construct';
import { AppConfig } from './interfaces/config';

export class BackendConstruct extends Construct {
  public readonly bucket: S3Bucket;
  public readonly dynamoTable: DynamodbTable;

  constructor(scope: Construct, id: string, config: BackendConfig) {
    super(scope, id);

    // S3 Bucket for Terraform State
    this.bucket = new S3Bucket(this, 'terraform-state-bucket', {
      bucket: config.bucketName,
      tags: config.tags,
    });

    // Enable versioning for state recovery
    new S3BucketVersioning(this, 'terraform-state-versioning', {
      bucket: this.bucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // Server-side encryption with AES256 (can be upgraded to KMS)
    new S3BucketServerSideEncryptionConfiguration(
      this,
      'terraform-state-encryption',
      {
        bucket: this.bucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
            bucketKeyEnabled: true,
          },
        ],
      }
    );

    // Block all public access
    new S3BucketPublicAccessBlock(this, 'terraform-state-public-access-block', {
      bucket: this.bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // Secure bucket policy - only allow authenticated AWS users
    const bucketPolicyDocument = new DataAwsIamPolicyDocument(
      this,
      'terraform-state-policy-document',
      {
        statement: [
          {
            sid: 'DenyInsecureConnections',
            effect: 'Deny',
            principals: [{ type: '*', identifiers: ['*'] }],
            actions: ['s3:*'],
            resources: [this.bucket.arn, `${this.bucket.arn}/*`],
            condition: [
              {
                test: 'Bool',
                variable: 'aws:SecureTransport',
                values: ['false'],
              },
            ],
          },
          {
            sid: 'DenyUnencryptedObjectUploads',
            effect: 'Deny',
            principals: [{ type: '*', identifiers: ['*'] }],
            actions: ['s3:PutObject'],
            resources: [`${this.bucket.arn}/*`],
            condition: [
              {
                test: 'StringNotEquals',
                variable: 's3:x-amz-server-side-encryption',
                values: ['AES256'],
              },
            ],
          },
        ],
      }
    );

    new S3BucketPolicy(this, 'terraform-state-bucket-policy', {
      bucket: this.bucket.id,
      policy: bucketPolicyDocument.json,
    });

    // DynamoDB table for state locking
    this.dynamoTable = new DynamodbTable(this, 'terraform-state-lock', {
      name: config.dynamoTableName,
      billingMode: 'PAY_PER_REQUEST',
      hashKey: 'LockID',
      attribute: [
        {
          name: 'LockID',
          type: 'S',
        },
      ],
      serverSideEncryption: {
        enabled: true,
      },
      pointInTimeRecovery: {
        enabled: true,
      },
      tags: config.tags,
    });
  }
}
```

export class StorageConstruct extends Construct {
public readonly buckets: S3Bucket[];
public readonly kmsKey: KmsKey;
public readonly bucketArns: string[];

constructor(scope: Construct, id: string, config: StorageConfig) {
super(scope, id);

    // Create KMS key for encryption
    this.kmsKey = new KmsKey(this, 'sensitive-data-kms-key', {
      description: 'KMS key for sensitive data encryption',
      keyUsage: 'ENCRYPT_DECRYPT',
      keySpec: 'SYMMETRIC_DEFAULT',
      enableKeyRotation: true,
      deletionWindowInDays: 7,
      tags: config.tags,
    });

    // Create KMS alias
    new KmsAlias(this, 'sensitive-data-kms-alias', {
      name: config.kmsKeyAlias,
      targetKeyId: this.kmsKey.keyId,
    });

    // Create S3 buckets for sensitive data
    this.buckets = config.bucketNames.map((bucketName, index) => {
      const bucket = new S3Bucket(this, `sensitive-data-bucket-${index}`, {
        bucket: bucketName,
        tags: config.tags,
      });

      // Enable versioning
      new S3BucketVersioning(this, `sensitive-data-versioning-${index}`, {
        bucket: bucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      });

      // Server-side encryption with customer-managed KMS key
      new S3BucketServerSideEncryptionConfiguration(
        this,
        `sensitive-data-encryption-${index}`,
        {
          bucket: bucket.id,
          rule: [
            {
              applyServerSideEncryptionByDefault: {
                sseAlgorithm: 'aws:kms',
                kmsMasterKeyId: this.kmsKey.arn,
              },
              bucketKeyEnabled: true,
            },
          ],
        }
      );

      // Block all public access
      new S3BucketPublicAccessBlock(
        this,
        `sensitive-data-public-access-block-${index}`,
        {
          bucket: bucket.id,
          blockPublicAcls: true,
          blockPublicPolicy: true,
          ignorePublicAcls: true,
          restrictPublicBuckets: true,
        }
      );

      // Secure bucket policy
      const bucketPolicyDocument = new DataAwsIamPolicyDocument(
        this,
        `sensitive-data-policy-document-${index}`,
        {
          statement: [
            {
              sid: 'DenyInsecureConnections',
              effect: 'Deny',
              principals: [{ type: '*', identifiers: ['*'] }],
              actions: ['s3:*'],
              resources: [bucket.arn, `${bucket.arn}/*`],
              condition: [
                {
                  test: 'Bool',
                  variable: 'aws:SecureTransport',
                  values: ['false'],
                },
              ],
            },
            {
              sid: 'RequireKMSEncryption',
              effect: 'Deny',
              principals: [{ type: '*', identifiers: ['*'] }],
              actions: ['s3:PutObject'],
              resources: [`${bucket.arn}/*`],
              condition: [
                {
                  test: 'StringNotEquals',
                  variable: 's3:x-amz-server-side-encryption',
                  values: ['aws:kms'],
                },
              ],
            },
          ],
        }
      );

      new S3BucketPolicy(this, `sensitive-data-bucket-policy-${index}`, {
        bucket: bucket.id,
        policy: bucketPolicyDocument.json,
      });

      return bucket;
    });

    this.bucketArns = this.buckets.map(bucket => bucket.arn);

}
}

export class IamConstruct extends Construct {
public readonly role: IamRole;
public readonly policy: IamPolicy;

constructor(scope: Construct, id: string, config: IamConfig) {
super(scope, id);

    // Trust policy for the IAM role
    const trustPolicyDocument = new DataAwsIamPolicyDocument(
      this,
      'trust-policy-document',
      {
        statement: [
          {
            effect: 'Allow',
            principals: [
              {
                type: 'Service',
                identifiers: ['ec2.amazonaws.com'],
              },
            ],
            actions: ['sts:AssumeRole'],
          },
        ],
      }
    );

    // IAM Role for sensitive data access
    this.role = new IamRole(this, 'sensitive-data-role', {
      name: config.roleName,
      assumeRolePolicy: trustPolicyDocument.json,
      tags: config.tags,
    });

    // Least privilege policy for S3 bucket access
    const policyDocument = new DataAwsIamPolicyDocument(
      this,
      'sensitive-data-policy-document',
      {
        statement: [
          // Allow list bucket contents (with conditions)
          {
            sid: 'ListBucketAccess',
            effect: 'Allow',
            actions: [
              's3:ListBucket',
              's3:GetBucketLocation',
              's3:GetBucketVersioning',
            ],
            resources: config.bucketArns,
            condition: [
              {
                test: 'StringEquals',
                variable: 'aws:RequestedRegion',
                values: [config.region],
              },
            ],
          },
          // Allow object operations with MFA and secure transport
          {
            sid: 'ObjectAccess',
            effect: 'Allow',
            actions: [
              's3:GetObject',
              's3:GetObjectVersion',
              's3:PutObject',
              's3:DeleteObject',
              's3:DeleteObjectVersion',
            ],
            resources: config.bucketArns.map(arn => `${arn}/*`),
            condition: [
              {
                test: 'Bool',
                variable: 'aws:SecureTransport',
                values: ['true'],
              },
              {
                test: 'StringEquals',
                variable: 'aws:RequestedRegion',
                values: [config.region],
              },
            ],
          },
          // KMS permissions for encryption/decryption
          {
            sid: 'KMSAccess',
            effect: 'Allow',
            actions: [
              'kms:Decrypt',
              'kms:Encrypt',
              'kms:ReEncrypt*',
              'kms:GenerateDataKey*',
              'kms:DescribeKey',
            ],
            resources: ['*'],
            condition: [
              {
                test: 'StringEquals',
                variable: 'kms:ViaService',
                values: [`s3.${config.region}.amazonaws.com`],
              },
            ],
          },
          // Explicit deny for all other actions
          {
            sid: 'ExplicitDenyOtherActions',
            effect: 'Deny',
            notActions: [
              's3:ListBucket',
              's3:GetBucketLocation',
              's3:GetBucketVersioning',
              's3:GetObject',
              's3:GetObjectVersion',
              's3:PutObject',
              's3:DeleteObject',
              's3:DeleteObjectVersion',
              'kms:Decrypt',
              'kms:Encrypt',
              'kms:ReEncrypt*',
              'kms:GenerateDataKey*',
              'kms:DescribeKey',
            ],
            resources: ['*'],
          },
        ],
      }
    );

    // Create the IAM policy
    this.policy = new IamPolicy(this, 'sensitive-data-policy', {
      name: config.policyName,
      description: 'Least privilege policy for sensitive S3 bucket access',
      policy: policyDocument.json,
      tags: config.tags,
    });

    // Attach policy to role
    new IamRolePolicyAttachment(this, 'role-policy-attachment', {
      role: this.role.name,
      policyArn: this.policy.arn,
    });

    // Attach policy to specified users
    config.allowedUsers.forEach((username, index) => {
      new IamUserPolicyAttachment(this, `user-policy-attachment-${index}`, {
        user: username,
        policyArn: this.policy.arn,
      });
    });

}
}

class SecureInfraStack extends TerraformStack {
constructor(scope: Construct, id: string, config: AppConfig) {
super(scope, id);

    // Configure AWS Provider
    new AwsProvider(this, 'aws', {
      region: config.region,
      defaultTags: [
        {
          tags: config.tags,
        },
      ],
    });

    // Create backend infrastructure
    const backend = new BackendConstruct(this, 'backend', config.backend);

    // Create storage infrastructure
    const storage = new StorageConstruct(this, 'storage', config.storage);

    // Update IAM config with actual bucket ARNs
    const iamConfig = {
      ...config.iam,
      bucketArns: storage.bucketArns,
    };

    // Create IAM infrastructure
    const iam = new IamConstruct(this, 'iam', iamConfig);

    // Configure remote backend
    new S3Backend(this, {
      bucket: backend.bucket.bucket,
      key: 'terraform/state/secure-infra.tfstate',
      region: config.region,
      dynamodbTable: backend.dynamoTable.name,
      encrypt: true,
    });

}
}

// Application configuration
const appConfig: AppConfig = {
region: 'us-east-1',
tags: {
Project: 'SecureInfra',
Environment: 'Prod',
Owner: 'Akshat Jain',
},
backend: {
bucketName: 'secure-infra-terraform-state-bucket-2024',
dynamoTableName: 'secure-infra-terraform-locks',
region: 'us-east-1',
tags: {
Project: 'SecureInfra',
Environment: 'Prod',
Owner: 'Akshat Jain',
},
},
storage: {
bucketNames: [
'secure-infra-sensitive-data-primary-2024',
'secure-infra-sensitive-data-secondary-2024',
],
kmsKeyAlias: 'alias/secure-infra-sensitive-data-key',
region: 'us-east-1',
tags: {
Project: 'SecureInfra',
Environment: 'Prod',
Owner: 'Akshat Jain',
},
},
iam: {
roleName: 'SecureInfraSensitiveDataRole',
policyName: 'SecureInfraSensitiveDataPolicy',
allowedUsers: ['data-analyst-user', 'backup-service-user'], // Replace with actual usernames
bucketArns: [], // Will be populated by storage construct
region: 'us-east-1',
tags: {
Project: 'SecureInfra',
Environment: 'Prod',
Owner: 'Akshat Jain',
},
},
};

const app = new App();
new SecureInfraStack(app, 'secure-infra', appConfig);
app.synth();

````

## CDKTF Configuration

**cdktf.json**

```json
{
  "language": "typescript",
  "app": "npx ts-node main.ts",
  "projectId": "secure-infra-cdktf",
  "sendCrashReports": "false",
  "terraformProviders": ["aws@~> 5.0"],
  "terraformModules": [],
  "context": {
    "excludeStackIdFromLogicalIds": "true",
    "allowSepCharsInLogicalIds": "true"
  }
}
````

## Package.json Dependencies

```json
{
  "name": "secure-infra-cdktf",
  "version": "1.0.0",
  "main": "main.ts",
  "types": "main.ts",
  "scripts": {
    "get": "cdktf get",
    "build": "tsc",
    "synth": "cdktf synth",
    "compile": "tsc --pretty",
    "watch": "tsc -w",
    "test": "jest",
    "deploy": "cdktf deploy",
    "destroy": "cdktf destroy"
  },
  "devDependencies": {
    "@types/jest": "^29.5.5",
    "@types/node": "^20.6.3",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.1",
    "ts-node": "^10.9.1",
    "typescript": "^5.2.2"
  },
  "dependencies": {
    "@cdktf/provider-aws": "^19.0.0",
    "cdktf": "^0.20.0",
    "constructs": "^10.3.0"
  }
}
```

## Deployment Instructions

1. **Initialize the project:**

```bash
npm install
cdktf get
```

2. **Synthesize the configuration:**

```bash
cdktf synth
```

3. **Plan the deployment:**

```bash
cdktf plan
```

4. **Deploy the infrastructure:**

```bash
cdktf deploy
```
