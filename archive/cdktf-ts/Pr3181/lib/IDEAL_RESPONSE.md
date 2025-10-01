**lib/modules.ts**

```typescript
import { Construct } from 'constructs';

// KMS
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { KmsAlias } from '@cdktf/provider-aws/lib/kms-alias';

// S3
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3BucketPolicy } from '@cdktf/provider-aws/lib/s3-bucket-policy';

// SNS
import { SnsTopic } from '@cdktf/provider-aws/lib/sns-topic';
import { SnsTopicPolicy } from '@cdktf/provider-aws/lib/sns-topic-policy';
import { SnsTopicSubscription } from '@cdktf/provider-aws/lib/sns-topic-subscription';

// SQS
import { SqsQueue } from '@cdktf/provider-aws/lib/sqs-queue';
import { SqsQueuePolicy } from '@cdktf/provider-aws/lib/sqs-queue-policy';

// IAM
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';

// Data Sources
import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';

export interface KmsKeyOptions {
  description: string;
  tags: Record<string, string>;
  allowedPrincipals?: string[];
  accountId: string;
}

export interface S3BucketOptions {
  bucketName: string;
  kmsKeyArn: string;
  tags: Record<string, string>;
  accountId?: string;
  enableBucketPolicy?: boolean;
}

export interface SnsTopicOptions {
  topicName: string;
  allowedAwsAccounts: string[];
  tags: Record<string, string>;
  accountId: string;
}

export interface SqsQueueOptions {
  queueName: string;
  dlqName: string;
  kmsKeyArn: string;
  snsTopicArn: string;
  maxReceiveCount: number;
  tags: Record<string, string>;
}

export interface IamRoleOptions {
  rolePrefix: string;
  s3BucketArn: string;
  snsTopicArn: string;
  sqsQueueArn: string;
  dlqArn: string;
  kmsKeyArn: string;
  tags: Record<string, string>;
}

export interface CreatedKmsKey {
  key: KmsKey;
  alias: KmsAlias;
}

export interface CreatedS3Bucket {
  bucket: S3Bucket;
  versioning: S3BucketVersioningA;
  encryption: S3BucketServerSideEncryptionConfigurationA;
  publicAccessBlock: S3BucketPublicAccessBlock;
  policy?: S3BucketPolicy;
}

export interface CreatedSnsTopic {
  topic: SnsTopic;
  policy: SnsTopicPolicy;
}

export interface CreatedSqsQueues {
  mainQueue: SqsQueue;
  dlq: SqsQueue;
  subscription: SnsTopicSubscription;
  queuePolicy: SqsQueuePolicy;
}

export interface CreatedIamRoles {
  s3Role: IamRole;
  snsRole: IamRole;
  sqsRole: IamRole;
}

/**
 * Creates a customer-managed KMS key with rotation enabled and restrictive key policy
 */
/**
 * Creates a customer-managed KMS key with rotation enabled and restrictive key policy
 */
export function createKmsKey(
  scope: Construct,
  id: string,
  options: KmsKeyOptions
): CreatedKmsKey {
  const accountId = options.accountId;

  // Create the key policy document
  const keyPolicyDoc = new DataAwsIamPolicyDocument(
    scope,
    `${id}-key-policy-doc`,
    {
      statement: [
        {
          sid: 'Enable Root Permissions',
          effect: 'Allow',
          principals: [
            {
              type: 'AWS',
              identifiers: [`arn:aws:iam::${accountId}:root`],
            },
          ],
          actions: ['kms:*'],
          resources: ['*'],
        },
        {
          sid: 'Allow use of the key for encryption/decryption',
          effect: 'Allow',
          principals: options.allowedPrincipals
            ? [
                {
                  type: 'AWS',
                  identifiers: options.allowedPrincipals,
                },
              ]
            : [
                {
                  type: 'AWS',
                  identifiers: [`arn:aws:iam::${accountId}:root`],
                },
              ],
          actions: [
            'kms:Encrypt',
            'kms:Decrypt',
            'kms:ReEncrypt*',
            'kms:GenerateDataKey*',
            'kms:DescribeKey',
          ],
          resources: ['*'],
        },
        // Add this new statement to allow SNS and SQS services to use the key
        {
          sid: 'Allow services to use the key',
          effect: 'Allow',
          principals: [
            {
              type: 'Service',
              identifiers: [
                'sns.amazonaws.com',
                'sqs.amazonaws.com',
                's3.amazonaws.com',
              ],
            },
          ],
          actions: [
            'kms:Decrypt',
            'kms:GenerateDataKey',
            'kms:CreateGrant',
            'kms:DescribeKey',
          ],
          resources: ['*'],
        },
      ],
    }
  );

  const key = new KmsKey(scope, id, {
    description: options.description,
    keyUsage: 'ENCRYPT_DECRYPT',
    customerMasterKeySpec: 'SYMMETRIC_DEFAULT',
    enableKeyRotation: true,
    deletionWindowInDays: 7,
    policy: keyPolicyDoc.json,
    tags: options.tags,
  });

  const alias = new KmsAlias(scope, `${id}-alias`, {
    name: `alias/${id.toLowerCase().replace(/[^a-z0-9-]/g, '-')}`,
    targetKeyId: key.keyId,
  });

  return { key, alias };
}

/**
 * Creates an S3 bucket with KMS encryption, versioning, and security policies
 */
export function createS3BucketWithKms(
  scope: Construct,
  id: string,
  options: S3BucketOptions
): CreatedS3Bucket {
  const bucket = new S3Bucket(scope, id, {
    bucket: options.bucketName,
    tags: options.tags,
  });

  const versioning = new S3BucketVersioningA(scope, `${id}-versioning`, {
    bucket: bucket.id,
    versioningConfiguration: {
      status: 'Enabled',
    },
  });

  const encryption = new S3BucketServerSideEncryptionConfigurationA(
    scope,
    `${id}-encryption`,
    {
      bucket: bucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'aws:kms',
            kmsMasterKeyId: options.kmsKeyArn,
          },
          bucketKeyEnabled: true,
        },
      ],
    }
  );

  const publicAccessBlock = new S3BucketPublicAccessBlock(
    scope,
    `${id}-public-access-block`,
    {
      bucket: bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    }
  );

  // Only create bucket policy if explicitly enabled
  let bucketPolicy: S3BucketPolicy | undefined;

  if (options.enableBucketPolicy && options.accountId) {
    const bucketPolicyDoc = new DataAwsIamPolicyDocument(
      scope,
      `${id}-policy-doc`,
      {
        statement: [
          {
            sid: 'AllowRootAccountAccess',
            effect: 'Allow',
            principals: [
              {
                type: 'AWS',
                identifiers: [`arn:aws:iam::${options.accountId}:root`],
              },
            ],
            actions: ['s3:*'],
            resources: [bucket.arn, `${bucket.arn}/*`],
          },
          {
            sid: 'RequireSSLRequestsOnly',
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
            sid: 'DenyUnencryptedObjectUploads',
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

    bucketPolicy = new S3BucketPolicy(scope, `${id}-policy`, {
      bucket: bucket.id,
      policy: bucketPolicyDoc.json,
    });
  }

  return {
    bucket,
    versioning,
    encryption,
    publicAccessBlock,
    policy: bucketPolicy,
  };
}

/**
 * Creates an SNS topic with policy restricting publish access to allowed accounts
 */
export function createSnsTopicWithPolicy(
  scope: Construct,
  id: string,
  options: SnsTopicOptions
): CreatedSnsTopic {
  const topic = new SnsTopic(scope, id, {
    name: options.topicName,
    tags: options.tags,
  });

  const accountId = options.accountId;

  // Create SNS topic policy with valid SNS actions only
  const topicPolicyDoc = new DataAwsIamPolicyDocument(
    scope,
    `${id}-policy-doc`,
    {
      statement: [
        {
          sid: 'AllowOwnerFullControl',
          effect: 'Allow',
          principals: [
            {
              type: 'AWS',
              identifiers: [`arn:aws:iam::${accountId}:root`],
            },
          ],
          actions: [
            'SNS:GetTopicAttributes',
            'SNS:SetTopicAttributes',
            'SNS:AddPermission',
            'SNS:RemovePermission',
            'SNS:DeleteTopic',
            'SNS:Subscribe',
            'SNS:ListSubscriptionsByTopic',
            'SNS:Publish',
          ],
          resources: [topic.arn],
        },
        {
          sid: 'AllowPublishFromAllowedAccounts',
          effect: 'Allow',
          principals: [
            {
              type: 'AWS',
              identifiers: options.allowedAwsAccounts.map(
                account => `arn:aws:iam::${account}:root`
              ),
            },
          ],
          actions: ['SNS:Publish'],
          resources: [topic.arn],
        },
      ],
    }
  );

  const policy = new SnsTopicPolicy(scope, `${id}-policy`, {
    arn: topic.arn,
    policy: topicPolicyDoc.json,
  });

  return { topic, policy };
}

/**
 * Creates SQS queue with DLQ, KMS encryption, and SNS subscription
 */
export function createSqsWithDlqAndKms(
  scope: Construct,
  id: string,
  options: SqsQueueOptions
): CreatedSqsQueues {
  // Create DLQ first
  const dlq = new SqsQueue(scope, `${id}-dlq`, {
    name: options.dlqName,
    kmsMasterKeyId: options.kmsKeyArn,
    kmsDataKeyReusePeriodSeconds: 300,
    messageRetentionSeconds: 1209600, // 14 days
    tags: options.tags,
  });

  // Create main queue with proper visibility timeout
  const mainQueue = new SqsQueue(scope, id, {
    name: options.queueName,
    kmsMasterKeyId: options.kmsKeyArn,
    kmsDataKeyReusePeriodSeconds: 300,
    visibilityTimeoutSeconds: 30, // ✅ Correct
    messageRetentionSeconds: 345600, // 4 days
    redrivePolicy: JSON.stringify({
      deadLetterTargetArn: dlq.arn,
      maxReceiveCount: options.maxReceiveCount,
    }),
    tags: options.tags,
  });

  // Create queue policy to allow SNS to deliver messages
  const queuePolicyDoc = new DataAwsIamPolicyDocument(
    scope,
    `${id}-queue-policy-doc`,
    {
      statement: [
        {
          sid: 'AllowSNSToSendMessage',
          effect: 'Allow',
          principals: [
            {
              type: 'Service',
              identifiers: ['sns.amazonaws.com'],
            },
          ],
          actions: [
            'sqs:SendMessage',
            'sqs:GetQueueAttributes', // Add this for SNS to check queue attributes
          ],
          resources: [mainQueue.arn],
          condition: [
            {
              test: 'ArnEquals',
              variable: 'aws:SourceArn',
              values: [options.snsTopicArn],
            },
          ],
        },
      ],
    }
  );

  const queuePolicy = new SqsQueuePolicy(scope, `${id}-queue-policy`, {
    queueUrl: mainQueue.id,
    policy: queuePolicyDoc.json,
  });

  // Subscribe queue to SNS topic with raw message delivery disabled
  const subscription = new SnsTopicSubscription(scope, `${id}-subscription`, {
    topicArn: options.snsTopicArn,
    protocol: 'sqs',
    endpoint: mainQueue.arn,
    rawMessageDelivery: false, // Ensure messages are wrapped in SNS envelope
  });

  return { mainQueue, dlq, subscription, queuePolicy };
}

/**
 * Creates least-privilege IAM roles for S3, SNS, and SQS access
 */
export function createLeastPrivilegeIamRoles(
  scope: Construct,
  id: string,
  options: IamRoleOptions
): CreatedIamRoles {
  // Common assume role policy for all roles
  const assumeRolePolicyDoc = new DataAwsIamPolicyDocument(
    scope,
    `${id}-assume-role-policy`,
    {
      statement: [
        {
          effect: 'Allow',
          principals: [
            {
              type: 'Service',
              identifiers: ['ec2.amazonaws.com', 'lambda.amazonaws.com'],
            },
          ],
          actions: ['sts:AssumeRole'],
        },
      ],
    }
  );

  // S3 access role
  const s3Role = new IamRole(scope, `${id}-s3-role`, {
    name: `${options.rolePrefix}-s3-access-role`,
    assumeRolePolicy: assumeRolePolicyDoc.json,
    tags: options.tags,
  });

  const s3PolicyDoc = new DataAwsIamPolicyDocument(
    scope,
    `${id}-s3-policy-doc`,
    {
      statement: [
        {
          effect: 'Allow',
          actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
          resources: [`${options.s3BucketArn}/*`],
        },
        {
          effect: 'Allow',
          actions: ['s3:ListBucket'],
          resources: [options.s3BucketArn],
        },
        {
          effect: 'Allow',
          actions: ['kms:Encrypt', 'kms:Decrypt', 'kms:GenerateDataKey*'],
          resources: [options.kmsKeyArn],
        },
      ],
    }
  );

  new IamRolePolicy(scope, `${id}-s3-role-policy`, {
    name: 'S3AccessPolicy',
    role: s3Role.id,
    policy: s3PolicyDoc.json,
  });

  // SNS access role
  const snsRole = new IamRole(scope, `${id}-sns-role`, {
    name: `${options.rolePrefix}-sns-access-role`,
    assumeRolePolicy: assumeRolePolicyDoc.json,
    tags: options.tags,
  });

  const snsPolicyDoc = new DataAwsIamPolicyDocument(
    scope,
    `${id}-sns-policy-doc`,
    {
      statement: [
        {
          effect: 'Allow',
          actions: ['sns:Publish'],
          resources: [options.snsTopicArn],
        },
      ],
    }
  );

  new IamRolePolicy(scope, `${id}-sns-role-policy`, {
    name: 'SNSAccessPolicy',
    role: snsRole.id,
    policy: snsPolicyDoc.json,
  });

  // SQS access role
  const sqsRole = new IamRole(scope, `${id}-sqs-role`, {
    name: `${options.rolePrefix}-sqs-access-role`,
    assumeRolePolicy: assumeRolePolicyDoc.json,
    tags: options.tags,
  });

  const sqsPolicyDoc = new DataAwsIamPolicyDocument(
    scope,
    `${id}-sqs-policy-doc`,
    {
      statement: [
        {
          effect: 'Allow',
          actions: [
            'sqs:ReceiveMessage',
            'sqs:DeleteMessage',
            'sqs:GetQueueAttributes',
          ],
          resources: [options.sqsQueueArn, options.dlqArn],
        },
        {
          effect: 'Allow',
          actions: ['kms:Encrypt', 'kms:Decrypt', 'kms:GenerateDataKey*'],
          resources: [options.kmsKeyArn],
        },
      ],
    }
  );

  new IamRolePolicy(scope, `${id}-sqs-role-policy`, {
    name: 'SQSAccessPolicy',
    role: sqsRole.id,
    policy: sqsPolicyDoc.json,
  });

  return { s3Role, snsRole, sqsRole };
}


```

**lib/tap-stack.ts**

```typescript
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';

// Import your modules here
import {
  createKmsKey,
  createS3BucketWithKms,
  createSnsTopicWithPolicy,
  createSqsWithDlqAndKms,
  createLeastPrivilegeIamRoles,
  CreatedKmsKey,
  CreatedS3Bucket,
  CreatedSnsTopic,
  CreatedSqsQueues,
  CreatedIamRoles,
} from './modules';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

// If you need to override the AWS Region for the terraform provider for any particular task,
// you can set it here. Otherwise, it will default to 'us-east-1'.
const AWS_REGION_OVERRIDE = '';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Configure S3 Backend with native state locking
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    // Using an escape hatch instead of S3Backend construct - CDKTF still does not support S3 state locking natively
    // ref - https://developer.hashicorp.com/terraform/cdktf/concepts/resources#escape-hatch
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // Get current AWS account information
    const current = new DataAwsCallerIdentity(this, 'current');

    // Common tags for all resources
    const commonTags = {
      Environment: environmentSuffix,
      Project: 'tap-stack',
      ManagedBy: 'terraform',
    };

    // Create KMS key for encryption
    const kmsModule: CreatedKmsKey = createKmsKey(
      this,
      `tap-kms-${environmentSuffix}`,
      {
        description: `TAP Stack KMS key for ${environmentSuffix} environment`,
        tags: commonTags,
        allowedPrincipals: [`arn:aws:iam::${current.accountId}:root`],
        accountId: current.accountId,
      }
    );

    // Create S3 bucket with KMS encryption
    const s3Module: CreatedS3Bucket = createS3BucketWithKms(
      this,
      `tap-s3-${environmentSuffix}`,
      {
        bucketName: `tap-data-bucket-tss-${environmentSuffix}-${current.accountId}`,
        kmsKeyArn: kmsModule.key.arn,
        tags: commonTags,
        accountId: current.accountId,
        enableBucketPolicy: false, // Keep disabled to avoid deployment issues
      }
    );

    // Create SNS topic
    const snsModule: CreatedSnsTopic = createSnsTopicWithPolicy(
      this,
      `tap-sns-${environmentSuffix}`,
      {
        topicName: `tap-notifications-${environmentSuffix}`,
        allowedAwsAccounts: [current.accountId],
        tags: commonTags,
        accountId: current.accountId,
      }
    );

    // Create SQS queue with DLQ
    const sqsModule: CreatedSqsQueues = createSqsWithDlqAndKms(
      this,
      `tap-sqs-${environmentSuffix}`,
      {
        queueName: `tap-processing-queue-${environmentSuffix}`,
        dlqName: `tap-processing-dlq-${environmentSuffix}`,
        kmsKeyArn: kmsModule.key.arn,
        snsTopicArn: snsModule.topic.arn,
        maxReceiveCount: 3,
        tags: commonTags,
      }
    );

    // Create IAM roles with least privilege
    const iamModule: CreatedIamRoles = createLeastPrivilegeIamRoles(
      this,
      `tap-iam-${environmentSuffix}`,
      {
        rolePrefix: `tap-${environmentSuffix}`,
        s3BucketArn: s3Module.bucket.arn,
        snsTopicArn: snsModule.topic.arn,
        sqsQueueArn: sqsModule.mainQueue.arn,
        dlqArn: sqsModule.dlq.arn,
        kmsKeyArn: kmsModule.key.arn,
        tags: commonTags,
      }
    );

    // Terraform Outputs - exactly 10 as requested
    new TerraformOutput(this, 'kms-key-id', {
      value: kmsModule.key.keyId,
      description: 'KMS key ID for encryption',
    });

    new TerraformOutput(this, 'kms-key-arn', {
      value: kmsModule.key.arn,
      description: 'KMS key ARN for encryption',
    });

    new TerraformOutput(this, 's3-bucket-name', {
      value: s3Module.bucket.bucket,
      description: 'S3 bucket name for data storage',
    });

    new TerraformOutput(this, 's3-bucket-arn', {
      value: s3Module.bucket.arn,
      description: 'S3 bucket ARN for data storage',
    });

    new TerraformOutput(this, 'sns-topic-arn', {
      value: snsModule.topic.arn,
      description: 'SNS topic ARN for notifications',
    });

    new TerraformOutput(this, 'sqs-queue-url', {
      value: sqsModule.mainQueue.id,
      description: 'SQS main queue URL for message processing',
    });

    new TerraformOutput(this, 'sqs-dlq-url', {
      value: sqsModule.dlq.id,
      description: 'SQS dead letter queue URL',
    });

    new TerraformOutput(this, 's3-iam-role-arn', {
      value: iamModule.s3Role.arn,
      description: 'IAM role ARN for S3 access',
    });

    new TerraformOutput(this, 'sqs-iam-role-arn', {
      value: iamModule.sqsRole.arn,
      description: 'IAM role ARN for SQS access',
    });

    new TerraformOutput(this, 'aws-account-id', {
      value: current.accountId,
      description: 'Current AWS Account ID',
    });
  }
}

```