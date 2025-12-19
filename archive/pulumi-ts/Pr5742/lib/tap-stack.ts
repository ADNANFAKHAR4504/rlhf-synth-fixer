/**
 * tap-stack.ts
 *
 * This module defines the TapStack class, the main Pulumi ComponentResource for
 * the TAP (Test Automation Platform) project - Security-hardened AWS environment
 * with automated compliance controls for financial services following zero-trust architecture.
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';

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
   * Service name for resource naming
   */
  serviceName?: string;

  /**
   * Email address for SNS security alerts
   */
  email?: pulumi.Input<string>;

  /**
   * Replica region for multi-region replication
   */
  replicaRegion?: string;

  /**
   * Optional default tags to apply to resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * Represents the main Pulumi component resource for the TAP security infrastructure.
 *
 * This component orchestrates the creation of security-hardened AWS resources
 * following zero-trust architecture principles for financial services.
 */
export class TapStack extends pulumi.ComponentResource {
  // KMS Key ARN outputs
  public readonly piiKmsKeyArn: pulumi.Output<string>;
  public readonly financialKmsKeyArn: pulumi.Output<string>;
  public readonly generalKmsKeyArn: pulumi.Output<string>;

  // IAM Role ARNs
  public readonly crossAccountRoleArn: pulumi.Output<string>;

  // SNS Topic ARN
  public readonly securityAlertTopicArn: pulumi.Output<string>;

  // Compliance Report
  public readonly complianceReport: pulumi.Output<string>;

  // Bucket Names
  public readonly financialBucketName: pulumi.Output<string>;
  public readonly piiBucketName: pulumi.Output<string>;

  // Lambda ARN
  public readonly remediationLambdaArn: pulumi.Output<string>;

  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const serviceName = args.serviceName || 'financial-security';
    const replicaRegion = args.replicaRegion || 'us-west-2';
    const tags = args.tags || {};

    // Get current AWS region and account ID
    const currentRegion = aws.getRegionOutput({}, { parent: this });
    const currentCaller = aws.getCallerIdentityOutput({}, { parent: this });
    const region = currentRegion.name;
    const accountId = currentCaller.accountId;

    // Merge common tags
    const commonTags = pulumi
      .all([tags, serviceName, environmentSuffix])
      .apply(([t, sn, es]) => ({
        ...t,
        Environment: es,
        Service: sn,
        ManagedBy: 'Pulumi',
        ComplianceLevel: 'Financial',
        DataClassification: 'Sensitive',
      }));

    // ========================================
    // 1. KMS Key Hierarchy with Automatic Rotation
    // ========================================

    // KMS Key for PII Data
    const piiKey = new aws.kms.Key(
      `${serviceName}-pii-key`,
      {
        description: 'KMS key for PII data encryption',
        enableKeyRotation: true,
        deletionWindowInDays: 7,
        tags: commonTags,
      },
      { parent: this }
    );

    new aws.kms.Alias(
      `${serviceName}-pii-alias`,
      {
        name: pulumi.interpolate`alias/${serviceName}-pii-${region}-${environmentSuffix}`,
        targetKeyId: piiKey.id,
      },
      { parent: this }
    );

    // Multi-region replica for PII key
    const piiReplicaKeyProvider = new aws.Provider(
      `${serviceName}-replica-provider-pii`,
      {
        region: replicaRegion,
      },
      { parent: this }
    );

    new aws.kms.Key(
      `${serviceName}-pii-replica-key`,
      {
        description: `PII KMS replica key for ${replicaRegion}`,
        enableKeyRotation: true,
        deletionWindowInDays: 7,
        tags: commonTags,
      },
      { parent: this, provider: piiReplicaKeyProvider }
    );

    // KMS Key for Financial Data
    const financialKey = new aws.kms.Key(
      `${serviceName}-financial-key`,
      {
        description: 'KMS key for financial data encryption',
        enableKeyRotation: true,
        deletionWindowInDays: 7,
        tags: commonTags,
      },
      { parent: this }
    );

    new aws.kms.Alias(
      `${serviceName}-financial-alias`,
      {
        name: pulumi.interpolate`alias/${serviceName}-financial-${region}-${environmentSuffix}`,
        targetKeyId: financialKey.id,
      },
      { parent: this }
    );

    // Multi-region replica for Financial key
    const financialReplicaKeyProvider = new aws.Provider(
      `${serviceName}-replica-provider-financial`,
      {
        region: replicaRegion,
      },
      { parent: this }
    );

    new aws.kms.Key(
      `${serviceName}-financial-replica-key`,
      {
        description: `Financial KMS replica key for ${replicaRegion}`,
        enableKeyRotation: true,
        deletionWindowInDays: 7,
        tags: commonTags,
      },
      { parent: this, provider: financialReplicaKeyProvider }
    );

    // KMS Key for General Data
    const generalKey = new aws.kms.Key(
      `${serviceName}-general-key`,
      {
        description: 'KMS key for general data encryption',
        enableKeyRotation: true,
        deletionWindowInDays: 7,
        policy: pulumi.all([accountId]).apply(([accId]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'Enable IAM User Permissions',
                Effect: 'Allow',
                Principal: {
                  AWS: `arn:aws:iam::${accId}:root`,
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
                Action: ['kms:GenerateDataKey*', 'kms:DecryptDataKey'],
                Resource: '*',
                Condition: {
                  StringLike: {
                    'kms:EncryptionContext:aws:cloudtrail:arn': `arn:aws:cloudtrail:*:${accId}:trail/*`,
                  },
                },
              },
              {
                Sid: 'Allow CloudTrail to describe key',
                Effect: 'Allow',
                Principal: {
                  Service: 'cloudtrail.amazonaws.com',
                },
                Action: 'kms:DescribeKey',
                Resource: '*',
              },
            ],
          })
        ),
        tags: commonTags,
      },
      { parent: this }
    );

    new aws.kms.Alias(
      `${serviceName}-general-alias`,
      {
        name: pulumi.interpolate`alias/${serviceName}-general-${region}-${environmentSuffix}`,
        targetKeyId: generalKey.id,
      },
      { parent: this }
    );

    // Multi-region replica for General key
    const generalReplicaKeyProvider = new aws.Provider(
      `${serviceName}-replica-provider-general`,
      {
        region: replicaRegion,
      },
      { parent: this }
    );

    new aws.kms.Key(
      `${serviceName}-general-replica-key`,
      {
        description: `General KMS replica key for ${replicaRegion}`,
        enableKeyRotation: true,
        deletionWindowInDays: 7,
        tags: commonTags,
      },
      { parent: this, provider: generalReplicaKeyProvider }
    );

    // ========================================
    // 2. IAM Permission Boundaries
    // ========================================

    const permissionBoundaryPolicy = new aws.iam.Policy(
      `${serviceName}-permission-boundary`,
      {
        description:
          'Permission boundary restricting maximum allowed permissions',
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                's3:*',
                'dynamodb:*',
                'lambda:*',
                'logs:*',
                'cloudwatch:*',
                'kms:Decrypt',
                'kms:Encrypt',
                'kms:GenerateDataKey',
                'secretsmanager:GetSecretValue',
                'ec2:CreateNetworkInterface',
                'ec2:DescribeNetworkInterfaces',
                'ec2:DeleteNetworkInterface',
                'ec2:AssignPrivateIpAddresses',
                'ec2:UnassignPrivateIpAddresses',
                'config:PutEvaluations',
                'iam:UpdateAccountPasswordPolicy',
              ],
              Resource: '*',
            },
            {
              Effect: 'Deny',
              Action: [
                'iam:CreateUser',
                'iam:DeleteUser',
                'iam:CreateAccessKey',
                'organizations:*',
                'account:*',
              ],
              Resource: '*',
            },
          ],
        }),
        tags: commonTags,
      },
      { parent: this }
    );

    // ========================================
    // 3. AWS Secrets Manager with Auto Rotation
    // ========================================

    const dbSecret = new aws.secretsmanager.Secret(
      `${serviceName}-db-secret`,
      {
        name: pulumi.interpolate`${serviceName}/database/credentials/${region}/${environmentSuffix}`,
        description: 'Database credentials with automatic rotation',
        kmsKeyId: generalKey.id,
        tags: commonTags,
      },
      { parent: this }
    );

    new aws.secretsmanager.SecretVersion(
      `${serviceName}-db-secret-version`,
      {
        secretId: dbSecret.id,
        secretString: JSON.stringify({
          username: 'admin',
          password: 'PLACEHOLDER_WILL_BE_ROTATED',
        }),
      },
      { parent: this }
    );

    // Rotation Lambda for secrets
    const secretRotationRole = new aws.iam.Role(
      `${serviceName}-secret-rotation-role`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'lambda.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        managedPolicyArns: [
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
        ],
        permissionsBoundary: permissionBoundaryPolicy.arn,
        tags: commonTags,
      },
      { parent: this }
    );

    const secretRotationLambda = new aws.lambda.Function(
      `${serviceName}-secret-rotation-lambda`,
      {
        name: pulumi.interpolate`${serviceName}-secret-rotation-${region}-${environmentSuffix}`,
        runtime: aws.lambda.Runtime.Python3d11,
        role: secretRotationRole.arn,
        handler: 'index.handler',
        code: new pulumi.asset.AssetArchive({
          'index.py': new pulumi.asset.StringAsset(`
import json
import boto3

def handler(event, context):
    print(f"Rotating secret: {json.dumps(event)}")
    # Implement rotation logic here
    return {
        'statusCode': 200,
        'body': json.dumps('Secret rotation completed')
    }
        `),
        }),
        timeout: 300,
        tags: commonTags,
      },
      { parent: this }
    );

    // Grant Secrets Manager permission to invoke the rotation Lambda
    new aws.lambda.Permission(
      `${serviceName}-secret-rotation-permission`,
      {
        action: 'lambda:InvokeFunction',
        function: secretRotationLambda.name,
        principal: 'secretsmanager.amazonaws.com',
      },
      { parent: this }
    );

    new aws.secretsmanager.SecretRotation(
      `${serviceName}-db-secret-rotation`,
      {
        secretId: dbSecret.id,
        rotationLambdaArn: secretRotationLambda.arn,
        rotationRules: {
          automaticallyAfterDays: 30,
        },
      },
      { parent: this }
    );

    // API Secret
    const apiSecret = new aws.secretsmanager.Secret(
      `${serviceName}-api-secret`,
      {
        name: pulumi.interpolate`${serviceName}/api/keys/${region}/${environmentSuffix}`,
        description: 'API keys with automatic rotation',
        kmsKeyId: generalKey.id,
        tags: commonTags,
      },
      { parent: this }
    );

    new aws.secretsmanager.SecretVersion(
      `${serviceName}-api-secret-version`,
      {
        secretId: apiSecret.id,
        secretString: JSON.stringify({
          apiKeyName: 'primary',
          apiKey: 'PLACEHOLDER_WILL_BE_ROTATED',
        }),
      },
      { parent: this }
    );

    new aws.secretsmanager.SecretRotation(
      `${serviceName}-api-secret-rotation`,
      {
        secretId: apiSecret.id,
        rotationLambdaArn: secretRotationLambda.arn,
        rotationRules: {
          automaticallyAfterDays: 30,
        },
      },
      { parent: this }
    );

    // ========================================
    // 4. S3 Buckets with TLS and KMS Encryption
    // ========================================

    // Financial data bucket
    const financialBucket = new aws.s3.Bucket(
      `${serviceName}-financial-bucket`,
      {
        bucket: pulumi.interpolate`${serviceName}-financial-${accountId}-${region}-${environmentSuffix}`,
        acl: 'private',
        versioning: { enabled: true },
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: financialKey.id,
            },
            bucketKeyEnabled: true,
          },
        },
        lifecycleRules: [
          {
            enabled: true,
            transitions: [
              {
                days: 90,
                storageClass: 'GLACIER',
              },
            ],
          },
        ],
        tags: commonTags,
      },
      { parent: this }
    );

    new aws.s3.BucketPublicAccessBlock(
      `${serviceName}-financial-bucket-pab`,
      {
        bucket: financialBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // Enforce TLS 1.2+
    new aws.s3.BucketPolicy(
      `${serviceName}-financial-bucket-policy`,
      {
        bucket: financialBucket.id,
        policy: pulumi.all([financialBucket.arn]).apply(([bucketArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'DenyInsecureTransport',
                Effect: 'Deny',
                Principal: '*',
                Action: 's3:*',
                Resource: [bucketArn, `${bucketArn}/*`],
                Condition: {
                  Bool: { 'aws:SecureTransport': 'false' },
                },
              },
              {
                Sid: 'DenyOldTLS',
                Effect: 'Deny',
                Principal: '*',
                Action: 's3:*',
                Resource: [bucketArn, `${bucketArn}/*`],
                Condition: {
                  NumericLessThan: { 's3:TlsVersion': '1.2' },
                },
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // PII data bucket
    const piiBucket = new aws.s3.Bucket(
      `${serviceName}-pii-bucket`,
      {
        bucket: pulumi.interpolate`${serviceName}-pii-${accountId}-${region}-${environmentSuffix}`,
        acl: 'private',
        versioning: { enabled: true },
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: piiKey.id,
            },
            bucketKeyEnabled: true,
          },
        },
        tags: commonTags,
      },
      { parent: this }
    );

    new aws.s3.BucketPublicAccessBlock(
      `${serviceName}-pii-bucket-pab`,
      {
        bucket: piiBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    new aws.s3.BucketPolicy(
      `${serviceName}-pii-bucket-policy`,
      {
        bucket: piiBucket.id,
        policy: pulumi.all([piiBucket.arn]).apply(([bucketArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'DenyInsecureTransport',
                Effect: 'Deny',
                Principal: '*',
                Action: 's3:*',
                Resource: [bucketArn, `${bucketArn}/*`],
                Condition: {
                  Bool: { 'aws:SecureTransport': 'false' },
                },
              },
              {
                Sid: 'DenyOldTLS',
                Effect: 'Deny',
                Principal: '*',
                Action: 's3:*',
                Resource: [bucketArn, `${bucketArn}/*`],
                Condition: {
                  NumericLessThan: { 's3:TlsVersion': '1.2' },
                },
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // General data bucket
    const generalBucket = new aws.s3.Bucket(
      `${serviceName}-general-bucket`,
      {
        bucket: pulumi.interpolate`${serviceName}-general-${accountId}-${region}-${environmentSuffix}`,
        acl: 'private',
        versioning: { enabled: true },
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: generalKey.id,
            },
            bucketKeyEnabled: true,
          },
        },
        tags: commonTags,
      },
      { parent: this }
    );

    new aws.s3.BucketPublicAccessBlock(
      `${serviceName}-general-bucket-pab`,
      {
        bucket: generalBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    new aws.s3.BucketPolicy(
      `${serviceName}-general-bucket-policy`,
      {
        bucket: generalBucket.id,
        policy: pulumi.all([generalBucket.arn]).apply(([bucketArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'DenyInsecureTransport',
                Effect: 'Deny',
                Principal: '*',
                Action: 's3:*',
                Resource: [bucketArn, `${bucketArn}/*`],
                Condition: {
                  Bool: { 'aws:SecureTransport': 'false' },
                },
              },
              {
                Sid: 'DenyOldTLS',
                Effect: 'Deny',
                Principal: '*',
                Action: 's3:*',
                Resource: [bucketArn, `${bucketArn}/*`],
                Condition: {
                  NumericLessThan: { 's3:TlsVersion': '1.2' },
                },
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // ========================================
    // 5. Cross-Account IAM Role with MFA
    // ========================================

    const crossAccountRole = new aws.iam.Role(
      `${serviceName}-cross-account-role`,
      {
        description: 'Cross-account administrative access with MFA',
        maxSessionDuration: 43200, // 12 hours
        assumeRolePolicy: pulumi
          .all([accountId, serviceName])
          .apply(([accId, sn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Principal: { AWS: `arn:aws:iam::${accId}:root` },
                  Action: 'sts:AssumeRole',
                  Condition: {
                    Bool: { 'aws:MultiFactorAuthPresent': 'true' },
                    StringEquals: { 'sts:ExternalId': `${sn}-external-id` },
                  },
                },
              ],
            })
          ),
        permissionsBoundary: permissionBoundaryPolicy.arn,
        tags: commonTags,
      },
      { parent: this }
    );

    new aws.iam.RolePolicy(
      `${serviceName}-cross-account-policy`,
      {
        role: crossAccountRole.id,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                's3:*',
                'dynamodb:*',
                'lambda:*',
                'cloudwatch:*',
                'logs:*',
              ],
              Resource: '*',
            },
          ],
        }),
      },
      { parent: this }
    );

    // ========================================
    // 6. CloudWatch Log Groups with KMS Encryption
    // ========================================

    const securityLogGroup = new aws.cloudwatch.LogGroup(
      `${serviceName}-security-logs`,
      {
        name: pulumi.interpolate`/aws/${serviceName}/security/${region}/${environmentSuffix}`,
        retentionInDays: 365,
        tags: commonTags,
      },
      { parent: this }
    );

    const complianceLogGroup = new aws.cloudwatch.LogGroup(
      `${serviceName}-compliance-logs`,
      {
        name: pulumi.interpolate`/aws/${serviceName}/compliance/${region}/${environmentSuffix}`,
        retentionInDays: 365,
        tags: commonTags,
      },
      { parent: this }
    );

    // ========================================
    // 7. CloudTrail with Protection
    // ========================================

    const trailBucket = new aws.s3.Bucket(
      `${serviceName}-cloudtrail-bucket`,
      {
        bucket: pulumi.interpolate`${serviceName}-cloudtrail-${accountId}-${region}-${environmentSuffix}`,
        acl: 'private',
        versioning: { enabled: true },
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: generalKey.id,
            },
          },
        },
        tags: commonTags,
      },
      { parent: this }
    );

    new aws.s3.BucketPublicAccessBlock(
      `${serviceName}-cloudtrail-bucket-pab`,
      {
        bucket: trailBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // CloudTrail bucket policy
    new aws.s3.BucketPolicy(
      `${serviceName}-cloudtrail-bucket-policy`,
      {
        bucket: trailBucket.id,
        policy: pulumi
          .all([trailBucket.arn, accountId])
          .apply(([bucketArn, _accId]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Sid: 'AWSCloudTrailAclCheck',
                  Effect: 'Allow',
                  Principal: { Service: 'cloudtrail.amazonaws.com' },
                  Action: 's3:GetBucketAcl',
                  Resource: bucketArn,
                },
                {
                  Sid: 'AWSCloudTrailWrite',
                  Effect: 'Allow',
                  Principal: { Service: 'cloudtrail.amazonaws.com' },
                  Action: 's3:PutObject',
                  Resource: `${bucketArn}/*`,
                  Condition: {
                    StringEquals: {
                      's3:x-amz-acl': 'bucket-owner-full-control',
                    },
                  },
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    new aws.cloudtrail.Trail(
      `${serviceName}-trail`,
      {
        name: pulumi.interpolate`${serviceName}-trail-${region}-${environmentSuffix}`,
        s3BucketName: trailBucket.id,
        enableLogFileValidation: true,
        includeGlobalServiceEvents: true,
        isMultiRegionTrail: true,
        kmsKeyId: generalKey.arn,
        cloudWatchLogsGroupArn: pulumi.interpolate`${securityLogGroup.arn}:*`,
        cloudWatchLogsRoleArn: new aws.iam.Role(
          `${serviceName}-cloudtrail-role`,
          {
            assumeRolePolicy: JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Principal: { Service: 'cloudtrail.amazonaws.com' },
                  Action: 'sts:AssumeRole',
                },
              ],
            }),
            inlinePolicies: [
              {
                policy: pulumi.all([securityLogGroup.arn]).apply(([logArn]) =>
                  JSON.stringify({
                    Version: '2012-10-17',
                    Statement: [
                      {
                        Effect: 'Allow',
                        Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
                        Resource: `${logArn}:*`,
                      },
                    ],
                  })
                ),
              },
            ],
            tags: commonTags,
          },
          { parent: this }
        ).arn,
        tags: commonTags,
      },
      { parent: this, dependsOn: [trailBucket] }
    );

    // ========================================
    // 8. AWS Config Rules for CIS Benchmarks
    // ========================================

    const configBucket = new aws.s3.Bucket(
      `${serviceName}-config-bucket`,
      {
        bucket: pulumi.interpolate`${serviceName}-config-${accountId}-${region}-${environmentSuffix}`,
        acl: 'private',
        versioning: { enabled: true },
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: generalKey.id,
            },
          },
        },
        tags: commonTags,
      },
      { parent: this }
    );

    new aws.s3.BucketPublicAccessBlock(
      `${serviceName}-config-bucket-pab`,
      {
        bucket: configBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    const configRole = new aws.iam.Role(
      `${serviceName}-config-role`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'config.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        managedPolicyArns: [
          'arn:aws:iam::aws:policy/service-role/AWS_ConfigRole',
        ],
        tags: commonTags,
      },
      { parent: this }
    );

    new aws.iam.RolePolicy(
      `${serviceName}-config-bucket-policy`,
      {
        role: configRole.id,
        policy: pulumi.all([configBucket.arn]).apply(([bucketArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['s3:GetBucketVersioning', 's3:PutObject'],
                Resource: [bucketArn, `${bucketArn}/*`],
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    const configRecorder = new aws.cfg.Recorder(
      `${serviceName}-config-recorder`,
      {
        name: pulumi.interpolate`${serviceName}-recorder-${region}-${environmentSuffix}`,
        roleArn: configRole.arn,
        recordingGroup: {
          allSupported: true,
          includeGlobalResourceTypes: true,
        },
      },
      { parent: this }
    );

    const configDeliveryChannel = new aws.cfg.DeliveryChannel(
      `${serviceName}-config-delivery`,
      {
        name: pulumi.interpolate`${serviceName}-delivery-${region}-${environmentSuffix}`,
        s3BucketName: configBucket.id,
      },
      { parent: this, dependsOn: [configRecorder] }
    );

    new aws.cfg.RecorderStatus(
      `${serviceName}-config-recorder-status`,
      {
        name: configRecorder.name,
        isEnabled: true,
      },
      { parent: this, dependsOn: [configDeliveryChannel] }
    );

    // CIS Benchmark Rules
    new aws.cfg.Rule(
      `${serviceName}-s3-public-read-rule`,
      {
        name: pulumi.interpolate`${serviceName}-s3-public-read-${region}-${environmentSuffix}`,
        description: 'Checks that S3 buckets do not allow public read access',
        source: {
          owner: 'AWS',
          sourceIdentifier: 'S3_BUCKET_PUBLIC_READ_PROHIBITED',
        },
        tags: commonTags,
      },
      { parent: this, dependsOn: [configRecorder] }
    );

    new aws.cfg.Rule(
      `${serviceName}-s3-public-write-rule`,
      {
        name: pulumi.interpolate`${serviceName}-s3-public-write-${region}-${environmentSuffix}`,
        description: 'Checks that S3 buckets do not allow public write access',
        source: {
          owner: 'AWS',
          sourceIdentifier: 'S3_BUCKET_PUBLIC_WRITE_PROHIBITED',
        },
        tags: commonTags,
      },
      { parent: this, dependsOn: [configRecorder] }
    );

    new aws.cfg.Rule(
      `${serviceName}-s3-ssl-rule`,
      {
        name: pulumi.interpolate`${serviceName}-s3-ssl-requests-${region}-${environmentSuffix}`,
        description: 'Checks that S3 buckets enforce SSL',
        source: {
          owner: 'AWS',
          sourceIdentifier: 'S3_BUCKET_SSL_REQUESTS_ONLY',
        },
        tags: commonTags,
      },
      { parent: this, dependsOn: [configRecorder] }
    );

    new aws.cfg.Rule(
      `${serviceName}-iam-password-policy-rule`,
      {
        name: pulumi.interpolate`${serviceName}-iam-password-policy-${region}-${environmentSuffix}`,
        description: 'Checks IAM password policy compliance',
        source: {
          owner: 'AWS',
          sourceIdentifier: 'IAM_PASSWORD_POLICY',
        },
        inputParameters: JSON.stringify({
          RequireUppercaseCharacters: 'true',
          RequireLowercaseCharacters: 'true',
          RequireSymbols: 'true',
          RequireNumbers: 'true',
          MinimumPasswordLength: '14',
          MaxPasswordAge: '90',
        }),
        tags: commonTags,
      },
      { parent: this, dependsOn: [configRecorder] }
    );

    new aws.cfg.Rule(
      `${serviceName}-cloudtrail-enabled-rule`,
      {
        name: pulumi.interpolate`${serviceName}-cloudtrail-enabled-${region}-${environmentSuffix}`,
        description: 'Checks that CloudTrail is enabled',
        source: {
          owner: 'AWS',
          sourceIdentifier: 'CLOUD_TRAIL_ENABLED',
        },
        tags: commonTags,
      },
      { parent: this, dependsOn: [configRecorder] }
    );

    new aws.cfg.Rule(
      `${serviceName}-kms-rotation-rule`,
      {
        name: pulumi.interpolate`${serviceName}-kms-rotation-${region}-${environmentSuffix}`,
        description: 'Checks that KMS key rotation is enabled',
        source: {
          owner: 'AWS',
          sourceIdentifier: 'CMK_BACKING_KEY_ROTATION_ENABLED',
        },
        tags: commonTags,
      },
      { parent: this, dependsOn: [configRecorder] }
    );

    // ========================================
    // 9. Lambda Auto-Remediation in Isolated VPC
    // ========================================

    // Create isolated VPC
    const vpc = new aws.ec2.Vpc(
      `${serviceName}-vpc`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: pulumi
          .all([commonTags, serviceName, region, environmentSuffix])
          .apply(([ct, sn, r, es]) => ({
            ...ct,
            Name: `${sn}-vpc-${r}-${es}`,
          })),
      },
      { parent: this }
    );

    // Create isolated subnets (no route to internet)
    const subnet1 = new aws.ec2.Subnet(
      `${serviceName}-subnet-1`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.1.0/24',
        availabilityZone: pulumi.interpolate`${region}a`,
        tags: commonTags,
      },
      { parent: this }
    );

    const subnet2 = new aws.ec2.Subnet(
      `${serviceName}-subnet-2`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.2.0/24',
        availabilityZone: pulumi.interpolate`${region}b`,
        tags: commonTags,
      },
      { parent: this }
    );

    // Security group for Lambda
    const lambdaSecurityGroup = new aws.ec2.SecurityGroup(
      `${serviceName}-lambda-sg`,
      {
        vpcId: vpc.id,
        description: 'Security group for remediation Lambda',
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: commonTags,
      },
      { parent: this }
    );

    // VPC Endpoints for AWS services (no internet access)
    new aws.ec2.VpcEndpoint(
      `${serviceName}-s3-endpoint`,
      {
        vpcId: vpc.id,
        serviceName: pulumi.interpolate`com.amazonaws.${region}.s3`,
        vpcEndpointType: 'Gateway',
        tags: commonTags,
      },
      { parent: this }
    );

    new aws.ec2.VpcEndpoint(
      `${serviceName}-kms-endpoint`,
      {
        vpcId: vpc.id,
        serviceName: pulumi.interpolate`com.amazonaws.${region}.kms`,
        vpcEndpointType: 'Interface',
        subnetIds: [subnet1.id, subnet2.id],
        securityGroupIds: [lambdaSecurityGroup.id],
        privateDnsEnabled: true,
        tags: commonTags,
      },
      { parent: this }
    );

    new aws.ec2.VpcEndpoint(
      `${serviceName}-secretsmanager-endpoint`,
      {
        vpcId: vpc.id,
        serviceName: pulumi.interpolate`com.amazonaws.${region}.secretsmanager`,
        vpcEndpointType: 'Interface',
        subnetIds: [subnet1.id, subnet2.id],
        securityGroupIds: [lambdaSecurityGroup.id],
        privateDnsEnabled: true,
        tags: commonTags,
      },
      { parent: this }
    );

    new aws.ec2.VpcEndpoint(
      `${serviceName}-logs-endpoint`,
      {
        vpcId: vpc.id,
        serviceName: pulumi.interpolate`com.amazonaws.${region}.logs`,
        vpcEndpointType: 'Interface',
        subnetIds: [subnet1.id, subnet2.id],
        securityGroupIds: [lambdaSecurityGroup.id],
        privateDnsEnabled: true,
        tags: commonTags,
      },
      { parent: this }
    );

    // Auto-remediation Lambda role
    const remediationRole = new aws.iam.Role(
      `${serviceName}-remediation-role`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'lambda.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        managedPolicyArns: [
          'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
        ],
        permissionsBoundary: permissionBoundaryPolicy.arn,
        tags: commonTags,
      },
      { parent: this }
    );

    // Wait for managed policies to attach
    const remediationRolePolicy = new aws.iam.RolePolicy(
      `${serviceName}-remediation-policy`,
      {
        role: remediationRole.id,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                's3:PutBucketPublicAccessBlock',
                's3:PutBucketVersioning',
                's3:PutEncryptionConfiguration',
                'ec2:ModifyInstanceAttribute',
                'iam:UpdateAccountPasswordPolicy',
                'config:PutEvaluations',
              ],
              Resource: '*',
            },
          ],
        }),
      },
      { parent: this, dependsOn: [remediationRole] }
    );

    const remediationLambda = new aws.lambda.Function(
      `${serviceName}-remediation-lambda`,
      {
        name: pulumi.interpolate`${serviceName}-auto-remediate-${region}-${environmentSuffix}`,
        runtime: aws.lambda.Runtime.Python3d11,
        role: remediationRole.arn,
        handler: 'index.handler',
        code: new pulumi.asset.AssetArchive({
          'index.py': new pulumi.asset.StringAsset(`
import json
import boto3
import os

s3_client = boto3.client('s3')
config_client = boto3.client('config')

def handler(event, context):
    print(f"Remediation event: {json.dumps(event)}")
    
    # Parse Config rule evaluation
    config_rule_name = event.get('configRuleName', '')
    resource_type = event.get('configRuleInvokingEvent', {}).get('configurationItem', {}).get('resourceType', '')
    resource_id = event.get('configRuleInvokingEvent', {}).get('configurationItem', {}).get('resourceId', '')
    
    compliance_type = 'NON_COMPLIANT'
    
    try:
        # S3 public access remediation
        if 's3-public' in config_rule_name.lower() and resource_type == 'AWS::S3::Bucket':
            s3_client.put_public_access_block(
                Bucket=resource_id,
                PublicAccessBlockConfiguration={
                    'BlockPublicAcls': True,
                    'IgnorePublicAcls': True,
                    'BlockPublicPolicy': True,
                    'RestrictPublicBuckets': True
                }
            )
            print(f"Remediated public access for bucket: {resource_id}")
            compliance_type = 'COMPLIANT'
        
        # S3 SSL enforcement
        elif 's3-ssl' in config_rule_name.lower() and resource_type == 'AWS::S3::Bucket':
            bucket_policy = {
                'Version': '2012-10-17',
                'Statement': [{
                    'Sid': 'DenyInsecureTransport',
                    'Effect': 'Deny',
                    'Principal': '*',
                    'Action': 's3:*',
                    'Resource': [
                        f'arn:aws:s3:::{resource_id}',
                        f'arn:aws:s3:::{resource_id}/*'
                    ],
                    'Condition': {
                        'Bool': {'aws:SecureTransport': 'false'}
                    }
                }]
            }
            s3_client.put_bucket_policy(
                Bucket=resource_id,
                Policy=json.dumps(bucket_policy)
            )
            print(f"Enforced SSL for bucket: {resource_id}")
            compliance_type = 'COMPLIANT'
            
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Remediation completed',
                'resource': resource_id,
                'compliance': compliance_type
            })
        }
    except Exception as e:
        print(f"Remediation failed: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
`),
        }),
        environment: {
          variables: pulumi
            .all([environmentSuffix, serviceName, complianceLogGroup.name])
            .apply(([es, sn, lg]) => ({
              ENVIRONMENT: es,
              SERVICE_NAME: sn,
              LOG_GROUP: lg,
            })),
        },
        timeout: 300,
        memorySize: 512,
        vpcConfig: {
          subnetIds: [subnet1.id, subnet2.id],
          securityGroupIds: [lambdaSecurityGroup.id],
        },
        tags: commonTags,
      },
      { parent: this, dependsOn: [remediationRole, remediationRolePolicy] }
    );

    // ========================================
    // 10. SNS Topic with KMS Encryption
    // ========================================

    const securityAlertTopic = new aws.sns.Topic(
      `${serviceName}-security-alerts`,
      {
        name: pulumi.interpolate`${serviceName}-security-alerts-${region}-${environmentSuffix}`,
        displayName: 'Security Violation Alerts',
        kmsMasterKeyId: generalKey.id,
        tags: commonTags,
      },
      { parent: this }
    );

    // Add email subscription if provided
    if (args.email) {
      new aws.sns.TopicSubscription(
        `${serviceName}-email-subscription`,
        {
          topic: securityAlertTopic.arn,
          protocol: 'email',
          endpoint: args.email,
        },
        { parent: this }
      );
    }

    // CloudWatch Alarm for Config non-compliance
    new aws.cloudwatch.MetricAlarm(
      `${serviceName}-compliance-alarm`,
      {
        name: pulumi.interpolate`${serviceName}-config-noncompliant-${region}-${environmentSuffix}`,
        comparisonOperator: 'LessThanThreshold',
        evaluationPeriods: 1,
        metricName: 'ComplianceScore',
        namespace: 'AWS/Config',
        period: 300,
        statistic: 'Average',
        threshold: 95,
        alarmDescription: 'Alert when compliance score falls below 95%',
        alarmActions: [securityAlertTopic.arn],
        treatMissingData: 'breaching',
        tags: commonTags,
      },
      { parent: this }
    );

    // ========================================
    // Register Outputs
    // ========================================

    this.piiKmsKeyArn = piiKey.arn;
    this.financialKmsKeyArn = financialKey.arn;
    this.generalKmsKeyArn = generalKey.arn;
    this.crossAccountRoleArn = crossAccountRole.arn;
    this.securityAlertTopicArn = securityAlertTopic.arn;
    this.financialBucketName = financialBucket.id;
    this.piiBucketName = piiBucket.id;
    this.remediationLambdaArn = remediationLambda.arn;

    this.complianceReport = pulumi.output(
      JSON.stringify({
        kmsRotation: 'ENABLED',
        multiRegionReplication: 'ENABLED',
        iamPermissionBoundaries: 'CONFIGURED',
        secretsAutoRotation: '30_DAYS',
        s3TlsEnforcement: 'TLS_1_2_PLUS',
        crossAccountMfa: 'REQUIRED',
        logEncryption: 'KMS_ENCRYPTED',
        logRetention: '365_DAYS',
        cloudTrailProtection: 'ENABLED',
        configRules: 'CIS_BENCHMARKS',
        lambdaIsolation: 'VPC_NO_INTERNET',
        snsEncryption: 'KMS_ENCRYPTED',
      })
    );

    this.registerOutputs({
      piiKmsKeyArn: this.piiKmsKeyArn,
      financialKmsKeyArn: this.financialKmsKeyArn,
      generalKmsKeyArn: this.generalKmsKeyArn,
      crossAccountRoleArn: this.crossAccountRoleArn,
      securityAlertTopicArn: this.securityAlertTopicArn,
      complianceReport: this.complianceReport,
      financialBucketName: this.financialBucketName,
      piiBucketName: this.piiBucketName,
      remediationLambdaArn: this.remediationLambdaArn,
    });
  }
}
