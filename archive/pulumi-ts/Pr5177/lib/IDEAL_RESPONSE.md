```typescript
/**
 * tap-stack.ts
 *
 * Main Pulumi ComponentResource for Legal Document Storage System
 * Provides secure, compliant document storage with versioning and audit trails
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';

/**
 * TapStackArgs defines the input arguments for the TapStack component
 */
export interface TapStackArgs {
  /**
   * Environment suffix (e.g., 'dev', 'staging', 'prod')
   */
  environmentSuffix?: string;

  /**
   * Document retention period in days
   */
  retentionDays?: number;

  /**
   * Default tags for all resources
   */
  tags?: pulumi.Input<{ [key: string]: string }>;

  /**
   * Enable versioning on S3 buckets
   */
  enableVersioning?: boolean;

  /**
   * Enable CloudTrail logging
   */
  enableAuditLogging?: boolean;

  /**
   * Firm name for resource naming
   */
  firmName?: string;
}

/**
 * Main TapStack component for Legal Document Storage System
 */
export class TapStack extends pulumi.ComponentResource {
  // Storage outputs
  public readonly documentsBucketName: pulumi.Output<string>;
  public readonly documentsBucketArn: pulumi.Output<string>;
  public readonly auditLogsBucketName: pulumi.Output<string>;

  // Security outputs
  public readonly kmsKeyId: pulumi.Output<string>;
  public readonly kmsKeyArn: pulumi.Output<string>;

  // IAM outputs
  public readonly lawyersRoleArn: pulumi.Output<string>;
  public readonly adminRoleArn: pulumi.Output<string>;
  public readonly readOnlyRoleArn: pulumi.Output<string>;

  // Monitoring outputs
  public readonly cloudWatchDashboardUrl: pulumi.Output<string>;
  public readonly snsTopicArn: pulumi.Output<string>;

  // Audit outputs
  public readonly cloudTrailArn: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'prod';
    const retentionDays = args.retentionDays || 90;
    const enableVersioning = args.enableVersioning ?? true;
    const enableAuditLogging = args.enableAuditLogging ?? true;
    const firmName = args.firmName || 'morrison-associates';

    // Generate unique suffix to avoid naming conflicts in CI/CD
    const uniqueSuffix = Math.random().toString(36).substring(2, 8);

    const tags = pulumi.output(args.tags || {}).apply(t => ({
      ...t,
      Environment: environmentSuffix,
      Project: 'LegalDocumentStorage',
      ManagedBy: 'Pulumi',
      Compliance: 'Legal',
      FirmName: firmName,
    }));

    // 1. KMS Key for encryption
    const documentKmsKey = new aws.kms.Key(
      `${name}-documents-kms-key`,
      {
        description: 'KMS key for legal document encryption',
        tags,
        policy: aws.getCallerIdentity().then(identity =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'Enable IAM User Permissions',
                Effect: 'Allow',
                Principal: {
                  AWS: `arn:aws:iam::${identity.accountId}:root`,
                },
                Action: 'kms:*',
                Resource: '*',
              },
              {
                Sid: 'Allow CloudTrail encryption',
                Effect: 'Allow',
                Principal: { Service: 'cloudtrail.amazonaws.com' },
                Action: ['kms:Decrypt', 'kms:GenerateDataKey'],
                Resource: '*',
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    new aws.kms.Alias(
      `${name}-documents-kms-alias`,
      {
        name: `alias/${firmName}-documents-${environmentSuffix}-${uniqueSuffix}`,
        targetKeyId: documentKmsKey.keyId,
      },
      { parent: this }
    );

    // 2. S3 Bucket for audit logs (needed before CloudTrail)
    const auditLogsBucket = new aws.s3.Bucket(
      `${name}-audit-logs-bucket`,
      {
        bucket: `${firmName}-audit-logs-${environmentSuffix}`,
        tags,
      },
      { parent: this }
    );

    new aws.s3.BucketVersioning(
      `${name}-audit-logs-versioning`,
      {
        bucket: auditLogsBucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { parent: this }
    );

    new aws.s3.BucketServerSideEncryptionConfiguration(
      `${name}-audit-logs-encryption`,
      {
        bucket: auditLogsBucket.id,
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: documentKmsKey.arn,
            },
          },
        ],
      },
      { parent: this }
    );

    new aws.s3.BucketPublicAccessBlock(
      `${name}-audit-logs-public-access-block`,
      {
        bucket: auditLogsBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // 3. Main Documents S3 Bucket
    const documentsBucket = new aws.s3.Bucket(
      `${name}-documents-bucket`,
      {
        bucket: `${firmName}-documents-${environmentSuffix}`,
        tags,
      },
      { parent: this }
    );

    // Enable versioning on documents bucket
    const documentsBucketVersioning = new aws.s3.BucketVersioning(
      `${name}-documents-versioning`,
      {
        bucket: documentsBucket.id,
        versioningConfiguration: {
          status: enableVersioning ? 'Enabled' : 'Suspended',
        },
      },
      { parent: this }
    );

    // Encryption configuration
    new aws.s3.BucketServerSideEncryptionConfiguration(
      `${name}-documents-encryption`,
      {
        bucket: documentsBucket.id,
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: documentKmsKey.arn,
            },
            bucketKeyEnabled: true,
          },
        ],
      },
      { parent: this }
    );

    // Lifecycle policy for 90-day retention
    new aws.s3.BucketLifecycleConfiguration(
      `${name}-documents-lifecycle`,
      {
        bucket: documentsBucket.id,
        rules: [
          {
            id: 'document-retention-policy',
            status: 'Enabled',
            filter: {},
            noncurrentVersionExpiration: {
              noncurrentDays: retentionDays,
            },
            expiration: {
              expiredObjectDeleteMarker: true,
            },
            transitions: [
              {
                days: 30,
                storageClass: 'STANDARD_IA',
              },
              {
                days: 60,
                storageClass: 'GLACIER',
              },
            ],
          },
        ],
      },
      { parent: this, dependsOn: [documentsBucketVersioning] }
    );

    // Block public access
    new aws.s3.BucketPublicAccessBlock(
      `${name}-documents-public-access-block`,
      {
        bucket: documentsBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // 4. IAM Roles for different access levels

    // Admin role (full access)
    const adminRole = new aws.iam.Role(
      `${name}-admin-role`,
      {
        name: `${firmName}-admin-role-${environmentSuffix}`,
        assumeRolePolicy: aws.getCallerIdentity().then(identity =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Action: 'sts:AssumeRole',
                Effect: 'Allow',
                Principal: {
                  AWS: `arn:aws:iam::${identity.accountId}:root`,
                },
              },
            ],
          })
        ),
        tags,
      },
      { parent: this }
    );

    new aws.iam.RolePolicy(
      `${name}-admin-policy`,
      {
        role: adminRole.id,
        policy: pulumi
          .all([documentsBucket.arn, documentKmsKey.arn])
          .apply(([bucketArn, kmsArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: ['s3:*'],
                  Resource: [bucketArn, `${bucketArn}/*`],
                },
                {
                  Effect: 'Allow',
                  Action: ['kms:*'],
                  Resource: kmsArn,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // Lawyers role (read/write access)
    const lawyersRole = new aws.iam.Role(
      `${name}-lawyers-role`,
      {
        name: `${firmName}-lawyers-role-${environmentSuffix}`,
        assumeRolePolicy: aws.getCallerIdentity().then(identity =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Action: 'sts:AssumeRole',
                Effect: 'Allow',
                Principal: {
                  AWS: `arn:aws:iam::${identity.accountId}:root`,
                },
              },
            ],
          })
        ),
        tags,
      },
      { parent: this }
    );

    new aws.iam.RolePolicy(
      `${name}-lawyers-policy`,
      {
        role: lawyersRole.id,
        policy: pulumi
          .all([documentsBucket.arn, documentKmsKey.arn])
          .apply(([bucketArn, kmsArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    's3:GetObject',
                    's3:PutObject',
                    's3:DeleteObject',
                    's3:ListBucket',
                    's3:GetObjectVersion',
                  ],
                  Resource: [bucketArn, `${bucketArn}/*`],
                },
                {
                  Effect: 'Allow',
                  Action: [
                    'kms:Decrypt',
                    'kms:GenerateDataKey',
                    'kms:DescribeKey',
                  ],
                  Resource: kmsArn,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // Read-only role (for junior staff)
    const readOnlyRole = new aws.iam.Role(
      `${name}-readonly-role`,
      {
        name: `${firmName}-readonly-role-${environmentSuffix}`,
        assumeRolePolicy: aws.getCallerIdentity().then(identity =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Action: 'sts:AssumeRole',
                Effect: 'Allow',
                Principal: {
                  AWS: `arn:aws:iam::${identity.accountId}:root`,
                },
              },
            ],
          })
        ),
        tags,
      },
      { parent: this }
    );

    new aws.iam.RolePolicy(
      `${name}-readonly-policy`,
      {
        role: readOnlyRole.id,
        policy: pulumi
          .all([documentsBucket.arn, documentKmsKey.arn])
          .apply(([bucketArn, kmsArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    's3:GetObject',
                    's3:ListBucket',
                    's3:GetObjectVersion',
                  ],
                  Resource: [bucketArn, `${bucketArn}/*`],
                },
                {
                  Effect: 'Allow',
                  Action: ['kms:Decrypt', 'kms:DescribeKey'],
                  Resource: kmsArn,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // 5. CloudTrail for audit logging
    let cloudTrail: aws.cloudtrail.Trail | undefined;

    if (enableAuditLogging) {
      // CloudTrail bucket policy
      const cloudTrailBucketPolicy = new aws.s3.BucketPolicy(
        `${name}-cloudtrail-bucket-policy`,
        {
          bucket: auditLogsBucket.id,
          policy: pulumi
            .all([
              auditLogsBucket.arn,
              aws.getCallerIdentity(),
              aws.getRegion(),
            ])
            .apply(([bucketArn, identity, _region]) =>
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
                    Resource: `${bucketArn}/AWSLogs/${identity.accountId}/*`,
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

      cloudTrail = new aws.cloudtrail.Trail(
        `${name}-cloudtrail`,
        {
          name: `${firmName}-document-audit-${environmentSuffix}-${uniqueSuffix}`,
          s3BucketName: auditLogsBucket.id,
          includeGlobalServiceEvents: true,
          isMultiRegionTrail: true,
          enableLogging: true,
          kmsKeyId: documentKmsKey.arn,
          eventSelectors: [
            {
              readWriteType: 'All',
              includeManagementEvents: true,
              dataResources: [
                {
                  type: 'AWS::S3::Object',
                  values: [pulumi.interpolate`${documentsBucket.arn}/*`],
                },
              ],
            },
          ],
          tags,
        },
        { parent: this, dependsOn: [cloudTrailBucketPolicy] }
      );
    }

    // 6. SNS Topic for alerts
    const alertsTopic = new aws.sns.Topic(
      `${name}-alerts-topic`,
      {
        name: `${firmName}-document-alerts-${environmentSuffix}`,
        tags,
      },
      { parent: this }
    );

    // 7. CloudWatch Dashboard
    const dashboard = new aws.cloudwatch.Dashboard(
      `${name}-dashboard`,
      {
        dashboardName: `${firmName}-documents-${environmentSuffix}`,
        dashboardBody: pulumi
          .all([documentsBucket.id, alertsTopic.arn, aws.getRegion()])
          .apply(([bucketName, _topicArn, region]) =>
            JSON.stringify({
              widgets: [
                {
                  type: 'metric',
                  x: 0,
                  y: 0,
                  width: 12,
                  height: 6,
                  properties: {
                    metrics: [
                      [
                        'AWS/S3',
                        'BucketSizeBytes',
                        'BucketName',
                        bucketName,
                        'StorageType',
                        'StandardStorage',
                      ],
                      [
                        'AWS/S3',
                        'NumberOfObjects',
                        'BucketName',
                        bucketName,
                        'StorageType',
                        'AllStorageTypes',
                      ],
                    ],
                    period: 86400,
                    stat: 'Average',
                    region: region.name,
                    title: 'Document Storage Metrics',
                  },
                },
                {
                  type: 'metric',
                  x: 0,
                  y: 6,
                  width: 12,
                  height: 6,
                  properties: {
                    metrics: [
                      ['AWS/S3', 'AllRequests', 'BucketName', bucketName],
                      ['AWS/S3', 'GetRequests', 'BucketName', bucketName],
                      ['AWS/S3', 'PutRequests', 'BucketName', bucketName],
                    ],
                    period: 300,
                    stat: 'Sum',
                    region: region.name,
                    title: 'Document Access Patterns',
                  },
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // 8. CloudWatch Alarms
    new aws.cloudwatch.MetricAlarm(
      `${name}-high-access-alarm`,
      {
        name: `${firmName}-high-document-access-${environmentSuffix}`,
        alarmDescription: 'Alert when document access is unusually high',
        metricName: 'AllRequests',
        namespace: 'AWS/S3',
        statistic: 'Sum',
        period: 300,
        evaluationPeriods: 2,
        threshold: 1000,
        comparisonOperator: 'GreaterThanThreshold',
        dimensions: {
          BucketName: documentsBucket.id,
        },
        alarmActions: [alertsTopic.arn],
        tags,
      },
      { parent: this }
    );

    // Expose outputs
    this.documentsBucketName = documentsBucket.id;
    this.documentsBucketArn = documentsBucket.arn;
    this.auditLogsBucketName = auditLogsBucket.id;
    this.kmsKeyId = documentKmsKey.keyId;
    this.kmsKeyArn = documentKmsKey.arn;
    this.lawyersRoleArn = lawyersRole.arn;
    this.adminRoleArn = adminRole.arn;
    this.readOnlyRoleArn = readOnlyRole.arn;
    this.cloudWatchDashboardUrl = pulumi
      .all([aws.getRegion(), dashboard.dashboardName])
      .apply(
        ([region, dashboardName]) =>
          `https://console.aws.amazon.com/cloudwatch/home?region=${region.name}#dashboards:name=${dashboardName}`
      );
    this.snsTopicArn = alertsTopic.arn;
    this.cloudTrailArn = cloudTrail ? cloudTrail.arn : pulumi.output('');

    // Register all outputs
    this.registerOutputs({
      // Storage
      documentsBucketName: this.documentsBucketName,
      documentsBucketArn: this.documentsBucketArn,
      auditLogsBucketName: this.auditLogsBucketName,

      // Security
      kmsKeyId: this.kmsKeyId,
      kmsKeyArn: this.kmsKeyArn,

      // IAM
      lawyersRoleArn: this.lawyersRoleArn,
      adminRoleArn: this.adminRoleArn,
      readOnlyRoleArn: this.readOnlyRoleArn,

      // Monitoring
      cloudWatchDashboardUrl: this.cloudWatchDashboardUrl,
      snsTopicArn: this.snsTopicArn,

      // Audit
      cloudTrailArn: this.cloudTrailArn,

      // Configuration
      environment: environmentSuffix,
      retentionDays: retentionDays,
      firmName: firmName,
      deploymentTimestamp: new Date().toISOString(),
    });
  }
}

```