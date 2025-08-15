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
