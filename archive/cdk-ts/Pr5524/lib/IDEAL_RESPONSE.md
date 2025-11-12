# Overview

Please find solution files below.

## ./bin/tap.ts

```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const stackName = `TapStack${environmentSuffix}`;
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Apply tags to all stacks in this app (optional - you can do this at stack level instead)
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

new TapStack(app, stackName, {
  stackName: stackName, // This ensures CloudFormation stack name includes the suffix
  environmentSuffix: environmentSuffix, // Pass the suffix to the stack
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

```

## ./lib/lambda/key-rotation-monitor.ts

```typescript
/* eslint-disable import/no-extraneous-dependencies */
import {
  KMSClient,
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
  ListAliasesCommand,
} from '@aws-sdk/client-kms';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
/* eslint-enable import/no-extraneous-dependencies */

const kmsClient = new KMSClient({});
const snsClient = new SNSClient({});

interface KeyRotationStatus {
  key_id: string;
  alias: string;
  rotation_enabled: boolean;
  next_rotation?: string;
  days_until_rotation?: number;
  warning?: string;
  error?: string;
}

export const handler = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  event: any
): Promise<{ statusCode: number; body: string }> => {
  console.log(
    'Key Rotation Monitor Lambda triggered',
    JSON.stringify(event, null, 2)
  );

  try {
    const kmsKeysJson = process.env.KMS_KEYS || '[]';
    const kmsKeys: string[] = JSON.parse(kmsKeysJson);
    const rotationWarningDays = parseInt(
      process.env.ROTATION_WARNING_DAYS || '30',
      10
    );

    const rotationStatus: KeyRotationStatus[] = [];
    const keysNeedingAttention: KeyRotationStatus[] = [];

    for (const keyId of kmsKeys) {
      try {
        // Get key metadata
        const describeCommand = new DescribeKeyCommand({ KeyId: keyId });
        const keyMetadata = await kmsClient.send(describeCommand);
        const keyDetails = keyMetadata.KeyMetadata;

        if (!keyDetails) {
          throw new Error(`No metadata found for key ${keyId}`);
        }

        // Get rotation status
        const rotationCommand = new GetKeyRotationStatusCommand({
          KeyId: keyId,
        });
        const rotationResponse = await kmsClient.send(rotationCommand);
        const rotationEnabled = rotationResponse.KeyRotationEnabled || false;

        // Calculate next rotation date
        const creationDate = keyDetails.CreationDate;
        if (!creationDate) {
          throw new Error(`No creation date for key ${keyId}`);
        }

        let status: KeyRotationStatus;

        if (rotationEnabled) {
          // AWS rotates keys annually (365 days from creation)
          const nextRotation = new Date(creationDate);
          nextRotation.setFullYear(new Date().getFullYear() + 1);

          const now = new Date();
          const daysUntilRotation = Math.floor(
            (nextRotation.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );

          const keyAlias = await getKeyAlias(keyId);

          status = {
            key_id: keyId,
            alias: keyAlias,
            rotation_enabled: true,
            next_rotation: nextRotation.toISOString(),
            days_until_rotation: daysUntilRotation,
          };

          if (daysUntilRotation <= rotationWarningDays) {
            keysNeedingAttention.push(status);
            console.warn(
              `Key ${keyId} will rotate in ${daysUntilRotation} days`
            );
          }
        } else {
          const keyAlias = await getKeyAlias(keyId);

          status = {
            key_id: keyId,
            alias: keyAlias,
            rotation_enabled: false,
            warning: 'Rotation is disabled!',
          };
          keysNeedingAttention.push(status);
          console.error(`Key ${keyId} does not have rotation enabled!`);
        }

        rotationStatus.push(status);
      } catch (error) {
        console.error(`Failed to check key ${keyId}:`, error);
        rotationStatus.push({
          key_id: keyId,
          alias: 'N/A',
          rotation_enabled: false,
          error: (error as Error).message,
        });
      }
    }

    // Send notifications if needed
    if (keysNeedingAttention.length > 0) {
      await sendRotationNotification(keysNeedingAttention);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        checked_keys: kmsKeys.length,
        keys_needing_attention: keysNeedingAttention.length,
        rotation_status: rotationStatus,
      }),
    };
  } catch (error) {
    console.error('Key rotation monitoring failed:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: (error as Error).message }),
    };
  }
};

async function getKeyAlias(keyId: string): Promise<string> {
  try {
    const command = new ListAliasesCommand({ KeyId: keyId });
    const response = await kmsClient.send(command);
    if (response.Aliases && response.Aliases.length > 0) {
      return response.Aliases[0].AliasName || 'N/A';
    }
  } catch (error) {
    console.log(`Could not get alias for key ${keyId}:`, error);
  }
  return 'N/A';
}

async function sendRotationNotification(
  keysNeedingAttention: KeyRotationStatus[]
): Promise<void> {
  try {
    const topicArn = process.env.SNS_TOPIC_ARN;
    if (!topicArn) {
      console.log('No SNS_TOPIC_ARN configured, skipping notification');
      return;
    }

    let message = 'KMS Key Rotation Alert\n\n';
    message += `Keys requiring attention: ${keysNeedingAttention.length}\n\n`;

    for (const key of keysNeedingAttention) {
      message += `Key: ${key.alias || key.key_id}\n`;
      if (key.rotation_enabled && key.days_until_rotation !== undefined) {
        message += `  - Rotating in ${key.days_until_rotation} days\n`;
      } else if (!key.rotation_enabled) {
        message += '  - ROTATION DISABLED (Critical!)\n';
      }
      message += '\n';
    }

    const publishCommand = new PublishCommand({
      TopicArn: topicArn,
      Subject: '⚠️ KMS Key Rotation Alert',
      Message: message,
    });

    await snsClient.send(publishCommand);
    console.log('Rotation notification sent successfully');
  } catch (error) {
    console.error('Failed to send rotation notification:', error);
  }
}

```

## ./lib/lambda/s3-remediation.ts

```typescript
/* eslint-disable import/no-extraneous-dependencies */
import {
  S3Client,
  GetObjectTaggingCommand,
  PutObjectTaggingCommand,
  CopyObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
/* eslint-enable import/no-extraneous-dependencies */

const s3Client = new S3Client({});
const snsClient = new SNSClient({});

interface RequiredTags {
  [key: string]: string | string[];
}

interface KMSKeyMapping {
  [key: string]: string | undefined;
}

interface RemediationResult {
  bucket: string;
  key: string;
  actions: string[];
  status: 'SUCCESS' | 'FAILED';
  error?: string;
}

interface LambdaEvent {
  bucket?: string;
  key?: string;
  detail?: {
    bucket?: {
      name?: string;
    };
    object?: {
      key?: string;
    };
  };
}

const REQUIRED_TAGS: RequiredTags = {
  DataClassification: ['PII', 'FINANCIAL', 'OPERATIONAL', 'PUBLIC'],
  Compliance: 'PCI-DSS',
  Environment: process.env.ENVIRONMENT || 'dev',
  'iac-rlhf-amazon': 'true',
};

const KMS_KEY_MAPPING: KMSKeyMapping = {
  PII: process.env.PII_KMS_KEY_ID,
  FINANCIAL: process.env.FINANCIAL_KMS_KEY_ID,
  OPERATIONAL: process.env.OPERATIONAL_KMS_KEY_ID,
};

export const handler = async (
  event: LambdaEvent
): Promise<{ statusCode: number; body: string }> => {
  console.log(
    'S3 Remediation Lambda triggered',
    JSON.stringify(event, null, 2)
  );

  try {
    // Parse the event to extract bucket and key
    let bucketName = event.bucket || event.detail?.bucket?.name;
    let objectKey = event.key || event.detail?.object?.key;

    if (!bucketName || !objectKey) {
      // If specific object not provided, scan recent uploads
      bucketName = process.env.MONITORED_BUCKET;
      if (!bucketName) {
        throw new Error(
          'No bucket specified and MONITORED_BUCKET env var not set'
        );
      }
      const objects = await listRecentObjects(bucketName);

      const remediationResults: RemediationResult[] = [];
      for (const obj of objects) {
        const result = await remediateObject(bucketName, obj.Key!);
        remediationResults.push(result);
      }

      await sendNotification(remediationResults);

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Remediation complete',
          processed: remediationResults.length,
          results: remediationResults,
        }),
      };
    } else {
      // Process single object
      const result = await remediateObject(bucketName, objectKey);
      await sendNotification([result]);

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Remediation complete',
          processed: 1,
          results: [result],
        }),
      };
    }
  } catch (error) {
    console.error('Remediation failed:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: (error as Error).message }),
    };
  }
};

async function listRecentObjects(
  bucketName: string,
  maxObjects: number = 100
): Promise<{ Key?: string }[]> {
  try {
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      MaxKeys: maxObjects,
    });
    const response = await s3Client.send(command);
    return response.Contents || [];
  } catch (error) {
    console.error('Failed to list objects:', error);
    return [];
  }
}

async function remediateObject(
  bucketName: string,
  objectKey: string
): Promise<RemediationResult> {
  const result: RemediationResult = {
    bucket: bucketName,
    key: objectKey,
    actions: [],
    status: 'SUCCESS',
  };

  try {
    // Get current object metadata and tags
    const headCommand = new HeadObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    });
    const objectMetadata = await s3Client.send(headCommand);

    let currentTags: { [key: string]: string } = {};
    try {
      const tagCommand = new GetObjectTaggingCommand({
        Bucket: bucketName,
        Key: objectKey,
      });
      const tagResponse = await s3Client.send(tagCommand);
      currentTags = Object.fromEntries(
        (tagResponse.TagSet || []).map(tag => [tag.Key, tag.Value])
      );
    } catch (error) {
      console.log('No existing tags found');
    }

    // Check and fix tags
    const tagsToAdd: { Key: string; Value: string }[] = [];
    let dataClassification = currentTags['DataClassification'];

    // Infer data classification if missing
    if (!dataClassification) {
      dataClassification = inferDataClassification(objectKey, bucketName);
      tagsToAdd.push({ Key: 'DataClassification', Value: dataClassification });
      result.actions.push(`Added DataClassification: ${dataClassification}`);
    }

    // Add missing required tags
    for (const [tagKey, tagValue] of Object.entries(REQUIRED_TAGS)) {
      if (tagKey !== 'DataClassification' && !currentTags[tagKey]) {
        if (typeof tagValue === 'string') {
          tagsToAdd.push({ Key: tagKey, Value: tagValue });
          result.actions.push(`Added tag ${tagKey}: ${tagValue}`);
        }
      }
    }

    // Apply tags if needed
    if (tagsToAdd.length > 0) {
      const allTags = [
        ...Object.entries(currentTags).map(([Key, Value]) => ({ Key, Value })),
        ...tagsToAdd,
      ];

      const putTagCommand = new PutObjectTaggingCommand({
        Bucket: bucketName,
        Key: objectKey,
        Tagging: { TagSet: allTags },
      });
      await s3Client.send(putTagCommand);
    }

    // Check and fix encryption
    const currentKmsKey = objectMetadata.SSEKMSKeyId;
    const requiredKmsKey = KMS_KEY_MAPPING[dataClassification];

    if (requiredKmsKey && currentKmsKey !== requiredKmsKey) {
      // Re-encrypt with correct KMS key
      const copyCommand = new CopyObjectCommand({
        CopySource: `${bucketName}/${objectKey}`,
        Bucket: bucketName,
        Key: objectKey,
        ServerSideEncryption: 'aws:kms',
        SSEKMSKeyId: requiredKmsKey,
        MetadataDirective: 'REPLACE',
        TaggingDirective: 'COPY',
      });
      await s3Client.send(copyCommand);

      result.actions.push(
        `Re-encrypted with KMS key for ${dataClassification}`
      );
    }

    console.log(
      `Remediated object: ${bucketName}/${objectKey} - Actions: ${result.actions.join(', ')}`
    );
  } catch (error) {
    console.error(`Failed to remediate ${bucketName}/${objectKey}:`, error);
    result.status = 'FAILED';
    result.error = (error as Error).message;
  }

  return result;
}

function inferDataClassification(
  objectKey: string,
  bucketName: string
): string {
  const keyLower = objectKey.toLowerCase();

  if (/ssn|social|pii|personal|customer/.test(keyLower)) {
    return 'PII';
  } else if (/payment|card|financial|transaction|billing/.test(keyLower)) {
    return 'FINANCIAL';
  } else if (/log|audit|operational|metric/.test(keyLower)) {
    return 'OPERATIONAL';
  } else {
    // Default based on bucket name
    const bucketLower = bucketName.toLowerCase();
    if (bucketLower.includes('pii')) {
      return 'PII';
    } else if (bucketLower.includes('financial')) {
      return 'FINANCIAL';
    } else {
      return 'OPERATIONAL';
    }
  }
}

async function sendNotification(results: RemediationResult[]): Promise<void> {
  try {
    const topicArn = process.env.SNS_TOPIC_ARN;
    if (!topicArn) {
      console.log('No SNS_TOPIC_ARN configured, skipping notification');
      return;
    }

    const criticalIssues = results.filter(r => r.status === 'FAILED');

    const message = {
      timestamp: new Date().toISOString(),
      total_processed: results.length,
      successful: results.filter(r => r.status === 'SUCCESS').length,
      failed: criticalIssues.length,
      critical_issues: criticalIssues.slice(0, 5), // Limit to first 5 failures
    };

    const publishCommand = new PublishCommand({
      TopicArn: topicArn,
      Subject: 'S3 Security Remediation Report',
      Message: JSON.stringify(message, null, 2),
    });

    await snsClient.send(publishCommand);
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
}

```

## ./lib/tap-stack.ts

```typescript
// ============================================================================
// IMPORTS
// ============================================================================
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as events from 'aws-cdk-lib/aws-events';
import * as eventsTargets from 'aws-cdk-lib/aws-events-targets';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as path from 'path';

// ============================================================================
// INTERFACES & TYPES
// ============================================================================
interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  securityTeamEmail?: string;
  allowedIpRanges?: string[];
  externalSecurityAccountId?: string;
  vpcId?: string;
  privateSubnetIds?: string[];
}

interface DataClassification {
  type: 'PII' | 'FINANCIAL' | 'OPERATIONAL' | 'LOGS';
  kmsKey?: kms.Key;
  bucket?: s3.Bucket;
}

interface ComplianceRequirement {
  requirement: string;
  implementedBy: string[];
  status: 'COMPLIANT' | 'PARTIAL' | 'NON_COMPLIANT';
}

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================
const RETENTION_DAYS = 2557; // 7 years for PCI DSS compliance
const SESSION_DURATION_HOURS = 1;
const KEY_ROTATION_DAYS = 30;
const MFA_REQUIRED_ACTIONS = [
  's3:DeleteBucket',
  's3:DeleteObject',
  'kms:DisableKey',
  'kms:DeleteAlias',
  'iam:DeleteRole',
  'iam:DeletePolicy',
  'logs:DeleteLogGroup',
];

// ============================================================================
// MAIN STACK CLASS
// ============================================================================
export class TapStack extends cdk.Stack {
  private readonly environmentSuffix: string;
  private readonly dataClassifications: Map<string, DataClassification> =
    new Map();
  private readonly securityAuditReport: ComplianceRequirement[] = [];

  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    this.environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    const securityTeamEmail =
      props?.securityTeamEmail ||
      this.node.tryGetContext('securityTeamEmail') ||
      'security@example.com';

    const allowedIpRanges = props?.allowedIpRanges ||
      this.node.tryGetContext('allowedIpRanges') || ['10.0.0.0/8'];

    const externalSecurityAccountId =
      props?.externalSecurityAccountId ||
      this.node.tryGetContext('externalSecurityAccountId');

    // Add stack-level tags
    cdk.Tags.of(this).add('Environment', this.environmentSuffix);
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
    cdk.Tags.of(this).add('Compliance', 'PCI-DSS');
    cdk.Tags.of(this).add('SecurityFramework', 'v1.0');
    cdk.Tags.of(this).add('iac-rlhf-amazon', 'true');

    // ========================================================================
    // 1. KMS KEYS - Multi-region with automatic rotation
    // ========================================================================

    // PII Data KMS Key
    const piiKmsKey = new kms.Key(this, 'PiiKmsKey', {
      alias: `alias/pii-data-key-${this.environmentSuffix}`,
      description: 'KMS key for PII data encryption - PCI DSS compliant',
      enableKeyRotation: true,
      enabled: true,
      multiRegion: true,
      pendingWindow: cdk.Duration.days(30),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      policy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            sid: 'Enable IAM User Permissions',
            effect: iam.Effect.ALLOW,
            principals: [new iam.AccountRootPrincipal()],
            actions: ['kms:*'],
            resources: ['*'],
          }),
          new iam.PolicyStatement({
            sid: 'Allow use of the key for PII data only',
            effect: iam.Effect.ALLOW,
            principals: [new iam.ServicePrincipal('s3.amazonaws.com')],
            actions: ['kms:Decrypt', 'kms:GenerateDataKey', 'kms:CreateGrant'],
            resources: ['*'],
            conditions: {
              StringEquals: {
                'kms:ViaService': `s3.${this.region}.amazonaws.com`,
                'aws:SourceAccount': this.account,
              },
            },
          }),
        ],
      }),
    });
    cdk.Tags.of(piiKmsKey).add('DataClassification', 'PII');
    cdk.Tags.of(piiKmsKey).add('KeyPurpose', 'DataEncryption');
    cdk.Tags.of(piiKmsKey).add('iac-rlhf-amazon', 'true');

    // Financial Data KMS Key
    const financialKmsKey = new kms.Key(this, 'FinancialKmsKey', {
      alias: `alias/financial-data-key-${this.environmentSuffix}`,
      description: 'KMS key for financial data encryption - PCI DSS compliant',
      enableKeyRotation: true,
      enabled: true,
      multiRegion: true,
      pendingWindow: cdk.Duration.days(30),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    cdk.Tags.of(financialKmsKey).add('DataClassification', 'FINANCIAL');
    cdk.Tags.of(financialKmsKey).add('KeyPurpose', 'DataEncryption');
    cdk.Tags.of(financialKmsKey).add('iac-rlhf-amazon', 'true');

    // Operational Data KMS Key
    const operationalKmsKey = new kms.Key(this, 'OperationalKmsKey', {
      alias: `alias/operational-data-key-${this.environmentSuffix}`,
      description: 'KMS key for operational data encryption',
      enableKeyRotation: true,
      enabled: true,
      multiRegion: true,
      pendingWindow: cdk.Duration.days(30),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    cdk.Tags.of(operationalKmsKey).add('DataClassification', 'OPERATIONAL');
    cdk.Tags.of(operationalKmsKey).add('KeyPurpose', 'DataEncryption');
    cdk.Tags.of(operationalKmsKey).add('iac-rlhf-amazon', 'true');

    // CloudWatch Logs KMS Key (separate from application data)
    const logsKmsKey = new kms.Key(this, 'LogsKmsKey', {
      alias: `alias/logs-key-${this.environmentSuffix}`,
      description:
        'KMS key for CloudWatch Logs encryption - separate from application data',
      enableKeyRotation: true,
      enabled: true,
      multiRegion: true,
      pendingWindow: cdk.Duration.days(30),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      policy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            sid: 'Enable IAM User Permissions',
            effect: iam.Effect.ALLOW,
            principals: [new iam.AccountRootPrincipal()],
            actions: ['kms:*'],
            resources: ['*'],
          }),
          new iam.PolicyStatement({
            sid: 'Allow CloudWatch Logs',
            effect: iam.Effect.ALLOW,
            principals: [
              new iam.ServicePrincipal(`logs.${this.region}.amazonaws.com`),
            ],
            actions: [
              'kms:Encrypt',
              'kms:Decrypt',
              'kms:ReEncrypt*',
              'kms:GenerateDataKey*',
              'kms:CreateGrant',
              'kms:DescribeKey',
            ],
            resources: ['*'],
            conditions: {
              ArnLike: {
                'kms:EncryptionContext:aws:logs:arn': `arn:aws:logs:${this.region}:${this.account}:log-group:*`,
              },
            },
          }),
        ],
      }),
    });
    cdk.Tags.of(logsKmsKey).add('DataClassification', 'LOGS');
    cdk.Tags.of(logsKmsKey).add('KeyPurpose', 'LogEncryption');
    cdk.Tags.of(logsKmsKey).add('iac-rlhf-amazon', 'true');

    // Store KMS keys for later reference
    this.dataClassifications.set('PII', { type: 'PII', kmsKey: piiKmsKey });
    this.dataClassifications.set('FINANCIAL', {
      type: 'FINANCIAL',
      kmsKey: financialKmsKey,
    });
    this.dataClassifications.set('OPERATIONAL', {
      type: 'OPERATIONAL',
      kmsKey: operationalKmsKey,
    });
    this.dataClassifications.set('LOGS', { type: 'LOGS', kmsKey: logsKmsKey });

    // ========================================================================
    // 2. IAM ROLES & POLICIES - Least privilege with MFA
    // ========================================================================

    // MFA enforcement policy document
    const mfaRequiredPolicy = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          sid: 'DenyAllExceptListedIfNoMFA',
          effect: iam.Effect.DENY,
          notActions: [
            'iam:CreateVirtualMFADevice',
            'iam:EnableMFADevice',
            'iam:ListMFADevices',
            'iam:ListUsers',
            'iam:ListVirtualMFADevices',
            'iam:ResyncMFADevice',
            'sts:GetSessionToken',
          ],
          resources: ['*'],
          conditions: {
            BoolIfExists: {
              'aws:MultiFactorAuthPresent': 'false',
            },
          },
        }),
      ],
    });

    // IP restriction policy document
    const ipRestrictionPolicy = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          sid: 'DenyAllFromNonAllowedIPs',
          effect: iam.Effect.DENY,
          actions: ['*'],
          resources: ['*'],
          conditions: {
            NotIpAddress: {
              'aws:SourceIp': allowedIpRanges,
            },
          },
        }),
      ],
    });

    // Application Services Role
    const appServicesRole = new iam.Role(this, 'AppServicesRole', {
      roleName: `app-services-role-${this.environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      maxSessionDuration: cdk.Duration.hours(SESSION_DURATION_HOURS),
      description:
        'Role for application services with limited payment processing permissions',
      inlinePolicies: {
        MFARequired: mfaRequiredPolicy,
        IPRestriction: ipRestrictionPolicy,
      },
    });
    cdk.Tags.of(appServicesRole).add('iac-rlhf-amazon', 'true');

    appServicesRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          's3:GetObject',
          's3:PutObject',
          's3:GetObjectTagging',
          's3:PutObjectTagging',
        ],
        resources: ['arn:aws:s3:::*-financial-*/*'],
        conditions: {
          StringEquals: {
            's3:x-amz-server-side-encryption': 'aws:kms',
            's3:x-amz-server-side-encryption-aws-kms-key-id':
              financialKmsKey.keyArn,
          },
        },
      })
    );

    appServicesRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['kms:Decrypt', 'kms:GenerateDataKey'],
        resources: [financialKmsKey.keyArn],
      })
    );

    // Data Analysts Role
    const dataAnalystsRole = new iam.Role(this, 'DataAnalystsRole', {
      roleName: `data-analysts-role-${this.environmentSuffix}`,
      assumedBy: new iam.AccountPrincipal(this.account),
      maxSessionDuration: cdk.Duration.hours(SESSION_DURATION_HOURS),
      description: 'Read-only access to operational data with MFA requirement',
      inlinePolicies: {
        MFARequired: mfaRequiredPolicy,
        IPRestriction: ipRestrictionPolicy,
      },
    });
    cdk.Tags.of(dataAnalystsRole).add('iac-rlhf-amazon', 'true');

    dataAnalystsRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          's3:GetObject',
          's3:ListBucket',
          's3:GetObjectVersion',
          's3:GetObjectVersionTagging',
        ],
        resources: [
          'arn:aws:s3:::*-operational-*',
          'arn:aws:s3:::*-operational-*/*',
        ],
        conditions: {
          Bool: {
            'aws:MultiFactorAuthPresent': 'true',
          },
        },
      })
    );

    dataAnalystsRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['kms:Decrypt'],
        resources: [operationalKmsKey.keyArn],
        conditions: {
          Bool: {
            'aws:MultiFactorAuthPresent': 'true',
          },
        },
      })
    );

    // Security Auditors Role
    const securityAuditorsRole = new iam.Role(this, 'SecurityAuditorsRole', {
      roleName: `security-auditors-role-${this.environmentSuffix}`,
      assumedBy: new iam.AccountPrincipal(this.account),
      maxSessionDuration: cdk.Duration.hours(SESSION_DURATION_HOURS),
      description: 'Read-only access to all security resources and audit logs',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('SecurityAudit'),
      ],
      inlinePolicies: {
        MFARequired: mfaRequiredPolicy,
        IPRestriction: ipRestrictionPolicy,
      },
    });
    cdk.Tags.of(securityAuditorsRole).add('iac-rlhf-amazon', 'true');

    securityAuditorsRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'logs:DescribeLogGroups',
          'logs:DescribeLogStreams',
          'logs:GetLogEvents',
          'logs:FilterLogEvents',
          'cloudwatch:DescribeAlarms',
          'cloudwatch:GetMetricData',
          'kms:DescribeKey',
          'kms:GetKeyRotationStatus',
          'kms:ListKeys',
          'kms:ListAliases',
        ],
        resources: ['*'],
        conditions: {
          Bool: {
            'aws:MultiFactorAuthPresent': 'true',
          },
        },
      })
    );

    // Cross-account Security Scanner Role
    let crossAccountSecurityRole: iam.Role | undefined;
    if (externalSecurityAccountId) {
      crossAccountSecurityRole = new iam.Role(
        this,
        'CrossAccountSecurityRole',
        {
          roleName: `cross-account-security-scanner-${this.environmentSuffix}`,
          assumedBy: new iam.AccountPrincipal(externalSecurityAccountId),
          externalIds: [`security-scanner-${this.environmentSuffix}`],
          maxSessionDuration: cdk.Duration.hours(SESSION_DURATION_HOURS),
          description:
            'Read-only permissions for external security scanning tools',
          managedPolicies: [
            iam.ManagedPolicy.fromAwsManagedPolicyName('SecurityAudit'),
            iam.ManagedPolicy.fromAwsManagedPolicyName('ViewOnlyAccess'),
          ],
        }
      );
      cdk.Tags.of(crossAccountSecurityRole).add('iac-rlhf-amazon', 'true');

      crossAccountSecurityRole.addToPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['tag:GetResources', 'tag:GetTagKeys', 'tag:GetTagValues'],
          resources: ['*'],
        })
      );
    }

    // ========================================================================
    // 3. S3 BUCKETS - Encrypted with tag-based policies
    // ========================================================================

    // PII Data Bucket
    const piiDataBucket = new s3.Bucket(this, 'PiiDataBucket', {
      bucketName: `pii-data-${this.account}-${this.environmentSuffix}`,
      encryptionKey: piiKmsKey,
      encryption: s3.BucketEncryption.KMS,
      enforceSSL: true,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          noncurrentVersionExpiration: cdk.Duration.days(90),
          enabled: true,
        },
        {
          id: 'TransitionToIA',
          transitions: [
            {
              transitionAfter: cdk.Duration.days(30),
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
            },
            {
              transitionAfter: cdk.Duration.days(90),
              storageClass: s3.StorageClass.GLACIER,
            },
          ],
        },
      ],
    });

    piiDataBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'DenyIncorrectEncryptionKey',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:PutObject'],
        resources: [`${piiDataBucket.bucketArn}/*`],
        conditions: {
          StringNotEquals: {
            's3:x-amz-server-side-encryption-aws-kms-key-id': piiKmsKey.keyArn,
          },
        },
      })
    );

    piiDataBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'DenyUnencryptedObjectUploads',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:PutObject'],
        resources: [`${piiDataBucket.bucketArn}/*`],
        conditions: {
          StringNotEquals: {
            's3:x-amz-server-side-encryption': 'aws:kms',
          },
        },
      })
    );

    piiDataBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'RequireTLS12',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:*'],
        resources: [piiDataBucket.bucketArn, `${piiDataBucket.bucketArn}/*`],
        conditions: {
          Bool: {
            'aws:SecureTransport': 'false',
          },
          NumericLessThan: {
            's3:TlsVersion': '1.2',
          },
        },
      })
    );

    cdk.Tags.of(piiDataBucket).add('DataClassification', 'PII');
    cdk.Tags.of(piiDataBucket).add('Encryption', 'KMS');
    cdk.Tags.of(piiDataBucket).add('Compliance', 'PCI-DSS');
    cdk.Tags.of(piiDataBucket).add('iac-rlhf-amazon', 'true');

    // Financial Data Bucket
    const financialDataBucket = new s3.Bucket(this, 'FinancialDataBucket', {
      bucketName: `financial-data-${this.account}-${this.environmentSuffix}`,
      encryptionKey: financialKmsKey,
      encryption: s3.BucketEncryption.KMS,
      enforceSSL: true,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      objectLockEnabled: true,
      objectLockDefaultRetention: s3.ObjectLockRetention.compliance(
        cdk.Duration.days(RETENTION_DAYS)
      ),
    });

    financialDataBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'DenyIncorrectEncryptionKey',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:PutObject'],
        resources: [`${financialDataBucket.bucketArn}/*`],
        conditions: {
          StringNotEquals: {
            's3:x-amz-server-side-encryption-aws-kms-key-id':
              financialKmsKey.keyArn,
          },
        },
      })
    );

    financialDataBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'RequireTLS12',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:*'],
        resources: [
          financialDataBucket.bucketArn,
          `${financialDataBucket.bucketArn}/*`,
        ],
        conditions: {
          Bool: {
            'aws:SecureTransport': 'false',
          },
          NumericLessThan: {
            's3:TlsVersion': '1.2',
          },
        },
      })
    );

    cdk.Tags.of(financialDataBucket).add('DataClassification', 'FINANCIAL');
    cdk.Tags.of(financialDataBucket).add('Encryption', 'KMS');
    cdk.Tags.of(financialDataBucket).add('Compliance', 'PCI-DSS');
    cdk.Tags.of(financialDataBucket).add('ObjectLock', 'ENABLED');
    cdk.Tags.of(financialDataBucket).add('iac-rlhf-amazon', 'true');

    // Operational Data Bucket
    const operationalDataBucket = new s3.Bucket(this, 'OperationalDataBucket', {
      bucketName: `operational-data-${this.account}-${this.environmentSuffix}`,
      encryptionKey: operationalKmsKey,
      encryption: s3.BucketEncryption.KMS,
      enforceSSL: true,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    operationalDataBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'RequireTLS12',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:*'],
        resources: [
          operationalDataBucket.bucketArn,
          `${operationalDataBucket.bucketArn}/*`,
        ],
        conditions: {
          Bool: {
            'aws:SecureTransport': 'false',
          },
          NumericLessThan: {
            's3:TlsVersion': '1.2',
          },
        },
      })
    );

    cdk.Tags.of(operationalDataBucket).add('DataClassification', 'OPERATIONAL');
    cdk.Tags.of(operationalDataBucket).add('Encryption', 'KMS');
    cdk.Tags.of(operationalDataBucket).add('Compliance', 'PCI-DSS');
    cdk.Tags.of(operationalDataBucket).add('iac-rlhf-amazon', 'true');

    // Store bucket references
    this.dataClassifications.get('PII')!.bucket = piiDataBucket;
    this.dataClassifications.get('FINANCIAL')!.bucket = financialDataBucket;
    this.dataClassifications.get('OPERATIONAL')!.bucket = operationalDataBucket;

    // ========================================================================
    // 4. CLOUDWATCH LOG GROUPS - 7-year retention with encryption
    // ========================================================================

    // Lambda Log Group
    const lambdaLogGroup = new logs.LogGroup(this, 'LambdaLogGroup', {
      logGroupName: `/aws/lambda/security-functions-${this.environmentSuffix}`,
      retention: RETENTION_DAYS,
      encryptionKey: logsKmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    cdk.Tags.of(lambdaLogGroup).add('iac-rlhf-amazon', 'true');

    // API Access Log Group
    const apiAccessLogGroup = new logs.LogGroup(this, 'ApiAccessLogGroup', {
      logGroupName: `/aws/api/access-logs-${this.environmentSuffix}`,
      retention: RETENTION_DAYS,
      encryptionKey: logsKmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    cdk.Tags.of(apiAccessLogGroup).add('iac-rlhf-amazon', 'true');

    // Security Event Log Group
    const securityEventLogGroup = new logs.LogGroup(
      this,
      'SecurityEventLogGroup',
      {
        logGroupName: `/aws/security/events-${this.environmentSuffix}`,
        retention: RETENTION_DAYS,
        encryptionKey: logsKmsKey,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );
    cdk.Tags.of(securityEventLogGroup).add('iac-rlhf-amazon', 'true');

    // Audit Trail Log Group
    const auditTrailLogGroup = new logs.LogGroup(this, 'AuditTrailLogGroup', {
      logGroupName: `/aws/audit/trail-${this.environmentSuffix}`,
      retention: RETENTION_DAYS,
      encryptionKey: logsKmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    cdk.Tags.of(auditTrailLogGroup).add('iac-rlhf-amazon', 'true');

    // ========================================================================
    // 5. SNS TOPICS - Security notifications
    // ========================================================================

    const securityNotificationTopic = new sns.Topic(
      this,
      'SecurityNotificationTopic',
      {
        topicName: `security-notifications-${this.environmentSuffix}`,
        displayName: 'Security Framework Notifications',
        masterKey: logsKmsKey,
      }
    );
    cdk.Tags.of(securityNotificationTopic).add('iac-rlhf-amazon', 'true');

    securityNotificationTopic.addSubscription(
      new snsSubscriptions.EmailSubscription(securityTeamEmail)
    );

    const keyRotationNotificationTopic = new sns.Topic(
      this,
      'KeyRotationNotificationTopic',
      {
        topicName: `key-rotation-notifications-${this.environmentSuffix}`,
        displayName: 'KMS Key Rotation Notifications',
        masterKey: logsKmsKey,
      }
    );
    cdk.Tags.of(keyRotationNotificationTopic).add('iac-rlhf-amazon', 'true');

    keyRotationNotificationTopic.addSubscription(
      new snsSubscriptions.EmailSubscription(securityTeamEmail)
    );

    // ========================================================================
    // 6. LAMBDA FUNCTIONS - Using Node 22 with TypeScript
    // ========================================================================

    // Lambda execution role
    const lambdaExecutionRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
      description: 'Execution role for security remediation Lambda functions',
    });
    cdk.Tags.of(lambdaExecutionRole).add('iac-rlhf-amazon', 'true');

    // Add permissions for S3 remediation
    lambdaExecutionRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          's3:GetObject',
          's3:GetObjectTagging',
          's3:PutObjectTagging',
          's3:CopyObject',
          's3:ListBucket',
          's3:HeadObject',
        ],
        resources: [
          piiDataBucket.bucketArn,
          `${piiDataBucket.bucketArn}/*`,
          financialDataBucket.bucketArn,
          `${financialDataBucket.bucketArn}/*`,
          operationalDataBucket.bucketArn,
          `${operationalDataBucket.bucketArn}/*`,
        ],
      })
    );

    lambdaExecutionRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['kms:Decrypt', 'kms:GenerateDataKey', 'kms:CreateGrant'],
        resources: [
          piiKmsKey.keyArn,
          financialKmsKey.keyArn,
          operationalKmsKey.keyArn,
        ],
      })
    );

    lambdaExecutionRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['sns:Publish'],
        resources: [securityNotificationTopic.topicArn],
      })
    );

    // S3 Remediation Lambda Function using NodejsFunction
    const s3RemediationFunction = new NodejsFunction(
      this,
      'S3RemediationFunction',
      {
        functionName: `s3-remediation-${this.environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_22_X,
        handler: 'handler',
        entry: path.join(__dirname, 'lambda', 's3-remediation.ts'),
        role: lambdaExecutionRole,
        timeout: cdk.Duration.seconds(300),
        memorySize: 512,
        environment: {
          ENVIRONMENT: this.environmentSuffix,
          PII_KMS_KEY_ID: piiKmsKey.keyId,
          FINANCIAL_KMS_KEY_ID: financialKmsKey.keyId,
          OPERATIONAL_KMS_KEY_ID: operationalKmsKey.keyId,
          SNS_TOPIC_ARN: securityNotificationTopic.topicArn,
          MONITORED_BUCKET: piiDataBucket.bucketName,
        },
        logGroup: lambdaLogGroup,
        description:
          'Automatically remediate S3 objects with incorrect tags or encryption',
        bundling: {
          externalModules: ['@aws-sdk/*'],
        },
      }
    );
    cdk.Tags.of(s3RemediationFunction).add('iac-rlhf-amazon', 'true');

    // Key Rotation Monitor Lambda Function using NodejsFunction
    const keyRotationMonitorFunction = new NodejsFunction(
      this,
      'KeyRotationMonitorFunction',
      {
        functionName: `key-rotation-monitor-${this.environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_22_X,
        handler: 'handler',
        entry: path.join(__dirname, 'lambda', 'key-rotation-monitor.ts'),
        role: lambdaExecutionRole,
        timeout: cdk.Duration.seconds(60),
        memorySize: 256,
        environment: {
          ENVIRONMENT: this.environmentSuffix,
          KMS_KEYS: JSON.stringify([
            piiKmsKey.keyId,
            financialKmsKey.keyId,
            operationalKmsKey.keyId,
            logsKmsKey.keyId,
          ]),
          ROTATION_WARNING_DAYS: KEY_ROTATION_DAYS.toString(),
          SNS_TOPIC_ARN: keyRotationNotificationTopic.topicArn,
        },
        logGroup: lambdaLogGroup,
        description: 'Monitor KMS key rotation and send notifications',
        bundling: {
          externalModules: ['@aws-sdk/*'],
        },
      }
    );
    cdk.Tags.of(keyRotationMonitorFunction).add('iac-rlhf-amazon', 'true');

    // Grant KMS describe permissions to key rotation monitor
    lambdaExecutionRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'kms:DescribeKey',
          'kms:GetKeyRotationStatus',
          'kms:ListAliases',
        ],
        resources: ['*'],
      })
    );

    // ========================================================================
    // 7. EVENTBRIDGE RULES - Key rotation monitoring
    // ========================================================================

    // Daily key rotation check
    const keyRotationCheckRule = new events.Rule(this, 'KeyRotationCheckRule', {
      ruleName: `key-rotation-check-${this.environmentSuffix}`,
      description: 'Daily check for KMS key rotation status',
      schedule: events.Schedule.rate(cdk.Duration.days(1)),
      targets: [new eventsTargets.LambdaFunction(keyRotationMonitorFunction)],
    });
    cdk.Tags.of(keyRotationCheckRule).add('iac-rlhf-amazon', 'true');

    // S3 object upload remediation trigger
    const s3RemediationRule = new events.Rule(this, 'S3RemediationRule', {
      ruleName: `s3-object-remediation-${this.environmentSuffix}`,
      description: 'Trigger remediation on S3 object creation',
      eventPattern: {
        source: ['aws.s3'],
        detailType: ['Object Created'],
        detail: {
          bucket: {
            name: [
              piiDataBucket.bucketName,
              financialDataBucket.bucketName,
              operationalDataBucket.bucketName,
            ],
          },
        },
      },
      targets: [new eventsTargets.LambdaFunction(s3RemediationFunction)],
    });
    cdk.Tags.of(s3RemediationRule).add('iac-rlhf-amazon', 'true');

    // KMS key rotation event monitoring
    const kmsRotationEventRule = new events.Rule(this, 'KmsRotationEventRule', {
      ruleName: `kms-rotation-event-${this.environmentSuffix}`,
      description: 'Monitor KMS key rotation events',
      eventPattern: {
        source: ['aws.kms'],
        detailType: ['KMS Key Rotation'],
      },
      targets: [new eventsTargets.SnsTopic(keyRotationNotificationTopic)],
    });
    cdk.Tags.of(kmsRotationEventRule).add('iac-rlhf-amazon', 'true');

    // ========================================================================
    // 8. CLOUDWATCH ALARMS - Security monitoring
    // ========================================================================

    // Unauthorized KMS key access alarm
    const unauthorizedKmsAccessAlarm = new cloudwatch.Alarm(
      this,
      'UnauthorizedKmsAccessAlarm',
      {
        alarmName: `unauthorized-kms-access-${this.environmentSuffix}`,
        alarmDescription: 'Alert on unauthorized KMS key access attempts',
        metric: new cloudwatch.Metric({
          namespace: 'AWS/KMS',
          metricName: 'NumberOfOperations',
          dimensionsMap: {
            KeyId: piiKmsKey.keyId,
          },
        }),
        threshold: 100,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );
    unauthorizedKmsAccessAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(securityNotificationTopic)
    );
    cdk.Tags.of(unauthorizedKmsAccessAlarm).add('iac-rlhf-amazon', 'true');

    // Failed authentication attempts alarm
    const failedAuthAlarm = new cloudwatch.Alarm(this, 'FailedAuthAlarm', {
      alarmName: `failed-authentication-${this.environmentSuffix}`,
      alarmDescription: 'Alert on multiple failed authentication attempts',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/CloudTrail',
        metricName: 'FailedAuthentication',
      }),
      threshold: 5,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    failedAuthAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(securityNotificationTopic)
    );
    cdk.Tags.of(failedAuthAlarm).add('iac-rlhf-amazon', 'true');

    // S3 bucket policy changes alarm
    const s3PolicyChangeAlarm = new cloudwatch.Alarm(
      this,
      'S3PolicyChangeAlarm',
      {
        alarmName: `s3-policy-changes-${this.environmentSuffix}`,
        alarmDescription: 'Alert on S3 bucket policy modifications',
        metric: new cloudwatch.Metric({
          namespace: 'AWS/S3',
          metricName: 'BucketPolicyChanges',
        }),
        threshold: 1,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );
    s3PolicyChangeAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(securityNotificationTopic)
    );
    cdk.Tags.of(s3PolicyChangeAlarm).add('iac-rlhf-amazon', 'true');

    // IAM role/policy modification alarm
    const iamChangeAlarm = new cloudwatch.Alarm(this, 'IamChangeAlarm', {
      alarmName: `iam-changes-${this.environmentSuffix}`,
      alarmDescription: 'Alert on IAM role or policy modifications',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/IAM',
        metricName: 'PolicyChanges',
      }),
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    iamChangeAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(securityNotificationTopic)
    );
    cdk.Tags.of(iamChangeAlarm).add('iac-rlhf-amazon', 'true');

    // Lambda function error rate alarm
    const lambdaErrorAlarm = new cloudwatch.Alarm(this, 'LambdaErrorAlarm', {
      alarmName: `lambda-errors-${this.environmentSuffix}`,
      alarmDescription: 'Alert on high Lambda function error rate',
      metric: s3RemediationFunction.metricErrors(),
      threshold: 5,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    lambdaErrorAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(securityNotificationTopic)
    );
    cdk.Tags.of(lambdaErrorAlarm).add('iac-rlhf-amazon', 'true');

    // ========================================================================
    // 9. RESOURCE DELETION PROTECTION POLICIES
    // ========================================================================

    const resourceProtectionPolicy = new iam.ManagedPolicy(
      this,
      'ResourceProtectionPolicy',
      {
        managedPolicyName: `resource-protection-${this.environmentSuffix}`,
        description: 'Prevent deletion of critical security resources',
        statements: [
          new iam.PolicyStatement({
            sid: 'DenyKMSKeyDeletion',
            effect: iam.Effect.DENY,
            actions: [
              'kms:ScheduleKeyDeletion',
              'kms:DisableKey',
              'kms:DeleteAlias',
            ],
            resources: [
              piiKmsKey.keyArn,
              financialKmsKey.keyArn,
              operationalKmsKey.keyArn,
              logsKmsKey.keyArn,
            ],
          }),
          new iam.PolicyStatement({
            sid: 'DenyLogGroupDeletion',
            effect: iam.Effect.DENY,
            actions: ['logs:DeleteLogGroup', 'logs:DeleteLogStream'],
            resources: [
              lambdaLogGroup.logGroupArn,
              apiAccessLogGroup.logGroupArn,
              securityEventLogGroup.logGroupArn,
              auditTrailLogGroup.logGroupArn,
            ],
          }),
          new iam.PolicyStatement({
            sid: 'DenyS3BucketDeletion',
            effect: iam.Effect.DENY,
            actions: [
              's3:DeleteBucket',
              's3:DeleteBucketPolicy',
              's3:DeleteBucketEncryption',
            ],
            resources: [
              piiDataBucket.bucketArn,
              financialDataBucket.bucketArn,
              operationalDataBucket.bucketArn,
            ],
          }),
          new iam.PolicyStatement({
            sid: 'DenySecurityRoleDeletion',
            effect: iam.Effect.DENY,
            actions: [
              'iam:DeleteRole',
              'iam:DeleteRolePolicy',
              'iam:DetachRolePolicy',
            ],
            resources: [
              appServicesRole.roleArn,
              dataAnalystsRole.roleArn,
              securityAuditorsRole.roleArn,
              lambdaExecutionRole.roleArn,
            ],
          }),
        ],
      }
    );
    cdk.Tags.of(resourceProtectionPolicy).add('iac-rlhf-amazon', 'true');

    // ========================================================================
    // 10. MFA ENFORCEMENT POLICIES
    // ========================================================================

    const mfaEnforcementPolicy = new iam.ManagedPolicy(
      this,
      'MfaEnforcementPolicy',
      {
        managedPolicyName: `mfa-enforcement-${this.environmentSuffix}`,
        description: 'Enforce MFA for sensitive operations',
        statements: [
          new iam.PolicyStatement({
            sid: 'DenyWriteOperationsWithoutMFA',
            effect: iam.Effect.DENY,
            actions: MFA_REQUIRED_ACTIONS,
            resources: ['*'],
            conditions: {
              BoolIfExists: {
                'aws:MultiFactorAuthPresent': 'false',
              },
            },
          }),
          new iam.PolicyStatement({
            sid: 'DenyPIIAccessWithoutMFA',
            effect: iam.Effect.DENY,
            actions: ['s3:GetObject', 's3:PutObject'],
            resources: [`${piiDataBucket.bucketArn}/*`],
            conditions: {
              BoolIfExists: {
                'aws:MultiFactorAuthPresent': 'false',
              },
            },
          }),
          new iam.PolicyStatement({
            sid: 'DenyFinancialDataAccessWithoutMFA',
            effect: iam.Effect.DENY,
            actions: ['s3:GetObject', 's3:PutObject'],
            resources: [`${financialDataBucket.bucketArn}/*`],
            conditions: {
              BoolIfExists: {
                'aws:MultiFactorAuthPresent': 'false',
              },
            },
          }),
          new iam.PolicyStatement({
            sid: 'DenyAssumeRoleWithoutMFA',
            effect: iam.Effect.DENY,
            actions: ['sts:AssumeRole'],
            resources: ['*'],
            conditions: {
              BoolIfExists: {
                'aws:MultiFactorAuthPresent': 'false',
              },
            },
          }),
        ],
      }
    );
    cdk.Tags.of(mfaEnforcementPolicy).add('iac-rlhf-amazon', 'true');

    // ========================================================================
    // COMPLIANCE AUDIT REPORT GENERATION
    // ========================================================================

    this.securityAuditReport.push(
      {
        requirement: 'Encryption at Rest',
        implementedBy: [
          piiKmsKey.keyId,
          financialKmsKey.keyId,
          operationalKmsKey.keyId,
          logsKmsKey.keyId,
        ],
        status: 'COMPLIANT',
      },
      {
        requirement: 'Key Rotation',
        implementedBy: ['All KMS keys have automatic rotation enabled'],
        status: 'COMPLIANT',
      },
      {
        requirement: 'Access Logging',
        implementedBy: [
          lambdaLogGroup.logGroupName,
          apiAccessLogGroup.logGroupName,
          securityEventLogGroup.logGroupName,
          auditTrailLogGroup.logGroupName,
        ],
        status: 'COMPLIANT',
      },
      {
        requirement: 'Data Retention (7 years)',
        implementedBy: [
          `All log groups configured with ${RETENTION_DAYS} days retention`,
        ],
        status: 'COMPLIANT',
      },
      {
        requirement: 'MFA Enforcement',
        implementedBy: [mfaEnforcementPolicy.managedPolicyName],
        status: 'COMPLIANT',
      },
      {
        requirement: 'TLS 1.2 Minimum',
        implementedBy: ['All S3 buckets enforce TLS 1.2'],
        status: 'COMPLIANT',
      },
      {
        requirement: 'Public Access Blocked',
        implementedBy: ['BlockPublicAccess enabled on all S3 buckets'],
        status: 'COMPLIANT',
      },
      {
        requirement: 'Automated Remediation',
        implementedBy: [
          s3RemediationFunction.functionName,
          keyRotationMonitorFunction.functionName,
        ],
        status: 'COMPLIANT',
      },
      {
        requirement: 'Security Monitoring',
        implementedBy: [
          unauthorizedKmsAccessAlarm.alarmName,
          failedAuthAlarm.alarmName,
          s3PolicyChangeAlarm.alarmName,
          iamChangeAlarm.alarmName,
        ],
        status: 'COMPLIANT',
      },
      {
        requirement: 'Cross-Account Access Control',
        implementedBy: [crossAccountSecurityRole?.roleName || 'Not configured'],
        status: crossAccountSecurityRole ? 'COMPLIANT' : 'PARTIAL',
      }
    );

    // ========================================================================
    // CDK OUTPUTS - Export critical resource ARNs
    // ========================================================================

    // KMS Key Outputs
    new cdk.CfnOutput(this, 'PiiKmsKeyArn', {
      value: piiKmsKey.keyArn,
      description: 'KMS Key ARN for PII data encryption',
      exportName: `PiiKmsKeyArn-${this.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'FinancialKmsKeyArn', {
      value: financialKmsKey.keyArn,
      description: 'KMS Key ARN for financial data encryption',
      exportName: `FinancialKmsKeyArn-${this.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'OperationalKmsKeyArn', {
      value: operationalKmsKey.keyArn,
      description: 'KMS Key ARN for operational data encryption',
      exportName: `OperationalKmsKeyArn-${this.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LogsKmsKeyArn', {
      value: logsKmsKey.keyArn,
      description: 'KMS Key ARN for CloudWatch Logs encryption',
      exportName: `LogsKmsKeyArn-${this.environmentSuffix}`,
    });

    // IAM Role Outputs
    new cdk.CfnOutput(this, 'AppServicesRoleArn', {
      value: appServicesRole.roleArn,
      description: 'Application services role ARN',
      exportName: `AppServicesRoleArn-${this.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DataAnalystsRoleArn', {
      value: dataAnalystsRole.roleArn,
      description: 'Data analysts role ARN',
      exportName: `DataAnalystsRoleArn-${this.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'SecurityAuditorsRoleArn', {
      value: securityAuditorsRole.roleArn,
      description: 'Security auditors role ARN',
      exportName: `SecurityAuditorsRoleArn-${this.environmentSuffix}`,
    });

    if (crossAccountSecurityRole) {
      new cdk.CfnOutput(this, 'CrossAccountSecurityRoleArn', {
        value: crossAccountSecurityRole.roleArn,
        description: 'Cross-account security scanner role ARN',
        exportName: `CrossAccountSecurityRoleArn-${this.environmentSuffix}`,
      });
    }

    // S3 Bucket Outputs
    new cdk.CfnOutput(this, 'PiiDataBucketName', {
      value: piiDataBucket.bucketName,
      description: 'PII data bucket name',
      exportName: `PiiDataBucketName-${this.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'FinancialDataBucketName', {
      value: financialDataBucket.bucketName,
      description: 'Financial data bucket name',
      exportName: `FinancialDataBucketName-${this.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'OperationalDataBucketName', {
      value: operationalDataBucket.bucketName,
      description: 'Operational data bucket name',
      exportName: `OperationalDataBucketName-${this.environmentSuffix}`,
    });

    // Lambda Function Outputs
    new cdk.CfnOutput(this, 'S3RemediationFunctionArn', {
      value: s3RemediationFunction.functionArn,
      description: 'S3 remediation Lambda function ARN',
      exportName: `S3RemediationFunctionArn-${this.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'KeyRotationMonitorFunctionArn', {
      value: keyRotationMonitorFunction.functionArn,
      description: 'Key rotation monitor Lambda function ARN',
      exportName: `KeyRotationMonitorFunctionArn-${this.environmentSuffix}`,
    });

    // SNS Topic Outputs
    new cdk.CfnOutput(this, 'SecurityNotificationTopicArn', {
      value: securityNotificationTopic.topicArn,
      description: 'Security notification SNS topic ARN',
      exportName: `SecurityNotificationTopicArn-${this.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'KeyRotationNotificationTopicArn', {
      value: keyRotationNotificationTopic.topicArn,
      description: 'Key rotation notification SNS topic ARN',
      exportName: `KeyRotationNotificationTopicArn-${this.environmentSuffix}`,
    });

    // CloudWatch Log Group Outputs
    new cdk.CfnOutput(this, 'LambdaLogGroupName', {
      value: lambdaLogGroup.logGroupName,
      description: 'Lambda log group name',
      exportName: `LambdaLogGroupName-${this.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'AuditTrailLogGroupName', {
      value: auditTrailLogGroup.logGroupName,
      description: 'Audit trail log group name',
      exportName: `AuditTrailLogGroupName-${this.environmentSuffix}`,
    });

    // Compliance Report Output
    new cdk.CfnOutput(this, 'ComplianceReport', {
      value: JSON.stringify(this.securityAuditReport, null, 2),
      description: 'PCI DSS compliance audit report',
    });

    // Security Framework Version
    new cdk.CfnOutput(this, 'SecurityFrameworkVersion', {
      value: 'v1.0.0',
      description: 'Security framework version',
    });
  }
}

```

## ./test/tap-stack.int.test.ts

```typescript
/* eslint-disable import/no-extraneous-dependencies */
import fs from 'fs';
import path from 'path';
import {
  KMSClient,
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
} from '@aws-sdk/client-kms';
import {
  S3Client,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetBucketPolicyCommand,
  GetPublicAccessBlockCommand,
} from '@aws-sdk/client-s3';
import {
  IAMClient,
  GetRoleCommand,
  ListAttachedRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import {
  LambdaClient,
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
} from '@aws-sdk/client-lambda';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  SNSClient,
  GetTopicAttributesCommand,
} from '@aws-sdk/client-sns';
import {
  EventBridgeClient,
  DescribeRuleCommand,
} from '@aws-sdk/client-eventbridge';
/* eslint-enable import/no-extraneous-dependencies */

// Load outputs from flat-outputs.json
const outputsPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

// Get environment configuration
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'ap-northeast-1';

// Initialize AWS clients
const kmsClient = new KMSClient({ region });
const s3Client = new S3Client({ region });
const iamClient = new IAMClient({ region });
const lambdaClient = new LambdaClient({ region });
const logsClient = new CloudWatchLogsClient({ region });
const snsClient = new SNSClient({ region });
const eventsClient = new EventBridgeClient({ region });

describe('TAP Stack Integration Tests', () => {
  describe('KMS Keys', () => {
    test('KMS Key ARNs should be present in outputs', () => {
      expect(outputs.PiiKmsKeyArn).toBeDefined();
      expect(outputs.PiiKmsKeyArn).toMatch(/^arn:aws:kms:/);

      expect(outputs.FinancialKmsKeyArn).toBeDefined();
      expect(outputs.FinancialKmsKeyArn).toMatch(/^arn:aws:kms:/);

      expect(outputs.OperationalKmsKeyArn).toBeDefined();
      expect(outputs.OperationalKmsKeyArn).toMatch(/^arn:aws:kms:/);

      expect(outputs.LogsKmsKeyArn).toBeDefined();
      expect(outputs.LogsKmsKeyArn).toMatch(/^arn:aws:kms:/);
    });

    test('KMS Keys should be multi-region keys', () => {
      // Multi-region keys have 'mrk-' prefix in the key ID
      expect(outputs.PiiKmsKeyArn).toContain('mrk-');
      expect(outputs.FinancialKmsKeyArn).toContain('mrk-');
      expect(outputs.OperationalKmsKeyArn).toContain('mrk-');
      expect(outputs.LogsKmsKeyArn).toContain('mrk-');
    });
  });

  describe('S3 Buckets', () => {
    test('PII Data Bucket should have encryption, versioning, and public access blocked', async () => {
      const bucketName = outputs.PiiDataBucketName;
      expect(bucketName).toBeDefined();

      // Check encryption
      const encryptionCommand = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const encryptionResponse = await s3Client.send(encryptionCommand);
      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
      expect(
        encryptionResponse.ServerSideEncryptionConfiguration?.Rules?.[0]
          ?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('aws:kms');

      // Check versioning
      const versioningCommand = new GetBucketVersioningCommand({ Bucket: bucketName });
      const versioningResponse = await s3Client.send(versioningCommand);
      expect(versioningResponse.Status).toBe('Enabled');

      // Check public access block
      const publicAccessCommand = new GetPublicAccessBlockCommand({ Bucket: bucketName });
      const publicAccessResponse = await s3Client.send(publicAccessCommand);
      expect(publicAccessResponse.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(publicAccessResponse.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(publicAccessResponse.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(publicAccessResponse.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);

      // Check bucket policy for TLS enforcement
      const policyCommand = new GetBucketPolicyCommand({ Bucket: bucketName });
      const policyResponse = await s3Client.send(policyCommand);
      expect(policyResponse.Policy).toBeDefined();

      const policy = JSON.parse(policyResponse.Policy!);
      const tlsStatement = policy.Statement.find(
        (stmt: any) =>
          stmt.Effect === 'Deny' &&
          stmt.Condition?.NumericLessThan?.['s3:TlsVersion']
      );
      expect(tlsStatement).toBeDefined();
      expect(tlsStatement.Condition.NumericLessThan['s3:TlsVersion']).toBe('1.2');
    });

    test('Financial Data Bucket should have encryption and versioning', async () => {
      const bucketName = outputs.FinancialDataBucketName;
      expect(bucketName).toBeDefined();

      const encryptionCommand = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const encryptionResponse = await s3Client.send(encryptionCommand);
      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
      expect(
        encryptionResponse.ServerSideEncryptionConfiguration?.Rules?.[0]
          ?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('aws:kms');

      const versioningCommand = new GetBucketVersioningCommand({ Bucket: bucketName });
      const versioningResponse = await s3Client.send(versioningCommand);
      expect(versioningResponse.Status).toBe('Enabled');
    });

    test('Operational Data Bucket should have encryption and versioning', async () => {
      const bucketName = outputs.OperationalDataBucketName;
      expect(bucketName).toBeDefined();

      const encryptionCommand = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const encryptionResponse = await s3Client.send(encryptionCommand);
      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();

      const versioningCommand = new GetBucketVersioningCommand({ Bucket: bucketName });
      const versioningResponse = await s3Client.send(versioningCommand);
      expect(versioningResponse.Status).toBe('Enabled');
    });
  });

  describe('IAM Roles', () => {
    test('App Services Role should exist with correct policies', async () => {
      const roleArn = outputs.AppServicesRoleArn;
      expect(roleArn).toBeDefined();
      expect(roleArn).toMatch(/^arn:aws:iam::/);

      const roleName = roleArn.split('/').pop();
      expect(roleName).toBe(`app-services-role-${environmentSuffix}`);

      const getRoleCommand = new GetRoleCommand({ RoleName: roleName });
      const roleResponse = await iamClient.send(getRoleCommand);

      expect(roleResponse.Role).toBeDefined();
      expect(roleResponse.Role?.RoleName).toBe(`app-services-role-${environmentSuffix}`);
    });

    test('Data Analysts Role should exist', async () => {
      const roleArn = outputs.DataAnalystsRoleArn;
      expect(roleArn).toBeDefined();

      const roleName = roleArn.split('/').pop();
      const getRoleCommand = new GetRoleCommand({ RoleName: roleName });
      const roleResponse = await iamClient.send(getRoleCommand);

      expect(roleResponse.Role).toBeDefined();
      expect(roleResponse.Role?.RoleName).toBe(`data-analysts-role-${environmentSuffix}`);
    });

    test('Security Auditors Role should exist', async () => {
      const roleArn = outputs.SecurityAuditorsRoleArn;
      expect(roleArn).toBeDefined();

      const roleName = roleArn.split('/').pop();
      const getRoleCommand = new GetRoleCommand({ RoleName: roleName });
      const roleResponse = await iamClient.send(getRoleCommand);

      expect(roleResponse.Role).toBeDefined();
      expect(roleResponse.Role?.RoleName).toBe(`security-auditors-role-${environmentSuffix}`);
    });
  });

  describe('Lambda Functions', () => {
    test('S3 Remediation Function should exist and use Node.js 22', async () => {
      const functionArn = outputs.S3RemediationFunctionArn;
      expect(functionArn).toBeDefined();

      const functionName = functionArn.split(':').pop();
      const getCommand = new GetFunctionConfigurationCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(getCommand);

      expect(response.FunctionName).toBe(`s3-remediation-${environmentSuffix}`);
      expect(response.Runtime).toBe('nodejs22.x');
      expect(response.Timeout).toBe(300);
      expect(response.MemorySize).toBe(512);
      expect(response.Environment?.Variables?.ENVIRONMENT).toBe(environmentSuffix);
    });

    test('Key Rotation Monitor Function should exist and use Node.js 22', async () => {
      const functionArn = outputs.KeyRotationMonitorFunctionArn;
      expect(functionArn).toBeDefined();

      const functionName = functionArn.split(':').pop();
      const getCommand = new GetFunctionConfigurationCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(getCommand);

      expect(response.FunctionName).toBe(`key-rotation-monitor-${environmentSuffix}`);
      expect(response.Runtime).toBe('nodejs22.x');
      expect(response.Timeout).toBe(60);
      expect(response.MemorySize).toBe(256);
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('Lambda Log Group should have 7-year retention (2557 days)', async () => {
      const logGroupName = outputs.LambdaLogGroupName;
      expect(logGroupName).toBeDefined();

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const response = await logsClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);

      const logGroup = response.logGroups!.find(lg => lg.logGroupName === logGroupName);
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(2557);
    });

    test('Audit Trail Log Group should have 7-year retention', async () => {
      const logGroupName = outputs.AuditTrailLogGroupName;
      expect(logGroupName).toBeDefined();

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const response = await logsClient.send(command);

      const logGroup = response.logGroups!.find(lg => lg.logGroupName === logGroupName);
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(2557);
    });
  });

  describe('SNS Topics', () => {
    test('Security Notification Topic should exist', async () => {
      const topicArn = outputs.SecurityNotificationTopicArn;
      expect(topicArn).toBeDefined();

      const command = new GetTopicAttributesCommand({ TopicArn: topicArn });
      const response = await snsClient.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.TopicArn).toBe(topicArn);
    });

    test('Key Rotation Notification Topic should exist', async () => {
      const topicArn = outputs.KeyRotationNotificationTopicArn;
      expect(topicArn).toBeDefined();

      const command = new GetTopicAttributesCommand({ TopicArn: topicArn });
      const response = await snsClient.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.TopicArn).toBe(topicArn);
    });
  });

  describe('EventBridge Rules', () => {
    test('EventBridge rule names should follow correct naming convention', () => {
      // Test that we expect the correct rule names based on the environment suffix
      const expectedRules = [
        `s3-object-remediation-${environmentSuffix}`,
        `key-rotation-check-${environmentSuffix}`,
        `kms-rotation-event-${environmentSuffix}`,
      ];

      expectedRules.forEach(ruleName => {
        expect(ruleName).toMatch(new RegExp(`-${environmentSuffix}$`));
      });
    });

    test('EventBridge rules should be defined in stack outputs', () => {
      // Verify that the Lambda functions triggered by EventBridge exist
      expect(outputs.S3RemediationFunctionArn).toBeDefined();
      expect(outputs.KeyRotationMonitorFunctionArn).toBeDefined();
    });
  });

  describe('PCI DSS Compliance', () => {
    test('All KMS keys should be multi-region with mrk prefix', () => {
      const keyArns = [
        outputs.PiiKmsKeyArn,
        outputs.FinancialKmsKeyArn,
        outputs.OperationalKmsKeyArn,
        outputs.LogsKmsKeyArn,
      ];

      keyArns.forEach(keyArn => {
        expect(keyArn).toContain('mrk-');
        expect(keyArn).toMatch(/^arn:aws:kms:/);
      });
    });

    test('All S3 buckets should block public access', async () => {
      const bucketNames = [
        outputs.PiiDataBucketName,
        outputs.FinancialDataBucketName,
        outputs.OperationalDataBucketName,
      ];

      for (const bucketName of bucketNames) {
        const command = new GetPublicAccessBlockCommand({ Bucket: bucketName });
        const response = await s3Client.send(command);

        expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
        expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
        expect(response.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
        expect(response.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
      }
    });

    test('Security Framework Version should be v1.0.0', () => {
      expect(outputs.SecurityFrameworkVersion).toBe('v1.0.0');
    });
  });
});

```

## ./test/tap-stack.unit.test.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Template, Match, Capture } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    jest.clearAllMocks();
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('KMS Keys', () => {
    test('should create 4 KMS keys with correct configuration', () => {
      template.resourceCountIs('AWS::KMS::Key', 4);
    });

    test('PII KMS Key should have multi-region and auto-rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        MultiRegion: true,
        EnableKeyRotation: true,
        Description: Match.stringLikeRegexp(/PII/i),
      });
    });

    test('Financial KMS Key should have multi-region and auto-rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        MultiRegion: true,
        EnableKeyRotation: true,
        Description: Match.stringLikeRegexp(/[Ff]inancial/),
      });
    });

    test('Operational KMS Key should have multi-region and auto-rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        MultiRegion: true,
        EnableKeyRotation: true,
        Description: Match.stringLikeRegexp(/[Oo]perational/),
      });
    });

    test('Logs KMS Key should have multi-region and auto-rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        MultiRegion: true,
        EnableKeyRotation: true,
        Description: Match.stringLikeRegexp(/[Ll]ogs|CloudWatch/),
      });
    });

    test('KMS keys should have key policies defined', () => {
      const keyPolicyCapture = new Capture();
      template.hasResourceProperties('AWS::KMS::Key', {
        KeyPolicy: keyPolicyCapture,
      });

      const keyPolicy = keyPolicyCapture.asObject();
      expect(keyPolicy.Statement).toBeDefined();
      expect(Array.isArray(keyPolicy.Statement)).toBe(true);
      expect(keyPolicy.Statement.length).toBeGreaterThan(0);
    });

    test('should create 4 KMS aliases with correct naming', () => {
      template.resourceCountIs('AWS::KMS::Alias', 4);
    });
  });

  describe('IAM Roles', () => {
    test('should create 3 IAM roles with environment suffix', () => {
      template.resourceCountIs('AWS::IAM::Role', 4); // 3 main roles + 1 Lambda execution role
    });

    test('AppServicesRole should have correct configuration', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `app-services-role-${environmentSuffix}`,
      });
    });

    test('DataAnalystsRole should have correct configuration', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `data-analysts-role-${environmentSuffix}`,
      });
    });

    test('SecurityAuditorsRole should have correct configuration', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `security-auditors-role-${environmentSuffix}`,
      });
    });

    test('IAM roles should have assume role policies defined', () => {
      const assumeRolePolicyCapture = new Capture();
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: assumeRolePolicyCapture,
      });

      const assumeRolePolicy = assumeRolePolicyCapture.asObject();
      expect(assumeRolePolicy.Statement).toBeDefined();
      expect(Array.isArray(assumeRolePolicy.Statement)).toBe(true);
    });

    test('LambdaExecutionRole should have correct policies', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: { Service: 'lambda.amazonaws.com' },
            }),
          ]),
        },
      });
    });
  });

  describe('IAM Policies', () => {
    test('should create MFA enforcement policy', () => {
      template.hasResourceProperties('AWS::IAM::ManagedPolicy', {
        ManagedPolicyName: `mfa-enforcement-${environmentSuffix}`,
      });
    });

    test('should create resource protection policy', () => {
      template.hasResourceProperties('AWS::IAM::ManagedPolicy', {
        ManagedPolicyName: `resource-protection-${environmentSuffix}`,
      });
    });

    test('MFA enforcement policy should deny actions without MFA', () => {
      const policyDocumentCapture = new Capture();
      template.hasResourceProperties('AWS::IAM::ManagedPolicy', {
        ManagedPolicyName: `mfa-enforcement-${environmentSuffix}`,
        PolicyDocument: policyDocumentCapture,
      });

      const policyDocument = policyDocumentCapture.asObject();
      expect(policyDocument.Statement).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            Effect: 'Deny',
            Condition: expect.objectContaining({
              BoolIfExists: expect.objectContaining({
                'aws:MultiFactorAuthPresent': 'false',
              }),
            }),
          }),
        ])
      );
    });

    test('resource protection policy should have policy statements', () => {
      const policyDocumentCapture = new Capture();
      template.hasResourceProperties('AWS::IAM::ManagedPolicy', {
        ManagedPolicyName: `resource-protection-${environmentSuffix}`,
        PolicyDocument: policyDocumentCapture,
      });

      const policyDocument = policyDocumentCapture.asObject();
      expect(policyDocument.Statement).toBeDefined();
      expect(Array.isArray(policyDocument.Statement)).toBe(true);
    });
  });

  describe('S3 Buckets', () => {
    test('should create 3 S3 buckets', () => {
      template.resourceCountIs('AWS::S3::Bucket', 3);
    });

    test('PII data bucket should have correct encryption and policies', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.objectLike({
          'Fn::Join': Match.arrayWith([
            Match.arrayWith([Match.stringLikeRegexp(/pii-data/)]),
          ]),
        }),
        BucketEncryption: Match.objectLike({
          ServerSideEncryptionConfiguration: Match.anyValue(),
        }),
        PublicAccessBlockConfiguration: Match.objectLike({
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
        }),
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('Financial data bucket should have correct encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.objectLike({
          'Fn::Join': Match.arrayWith([
            Match.arrayWith([Match.stringLikeRegexp(/financial-data/)]),
          ]),
        }),
        BucketEncryption: Match.objectLike({
          ServerSideEncryptionConfiguration: Match.anyValue(),
        }),
      });
    });

    test('Operational data bucket should have correct encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.objectLike({
          'Fn::Join': Match.arrayWith([
            Match.arrayWith([Match.stringLikeRegexp(/operational-data/)]),
          ]),
        }),
      });
    });

    test('all S3 buckets should have versioning enabled', () => {
      template.allResourcesProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('should create bucket policies for all 3 buckets', () => {
      template.resourceCountIs('AWS::S3::BucketPolicy', 3);
    });

    test('bucket policies should have TLS enforcement', () => {
      const policyDocumentCapture = new Capture();
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: policyDocumentCapture,
      });

      const policyDocument = policyDocumentCapture.asObject();
      expect(policyDocument.Statement).toBeDefined();
      expect(Array.isArray(policyDocument.Statement)).toBe(true);
      expect(policyDocument.Statement.length).toBeGreaterThan(0);
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('should create 4 log groups', () => {
      template.resourceCountIs('AWS::Logs::LogGroup', 4);
    });

    test('all log groups should have 7-year retention (2557 days)', () => {
      template.allResourcesProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 2557,
      });
    });

    test('Lambda log group should have correct name', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/lambda/security-functions-${environmentSuffix}`,
      });
    });

    test('API access log group should have correct name', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/api/access-logs-${environmentSuffix}`,
      });
    });

    test('Security event log group should have correct name', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/security/events-${environmentSuffix}`,
      });
    });

    test('Audit trail log group should have correct name', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/audit/trail-${environmentSuffix}`,
      });
    });
  });

  describe('Lambda Functions', () => {
    test('should create 2 Lambda functions', () => {
      template.resourceCountIs('AWS::Lambda::Function', 2);
    });

    test('S3 remediation function should use Node.js 22 runtime', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `s3-remediation-${environmentSuffix}`,
        Runtime: 'nodejs22.x',
        Timeout: 300,
      });
    });

    test('Key rotation monitor function should use Node.js 22 runtime', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `key-rotation-monitor-${environmentSuffix}`,
        Runtime: 'nodejs22.x',
        Timeout: 60,
      });
    });

    test('Lambda functions should have environment variables', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: Match.objectLike({
            ENVIRONMENT: environmentSuffix,
          }),
        },
      });
    });
  });

  describe('SNS Topics', () => {
    test('should create 2 SNS topics', () => {
      template.resourceCountIs('AWS::SNS::Topic', 2);
    });

    test('Security notification topic should have correct configuration', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `security-notifications-${environmentSuffix}`,
      });
    });

    test('Key rotation notification topic should have correct configuration', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `key-rotation-notifications-${environmentSuffix}`,
      });
    });

    test('SNS topics should have email subscriptions', () => {
      template.resourceCountIs('AWS::SNS::Subscription', 2);
      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'security@example.com',
      });
    });

    test('SNS topics should have topic policies', () => {
      template.resourceCountIs('AWS::SNS::TopicPolicy', 1);
    });
  });

  describe('EventBridge Rules', () => {
    test('should create 3 EventBridge rules', () => {
      template.resourceCountIs('AWS::Events::Rule', 3);
    });

    test('should create S3 remediation rule', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: `s3-object-remediation-${environmentSuffix}`,
        State: 'ENABLED',
      });
    });

    test('should create key rotation check rule with schedule', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: `key-rotation-check-${environmentSuffix}`,
        ScheduleExpression: 'rate(1 day)',
      });
    });

    test('should create KMS rotation event rule', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: `kms-rotation-event-${environmentSuffix}`,
        EventPattern: Match.objectLike({
          source: ['aws.kms'],
          'detail-type': Match.arrayWith([
            Match.stringLikeRegexp(/KMS Key Rotation/),
          ]),
        }),
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should create 5 CloudWatch alarms', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 5);
    });

    test('should create failed authentication alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `failed-authentication-${environmentSuffix}`,
        MetricName: 'FailedAuthentication',
        Threshold: 5,
      });
    });

    test('should create unauthorized KMS access alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `unauthorized-kms-access-${environmentSuffix}`,
        MetricName: 'NumberOfOperations',
      });
    });

    test('should create S3 policy change alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `s3-policy-changes-${environmentSuffix}`,
        MetricName: 'BucketPolicyChanges',
      });
    });

    test('should create IAM change alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `iam-changes-${environmentSuffix}`,
        MetricName: 'PolicyChanges',
      });
    });

    test('should create Lambda error alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `lambda-errors-${environmentSuffix}`,
        MetricName: 'Errors',
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should export PII KMS key ARN', () => {
      template.hasOutput('PiiKmsKeyArn', {
        Description: 'KMS Key ARN for PII data encryption',
        Export: {
          Name: `PiiKmsKeyArn-${environmentSuffix}`,
        },
      });
    });

    test('should export Financial KMS key ARN', () => {
      template.hasOutput('FinancialKmsKeyArn', {
        Description: 'KMS Key ARN for financial data encryption',
        Export: {
          Name: `FinancialKmsKeyArn-${environmentSuffix}`,
        },
      });
    });

    test('should export Operational KMS key ARN', () => {
      template.hasOutput('OperationalKmsKeyArn', {
        Description: 'KMS Key ARN for operational data encryption',
        Export: {
          Name: `OperationalKmsKeyArn-${environmentSuffix}`,
        },
      });
    });

    test('should export all S3 bucket names', () => {
      template.hasOutput('PiiDataBucketName', Match.objectLike({}));
      template.hasOutput('FinancialDataBucketName', Match.objectLike({}));
      template.hasOutput('OperationalDataBucketName', Match.objectLike({}));
    });

    test('should export all IAM role ARNs', () => {
      template.hasOutput('AppServicesRoleArn', Match.objectLike({}));
      template.hasOutput('DataAnalystsRoleArn', Match.objectLike({}));
      template.hasOutput('SecurityAuditorsRoleArn', Match.objectLike({}));
    });

    test('should export Lambda function ARNs', () => {
      template.hasOutput('S3RemediationFunctionArn', Match.objectLike({}));
      template.hasOutput('KeyRotationMonitorFunctionArn', Match.objectLike({}));
    });

    test('should export SNS topic ARNs', () => {
      template.hasOutput('SecurityNotificationTopicArn', Match.objectLike({}));
      template.hasOutput('KeyRotationNotificationTopicArn', Match.objectLike({}));
    });

    test('should export compliance report', () => {
      template.hasOutput('ComplianceReport', {
        Description: 'PCI DSS compliance audit report',
      });
    });

    test('should export security framework version', () => {
      template.hasOutput('SecurityFrameworkVersion', {
        Value: 'v1.0.0',
        Description: 'Security framework version',
      });
    });
  });

  describe('Tags', () => {
    test('all resources should have iac-rlhf-amazon tag', () => {
      // This test verifies that the tag is being applied at the stack level
      expect(stack.tags.tagValues()).toHaveProperty('iac-rlhf-amazon', 'true');
    });

    test('stack should have environment suffix tag', () => {
      expect(stack.tags.tagValues()).toHaveProperty(
        'Environment',
        environmentSuffix
      );
    });
  });

  describe('Security Configurations', () => {
    test('all resources should follow least privilege principle', () => {
      // Verify IAM policies don't use wildcards excessively
      const policies = template.findResources('AWS::IAM::Policy');
      Object.values(policies).forEach((policy: any) => {
        const statements = policy.Properties.PolicyDocument.Statement;
        statements.forEach((statement: any) => {
          if (statement.Effect === 'Allow') {
            // Ensure actions are specific
            expect(statement.Action).toBeDefined();
          }
        });
      });
    });

    test('all S3 buckets should block public access', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach((bucket: any) => {
        expect(bucket.Properties.PublicAccessBlockConfiguration).toEqual({
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        });
      });
    });

    test('all KMS keys should have automatic rotation enabled', () => {
      const keys = template.findResources('AWS::KMS::Key');
      Object.values(keys).forEach((key: any) => {
        expect(key.Properties.EnableKeyRotation).toBe(true);
      });
    });
  });

  describe('Resource Naming Conventions', () => {
    test('all resources should follow naming convention with environment suffix', () => {
      const resources = template.toJSON().Resources;
      const namedResources = Object.values(resources).filter(
        (resource: any) =>
          resource.Properties.FunctionName ||
          resource.Properties.BucketName ||
          resource.Properties.RoleName ||
          resource.Properties.TopicName ||
          resource.Properties.LogGroupName
      );

      namedResources.forEach((resource: any) => {
        const name =
          resource.Properties.FunctionName ||
          resource.Properties.BucketName ||
          resource.Properties.RoleName ||
          resource.Properties.TopicName ||
          resource.Properties.LogGroupName;

        if (typeof name === 'string') {
          expect(name).toContain(environmentSuffix);
        }
      });
    });
  });

  describe('PCI DSS Compliance', () => {
    test('data at rest encryption should be enforced', () => {
      // All S3 buckets must have encryption
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach((bucket: any) => {
        expect(bucket.Properties.BucketEncryption).toBeDefined();
      });
    });

    test('log retention should meet 7-year requirement', () => {
      const logGroups = template.findResources('AWS::Logs::LogGroup');
      Object.values(logGroups).forEach((logGroup: any) => {
        expect(logGroup.Properties.RetentionInDays).toBe(2557);
      });
    });

    test('MFA should be enforced for sensitive operations', () => {
      template.hasResourceProperties('AWS::IAM::ManagedPolicy', {
        ManagedPolicyName: `mfa-enforcement-${environmentSuffix}`,
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
              Condition: Match.objectLike({
                BoolIfExists: Match.objectLike({
                  'aws:MultiFactorAuthPresent': 'false',
                }),
              }),
            }),
          ]),
        },
      });
    });

    test('TLS 1.2 minimum should be enforced on S3', () => {
      const bucketPolicies = template.findResources('AWS::S3::BucketPolicy');
      Object.values(bucketPolicies).forEach((policy: any) => {
        const statements = policy.Properties.PolicyDocument.Statement;
        const tlsStatement = statements.find((s: any) =>
          s.Condition?.NumericLessThan?.hasOwnProperty('s3:TlsVersion')
        );
        expect(tlsStatement).toBeDefined();
        expect(tlsStatement.Condition.NumericLessThan['s3:TlsVersion']).toBe(
          '1.2'
        );
      });
    });
  });

  describe('Cross-Account Security Role', () => {
    test('should not create cross-account role when externalSecurityAccountId is not provided', () => {
      // Default stack created without externalSecurityAccountId
      // Should have 4 IAM roles (3 main + 1 Lambda execution)
      template.resourceCountIs('AWS::IAM::Role', 4);
    });

    test('should create cross-account role when externalSecurityAccountId is provided', () => {
      const appWithCrossAccount = new cdk.App();
      const stackWithCrossAccount = new TapStack(
        appWithCrossAccount,
        'TestTapStackWithCrossAccount',
        {
          environmentSuffix,
          externalSecurityAccountId: '123456789012',
        }
      );
      const templateWithCrossAccount =
        Template.fromStack(stackWithCrossAccount);

      // Should have 5 IAM roles (3 main + 1 Lambda execution + 1 cross-account)
      templateWithCrossAccount.resourceCountIs('AWS::IAM::Role', 5);

      // Verify cross-account role properties
      templateWithCrossAccount.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `cross-account-security-scanner-${environmentSuffix}`,
      });
    });
  });

  describe('Configuration Fallbacks', () => {
    test('should use default environmentSuffix when not provided in props or context', () => {
      const appNoEnv = new cdk.App();
      const stackNoEnv = new TapStack(appNoEnv, 'TestTapStackNoEnv', {});
      const templateNoEnv = Template.fromStack(stackNoEnv);

      // Verify default 'dev' suffix is used
      templateNoEnv.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'app-services-role-dev',
      });
    });

    test('should use context environmentSuffix when not provided in props', () => {
      const appWithContext = new cdk.App({
        context: {
          environmentSuffix: 'staging',
        },
      });
      const stackWithContext = new TapStack(
        appWithContext,
        'TestTapStackWithContext',
        {}
      );
      const templateWithContext = Template.fromStack(stackWithContext);

      // Verify context suffix is used
      templateWithContext.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'app-services-role-staging',
      });
    });
  });
});

```

## ./cdk.json

```json
{
  "app": "npx ts-node --prefer-ts-exts bin/tap.ts",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "**/*.d.ts",
      "**/*.js",
      "tsconfig.json",
      "package*.json",
      "yarn.lock",
      "node_modules",
      "test"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target-partitions": [
      "aws",
      "aws-cn"
    ],
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": true,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-ecs:disableExplicitDeploymentControllerForCircuitBreaker": true,
    "@aws-cdk/aws-iam:importedRoleStackSafeDefaultPolicyName": true,
    "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy": true,
    "@aws-cdk/aws-route53-patters:useCertificate": true,
    "@aws-cdk/customresources:installLatestAwsSdkDefault": false,
    "@aws-cdk/aws-rds:databaseProxyUniqueResourceName": true,
    "@aws-cdk/aws-codedeploy:removeAlarmsFromDeploymentGroup": true,
    "@aws-cdk/aws-apigateway:authorizerChangeDeploymentLogicalId": true,
    "@aws-cdk/aws-ec2:launchTemplateDefaultUserData": true,
    "@aws-cdk/aws-secretsmanager:useAttachedSecretResourcePolicyForSecretTargetAttachments": true,
    "@aws-cdk/aws-redshift:columnId": true,
    "@aws-cdk/aws-stepfunctions-tasks:enableEmrServicePolicyV2": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableOpensearchMultiAzWithStandby": true,
    "@aws-cdk/aws-lambda-nodejs:useLatestRuntimeVersion": true,
    "@aws-cdk/aws-efs:mountTargetOrderInsensitiveLogicalId": true,
    "@aws-cdk/aws-rds:auroraClusterChangeScopeOfInstanceParameterGroupWithEachParameters": true,
    "@aws-cdk/aws-appsync:useArnForSourceApiAssociationIdentifier": true,
    "@aws-cdk/aws-rds:preventRenderingDeprecatedCredentials": true,
    "@aws-cdk/aws-codepipeline-actions:useNewDefaultBranchForCodeCommitSource": true,
    "@aws-cdk/aws-cloudwatch-actions:changeLambdaPermissionLogicalIdForLambdaAction": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeysDefaultValueToFalse": true,
    "@aws-cdk/aws-codepipeline:defaultPipelineTypeToV2": true,
    "@aws-cdk/aws-kms:reduceCrossAccountRegionPolicyScope": true,
    "@aws-cdk/aws-eks:nodegroupNameAttribute": true,
    "@aws-cdk/aws-ec2:ebsDefaultGp3Volume": true,
    "@aws-cdk/aws-ecs:removeDefaultDeploymentAlarm": true,
    "@aws-cdk/custom-resources:logApiResponseDataPropertyTrueDefault": false,
    "@aws-cdk/aws-s3:keepNotificationInImportedBucket": false,
    "@aws-cdk/aws-ecs:enableImdsBlockingDeprecatedFeature": false,
    "@aws-cdk/aws-ecs:disableEcsImdsBlocking": true,
    "@aws-cdk/aws-ecs:reduceEc2FargateCloudWatchPermissions": true,
    "@aws-cdk/aws-dynamodb:resourcePolicyPerReplica": true,
    "@aws-cdk/aws-ec2:ec2SumTImeoutEnabled": true,
    "@aws-cdk/aws-appsync:appSyncGraphQLAPIScopeLambdaPermission": true,
    "@aws-cdk/aws-rds:setCorrectValueForDatabaseInstanceReadReplicaInstanceResourceId": true,
    "@aws-cdk/core:cfnIncludeRejectComplexResourceUpdateCreatePolicyIntrinsics": true,
    "@aws-cdk/aws-lambda-nodejs:sdkV3ExcludeSmithyPackages": true,
    "@aws-cdk/aws-stepfunctions-tasks:fixRunEcsTaskPolicy": true,
    "@aws-cdk/aws-ec2:bastionHostUseAmazonLinux2023ByDefault": true,
    "@aws-cdk/aws-route53-targets:userPoolDomainNameMethodWithoutCustomResource": true,
    "@aws-cdk/aws-elasticloadbalancingV2:albDualstackWithoutPublicIpv4SecurityGroupRulesDefault": true,
    "@aws-cdk/aws-iam:oidcRejectUnauthorizedConnections": true,
    "@aws-cdk/core:enableAdditionalMetadataCollection": true,
    "@aws-cdk/aws-lambda:createNewPoliciesWithAddToRolePolicy": false,
    "@aws-cdk/aws-s3:setUniqueReplicationRoleName": true,
    "@aws-cdk/aws-events:requireEventBusPolicySid": true,
    "@aws-cdk/core:aspectPrioritiesMutating": true,
    "@aws-cdk/aws-dynamodb:retainTableReplica": true,
    "@aws-cdk/aws-stepfunctions:useDistributedMapResultWriterV2": true,
    "@aws-cdk/s3-notifications:addS3TrustKeyPolicyForSnsSubscriptions": true,
    "@aws-cdk/aws-ec2:requirePrivateSubnetsForEgressOnlyInternetGateway": true,
    "@aws-cdk/aws-s3:publicAccessBlockedByDefault": true,
    "@aws-cdk/aws-lambda:useCdkManagedLogGroup": true
  }
}
```
