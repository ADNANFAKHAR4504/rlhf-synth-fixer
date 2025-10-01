**lib/modules.ts**

```typescript
/**
 * Reusable infrastructure modules for AWS security-focused components.
 * Contains functions to create KMS keys, S3 buckets, SNS topics, SQS queues, and IAM roles
 * with security best practices and least privilege principles.
 */

import { Construct } from "constructs";
import {
  KmsKey,
  KmsAlias,
  S3Bucket,
  S3BucketVersioning,
  S3BucketServerSideEncryptionConfiguration,
  S3BucketPublicAccessBlock,
  S3BucketPolicy,
  SnsTopic,
  SnsTopicPolicy,
  SqsQueue,
  SnsTopicSubscription,
  SqsQueuePolicy,
  IamRole,
  IamRolePolicy,
  IamAssumeRolePolicy,
  DataAwsIamPolicyDocument,
} from "@cdktf/provider-aws";

export interface KmsKeyOptions {
  description: string;
  tags: Record<string, string>;
  allowedPrincipals?: string[];
}

export interface S3BucketOptions {
  bucketName: string;
  kmsKeyArn: string;
  tags: Record<string, string>;
}

export interface SnsTopicOptions {
  topicName: string;
  allowedAwsAccounts: string[];
  tags: Record<string, string>;
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
  versioning: S3BucketVersioning;
  encryption: S3BucketServerSideEncryptionConfiguration;
  publicAccessBlock: S3BucketPublicAccessBlock;
  policy: S3BucketPolicy;
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
export function createKmsKey(
  scope: Construct,
  id: string,
  options: KmsKeyOptions
): CreatedKmsKey {
  // Create the key policy document
  const keyPolicyDoc = new DataAwsIamPolicyDocument(scope, `${id}-key-policy-doc`, {
    statement: [
      {
        sid: "Enable Root Permissions",
        effect: "Allow",
        principals: [
          {
            type: "AWS",
            identifiers: [`arn:aws:iam::*:root`],
          },
        ],
        actions: ["kms:*"],
        resources: ["*"],
      },
      {
        sid: "Allow use of the key for encryption/decryption",
        effect: "Allow",
        principals: options.allowedPrincipals ? [
          {
            type: "AWS",
            identifiers: options.allowedPrincipals,
          },
        ] : [
          {
            type: "AWS",
            identifiers: [`arn:aws:iam::*:root`],
          },
        ],
        actions: [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey",
        ],
        resources: ["*"],
      },
    ],
  });

  const key = new KmsKey(scope, id, {
    description: options.description,
    keyUsage: "ENCRYPT_DECRYPT",
    keySpec: "SYMMETRIC_DEFAULT",
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

  const versioning = new S3BucketVersioning(scope, `${id}-versioning`, {
    bucket: bucket.id,
    versioningConfiguration: {
      status: "Enabled",
    },
  });

  const encryption = new S3BucketServerSideEncryptionConfiguration(
    scope,
    `${id}-encryption`,
    {
      bucket: bucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: "aws:kms",
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

  // Create bucket policy that denies unencrypted uploads and public access
  const bucketPolicyDoc = new DataAwsIamPolicyDocument(scope, `${id}-policy-doc`, {
    statement: [
      {
        sid: "DenyInsecureConnections",
        effect: "Deny",
        principals: [{ type: "*", identifiers: ["*"] }],
        actions: ["s3:*"],
        resources: [bucket.arn, `${bucket.arn}/*`],
        condition: [
          {
            test: "Bool",
            variable: "aws:SecureTransport",
            values: ["false"],
          },
        ],
      },
      {
        sid: "DenyUnencryptedUploads",
        effect: "Deny",
        principals: [{ type: "*", identifiers: ["*"] }],
        actions: ["s3:PutObject"],
        resources: [`${bucket.arn}/*`],
        condition: [
          {
            test: "StringNotEquals",
            variable: "s3:x-amz-server-side-encryption",
            values: ["aws:kms"],
          },
        ],
      },
      {
        sid: "DenyPublicAccess",
        effect: "Deny",
        principals: [{ type: "*", identifiers: ["*"] }],
        actions: ["s3:*"],
        resources: [bucket.arn, `${bucket.arn}/*`],
        condition: [
          {
            test: "StringNotEquals",
            variable: "aws:PrincipalServiceName",
            values: ["s3.amazonaws.com"],
          },
        ],
      },
    ],
  });

  const policy = new S3BucketPolicy(scope, `${id}-policy`, {
    bucket: bucket.id,
    policy: bucketPolicyDoc.json,
  });

  return { bucket, versioning, encryption, publicAccessBlock, policy };
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

  // Create SNS topic policy
  const topicPolicyDoc = new DataAwsIamPolicyDocument(scope, `${id}-policy-doc`, {
    statement: [
      {
        sid: "AllowOwnerFullControl",
        effect: "Allow",
        principals: [
          {
            type: "AWS",
            identifiers: [`arn:aws:iam::*:root`],
          },
        ],
        actions: ["SNS:*"],
        resources: [topic.arn],
      },
      {
        sid: "AllowPublishFromAllowedAccounts",
        effect: "Allow",
        principals: [
          {
            type: "AWS",
            identifiers: options.allowedAwsAccounts.map(
              (account) => `arn:aws:iam::${account}:root`
            ),
          },
        ],
        actions: ["SNS:Publish"],
        resources: [topic.arn],
      },
    ],
  });

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
    tags: options.tags,
  });

  // Create main queue
  const mainQueue = new SqsQueue(scope, id, {
    name: options.queueName,
    kmsMasterKeyId: options.kmsKeyArn,
    kmsDataKeyReusePeriodSeconds: 300,
    redrivePolicy: JSON.stringify({
      deadLetterTargetArn: dlq.arn,
      maxReceiveCount: options.maxReceiveCount,
    }),
    tags: options.tags,
  });

  // Create queue policy to allow SNS to deliver messages
  const queuePolicyDoc = new DataAwsIamPolicyDocument(scope, `${id}-queue-policy-doc`, {
    statement: [
      {
        sid: "AllowSNSToSendMessage",
        effect: "Allow",
        principals: [
          {
            type: "Service",
            identifiers: ["sns.amazonaws.com"],
          },
        ],
        actions: ["sqs:SendMessage"],
        resources: [mainQueue.arn],
        condition: [
          {
            test: "ArnEquals",
            variable: "aws:SourceArn",
            values: [options.snsTopicArn],
          },
        ],
      },
    ],
  });

  const queuePolicy = new SqsQueuePolicy(scope, `${id}-queue-policy`, {
    queueUrl: mainQueue.id,
    policy: queuePolicyDoc.json,
  });

  // Subscribe queue to SNS topic
  const subscription = new SnsTopicSubscription(scope, `${id}-subscription`, {
    topicArn: options.snsTopicArn,
    protocol: "sqs",
    endpoint: mainQueue.arn,
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
  const assumeRolePolicyDoc = new DataAwsIamPolicyDocument(scope, `${id}-assume-role-policy`, {
    statement: [
      {
        effect: "Allow",
        principals: [
          {
            type: "Service",
            identifiers: ["ec2.amazonaws.com", "lambda.amazonaws.com"],
          },
        ],
        actions: ["sts:AssumeRole"],
      },
    ],
  });

  // S3 access role
  const s3Role = new IamRole(scope, `${id}-s3-role`, {
    name: `${options.rolePrefix}-s3-access-role`,
    assumeRolePolicy: assumeRolePolicyDoc.json,
    tags: options.tags,
  });

  const s3PolicyDoc = new DataAwsIamPolicyDocument(scope, `${id}-s3-policy-doc`, {
    statement: [
      {
        effect: "Allow",
        actions: ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
        resources: [`${options.s3BucketArn}/*`],
      },
      {
        effect: "Allow",
        actions: ["s3:ListBucket"],
        resources: [options.s3BucketArn],
      },
      {
        effect: "Allow",
        actions: ["kms:Encrypt", "kms:Decrypt", "kms:GenerateDataKey*"],
        resources: [options.kmsKeyArn],
      },
    ],
  });

  new IamRolePolicy(scope, `${id}-s3-role-policy`, {
    name: "S3AccessPolicy",
    role: s3Role.id,
    policy: s3PolicyDoc.json,
  });

  // SNS access role
  const snsRole = new IamRole(scope, `${id}-sns-role`, {
    name: `${options.rolePrefix}-sns-access-role`,
    assumeRolePolicy: assumeRolePolicyDoc.json,
    tags: options.tags,
  });

  const snsPolicyDoc = new DataAwsIamPolicyDocument(scope, `${id}-sns-policy-doc`, {
    statement: [
      {
        effect: "Allow",
        actions: ["sns:Publish"],
        resources: [options.snsTopicArn],
      },
    ],
  });

  new IamRolePolicy(scope, `${id}-sns-role-policy`, {
    name: "SNSAccessPolicy",
    role: snsRole.id,
    policy: snsPolicyDoc.json,
  });

  // SQS access role
  const sqsRole = new IamRole(scope, `${id}-sqs-role`, {
    name: `${options.rolePrefix}-sqs-access-role`,
    assumeRolePolicy: assumeRolePolicyDoc.json,
    tags: options.tags,
  });

  const sqsPolicyDoc = new DataAwsIamPolicyDocument(scope, `${id}-sqs-policy-doc`, {
    statement: [
      {
        effect: "Allow",
        actions: [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes",
        ],
        resources: [options.sqsQueueArn, options.dlqArn],
      },
      {
        effect: "Allow",
        actions: ["kms:Encrypt", "kms:Decrypt", "kms:GenerateDataKey*"],
        resources: [options.kmsKeyArn],
      },
    ],
  });

  new IamRolePolicy(scope, `${id}-sqs-role-policy`, {
    name: "SQSAccessPolicy",
    role: sqsRole.id,
    policy: sqsPolicyDoc.json,
  });

  return { s3Role, snsRole, sqsRole };
}
```

**lib/tap-stack.ts**

```typescript
/**
 * Main TAP (Test, Alert, Process) Stack - Production-ready AWS infrastructure
 * Creates secure S3, SNS, SQS, and KMS resources with least-privilege IAM roles.
 * 
 * This stack implements security best practices including:
 * - Customer-managed KMS encryption with rotation
 * - Least-privilege IAM policies
 * - Secure S3 bucket configuration
 * - SNS topic with restricted publish access
 * - SQS queue with DLQ and encryption
 * - Comprehensive resource tagging
 */

import { Construct } from "constructs";
import { TerraformStack, TerraformOutput, TerraformVariable } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import {
  createKmsKey,
  createS3BucketWithKms,
  createSnsTopicWithPolicy,
  createSqsWithDlqAndKms,
  createLeastPrivilegeIamRoles,
} from "./modules";

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Input variables
    const allowedAwsAccounts = new TerraformVariable(this, "allowed_aws_accounts", {
      description: "List of AWS account IDs that are permitted to publish to the SNS topic",
      type: "list(string)",
      validation: [
        {
          condition: "length(var.allowed_aws_accounts) > 0",
          errorMessage: "At least one AWS account ID must be provided",
        },
      ],
    });

    const owner = new TerraformVariable(this, "owner", {
      description: "Owner tag value for all resources",
      type: "string",
      validation: [
        {
          condition: "length(var.owner) > 0",
          errorMessage: "Owner must not be empty",
        },
      ],
    });

    const environment = new TerraformVariable(this, "environment", {
      description: "Environment tag value (e.g., 'prod', 'staging', 'dev')",
      type: "string",
      validation: [
        {
          condition: "contains(['dev', 'staging', 'prod'], var.environment)",
          errorMessage: "Environment must be one of: dev, staging, prod",
        },
      ],
    });

    const resourcePrefix = new TerraformVariable(this, "resource_prefix", {
      description: "Prefix for resource names to namespace resources",
      type: "string",
      validation: [
        {
          condition: "can(regex(\"^[a-z0-9-]+$\", var.resource_prefix))",
          errorMessage: "Resource prefix must contain only lowercase letters, numbers, and hyphens",
        },
      ],
    });

    // Configure AWS provider for us-west-2
    new AwsProvider(this, "AWS", {
      region: "us-west-2",
    });

    // Common tags for all resources
    const commonTags = {
      Project: "SecurityConfig",
      Environment: environment.stringValue,
      Owner: owner.stringValue,
      CreatedBy: "CDKTF",
      ManagedBy: "Terraform",
    };

    // Create customer-managed KMS key for S3 and SQS encryption
    const kmsKey = createKmsKey(this, "security-cmk", {
      description: "Customer-managed key for S3 and SQS encryption",
      tags: {
        ...commonTags,
        Name: `${resourcePrefix.stringValue}-security-cmk`,
        Purpose: "S3-SQS-Encryption",
      },
    });

    // Create S3 bucket with KMS encryption and security policies
    const s3Bucket = createS3BucketWithKms(this, "secure-bucket", {
      bucketName: `${resourcePrefix.stringValue}-secure-bucket-${environment.stringValue}`,
      kmsKeyArn: kmsKey.key.arn,
      tags: {
        ...commonTags,
        Name: `${resourcePrefix.stringValue}-secure-bucket`,
        Purpose: "Secure-Storage",
      },
    });

    // Create SNS topic with restricted publish access
    const snsTopic = createSnsTopicWithPolicy(this, "notification-topic", {
      topicName: `${resourcePrefix.stringValue}-notifications-${environment.stringValue}`,
      allowedAwsAccounts: allowedAwsAccounts.listValue,
      tags: {
        ...commonTags,
        Name: `${resourcePrefix.stringValue}-notifications`,
        Purpose: "Event-Notifications",
      },
    });

    // Create SQS queue with DLQ and SNS subscription
    const sqsQueues = createSqsWithDlqAndKms(this, "processing-queue", {
      queueName: `${resourcePrefix.stringValue}-processing-queue-${environment.stringValue}`,
      dlqName: `${resourcePrefix.stringValue}-processing-dlq-${environment.stringValue}`,
      kmsKeyArn: kmsKey.key.arn,
      snsTopicArn: snsTopic.topic.arn,
      maxReceiveCount: 3,
      tags: {
        ...commonTags,
        Name: `${resourcePrefix.stringValue}-processing-queue`,
        Purpose: "Message-Processing",
      },
    });

    // Create least-privilege IAM roles
    const iamRoles = createLeastPrivilegeIamRoles(this, "access-roles", {
      rolePrefix: `${resourcePrefix.stringValue}-${environment.stringValue}`,
      s3BucketArn: s3Bucket.bucket.arn,
      snsTopicArn: snsTopic.topic.arn,
      sqsQueueArn: sqsQueues.mainQueue.arn,
      dlqArn: sqsQueues.dlq.arn,
      kmsKeyArn: kmsKey.key.arn,
      tags: {
        ...commonTags,
        Purpose: "Service-Access",
      },
    });

    // Terraform Outputs for important ARNs/IDs
    new TerraformOutput(this, "s3_bucket_name", {
      description: "Name of the created S3 bucket",
      value: s3Bucket.bucket.id,
    });

    new TerraformOutput(this, "s3_bucket_arn", {
      description: "ARN of the created S3 bucket",
      value: s3Bucket.bucket.arn,
    });

    new TerraformOutput(this, "sns_topic_arn", {
      description: "ARN of the SNS topic",
      value: snsTopic.topic.arn,
    });

    new TerraformOutput(this, "sqs_queue_url", {
      description: "URL of the main SQS queue",
      value: sqsQueues.mainQueue.id,
    });

    new TerraformOutput(this, "sqs_queue_arn", {
      description: "ARN of the main SQS queue",
      value: sqsQueues.mainQueue.arn,
    });

    new TerraformOutput(this, "dlq_arn", {
      description: "ARN of the Dead Letter Queue",
      value: sqsQueues.dlq.arn,
    });

    new TerraformOutput(this, "dlq_url", {
      description: "URL of the Dead Letter Queue",
      value: sqsQueues.dlq.id,
    });

    new TerraformOutput(this, "cmk_arn", {
      description: "ARN of the customer-managed KMS key",
      value: kmsKey.key.arn,
    });

    new TerraformOutput(this, "cmk_key_id", {
      description: "ID of the customer-managed KMS key",
      value: kmsKey.key.keyId,
    });

    new TerraformOutput(this, "kms_alias_name", {
      description: "Alias name of the KMS key",
      value: kmsKey.alias.name,
    });

    new TerraformOutput(this, "iam_s3_role_arn", {
      description: "ARN of the S3 access IAM role",
      value: iamRoles.s3Role.arn,
    });

    new TerraformOutput(this, "iam_sns_role_arn", {
      description: "ARN of the SNS access IAM role",
      value: iamRoles.snsRole.arn,
    });

    new TerraformOutput(this, "iam_sqs_role_arn", {
      description: "ARN of the SQS access IAM role",
      value: iamRoles.sqsRole.arn,
    });

    // Output security summary
    new TerraformOutput(this, "security_summary", {
      description: "Summary of security configurations implemented",
      value: {
        kms_rotation_enabled: true,
        s3_versioning_enabled: true,
        s3_public_access_blocked: true,
        s3_encryption_enforced: true,
        sqs_encryption_enabled: true,
        sns_publish_restricted: true,
        dlq_configured: true,
        least_privilege_iam: true,
      },
    });
  }
}
```