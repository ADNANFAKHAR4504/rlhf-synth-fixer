// main contsruct

import { App, S3Backend, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { BackendConstruct } from './backend-construct';
import { IamConstruct } from './iam-construct';
import { StorageConstruct } from './storage-construct';

// Define common tags for governance and tracking
const commonTags = {
Project: 'SecureInfra',
Environment: 'Prod',
Owner: 'Akshat Jain',
ManagedBy: 'CDKTF',
};

const projectName = 'secure-cdktf-aws-project';

/\*\*

- @class BackendStack
- @description This stack is ONLY for provisioning the remote backend resources (S3, DynamoDB).
- It should be deployed first, separately from the main infrastructure stack.
  \*/
  class BackendStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
  super(scope, id);

      new AwsProvider(this, 'AWS', {
        region: 'us-east-1',
      });

      const backend = new BackendConstruct(this, 'RemoteBackendResources', {
        tags: commonTags,
        projectName: projectName,
      });

      // Output the names of the created resources so they can be used to configure the main stack's backend
      new TerraformOutput(this, 'state_bucket_name', {
        value: backend.stateBucket.bucket,
      });
      new TerraformOutput(this, 'lock_table_name', {
        value: backend.lockTable.name,
      });

  }
  }

/\*\*

- @class SecureInfraStack
- @description The main stack for provisioning secure infrastructure.
- This stack configures its remote backend to use the resources created by BackendStack.
  \*/
  class SecureInfraStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
  super(scope, id);

      // Configure the AWS Provider
      new AwsProvider(this, 'AWS', {
        region: 'us-east-1',
      });

      // --- IMPORTANT ---
      // Configure the S3 remote backend.
      // The bucket and dynamodb_table values MUST match the output from the initial deployment of BackendStack.
      // Manually update these values after the first deployment.
      new S3Backend(this, {
        bucket: 'secure-cdktf-aws-project-tfstate-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', // <-- REPLACE WITH OUTPUT FROM BACKENDSTACK
        key: 'secure-infra.tfstate',
        region: 'us-east-1',
        dynamodbTable: 'secure-cdktf-aws-project-terraform-state-lock', // <-- REPLACE WITH OUTPUT FROM BACKENDSTACK
        encrypt: true,
      });

      // Instantiate the IAM construct which creates a role and access policy
      const iam = new IamConstruct(this, 'IamResources', {
        tags: commonTags,
        // These are placeholders; they will be replaced by the actual ARNs from the StorageConstruct
        sensitiveBucketArn: 'placeholder',
        kmsKeyArn: 'placeholder',
      });

      // Instantiate the Storage construct, passing the ARN of the role created above
      const storage = new StorageConstruct(this, 'StorageResources', {
        tags: commonTags,
        allowedRoleArn: iam.limitedAccessRole.arn,
      });

      // Now, correctly configure the IAM construct with the actual ARNs from the storage construct
      // This creates a dependency graph ensuring resources are created in the correct order.
      iam.addOverride('sensitiveBucketArn', storage.sensitiveDataBucket.arn);
      iam.addOverride('kmsKeyArn', storage.kmsKey.arn);

  }
  }

const app = new App();

// To deploy, you will follow a two-step process:
// 1. Deploy the BackendStack first to create the S3 bucket and DynamoDB table.
// Run: cdktf deploy 'backend-stack'
// 2. Once the backend resources exist, update the S3Backend configuration in SecureInfraStack
// with the output values from the first step.
// 3. Deploy the main infrastructure stack.
// Run: cdktf deploy 'secure-infra-stack'

new BackendStack(app, 'backend-stack');
new SecureInfraStack(app, 'secure-infra-stack');

app.synth();

// iam-construct

import { Construct } from 'constructs';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';

/\*\*

- @interface IamConstructProps
- @description Properties for the IamConstruct.
- @property { { [key: string]: string } } tags - Common tags to apply to all resources.
- @property {string} sensitiveBucketArn - The ARN of the S3 bucket for sensitive data.
- @property {string} kmsKeyArn - The ARN of the KMS key used for bucket encryption.
  \*/
  export interface IamConstructProps {
  readonly tags: { [key:string]: string };
  readonly sensitiveBucketArn: string;
  readonly kmsKeyArn: string;
  }

/\*\*

- @class IamConstruct
- @description Creates an IAM Role and Policy for least-privilege access to a specific S3 bucket and KMS key.
  \*/
  export class IamConstruct extends Construct {
  public readonly limitedAccessRole: IamRole;

constructor(scope: Construct, id: string, props: IamConstructProps) {
super(scope, id);

    const { tags, sensitiveBucketArn, kmsKeyArn } = props;

    // Get the current AWS account ID to build a secure trust policy
    const callerIdentity = new DataAwsCallerIdentity(this, 'Current');

    // Create an IAM role that can be assumed by users/services in the same account
    this.limitedAccessRole = new IamRole(this, 'S3LimitedAccessRole', {
      name: 'S3LimitedAccessRole',
      assumeRolePolicy: new DataAwsIamPolicyDocument(this, 'RoleTrustPolicy', {
        statement: [
          {
            effect: 'Allow',
            actions: ['sts:AssumeRole'],
            principals: [
              {
                type: 'AWS',
                // In a real-world scenario, you would lock this down to specific IAM users or roles.
                // Using the root account principal for demonstration purposes.
                identifiers: [`arn:aws:iam::${callerIdentity.accountId}:root`],
              },
            ],
          },
        ],
      }).json,
      tags,
    });

    // Define the IAM policy document granting specific, limited permissions
    const accessPolicyDocument = new DataAwsIamPolicyDocument(this, 'S3AccessPolicyDoc', {
      statement: [
        // Statement 1: Allow read, write, and delete operations on objects within the specific bucket
        {
          effect: 'Allow',
          actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
          resources: [`${sensitiveBucketArn}/*`], // Note the /* for object-level permissions
        },
        // Statement 2: Allow listing the contents of the bucket
        {
          effect: 'Allow',
          actions: ['s3:ListBucket'],
          resources: [sensitiveBucketArn], // No /* for bucket-level permissions
        },
        // Statement 3: Allow using the KMS key for cryptographic operations
        {
          effect: 'Allow',
          actions: [
            'kms:Decrypt',
            'kms:Encrypt',
            'kms:ReEncrypt*',
            'kms:GenerateDataKey*',
            'kms:DescribeKey',
          ],
          resources: [kmsKeyArn],
        },
      ],
    });

    // Create the IAM policy from the document
    const s3AccessPolicy = new IamPolicy(this, 'S3AccessPolicy', {
      name: 'S3LimitedAccessPolicy',
      policy: accessPolicyDocument.json,
      tags,
    });

    // Attach the policy to the role
    new IamRolePolicyAttachment(this, 'RolePolicyAttachment', {
      role: this.limitedAccessRole.name,
      policyArn: s3AccessPolicy.arn,
    });

}
}

// storage-construct

import { Construct } from 'constructs';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning-a';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration-a';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3BucketPolicy } from '@cdktf/provider-aws/lib/s3-bucket-policy';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';
import { Fn } from 'cdktf';

/\*\*

- @interface StorageConstructProps
- @description Properties for the StorageConstruct.
- @property { { [key: string]: string } } tags - Common tags to apply to all resources.
- @property {string} allowedRoleArn - The ARN of the IAM role that is allowed to access the bucket.
  \*/
  export interface StorageConstructProps {
  readonly tags: { [key: string]: string };
  readonly allowedRoleArn: string;
  }

/\*\*

- @class StorageConstruct
- @description Provisions a secure S3 bucket for sensitive data.
- Features include KMS encryption, versioning, public access block, and a strict bucket policy.
  \*/
  export class StorageConstruct extends Construct {
  public readonly sensitiveDataBucket: S3Bucket;
  public readonly kmsKey: KmsKey;

constructor(scope: Construct, id: string, props: StorageConstructProps) {
super(scope, id);

    const { tags, allowedRoleArn } = props;

    // Create a customer-managed KMS key for S3 bucket encryption
    this.kmsKey = new KmsKey(this, 'SensitiveDataKmsKey', {
      description: 'KMS key for sensitive data S3 bucket',
      enableKeyRotation: true,
      deletionWindowInDays: 10,
      tags,
    });

    // Create the S3 bucket for sensitive data
    this.sensitiveDataBucket = new S3Bucket(this, 'SensitiveDataBucket', {
      bucket: `sensitive-data-bucket-${Fn.randomuuid()}`,
      tags,
    });

    // Enable versioning for data recovery and audit trails
    new S3BucketVersioningA(this, 'SensitiveDataBucketVersioning', {
      bucket: this.sensitiveDataBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // Enforce server-side encryption using the created KMS key
    new S3BucketServerSideEncryptionConfigurationA(this, 'SensitiveDataBucketEncryption', {
      bucket: this.sensitiveDataBucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'aws:kms',
            kmsMasterKeyId: this.kmsKey.id,
          },
          bucketKeyEnabled: true,
        },
      ],
    });

    // Block all public access
    new S3BucketPublicAccessBlock(this, 'SensitiveDataPublicAccessBlock', {
      bucket: this.sensitiveDataBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // Create a restrictive bucket policy document
    const bucketPolicyDocument = new DataAwsIamPolicyDocument(this, 'SensitiveDataBucketPolicyDoc', {
      statement: [
        // Statement 1: Deny access to any principal EXCEPT the allowed role.
        // This is a powerful explicit deny for least privilege.
        {
          effect: 'Deny',
          principals: [{ type: '*', identifiers: ['*'] }],
          actions: ['s3:*'],
          resources: [this.sensitiveDataBucket.arn, `${this.sensitiveDataBucket.arn}/*`],
          condition: [
            {
              test: 'StringNotEquals',
              variable: 'aws:PrincipalArn',
              values: [allowedRoleArn],
            },
          ],
        },
        // Statement 2: Deny any requests that are not sent over HTTPS.
        {
            effect: 'Deny',
            principals: [{ type: '*', identifiers: ['*'] }],
            actions: ['s3:*'],
            resources: [this.sensitiveDataBucket.arn, `${this.sensitiveDataBucket.arn}/*`],
            condition: [
                {
                    test: 'Bool',
                    variable: 'aws:SecureTransport',
                    values: ['false'],
                },
            ],
        },
      ],
    });

    // Attach the policy to the bucket
    new S3BucketPolicy(this, 'SensitiveDataBucketPolicy', {
      bucket: this.sensitiveDataBucket.id,
      policy: bucketPolicyDocument.json,
    });

}
}

// backend-construct

import { Construct } from 'constructs';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning-a';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration-a';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { DynamodbTable } from '@cdktf/provider-aws/lib/dynamodb-table';
import { Fn } from 'cdktf';

/\*\*

- @interface BackendConstructProps
- @description Properties for the BackendConstruct.
- @property { { [key: string]: string } } tags - Common tags to apply to all resources.
- @property {string} projectName - A unique name for the project to prefix resources.
  \*/
  export interface BackendConstructProps {
  readonly tags: { [key: string]: string };
  readonly projectName: string;
  }

/\*\*

- @class BackendConstruct
- @description This construct provisions the necessary infrastructure for a secure Terraform remote backend.
- It creates a versioned, encrypted S3 bucket for state files and a DynamoDB table for state locking.
  \*/
  export class BackendConstruct extends Construct {
  public readonly stateBucket: S3Bucket;
  public readonly lockTable: DynamodbTable;

constructor(scope: Construct, id: string, props: BackendConstructProps) {
super(scope, id);

    const { tags, projectName } = props;

    // Create an S3 bucket to store the Terraform state
    this.stateBucket = new S3Bucket(this, 'TerraformStateBucket', {
      // Bucket names must be globally unique. A random suffix helps.
      bucket: `${projectName.toLowerCase()}-tfstate-${Fn.randomuuid()}`,
      tags,
    });

    // Enable versioning on the S3 bucket to keep a history of the state files
    new S3BucketVersioningA(this, 'StateBucketVersioning', {
      bucket: this.stateBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // Enforce server-side encryption for all objects in the bucket
    new S3BucketServerSideEncryptionConfigurationA(this, 'StateBucketEncryption', {
      bucket: this.stateBucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
        },
      ],
    });

    // Block all public access to the state bucket
    new S3BucketPublicAccessBlock(this, 'StateBucketPublicAccessBlock', {
      bucket: this.stateBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // Create a DynamoDB table for Terraform state locking
    this.lockTable = new DynamodbTable(this, 'TerraformLockTable', {
      name: `${projectName}-terraform-state-lock`,
      billingMode: 'PAY_PER_REQUEST',
      hashKey: 'LockID',
      attribute: [
        {
          name: 'LockID',
          type: 'S',
        },
      ],
      tags,
    });

}
}
