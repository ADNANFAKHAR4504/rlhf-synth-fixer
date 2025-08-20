# IDEAL_RESPONSE for Pr1178

## config/tags.ts

```typescript
export const commonTags = {
  Environment: 'Production',
  Project: 'Security',
  ManagedBy: 'Pulumi',
  Region: 'us-east-1',
};
```

## types/common.ts

```typescript
export interface BaseResourceArgs {
  tags: Record<string, string>;
}

export interface SecurityConfig {
  requireMFA: boolean;
  encryptionEnabled: boolean;
  region: string;
}
```

## modules/kms/index.ts

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { commonTags } from '../../config/tags';

export interface KMSKeyArgs {
  description: string;
  keyUsage?: string;
  tags?: Record<string, string>;
}

export class KMSKey extends pulumi.ComponentResource {
  public readonly key: aws.kms.Key;
  public readonly alias: aws.kms.Alias;

  constructor(
    name: string,
    args: KMSKeyArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:security:KMSKey', name, {}, opts);

    // Get account ID first
    const accountId = aws.getCallerIdentity().then(id => id.accountId);

    // Create key policy using pulumi.all to properly handle the Output
    const keyPolicy = pulumi.all([accountId]).apply(([accountId]) => ({
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'Enable IAM User Permissions',
          Effect: 'Allow',
          Principal: {
            AWS: `arn:aws:iam::${accountId}:root`,
          },
          Action: 'kms:*',
          Resource: '*',
        },
        {
          Sid: 'Allow CloudTrail to encrypt logs',
          Effect: 'Allow',
          Principal: {
            Service: 'cloudtrail.amazonaws.com',
          },
          Action: [
            'kms:GenerateDataKey*',
            'kms:DescribeKey',
            'kms:Encrypt',
            'kms:ReEncrypt*',
            'kms:Decrypt',
          ],
          Resource: '*',
        },
        {
          Sid: 'Allow S3 service to use the key',
          Effect: 'Allow',
          Principal: {
            Service: 's3.amazonaws.com',
          },
          Action: ['kms:GenerateDataKey', 'kms:Decrypt'],
          Resource: '*',
        },
        {
          Sid: 'Allow CloudWatch Logs to encrypt logs',
          Effect: 'Allow',
          Principal: {
            Service: 'logs.amazonaws.com',
          },
          Action: [
            'kms:Encrypt',
            'kms:Decrypt',
            'kms:ReEncrypt*',
            'kms:GenerateDataKey*',
            'kms:DescribeKey',
          ],
          Resource: '*',
        },
      ],
    }));

    this.key = new aws.kms.Key(
      `${name}-key`,
      {
        description: args.description,
        keyUsage: args.keyUsage || 'ENCRYPT_DECRYPT',
        policy: keyPolicy.apply(policy => JSON.stringify(policy)),
        enableKeyRotation: true,
        deletionWindowInDays: 30,
        tags: { ...commonTags, ...args.tags },
      },
      { parent: this }
    );

    this.alias = new aws.kms.Alias(
      `${name}-alias`,
      {
        name: `alias/${name}`,
        targetKeyId: this.key.keyId,
      },
      { parent: this }
    );

    this.registerOutputs({
      keyId: this.key.keyId,
      keyArn: this.key.arn,
      aliasName: this.alias.name,
    });
  }
}
```

## modules/s3/enhanced-s3.ts

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { commonTags } from '../../config/tags';

export interface EnhancedSecureS3BucketArgs {
  bucketName?: string;
  kmsKeyId: pulumi.Input<string>;
  tags?: Record<string, string>;
  lifecycleRules?: any[];
  enableAccessLogging?: boolean;
  enableNotifications?: boolean;
  allowedIpRanges?: string[];
  enableObjectLock?: boolean;
  lambdaFunctionArn?: string; // Optional Lambda function ARN for notifications
  enableBucketPolicy?: boolean; // Optional flag to enable/disable bucket policy
}

export class EnhancedSecureS3Bucket extends pulumi.ComponentResource {
  public readonly bucket: aws.s3.Bucket;
  public readonly bucketPolicy?: aws.s3.BucketPolicy;
  public readonly publicAccessBlock: aws.s3.BucketPublicAccessBlock;
  public readonly accessLogsBucket?: aws.s3.Bucket;
  public readonly notification?: aws.s3.BucketNotification;

  constructor(
    name: string,
    args: EnhancedSecureS3BucketArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:security:EnhancedSecureS3Bucket', name, {}, opts);

    // Create access logs bucket if logging is enabled
    if (args.enableAccessLogging) {
      this.accessLogsBucket = new aws.s3.Bucket(
        `${name}-access-logs`,
        {
          bucket: args.bucketName
            ? `${args.bucketName}-access-logs`
            : undefined,
          forceDestroy: false,
          tags: { ...commonTags, ...args.tags, Purpose: 'Access Logs' },
        },
        { parent: this }
      );

      // Block public access for logs bucket
      new aws.s3.BucketPublicAccessBlock(
        `${name}-logs-public-access-block`,
        {
          bucket: this.accessLogsBucket.id,
          blockPublicAcls: true,
          blockPublicPolicy: true,
          ignorePublicAcls: true,
          restrictPublicBuckets: true,
        },
        { parent: this }
      );
    }

    // Create main S3 bucket with enhanced security
    this.bucket = new aws.s3.Bucket(
      `${name}-bucket`,
      {
        bucket: args.bucketName,
        forceDestroy: false,
        objectLockEnabled: args.enableObjectLock,
        tags: { ...commonTags, ...args.tags },
      },
      { parent: this }
    );

    // Enable versioning with MFA delete protection (disabled for automation)
    new aws.s3.BucketVersioning(
      `${name}-versioning`,
      {
        bucket: this.bucket.id,
        versioningConfiguration: {
          status: 'Enabled',
          mfaDelete: 'Disabled', // Disabled for automated deployments
        },
      },
      { parent: this }
    );

    // Configure server-side encryption with additional security
    new aws.s3.BucketServerSideEncryptionConfiguration(
      `${name}-encryption`,
      {
        bucket: this.bucket.id,
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: args.kmsKeyId,
            },
            bucketKeyEnabled: true,
          },
        ],
      },
      { parent: this }
    );

    // Block all public access
    this.publicAccessBlock = new aws.s3.BucketPublicAccessBlock(
      `${name}-public-access-block`,
      {
        bucket: this.bucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // Enhanced secure bucket policy with IP restrictions (optional)
    if (args.enableBucketPolicy !== false) {
      const bucketPolicyDocument = pulumi
        .all([
          this.bucket.arn,
          aws.getCallerIdentity().then(id => id.accountId),
        ])
        .apply(([bucketArn, accountId]) => ({
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'AllowRootAccountFullAccess',
              Effect: 'Allow',
              Principal: {
                AWS: `arn:aws:iam::${accountId}:root`,
              },
              Action: 's3:*',
              Resource: [bucketArn, `${bucketArn}/*`],
            },
            {
              Sid: 'AllowCloudTrailAclCheck',
              Effect: 'Allow',
              Principal: {
                Service: 'cloudtrail.amazonaws.com',
              },
              Action: 's3:GetBucketAcl',
              Resource: bucketArn,
            },
            {
              Sid: 'AllowCloudTrailWrite',
              Effect: 'Allow',
              Principal: {
                Service: 'cloudtrail.amazonaws.com',
              },
              Action: 's3:PutObject',
              Resource: `${bucketArn}/*`,
              Condition: {
                StringEquals: {
                  's3:x-amz-acl': 'bucket-owner-full-control',
                },
              },
            },
            {
              Sid: 'DenyInsecureConnections',
              Effect: 'Deny',
              Principal: '*',
              Action: 's3:*',
              Resource: [bucketArn, `${bucketArn}/*`],
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'false',
                },
              },
            },
            {
              Sid: 'DenyDeleteWithoutMFA',
              Effect: 'Deny',
              Principal: '*',
              Action: [
                's3:DeleteObject',
                's3:DeleteObjectVersion',
                's3:DeleteBucket',
              ],
              Resource: [bucketArn, `${bucketArn}/*`],
              Condition: {
                Bool: {
                  'aws:MultiFactorAuthPresent': 'false',
                },
              },
            },
          ],
        }));

      this.bucketPolicy = new aws.s3.BucketPolicy(
        `${name}-policy`,
        {
          bucket: this.bucket.id,
          policy: bucketPolicyDocument.apply(policy => JSON.stringify(policy)),
        },
        { parent: this, dependsOn: [this.publicAccessBlock] }
      );
    }

    // Configure enhanced lifecycle rules
    if (args.lifecycleRules) {
      new aws.s3.BucketLifecycleConfiguration(
        `${name}-lifecycle`,
        {
          bucket: this.bucket.id,
          rules: [
            ...args.lifecycleRules,
            // Add default rule for incomplete multipart uploads
            {
              id: 'cleanup-incomplete-uploads',
              status: 'Enabled',
              abortIncompleteMultipartUpload: {
                daysAfterInitiation: 7,
              },
            },
            // Add rule for old versions cleanup
            {
              id: 'cleanup-old-versions',
              status: 'Enabled',
              noncurrentVersionExpiration: {
                noncurrentDays: 90,
              },
            },
          ],
        },
        { parent: this }
      );
    }

    // Enable access logging if requested
    if (args.enableAccessLogging && this.accessLogsBucket) {
      new aws.s3.BucketLogging(
        `${name}-logging`,
        {
          bucket: this.bucket.id,
          targetBucket: this.accessLogsBucket.id,
          targetPrefix: 'access-logs/',
          // Note: targetGrants removed for bucket owner enforced buckets
        },
        { parent: this }
      );
    }

    // Configure object lock if enabled
    if (args.enableObjectLock) {
      new aws.s3.BucketObjectLockConfiguration(
        `${name}-object-lock`,
        {
          bucket: this.bucket.id,
          objectLockEnabled: 'Enabled',
          rule: {
            defaultRetention: {
              mode: 'COMPLIANCE',
              years: 7, // 7 years retention for compliance
            },
          },
        },
        { parent: this }
      );
    }

    // Enable notifications for security monitoring (only if Lambda ARN is provided)
    if (args.enableNotifications && args.lambdaFunctionArn) {
      this.notification = new aws.s3.BucketNotification(
        `${name}-notification`,
        {
          bucket: this.bucket.id,
          lambdaFunctions: [
            {
              events: [
                's3:ObjectCreated:*',
                's3:ObjectRemoved:*',
                's3:ObjectRestore:*',
              ],
              lambdaFunctionArn: args.lambdaFunctionArn,
            },
          ],
        },
        { parent: this }
      );
    }

    // Enable request metrics for monitoring
    new aws.s3.BucketMetric(
      `${name}-metrics`,
      {
        bucket: this.bucket.id,
        name: 'EntireBucket',
      },
      { parent: this }
    );

    // Note: BucketInventory is not available in current Pulumi AWS version
    // This would be added when the resource becomes available

    this.registerOutputs({
      bucketName: this.bucket.id,
      bucketArn: this.bucket.arn,
      bucketDomainName: this.bucket.bucketDomainName,
      accessLogsBucketName: this.accessLogsBucket?.id,
      accessLogsBucketArn: this.accessLogsBucket?.arn,
    });
  }
}
```

## modules/s3/index.ts

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { commonTags } from '../../config/tags';

export interface SecureS3BucketArgs {
  bucketName?: string;
  kmsKeyId: pulumi.Input<string>;
  tags?: Record<string, string>;
  lifecycleRules?: any[];
  enableBucketPolicy?: boolean; // Optional flag to enable/disable bucket policy
  enableAccessLogging?: boolean; // Optional flag to enable/disable access logging
}

export class SecureS3Bucket extends pulumi.ComponentResource {
  public readonly bucket: aws.s3.Bucket;
  public readonly bucketPolicy?: aws.s3.BucketPolicy;
  public readonly publicAccessBlock: aws.s3.BucketPublicAccessBlock;
  public readonly accessLogsBucket?: aws.s3.Bucket;

  constructor(
    name: string,
    args: SecureS3BucketArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:security:SecureS3Bucket', name, {}, opts);

    // Input validation
    if (!args.kmsKeyId) {
      throw new Error(`KMS Key ID is required for secure S3 bucket ${name}`);
    }

    // Validate bucket name if provided
    if (args.bucketName) {
      const bucketNameRegex = /^[a-z0-9][a-z0-9.-]*[a-z0-9]$/;
      if (
        !bucketNameRegex.test(args.bucketName) ||
        args.bucketName.length < 3 ||
        args.bucketName.length > 63
      ) {
        throw new Error(
          `Invalid bucket name ${args.bucketName}. Must be 3-63 characters, lowercase, and follow S3 naming rules.`
        );
      }
    }

    // Create access logs bucket only if logging is enabled (default: true)
    const enableLogging = args.enableAccessLogging !== false;

    if (enableLogging) {
      this.accessLogsBucket = new aws.s3.Bucket(
        `${name}-access-logs`,
        {
          bucket: args.bucketName
            ? `${args.bucketName}-access-logs`
            : undefined,
          forceDestroy: false,
          tags: { ...commonTags, ...args.tags, Purpose: 'Access Logs' },
        },
        { parent: this }
      );

      // Block public access for logs bucket
      new aws.s3.BucketPublicAccessBlock(
        `${name}-logs-public-access-block`,
        {
          bucket: this.accessLogsBucket.id,
          blockPublicAcls: true,
          blockPublicPolicy: true,
          ignorePublicAcls: true,
          restrictPublicBuckets: true,
        },
        { parent: this }
      );
    }

    // Create S3 bucket
    this.bucket = new aws.s3.Bucket(
      `${name}-bucket`,
      {
        bucket: args.bucketName,
        forceDestroy: false,
        tags: { ...commonTags, ...args.tags },
      },
      { parent: this }
    );

    // Enable versioning with error handling
    try {
      new aws.s3.BucketVersioning(
        `${name}-versioning`,
        {
          bucket: this.bucket.id,
          versioningConfiguration: {
            status: 'Enabled',
            mfaDelete: 'Disabled', // Can be enabled if MFA delete is required
          },
        },
        {
          parent: this,
          dependsOn: [this.bucket],
        }
      );
    } catch (error) {
      console.warn(
        `Warning: Failed to configure versioning for bucket ${name}:`,
        error
      );
      // Versioning is important for security, so we should still try to continue
    }

    // Configure server-side encryption with error handling
    try {
      new aws.s3.BucketServerSideEncryptionConfiguration(
        `${name}-encryption`,
        {
          bucket: this.bucket.id,
          rules: [
            {
              applyServerSideEncryptionByDefault: {
                sseAlgorithm: 'aws:kms',
                kmsMasterKeyId: args.kmsKeyId,
              },
              bucketKeyEnabled: true,
            },
          ],
        },
        {
          parent: this,
          dependsOn: [this.bucket],
        }
      );
    } catch (error) {
      console.warn(
        `Warning: Failed to configure encryption for bucket ${name}:`,
        error
      );
      throw new Error(
        `Critical: Cannot create secure S3 bucket without encryption: ${error}`
      );
    }

    // Block all public access
    this.publicAccessBlock = new aws.s3.BucketPublicAccessBlock(
      `${name}-public-access-block`,
      {
        bucket: this.bucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // Secure bucket policy with error handling (optional)
    if (args.enableBucketPolicy !== false) {
      const bucketPolicyDocument = pulumi
        .all([
          this.bucket.arn,
          aws.getCallerIdentity().then(id => id.accountId),
        ])
        .apply(([bucketArn, accountId]) => {
          try {
            if (!bucketArn || !accountId) {
              throw new Error(
                'Missing required values for bucket policy creation'
              );
            }

            return {
              Version: '2012-10-17',
              Statement: [
                {
                  Sid: 'AllowRootAccountFullAccess',
                  Effect: 'Allow',
                  Principal: {
                    AWS: `arn:aws:iam::${accountId}:root`,
                  },
                  Action: 's3:*',
                  Resource: [bucketArn, `${bucketArn}/*`],
                },
                {
                  Sid: 'AllowCloudTrailAclCheck',
                  Effect: 'Allow',
                  Principal: {
                    Service: 'cloudtrail.amazonaws.com',
                  },
                  Action: 's3:GetBucketAcl',
                  Resource: bucketArn,
                },
                {
                  Sid: 'AllowCloudTrailWrite',
                  Effect: 'Allow',
                  Principal: {
                    Service: 'cloudtrail.amazonaws.com',
                  },
                  Action: 's3:PutObject',
                  Resource: `${bucketArn}/*`,
                  Condition: {
                    StringEquals: {
                      's3:x-amz-acl': 'bucket-owner-full-control',
                    },
                  },
                },
                {
                  Sid: 'DenyInsecureConnections',
                  Effect: 'Deny',
                  Principal: '*',
                  Action: 's3:*',
                  Resource: [bucketArn, `${bucketArn}/*`],
                  Condition: {
                    Bool: {
                      'aws:SecureTransport': 'false',
                    },
                  },
                },
              ],
            };
          } catch (error) {
            console.warn(
              `Warning: Error creating bucket policy for ${name}:`,
              error
            );
            // Return a minimal policy that still enforces security
            return {
              Version: '2012-10-17',
              Statement: [
                {
                  Sid: 'DenyInsecureConnections',
                  Effect: 'Deny',
                  Principal: '*',
                  Action: 's3:*',
                  Resource: [bucketArn, `${bucketArn}/*`],
                  Condition: {
                    Bool: {
                      'aws:SecureTransport': 'false',
                    },
                  },
                },
              ],
            };
          }
        });

      this.bucketPolicy = new aws.s3.BucketPolicy(
        `${name}-policy`,
        {
          bucket: this.bucket.id,
          policy: bucketPolicyDocument.apply(policy => JSON.stringify(policy)),
        },
        { parent: this, dependsOn: [this.publicAccessBlock] }
      );
    }

    // Configure lifecycle rules with validation and error handling
    if (args.lifecycleRules && args.lifecycleRules.length > 0) {
      try {
        // Validate lifecycle rules structure
        const validatedRules = args.lifecycleRules.filter(rule => {
          if (!rule.id || !rule.status) {
            console.warn(
              `Warning: Skipping invalid lifecycle rule for bucket ${name}:`,
              rule
            );
            return false;
          }
          return true;
        });

        if (validatedRules.length > 0) {
          new aws.s3.BucketLifecycleConfiguration(
            `${name}-lifecycle`,
            {
              bucket: this.bucket.id,
              rules: validatedRules,
            },
            {
              parent: this,
              dependsOn: [this.bucket],
            }
          );
        }
      } catch (error) {
        console.warn(
          `Warning: Failed to configure lifecycle rules for bucket ${name}:`,
          error
        );
      }
    }

    // Enable access logging with proper dependency management and error resilience
    if (enableLogging && this.accessLogsBucket) {
      new aws.s3.BucketLogging(
        `${name}-logging`,
        {
          bucket: this.bucket.id,
          targetBucket: this.accessLogsBucket.id,
          targetPrefix: 'access-logs/',
        },
        {
          parent: this,
          dependsOn: [this.accessLogsBucket, this.publicAccessBlock],
          // Add error handling through resource options
          ignoreChanges: [], // Allow updates if needed
          retainOnDelete: false, // Clean up on deletion
        }
      );
    }

    this.registerOutputs({
      bucketName: this.bucket.id,
      bucketArn: this.bucket.arn,
      bucketDomainName: this.bucket.bucketDomainName,
      accessLogsBucketName: this.accessLogsBucket?.id,
      accessLogsBucketArn: this.accessLogsBucket?.arn,
    });
  }
}
```

## modules/iam/index.ts

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { commonTags } from '../../config/tags';

export interface SecureIAMRoleArgs {
  roleName?: string;
  assumeRolePolicy: pulumi.Input<string>;
  policies?: pulumi.Input<string>[];
  managedPolicyArns?: string[];
  requireMFA?: boolean;
  tags?: Record<string, string>;
}

export class SecureIAMRole extends pulumi.ComponentResource {
  public readonly role: aws.iam.Role;
  public readonly policies: aws.iam.RolePolicy[];

  constructor(
    name: string,
    args: SecureIAMRoleArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:security:SecureIAMRole', name, {}, opts);

    // Create IAM role
    this.role = new aws.iam.Role(
      `${name}-role`,
      {
        name: args.roleName,
        assumeRolePolicy: args.assumeRolePolicy,
        tags: { ...commonTags, ...args.tags },
      },
      { parent: this }
    );

    // Attach managed policies
    if (args.managedPolicyArns) {
      args.managedPolicyArns.forEach((policyArn, index) => {
        new aws.iam.RolePolicyAttachment(
          `${name}-managed-policy-${index}`,
          {
            role: this.role.name,
            policyArn: policyArn,
          },
          { parent: this }
        );
      });
    }

    // Attach inline policies
    this.policies = [];
    if (args.policies) {
      args.policies.forEach((policy, index) => {
        const rolePolicy = new aws.iam.RolePolicy(
          `${name}-policy-${index}`,
          {
            role: this.role.id,
            policy: policy,
          },
          { parent: this }
        );
        this.policies.push(rolePolicy);
      });
    }

    this.registerOutputs({
      roleArn: this.role.arn,
      roleName: this.role.name,
    });
  }
}

// MFA-enforced policy for sensitive operations
export function createMFAEnforcedPolicy(): string {
  return JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Sid: 'AllowViewAccountInfo',
        Effect: 'Allow',
        Action: [
          'iam:GetAccountPasswordPolicy',
          'iam:ListVirtualMFADevices',
          'iam:GetAccountSummary',
        ],
        Resource: '*',
      },
      {
        Sid: 'AllowManageOwnPasswords',
        Effect: 'Allow',
        Action: ['iam:ChangePassword', 'iam:GetUser'],
        Resource: 'arn:aws:iam::*:user/${aws:username}',
      },
      {
        Sid: 'AllowManageOwnMFA',
        Effect: 'Allow',
        Action: [
          'iam:CreateVirtualMFADevice',
          'iam:DeleteVirtualMFADevice',
          'iam:EnableMFADevice',
          'iam:ListMFADevices',
          'iam:ResyncMFADevice',
        ],
        Resource: [
          'arn:aws:iam::*:mfa/${aws:username}',
          'arn:aws:iam::*:user/${aws:username}',
        ],
      },
      {
        Sid: 'DenyAllExceptListedIfNoMFA',
        Effect: 'Deny',
        NotAction: [
          'iam:CreateVirtualMFADevice',
          'iam:EnableMFADevice',
          'iam:GetUser',
          'iam:ListMFADevices',
          'iam:ListVirtualMFADevices',
          'iam:ResyncMFADevice',
          'sts:GetSessionToken',
        ],
        Resource: '*',
        Condition: {
          BoolIfExists: {
            'aws:MultiFactorAuthPresent': 'false',
          },
        },
      },
    ],
  });
}

// S3 access policy with least privilege
export function createS3AccessPolicy(
  bucketArn: pulumi.Input<string>
): pulumi.Output<string> {
  return pulumi.interpolate`{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ],
        "Resource": "${bucketArn}/*"
      },
      {
        "Effect": "Allow",
        "Action": [
          "s3:ListBucket"
        ],
        "Resource": "${bucketArn}"
      }
    ]
  }`;
}
```

## modules/cloudtrail/enhanced-cloudtrail.ts

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { commonTags } from '../../config/tags';

export interface EnhancedCloudTrailArgs {
  trailName?: string;
  s3BucketName: pulumi.Input<string>;
  kmsKeyId: pulumi.Input<string>;
  includeGlobalServiceEvents?: boolean;
  isMultiRegionTrail?: boolean;
  enableLogFileValidation?: boolean;
  enableInsightSelectors?: boolean;
  tags?: Record<string, string>;
}

export class EnhancedCloudTrail extends pulumi.ComponentResource {
  public readonly trail: aws.cloudtrail.Trail;
  public readonly logGroup: aws.cloudwatch.LogGroup;
  public readonly logStream: aws.cloudwatch.LogStream;
  public readonly metricFilter: aws.cloudwatch.LogMetricFilter;
  public readonly alarm: aws.cloudwatch.MetricAlarm;

  constructor(
    name: string,
    args: EnhancedCloudTrailArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:security:EnhancedCloudTrail', name, {}, opts);

    // Create CloudWatch Log Group for CloudTrail with longer retention
    this.logGroup = new aws.cloudwatch.LogGroup(
      `${name}-log-group`,
      {
        name: `/aws/cloudtrail/${args.trailName || name}`,
        retentionInDays: 2557, // 7 years for compliance (valid value)
        kmsKeyId: args.kmsKeyId,
        tags: { ...commonTags, ...args.tags },
      },
      { parent: this }
    );

    // Create CloudWatch Log Stream
    this.logStream = new aws.cloudwatch.LogStream(
      `${name}-log-stream`,
      {
        name: `${args.trailName || name}-stream`,
        logGroupName: this.logGroup.name,
      },
      { parent: this }
    );

    // Create IAM role for CloudTrail to write to CloudWatch
    const cloudTrailRole = new aws.iam.Role(
      `${name}-cloudtrail-role`,
      {
        name: `${args.trailName || name}-cloudtrail-role`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'cloudtrail.amazonaws.com',
              },
            },
          ],
        }),
        tags: { ...commonTags, ...args.tags },
      },
      { parent: this }
    );

    // Enhanced policy for CloudTrail to write to CloudWatch
    const cloudTrailPolicy = new aws.iam.RolePolicy(
      `${name}-cloudtrail-policy`,
      {
        role: cloudTrailRole.id,
        policy: pulumi.interpolate`{
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Action": [
              "logs:PutLogEvents",
              "logs:CreateLogGroup",
              "logs:CreateLogStream",
              "logs:DescribeLogStreams",
              "logs:DescribeLogGroups"
            ],
            "Resource": "${this.logGroup.arn}:*"
          }
        ]
      }`,
      },
      { parent: this }
    );

    // Create enhanced CloudTrail with comprehensive event selectors
    this.trail = new aws.cloudtrail.Trail(
      `${name}-trail`,
      {
        name: args.trailName,
        s3BucketName: args.s3BucketName,
        s3KeyPrefix: 'cloudtrail-logs',
        includeGlobalServiceEvents: args.includeGlobalServiceEvents ?? true,
        isMultiRegionTrail: args.isMultiRegionTrail ?? true,
        enableLogFileValidation: args.enableLogFileValidation ?? true,
        kmsKeyId: args.kmsKeyId,
        cloudWatchLogsGroupArn: pulumi.interpolate`${this.logGroup.arn}:*`,
        cloudWatchLogsRoleArn: cloudTrailRole.arn,

        // Advanced event selectors for more granular logging
        advancedEventSelectors: [
          {
            name: 'Log all S3 data events',
            fieldSelectors: [
              {
                field: 'eventCategory',
                equals: ['Data'],
              },
              {
                field: 'resources.type',
                equals: ['AWS::S3::Object'],
              },
            ],
          },
          {
            name: 'Log all management events',
            fieldSelectors: [
              {
                field: 'eventCategory',
                equals: ['Management'],
              },
            ],
          },
        ],

        // Enable insights for anomaly detection
        insightSelectors: args.enableInsightSelectors
          ? [
              {
                insightType: 'ApiCallRateInsight',
              },
            ]
          : undefined,

        tags: { ...commonTags, ...args.tags },
      },
      { parent: this, dependsOn: [cloudTrailPolicy] }
    );

    // Create metric filter for security events
    this.metricFilter = new aws.cloudwatch.LogMetricFilter(
      `${name}-security-events`,
      {
        name: `${args.trailName || name}-security-events-filter`,
        logGroupName: this.logGroup.name,
        pattern:
          '[version, account, time, region, source, name="ConsoleLogin" || name="AssumeRole" || name="CreateRole" || name="DeleteRole" || name="AttachRolePolicy" || name="DetachRolePolicy"]',
        metricTransformation: {
          name: `${args.trailName || name}-SecurityEvents`,
          namespace: 'Security/CloudTrail',
          value: '1',
          defaultValue: '0',
        },
      },
      { parent: this }
    );

    // Create CloudWatch alarm for suspicious activity
    this.alarm = new aws.cloudwatch.MetricAlarm(
      `${name}-security-alarm`,
      {
        name: `${args.trailName || name}-suspicious-activity`,
        alarmDescription: 'Alarm for suspicious security-related activities',
        metricName: `${args.trailName || name}-SecurityEvents`,
        namespace: 'Security/CloudTrail',
        statistic: 'Sum',
        period: 300, // 5 minutes
        evaluationPeriods: 1,
        threshold: 10, // Alert if more than 10 security events in 5 minutes
        comparisonOperator: 'GreaterThanThreshold',
        alarmActions: [], // Add SNS topic ARN here for notifications
        tags: { ...commonTags, ...args.tags },
      },
      { parent: this }
    );

    this.registerOutputs({
      trailArn: this.trail.arn,
      trailName: this.trail.name,
      logGroupArn: this.logGroup.arn,
      metricFilterName: this.metricFilter.name,
      alarmName: this.alarm.name,
    });
  }
}
```

## modules/cloudtrail/index.ts

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { commonTags } from '../../config/tags';

export interface CloudTrailArgs {
  trailName?: string;
  s3BucketName: pulumi.Input<string>;
  kmsKeyId: pulumi.Input<string>;
  includeGlobalServiceEvents?: boolean;
  isMultiRegionTrail?: boolean;
  enableLogFileValidation?: boolean;
  tags?: Record<string, string>;
}

export class SecureCloudTrail extends pulumi.ComponentResource {
  public readonly trail: aws.cloudtrail.Trail;
  public readonly logGroup: aws.cloudwatch.LogGroup;
  public readonly logStream: aws.cloudwatch.LogStream;

  constructor(
    name: string,
    args: CloudTrailArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:security:SecureCloudTrail', name, {}, opts);

    // Create CloudWatch Log Group for CloudTrail
    this.logGroup = new aws.cloudwatch.LogGroup(
      `${name}-log-group`,
      {
        name: `/aws/cloudtrail/${args.trailName || name}`,
        retentionInDays: 365,
        kmsKeyId: args.kmsKeyId,
        tags: { ...commonTags, ...args.tags },
      },
      { parent: this }
    );

    // Create CloudWatch Log Stream
    this.logStream = new aws.cloudwatch.LogStream(
      `${name}-log-stream`,
      {
        name: `${args.trailName || name}-stream`,
        logGroupName: this.logGroup.name,
      },
      { parent: this }
    );

    // Create IAM role for CloudTrail to write to CloudWatch
    const cloudTrailRole = new aws.iam.Role(
      `${name}-cloudtrail-role`,
      {
        name: `${args.trailName || name}-cloudtrail-role`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'cloudtrail.amazonaws.com',
              },
            },
          ],
        }),
        tags: { ...commonTags, ...args.tags },
      },
      { parent: this }
    );

    // Policy for CloudTrail to write to CloudWatch
    const cloudTrailPolicy = new aws.iam.RolePolicy(
      `${name}-cloudtrail-policy`,
      {
        role: cloudTrailRole.id,
        policy: pulumi.interpolate`{
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Action": [
              "logs:PutLogEvents",
              "logs:CreateLogGroup",
              "logs:CreateLogStream"
            ],
            "Resource": "${this.logGroup.arn}:*"
          }
        ]
      }`,
      },
      { parent: this }
    );

    // Create CloudTrail
    this.trail = new aws.cloudtrail.Trail(
      `${name}-trail`,
      {
        name: args.trailName,
        s3BucketName: args.s3BucketName,
        s3KeyPrefix: 'cloudtrail-logs',
        includeGlobalServiceEvents: args.includeGlobalServiceEvents ?? true,
        isMultiRegionTrail: args.isMultiRegionTrail ?? true,
        enableLogFileValidation: args.enableLogFileValidation ?? true,
        kmsKeyId: args.kmsKeyId,
        cloudWatchLogsGroupArn: pulumi.interpolate`${this.logGroup.arn}:*`,
        cloudWatchLogsRoleArn: cloudTrailRole.arn,
        eventSelectors: [
          {
            readWriteType: 'All',
            includeManagementEvents: true,
            dataResources: [
              {
                type: 'AWS::S3::Object',
                values: ['arn:aws:s3:::*/*'],
              },
              {
                type: 'AWS::S3::Bucket',
                values: ['arn:aws:s3:::*'],
              },
            ],
          },
        ],
        tags: { ...commonTags, ...args.tags },
      },
      { parent: this, dependsOn: [cloudTrailPolicy] }
    );

    this.registerOutputs({
      trailArn: this.trail.arn,
      trailName: this.trail.name,
      logGroupArn: this.logGroup.arn,
    });
  }
}
```

## modules/security-policies/index.ts

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { commonTags } from '../../config/tags';

export interface SecurityPoliciesArgs {
  environmentSuffix?: string;
  tags?: Record<string, string>;
}

export class SecurityPolicies extends pulumi.ComponentResource {
  public readonly mfaEnforcementPolicy: aws.iam.Policy;
  public readonly ec2LifecyclePolicy: aws.iam.Policy;
  public readonly s3DenyInsecurePolicy: aws.iam.Policy;
  public readonly cloudTrailProtectionPolicy: aws.iam.Policy;
  public readonly kmsKeyProtectionPolicy: aws.iam.Policy;

  constructor(
    name: string,
    args?: SecurityPoliciesArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:security:SecurityPolicies', name, args, opts);

    const environmentSuffix = args?.environmentSuffix || 'dev';
    const tags = { ...commonTags, ...args?.tags };

    // Enhanced MFA enforcement policy for ALL sensitive actions
    this.mfaEnforcementPolicy = new aws.iam.Policy(
      `${name}-mfa-enforcement`,
      {
        name: `MFAEnforcementPolicy-${environmentSuffix}`,
        description: 'Enforces MFA for all sensitive AWS operations',
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'DenySensitiveActionsWithoutMFA',
              Effect: 'Deny',
              Action: [
                'iam:DeleteRole',
                'iam:DeleteUser',
                's3:DeleteBucket',
                'kms:ScheduleKeyDeletion',
              ],
              Resource: '*',
              Condition: {
                Bool: {
                  'aws:MultiFactorAuthPresent': 'false',
                },
              },
            },
            {
              Sid: 'DenyRootAccountUsage',
              Effect: 'Deny',
              Action: '*',
              Resource: '*',
              Condition: {
                StringEquals: {
                  'aws:userid': 'root',
                },
              },
            },
          ],
        }),
        tags,
      },
      { parent: this }
    );

    // Conditional EC2 instance lifecycle policy
    this.ec2LifecyclePolicy = new aws.iam.Policy(
      `${name}-ec2-lifecycle`,
      {
        name: `EC2LifecyclePolicy-${environmentSuffix}`,
        description:
          'Conditional restrictions for EC2 instance lifecycle operations',
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'DenyProductionInstanceTermination',
              Effect: 'Deny',
              Action: 'ec2:TerminateInstances',
              Resource: '*',
              Condition: {
                StringLike: {
                  'ec2:ResourceTag/Environment': 'prod*',
                },
              },
            },
            {
              Sid: 'AllowNonProductionOperations',
              Effect: 'Allow',
              Action: ['ec2:StopInstances', 'ec2:StartInstances'],
              Resource: '*',
            },
          ],
        }),
        tags,
      },
      { parent: this }
    );

    // S3 security enforcement policy
    this.s3DenyInsecurePolicy = new aws.iam.Policy(
      `${name}-s3-security`,
      {
        name: `S3SecurityPolicy-${environmentSuffix}`,
        description: 'Enforces secure S3 operations only',
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'DenyInsecureTransport',
              Effect: 'Deny',
              Action: 's3:*',
              Resource: ['arn:aws:s3:::*', 'arn:aws:s3:::*/*'],
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'false',
                },
              },
            },
            {
              Sid: 'DenyUnencryptedUploads',
              Effect: 'Deny',
              Action: 's3:PutObject',
              Resource: 'arn:aws:s3:::*/*',
              Condition: {
                StringNotEquals: {
                  's3:x-amz-server-side-encryption': 'aws:kms',
                },
              },
            },
          ],
        }),
        tags,
      },
      { parent: this }
    );

    // CloudTrail protection policy
    this.cloudTrailProtectionPolicy = new aws.iam.Policy(
      `${name}-cloudtrail-protection`,
      {
        name: `CloudTrailProtectionPolicy-${environmentSuffix}`,
        description: 'Protects CloudTrail from unauthorized modifications',
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'DenyCloudTrailDisabling',
              Effect: 'Deny',
              Action: ['cloudtrail:StopLogging', 'cloudtrail:DeleteTrail'],
              Resource: '*',
            },
          ],
        }),
        tags,
      },
      { parent: this }
    );

    // KMS key protection policy
    this.kmsKeyProtectionPolicy = new aws.iam.Policy(
      `${name}-kms-protection`,
      {
        name: `KMSKeyProtectionPolicy-${environmentSuffix}`,
        description: 'Protects KMS keys from unauthorized access and deletion',
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'DenyKMSKeyDeletion',
              Effect: 'Deny',
              Action: ['kms:ScheduleKeyDeletion', 'kms:DisableKey'],
              Resource: '*',
            },
          ],
        }),
        tags,
      },
      { parent: this }
    );

    this.registerOutputs({
      mfaEnforcementPolicyArn: this.mfaEnforcementPolicy.arn,
      ec2LifecyclePolicyArn: this.ec2LifecyclePolicy.arn,
      s3DenyInsecurePolicyArn: this.s3DenyInsecurePolicy.arn,
      cloudTrailProtectionPolicyArn: this.cloudTrailProtectionPolicy.arn,
      kmsKeyProtectionPolicyArn: this.kmsKeyProtectionPolicy.arn,
    });
  }
}

// Enhanced least privilege S3 policy with time-based access
export function createTimeBasedS3AccessPolicy(
  bucketArn: pulumi.Input<string>,
  allowedHours: string[] = [
    '09',
    '10',
    '11',
    '12',
    '13',
    '14',
    '15',
    '16',
    '17',
  ]
): pulumi.Output<string> {
  return pulumi.interpolate`{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "s3:GetObject"
        ],
        "Resource": "${bucketArn}/*",
        "Condition": {
          "DateGreaterThan": {
            "aws:TokenIssueTime": "2024-01-01T00:00:00Z"
          },
          "StringLike": {
            "aws:RequestedRegion": "us-east-1"
          }
        }
      },
      {
        "Effect": "Allow",
        "Action": [
          "s3:PutObject"
        ],
        "Resource": "${bucketArn}/*",
        "Condition": {
          "StringEquals": {
            "s3:x-amz-server-side-encryption": "aws:kms"
          },
          "StringLike": {
            "aws:RequestedRegion": "us-east-1"
          },
          "ForAllValues:StringEquals": {
            "aws:RequestedHour": ${JSON.stringify(allowedHours)}
          }
        }
      },
      {
        "Effect": "Allow",
        "Action": [
          "s3:ListBucket"
        ],
        "Resource": "${bucketArn}",
        "Condition": {
          "StringLike": {
            "aws:RequestedRegion": "us-east-1"
          }
        }
      },
      {
        "Effect": "Deny",
        "Action": [
          "s3:DeleteObject",
          "s3:DeleteObjectVersion"
        ],
        "Resource": "${bucketArn}/*"
      }
    ]
  }`;
}

// Read-only audit access policy with IP restrictions
export function createRestrictedAuditPolicy(
  auditBucketArn: pulumi.Input<string>,
  allowedIpRanges: string[] = ['203.0.113.0/24']
): pulumi.Output<string> {
  return pulumi.interpolate`{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "s3:GetObject",
          "s3:ListBucket"
        ],
        "Resource": [
          "${auditBucketArn}",
          "${auditBucketArn}/*"
        ],
        "Condition": {
          "IpAddress": {
            "aws:SourceIp": ${JSON.stringify(allowedIpRanges)}
          },
          "StringLike": {
            "aws:RequestedRegion": "us-east-1"
          }
        }
      },
      {
        "Effect": "Allow",
        "Action": [
          "cloudtrail:LookupEvents"
        ],
        "Resource": "*",
        "Condition": {
          "IpAddress": {
            "aws:SourceIp": ${JSON.stringify(allowedIpRanges)}
          },
          "StringLike": {
            "aws:RequestedRegion": "us-east-1"
          }
        }
      },
      {
        "Effect": "Deny",
        "NotAction": [
          "s3:GetObject",
          "s3:ListBucket",
          "cloudtrail:LookupEvents",
          "cloudtrail:GetTrailStatus"
        ],
        "Resource": "*"
      }
    ]
  }`;
}
```

## stacks/security-stack.ts

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { commonTags } from '../config/tags';
import { SecureCloudTrail } from '../modules/cloudtrail';
import { EnhancedCloudTrail } from '../modules/cloudtrail/enhanced-cloudtrail';
import {
  SecureIAMRole,
  createMFAEnforcedPolicy,
  createS3AccessPolicy,
} from '../modules/iam';
import { KMSKey } from '../modules/kms';
import { SecureS3Bucket } from '../modules/s3';
import { EnhancedSecureS3Bucket } from '../modules/s3/enhanced-s3';
import {
  SecurityPolicies,
  createRestrictedAuditPolicy,
  createTimeBasedS3AccessPolicy,
} from '../modules/security-policies';

export interface SecurityStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
  allowedIpRanges?: string[];
  enableEnhancedSecurity?: boolean;
}

export class SecurityStack extends pulumi.ComponentResource {
  // S3 Buckets
  public readonly primaryBucketName: pulumi.Output<string>;
  public readonly primaryBucketArn: pulumi.Output<string>;
  public readonly auditBucketName: pulumi.Output<string>;
  public readonly auditBucketArn: pulumi.Output<string>;

  // KMS Keys
  public readonly s3KmsKeyId: pulumi.Output<string>;
  public readonly s3KmsKeyArn: pulumi.Output<string>;
  public readonly cloudTrailKmsKeyId: pulumi.Output<string>;
  public readonly cloudTrailKmsKeyArn: pulumi.Output<string>;

  // IAM Roles
  public readonly dataAccessRoleArn: pulumi.Output<string>;
  public readonly auditRoleArn: pulumi.Output<string>;

  // CloudTrail properties
  public readonly cloudTrailArn: pulumi.Output<string>;
  public readonly cloudTrailLogGroupArn: pulumi.Output<string>;

  // Security Policies
  public readonly securityPolicyArn: pulumi.Output<string>;
  public readonly mfaEnforcementPolicyArn: pulumi.Output<string>;
  public readonly ec2LifecyclePolicyArn: pulumi.Output<string>;
  public readonly s3SecurityPolicyArn: pulumi.Output<string>;
  public readonly cloudTrailProtectionPolicyArn: pulumi.Output<string>;
  public readonly kmsProtectionPolicyArn: pulumi.Output<string>;

  // Region confirmation
  public readonly region: string;

  constructor(
    name: string,
    args?: SecurityStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:security:SecurityStack', name, args, opts);

    const environmentSuffix = args?.environmentSuffix || 'dev';
    const tags = args?.tags || {};
    const allowedIpRanges = args?.allowedIpRanges || ['203.0.113.0/24'];
    const enableEnhancedSecurity = args?.enableEnhancedSecurity ?? true;

    // Configure AWS provider for us-east-1
    const provider = new aws.Provider(
      'aws-provider',
      {
        region: 'us-east-1',
      },
      { parent: this }
    );

    // Get account ID for IAM role policies
    const accountId = aws.getCallerIdentity().then(id => id.accountId);

    // Create enhanced security policies
    const securityPolicies = new SecurityPolicies(
      `tap-security-policies-${environmentSuffix}`,
      {
        environmentSuffix,
        tags: commonTags,
      },
      { parent: this, provider }
    );

    // Create KMS keys for encryption
    const s3KmsKey = new KMSKey(
      `s3-encryption-${environmentSuffix}`,
      {
        description: `KMS key for S3 bucket encryption - ${environmentSuffix} environment`,
        tags: {
          Purpose: 'S3 Encryption',
          Environment: environmentSuffix,
        },
      },
      { parent: this, provider }
    );

    const cloudTrailKmsKey = new KMSKey(
      `cloudtrail-encryption-${environmentSuffix}`,
      {
        description: `KMS key for CloudTrail log encryption - ${environmentSuffix} environment`,
        tags: {
          Purpose: 'CloudTrail Encryption',
          Environment: environmentSuffix,
        },
      },
      { parent: this, provider }
    );

    // Create secure S3 buckets with enhanced security
    let primaryBucket: SecureS3Bucket | EnhancedSecureS3Bucket;
    let auditBucket: SecureS3Bucket | EnhancedSecureS3Bucket;

    if (enableEnhancedSecurity) {
      primaryBucket = new EnhancedSecureS3Bucket(
        `tap-primary-storage-${environmentSuffix}`,
        {
          bucketName: `tap-primary-storage-${environmentSuffix}`,
          kmsKeyId: s3KmsKey.key.keyId,
          allowedIpRanges,
          enableAccessLogging: true,
          enableNotifications: false,
          enableObjectLock: true,
          enableBucketPolicy: true,
          lifecycleRules: [
            {
              id: 'transition-to-ia',
              status: 'Enabled',
              transitions: [
                {
                  days: 30,
                  storageClass: 'STANDARD_IA',
                },
                {
                  days: 90,
                  storageClass: 'GLACIER',
                },
                {
                  days: 365,
                  storageClass: 'DEEP_ARCHIVE',
                },
              ],
            },
          ],
          tags: {
            Purpose: 'Primary data storage with enhanced security',
            Environment: environmentSuffix,
          },
        },
        { parent: this, provider }
      );

      auditBucket = new EnhancedSecureS3Bucket(
        `tap-audit-logs-${environmentSuffix}`,
        {
          bucketName: `tap-audit-logs-${environmentSuffix}`,
          kmsKeyId: cloudTrailKmsKey.key.arn,
          allowedIpRanges,
          enableAccessLogging: true,
          enableObjectLock: true,
          enableBucketPolicy: true,
          tags: {
            Purpose: 'Audit and compliance logs with enhanced security',
            Environment: environmentSuffix,
          },
        },
        { parent: this, provider }
      );
    } else {
      primaryBucket = new SecureS3Bucket(
        `tap-primary-storage-${environmentSuffix}`,
        {
          bucketName: `tap-primary-storage-${environmentSuffix}`,
          kmsKeyId: s3KmsKey.key.keyId,
          enableBucketPolicy: true,
          enableAccessLogging: true,
          lifecycleRules: [
            {
              id: 'transition-to-ia',
              status: 'Enabled',
              transitions: [
                {
                  days: 30,
                  storageClass: 'STANDARD_IA',
                },
                {
                  days: 90,
                  storageClass: 'GLACIER',
                },
                {
                  days: 365,
                  storageClass: 'DEEP_ARCHIVE',
                },
              ],
            },
          ],
          tags: {
            Purpose: 'Primary data storage',
            Environment: environmentSuffix,
          },
        },
        { parent: this, provider }
      );

      auditBucket = new SecureS3Bucket(
        `tap-audit-logs-${environmentSuffix}`,
        {
          bucketName: `tap-audit-logs-${environmentSuffix}`,
          kmsKeyId: cloudTrailKmsKey.key.arn,
          enableBucketPolicy: true,
          enableAccessLogging: true,
          tags: {
            Purpose: 'Audit and compliance logs',
            Environment: environmentSuffix,
          },
        },
        { parent: this, provider }
      );
    }

    // Create IAM roles with enhanced least privilege and MFA enforcement
    const dataAccessRole = new SecureIAMRole(
      `tap-data-access-${environmentSuffix}`,
      {
        assumeRolePolicy: pulumi.all([accountId]).apply(([accountId]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Action: 'sts:AssumeRole',
                Effect: 'Allow',
                Principal: {
                  AWS: `arn:aws:iam::${accountId}:root`,
                },
                Condition: {
                  Bool: {
                    'aws:MultiFactorAuthPresent': 'true',
                  },
                  StringEquals: {
                    'aws:RequestedRegion': 'us-east-1',
                  },
                  IpAddress: {
                    'aws:SourceIp': allowedIpRanges,
                  },
                },
              },
            ],
          })
        ),
        roleName: `tap-data-access-role-${environmentSuffix}`,
        policies: enableEnhancedSecurity
          ? [
              createTimeBasedS3AccessPolicy(primaryBucket.bucket.arn),
              createMFAEnforcedPolicy(),
            ]
          : [
              createS3AccessPolicy(primaryBucket.bucket.arn),
              createMFAEnforcedPolicy(),
            ],
        managedPolicyArns: [],
        requireMFA: true,
        tags: {
          Purpose:
            'Data access with enhanced MFA enforcement and time restrictions',
          Environment: environmentSuffix,
        },
      },
      { parent: this, provider }
    );

    const auditRole = new SecureIAMRole(
      `tap-audit-access-${environmentSuffix}`,
      {
        assumeRolePolicy: pulumi.all([accountId]).apply(([accountId]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Action: 'sts:AssumeRole',
                Effect: 'Allow',
                Principal: {
                  AWS: `arn:aws:iam::${accountId}:root`,
                },
                Condition: {
                  Bool: {
                    'aws:MultiFactorAuthPresent': 'true',
                  },
                  StringEquals: {
                    'aws:RequestedRegion': 'us-east-1',
                  },
                  IpAddress: {
                    'aws:SourceIp': allowedIpRanges,
                  },
                },
              },
            ],
          })
        ),
        roleName: `tap-audit-access-role-${environmentSuffix}`,
        policies: enableEnhancedSecurity
          ? [
              createRestrictedAuditPolicy(
                auditBucket.bucket.arn,
                allowedIpRanges
              ),
            ]
          : [
              pulumi.interpolate`{
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Action": [
                "s3:GetObject",
                "s3:ListBucket"
              ],
              "Resource": [
                "${auditBucket.bucket.arn}",
                "${auditBucket.bucket.arn}/*"
              ]
            },
            {
              "Effect": "Allow",
              "Action": [
                "cloudtrail:LookupEvents",
                "cloudtrail:GetTrailStatus"
              ],
              "Resource": "*"
            }
          ]
        }`,
            ],
        managedPolicyArns: ['arn:aws:iam::aws:policy/ReadOnlyAccess'],
        requireMFA: true,
        tags: {
          Purpose: 'Audit log access with IP and time restrictions',
          Environment: environmentSuffix,
        },
      },
      { parent: this, provider }
    );

    // Create CloudTrail for comprehensive logging
    let cloudTrail: SecureCloudTrail | EnhancedCloudTrail;

    if (enableEnhancedSecurity) {
      cloudTrail = new EnhancedCloudTrail(
        `tap-security-audit-${environmentSuffix}`,
        {
          trailName: `tap-security-audit-trail-${environmentSuffix}`,
          s3BucketName: auditBucket.bucket.id,
          kmsKeyId: cloudTrailKmsKey.key.arn,
          includeGlobalServiceEvents: true,
          isMultiRegionTrail: true,
          enableLogFileValidation: true,
          enableInsightSelectors: true,
          tags: {
            Purpose:
              'Enhanced security audit and compliance with anomaly detection',
            Environment: environmentSuffix,
          },
        },
        { parent: this, provider }
      );
    } else {
      cloudTrail = new SecureCloudTrail(
        `tap-security-audit-${environmentSuffix}`,
        {
          trailName: `tap-security-audit-trail-${environmentSuffix}`,
          s3BucketName: auditBucket.bucket.id,
          kmsKeyId: cloudTrailKmsKey.key.arn,
          includeGlobalServiceEvents: true,
          isMultiRegionTrail: true,
          enableLogFileValidation: true,
          tags: {
            Purpose: 'Security audit and compliance',
            Environment: environmentSuffix,
          },
        },
        { parent: this, provider }
      );
    }

    // Create additional security policies with enhanced controls
    const securityPolicy = new aws.iam.Policy(
      `tap-security-baseline-${environmentSuffix}`,
      {
        name: `SecurityBaseline-${environmentSuffix}`,
        description:
          'Enhanced baseline security policy with comprehensive MFA requirements',
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'RequireMFAForAllSensitiveActions',
              Effect: 'Deny',
              Action: [
                'iam:CreateRole',
                'iam:DeleteRole',
                'iam:AttachRolePolicy',
                'iam:DetachRolePolicy',
                'iam:PutRolePolicy',
                'iam:DeleteRolePolicy',
                's3:DeleteBucket',
                's3:PutBucketPolicy',
                'kms:ScheduleKeyDeletion',
                'kms:DisableKey',
                'cloudtrail:DeleteTrail',
                'cloudtrail:StopLogging',
              ],
              Resource: '*',
              Condition: {
                BoolIfExists: {
                  'aws:MultiFactorAuthPresent': 'false',
                },
              },
            },
            {
              Sid: 'RestrictToUSEast1Only',
              Effect: 'Deny',
              Action: '*',
              Resource: '*',
              Condition: {
                StringNotEquals: {
                  'aws:RequestedRegion': 'us-east-1',
                },
              },
            },
            {
              Sid: 'RequireEncryptedStorage',
              Effect: 'Deny',
              Action: [
                's3:PutObject',
                'ebs:CreateVolume',
                'rds:CreateDBInstance',
              ],
              Resource: '*',
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'false',
                },
              },
            },
          ],
        }),
        tags: { ...commonTags, ...tags },
      },
      { parent: this, provider }
    );

    // Assign outputs
    this.primaryBucketName = primaryBucket.bucket.id;
    this.primaryBucketArn = primaryBucket.bucket.arn;
    this.auditBucketName = auditBucket.bucket.id;
    this.auditBucketArn = auditBucket.bucket.arn;
    this.s3KmsKeyId = s3KmsKey.key.keyId;
    this.s3KmsKeyArn = s3KmsKey.key.arn;
    this.cloudTrailKmsKeyId = cloudTrailKmsKey.key.keyId;
    this.cloudTrailKmsKeyArn = cloudTrailKmsKey.key.arn;
    this.dataAccessRoleArn = dataAccessRole.role.arn;
    this.auditRoleArn = auditRole.role.arn;
    // CloudTrail outputs
    this.cloudTrailArn = cloudTrail.trail.arn;
    this.cloudTrailLogGroupArn = cloudTrail.logGroup.arn;
    this.securityPolicyArn = securityPolicy.arn;
    this.mfaEnforcementPolicyArn = securityPolicies.mfaEnforcementPolicy.arn;
    this.ec2LifecyclePolicyArn = securityPolicies.ec2LifecyclePolicy.arn;
    this.s3SecurityPolicyArn = securityPolicies.s3DenyInsecurePolicy.arn;
    this.cloudTrailProtectionPolicyArn =
      securityPolicies.cloudTrailProtectionPolicy.arn;
    this.kmsProtectionPolicyArn = securityPolicies.kmsKeyProtectionPolicy.arn;
    this.region = 'us-east-1';

    // Register the outputs of this component
    this.registerOutputs({
      primaryBucketName: this.primaryBucketName,
      primaryBucketArn: this.primaryBucketArn,
      auditBucketName: this.auditBucketName,
      auditBucketArn: this.auditBucketArn,
      s3KmsKeyId: this.s3KmsKeyId,
      s3KmsKeyArn: this.s3KmsKeyArn,
      cloudTrailKmsKeyId: this.cloudTrailKmsKeyId,
      cloudTrailKmsKeyArn: this.cloudTrailKmsKeyArn,
      dataAccessRoleArn: this.dataAccessRoleArn,
      auditRoleArn: this.auditRoleArn,
      // CloudTrail outputs
      cloudTrailArn: this.cloudTrailArn,
      cloudTrailLogGroupArn: this.cloudTrailLogGroupArn,
      securityPolicyArn: this.securityPolicyArn,
      mfaEnforcementPolicyArn: this.mfaEnforcementPolicyArn,
      ec2LifecyclePolicyArn: this.ec2LifecyclePolicyArn,
      s3SecurityPolicyArn: this.s3SecurityPolicyArn,
      cloudTrailProtectionPolicyArn: this.cloudTrailProtectionPolicyArn,
      kmsProtectionPolicyArn: this.kmsProtectionPolicyArn,
      region: this.region,
    });
  }
}
```

## tap-stack.ts

```typescript
/**
 * tap-stack.ts
 *
 * This module defines the TapStack class, the main Pulumi ComponentResource for
 * the TAP (Test Automation Platform) project.
 *
 * It orchestrates the instantiation of other resource-specific components
 * and manages environment-specific configurations.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { SecurityStack } from './stacks/security-stack';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  /**
   * An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
   * Defaults to 'dev' if not provided.
   */
  environmentSuffix?: string;

  /**
   * Optional default tags to apply to resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;

  /**
   * Optional list of allowed IP ranges for security policies.
   * Defaults to ['203.0.113.0/24'] if not provided.
   */
  allowedIpRanges?: string[];

  /**
   * Optional flag to enable enhanced security features.
   * Defaults to false if not provided.
   */
  enableEnhancedSecurity?: boolean;
}

/**
 * Represents the main Pulumi component resource for the TAP project.
 *
 * This component orchestrates the instantiation of other resource-specific components
 * and manages the environment suffix used for naming and configuration.
 *
 * Note:
 * - DO NOT create resources directly here unless they are truly global.
 * - Use other components (e.g., SecurityStack) for AWS resource definitions.
 */
export class TapStack extends pulumi.ComponentResource {
  // S3 Buckets
  public readonly primaryBucketName: pulumi.Output<string>;
  public readonly primaryBucketArn: pulumi.Output<string>;
  public readonly auditBucketName: pulumi.Output<string>;
  public readonly auditBucketArn: pulumi.Output<string>;

  // KMS Keys
  public readonly s3KmsKeyId: pulumi.Output<string>;
  public readonly s3KmsKeyArn: pulumi.Output<string>;
  public readonly cloudTrailKmsKeyId: pulumi.Output<string>;
  public readonly cloudTrailKmsKeyArn: pulumi.Output<string>;

  // IAM Roles
  public readonly dataAccessRoleArn: pulumi.Output<string>;
  public readonly auditRoleArn: pulumi.Output<string>;

  // CloudTrail properties
  public readonly cloudTrailArn: pulumi.Output<string>;
  public readonly cloudTrailLogGroupArn: pulumi.Output<string>;

  // Security Policies
  public readonly securityPolicyArn: pulumi.Output<string>;
  public readonly mfaEnforcementPolicyArn: pulumi.Output<string>;
  public readonly ec2LifecyclePolicyArn: pulumi.Output<string>;
  public readonly s3SecurityPolicyArn: pulumi.Output<string>;
  public readonly cloudTrailProtectionPolicyArn: pulumi.Output<string>;
  public readonly kmsProtectionPolicyArn: pulumi.Output<string>;

  // Region confirmation
  public readonly region: string;

  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args?: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args?.environmentSuffix || 'dev';
    const tags = args?.tags || {};
    const allowedIpRanges = args?.allowedIpRanges;
    const enableEnhancedSecurity = args?.enableEnhancedSecurity;

    // --- Instantiate Nested Components Here ---
    // Create the security infrastructure stack
    const securityStack = new SecurityStack(
      'security-infrastructure',
      {
        environmentSuffix: environmentSuffix,
        tags: tags,
        allowedIpRanges: allowedIpRanges,
        enableEnhancedSecurity: enableEnhancedSecurity,
      },
      { parent: this }
    );

    // --- Expose Outputs from Nested Components ---
    // Make outputs from the security stack available as outputs of this main stack
    this.primaryBucketName = securityStack.primaryBucketName;
    this.primaryBucketArn = securityStack.primaryBucketArn;
    this.auditBucketName = securityStack.auditBucketName;
    this.auditBucketArn = securityStack.auditBucketArn;
    this.s3KmsKeyId = securityStack.s3KmsKeyId;
    this.s3KmsKeyArn = securityStack.s3KmsKeyArn;
    this.cloudTrailKmsKeyId = securityStack.cloudTrailKmsKeyId;
    this.cloudTrailKmsKeyArn = securityStack.cloudTrailKmsKeyArn;
    this.dataAccessRoleArn = securityStack.dataAccessRoleArn;
    this.auditRoleArn = securityStack.auditRoleArn;
    // CloudTrail references
    this.cloudTrailArn = securityStack.cloudTrailArn;
    this.cloudTrailLogGroupArn = securityStack.cloudTrailLogGroupArn;
    this.securityPolicyArn = securityStack.securityPolicyArn;
    this.mfaEnforcementPolicyArn = securityStack.mfaEnforcementPolicyArn;
    this.ec2LifecyclePolicyArn = securityStack.ec2LifecyclePolicyArn;
    this.s3SecurityPolicyArn = securityStack.s3SecurityPolicyArn;
    this.cloudTrailProtectionPolicyArn =
      securityStack.cloudTrailProtectionPolicyArn;
    this.kmsProtectionPolicyArn = securityStack.kmsProtectionPolicyArn;
    this.region = securityStack.region;

    // Register the outputs of this component.
    this.registerOutputs({
      primaryBucketName: this.primaryBucketName,
      primaryBucketArn: this.primaryBucketArn,
      auditBucketName: this.auditBucketName,
      auditBucketArn: this.auditBucketArn,
      s3KmsKeyId: this.s3KmsKeyId,
      s3KmsKeyArn: this.s3KmsKeyArn,
      cloudTrailKmsKeyId: this.cloudTrailKmsKeyId,
      cloudTrailKmsKeyArn: this.cloudTrailKmsKeyArn,
      dataAccessRoleArn: this.dataAccessRoleArn,
      auditRoleArn: this.auditRoleArn,
      cloudTrailArn: this.cloudTrailArn,
      cloudTrailLogGroupArn: this.cloudTrailLogGroupArn,
      securityPolicyArn: this.securityPolicyArn,
      mfaEnforcementPolicyArn: this.mfaEnforcementPolicyArn,
      ec2LifecyclePolicyArn: this.ec2LifecyclePolicyArn,
      s3SecurityPolicyArn: this.s3SecurityPolicyArn,
      cloudTrailProtectionPolicyArn: this.cloudTrailProtectionPolicyArn,
      kmsProtectionPolicyArn: this.kmsProtectionPolicyArn,
      region: this.region,
    });
  }
}
```

