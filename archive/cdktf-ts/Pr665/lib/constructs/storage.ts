import { Construct } from 'constructs';
import {
  s3Bucket,
  s3BucketPublicAccessBlock,
  s3BucketServerSideEncryptionConfiguration,
  s3BucketLifecycleConfiguration,
  s3BucketVersioning,
  s3BucketLogging,
  s3BucketPolicy,
  dataAwsElbServiceAccount,
} from '@cdktf/provider-aws/lib';
import { AppConfig } from '../config/variables';

export interface StorageProps {
  config: AppConfig;
}

export class StorageConstruct extends Construct {
  public readonly logsBucket: s3Bucket.S3Bucket;
  public readonly accessLogsBucket: s3Bucket.S3Bucket;
  public readonly accessLogsBucketPolicy: s3BucketPolicy.S3BucketPolicy;

  constructor(scope: Construct, id: string, props: StorageProps) {
    super(scope, id);

    const { config } = props;
    const timestamp = Date.now();

    this.accessLogsBucket = new s3Bucket.S3Bucket(this, 'access-logs-bucket', {
      bucket: `${config.projectName}-${config.environment}-access-logs-${timestamp}`,
      forceDestroy: true,
      tags: {
        ...config.tags,
        Name: `${config.projectName}-${config.environment}-access-logs-bucket`,
        Purpose: 'S3AccessLogs',
      },
    });

    new s3BucketPublicAccessBlock.S3BucketPublicAccessBlock(
      this,
      'access-logs-bucket-pab',
      {
        bucket: this.accessLogsBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      }
    );

    new s3BucketServerSideEncryptionConfiguration.S3BucketServerSideEncryptionConfigurationA(
      this,
      'access-logs-bucket-encryption',
      {
        bucket: this.accessLogsBucket.id,
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

    // Get ALB service account for the region
    const albServiceAccount =
      new dataAwsElbServiceAccount.DataAwsElbServiceAccount(
        this,
        'alb-service-account',
        {
          region: config.region,
        }
      );

    // Bucket policy to allow ALB to write access logs
    this.accessLogsBucketPolicy = new s3BucketPolicy.S3BucketPolicy(
      this,
      'access-logs-bucket-policy',
      {
        bucket: this.accessLogsBucket.id,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                AWS: albServiceAccount.arn,
              },
              Action: 's3:PutObject',
              Resource: [
                `${this.accessLogsBucket.arn}/AWSLogs/*`,
                `${this.accessLogsBucket.arn}/alb-access-logs/*`,
              ],
            },
            {
              Effect: 'Allow',
              Principal: {
                AWS: albServiceAccount.arn,
              },
              Action: 's3:GetBucketAcl',
              Resource: this.accessLogsBucket.arn,
            },
            {
              Effect: 'Allow',
              Principal: {
                Service: 'delivery.logs.amazonaws.com',
              },
              Action: 's3:PutObject',
              Resource: `${this.accessLogsBucket.arn}/AWSLogs/*`,
              Condition: {
                StringEquals: {
                  's3:x-amz-acl': 'bucket-owner-full-control',
                },
              },
            },
            {
              Effect: 'Allow',
              Principal: {
                Service: 'delivery.logs.amazonaws.com',
              },
              Action: 's3:GetBucketAcl',
              Resource: this.accessLogsBucket.arn,
            },
          ],
        }),
      }
    );

    this.logsBucket = new s3Bucket.S3Bucket(this, 'logs-bucket', {
      bucket: `${config.projectName}-${config.environment}-logs-${timestamp}`,
      forceDestroy: true,
      tags: {
        ...config.tags,
        Name: `${config.projectName}-${config.environment}-logs-bucket`,
        Purpose: 'ApplicationLogs',
      },
    });

    new s3BucketPublicAccessBlock.S3BucketPublicAccessBlock(
      this,
      'logs-bucket-pab',
      {
        bucket: this.logsBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      }
    );

    new s3BucketServerSideEncryptionConfiguration.S3BucketServerSideEncryptionConfigurationA(
      this,
      'logs-bucket-encryption',
      {
        bucket: this.logsBucket.id,
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

    new s3BucketVersioning.S3BucketVersioningA(this, 'logs-bucket-versioning', {
      bucket: this.logsBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    new s3BucketLogging.S3BucketLoggingA(this, 'logs-bucket-logging', {
      bucket: this.logsBucket.id,
      targetBucket: this.accessLogsBucket.id,
      targetPrefix: 'access-logs/',
    });

    new s3BucketLifecycleConfiguration.S3BucketLifecycleConfiguration(
      this,
      'logs-bucket-lifecycle',
      {
        bucket: this.logsBucket.id,
        rule: [
          {
            id: 'log-lifecycle-rule',
            status: 'Enabled',
            filter: [
              {
                prefix: '',
              },
            ],
            expiration: [
              {
                days: 2555,
              },
            ],
            noncurrentVersionExpiration: [
              {
                noncurrentDays: 90,
              },
            ],
            transition: [
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
            noncurrentVersionTransition: [
              {
                noncurrentDays: 30,
                storageClass: 'STANDARD_IA',
              },
              {
                noncurrentDays: 60,
                storageClass: 'GLACIER',
              },
            ],
          },
        ],
      }
    );

    new s3BucketLifecycleConfiguration.S3BucketLifecycleConfiguration(
      this,
      'access-logs-bucket-lifecycle',
      {
        bucket: this.accessLogsBucket.id,
        rule: [
          {
            id: 'access-log-lifecycle-rule',
            status: 'Enabled',
            filter: [
              {
                prefix: '',
              },
            ],
            expiration: [
              {
                days: 90,
              },
            ],
            abortIncompleteMultipartUpload: [
              {
                daysAfterInitiation: 7,
              },
            ],
            transition: [
              {
                days: 30,
                storageClass: 'STANDARD_IA',
              },
            ],
          },
        ],
      }
    );
  }
}
