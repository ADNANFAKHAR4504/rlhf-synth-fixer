/**
 * s3-stack.ts
 *
 * S3 Storage Stack for video content optimization with intelligent tiering
 * and lifecycle management. Implements cost-effective storage strategies
 * for video content with automatic transitions based on access patterns.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

/**
 * Configuration arguments for S3Stack
 */
export interface S3StackArgs {
  /**
   * Environment suffix for resource naming (e.g., 'dev', 'staging', 'prod')
   */
  environmentSuffix: string;

  /**
   * Optional tags to apply to all resources
   */
  tags?: { [key: string]: string };
}

/**
 * S3Stack creates and configures an optimized S3 bucket for video storage
 * with intelligent tiering, lifecycle rules, and CloudWatch monitoring.
 */
export class S3Stack extends pulumi.ComponentResource {
  public readonly bucketName: pulumi.Output<string>;
  public readonly bucketArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: S3StackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:s3:S3Stack', name, args, opts);

    // Default tags for all resources
    const defaultTags = {
      Environment: args.environmentSuffix,
      Project: 'VideoStorage',
      CostCenter: 'Media',
      ManagedBy: 'Pulumi',
      ...args.tags,
    };

    // Create S3 bucket with optimized configuration
    const bucket = new aws.s3.BucketV2(
      `video-bucket-${args.environmentSuffix}`,
      {
        bucket: `video-bucket-${args.environmentSuffix}`,
        tags: defaultTags,
        forceDestroy: true,
      },
      { parent: this }
    );

    // Enable versioning for data protection
    const versioning = new aws.s3.BucketVersioningV2(
      `video-bucket-versioning-${args.environmentSuffix}`,
      {
        bucket: bucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { parent: this }
    );

    // Configure server-side encryption with AES256
    new aws.s3.BucketServerSideEncryptionConfigurationV2(
      `video-bucket-encryption-${args.environmentSuffix}`,
      {
        bucket: bucket.id,
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
            bucketKeyEnabled: true,
          },
        ],
      },
      { parent: this }
    );

    // Block all public access for security
    new aws.s3.BucketPublicAccessBlock(
      `video-bucket-pab-${args.environmentSuffix}`,
      {
        bucket: bucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // Configure lifecycle rules for cost optimization
    new aws.s3.BucketLifecycleConfigurationV2(
      `video-bucket-lifecycle-${args.environmentSuffix}`,
      {
        bucket: bucket.id,
        rules: [
          {
            id: 'transition-to-ia-and-glacier',
            status: 'Enabled',
            transitions: [
              {
                days: 30,
                storageClass: 'STANDARD_IA',
              },
              {
                days: 90,
                storageClass: 'GLACIER_IR',
              },
            ],
          },
          {
            id: 'cleanup-multipart-uploads',
            status: 'Enabled',
            abortIncompleteMultipartUpload: {
              daysAfterInitiation: 7,
            },
          },
          {
            id: 'cleanup-old-versions',
            status: 'Enabled',
            noncurrentVersionExpiration: {
              noncurrentDays: 60,
            },
          },
        ],
      },
      { parent: this, dependsOn: [versioning] }
    );

    // Configure intelligent tiering for automatic cost optimization
    new aws.s3.BucketIntelligentTieringConfiguration(
      `video-bucket-tiering-${args.environmentSuffix}`,
      {
        bucket: bucket.id,
        name: 'EntireBucket',
        status: 'Enabled',
        tierings: [
          {
            accessTier: 'ARCHIVE_ACCESS',
            days: 90,
          },
          {
            accessTier: 'DEEP_ARCHIVE_ACCESS',
            days: 180,
          },
        ],
      },
      { parent: this }
    );

    // CloudWatch metric alarm for bucket size monitoring
    new aws.cloudwatch.MetricAlarm(
      `video-bucket-size-alarm-${args.environmentSuffix}`,
      {
        name: `video-bucket-size-alarm-${args.environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'BucketSizeBytes',
        namespace: 'AWS/S3',
        period: 86400, // 24 hours
        statistic: 'Average',
        threshold: 1000000000000, // 1TB in bytes
        treatMissingData: 'notBreaching',
        alarmDescription: 'Alert when video bucket size exceeds 1TB',
        dimensions: {
          BucketName: bucket.id,
          StorageType: 'StandardStorage',
        },
        tags: defaultTags,
      },
      { parent: this }
    );

    // CloudWatch metric alarm for object count monitoring
    new aws.cloudwatch.MetricAlarm(
      `video-bucket-objects-alarm-${args.environmentSuffix}`,
      {
        name: `video-bucket-objects-alarm-${args.environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'NumberOfObjects',
        namespace: 'AWS/S3',
        period: 86400, // 24 hours
        statistic: 'Average',
        threshold: 100000,
        treatMissingData: 'notBreaching',
        alarmDescription:
          'Alert when video bucket object count exceeds 100,000',
        dimensions: {
          BucketName: bucket.id,
          StorageType: 'AllStorageTypes',
        },
        tags: defaultTags,
      },
      { parent: this }
    );

    // Set public outputs
    this.bucketName = bucket.id;
    this.bucketArn = bucket.arn;

    this.registerOutputs({
      bucketName: this.bucketName,
      bucketArn: this.bucketArn,
    });
  }
}
