import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface S3ConstructProps {
  environmentSuffix: string;
  primaryRegion: string;
  replicationRegion: string;
  enableS3Express: boolean;
  replicationRole: iam.Role;
}

export class S3Construct extends Construct {
  public readonly primaryBucket: s3.Bucket;
  public readonly replicationBucket: s3.Bucket;
  public readonly expressBucket?: s3.Bucket;

  constructor(scope: Construct, id: string, props: S3ConstructProps) {
    super(scope, id);

    // Create replication destination bucket first (in different region)
    this.replicationBucket = new s3.Bucket(this, 'ReplicationBucket', {
      bucketName: `tap-replica-${props.environmentSuffix}-${cdk.Aws.ACCOUNT_ID}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          enabled: true,
          noncurrentVersionExpiration: cdk.Duration.days(
            props.environmentSuffix === 'prod' ? 90 : 30
          ),
        },
      ],
    });

    // Create primary bucket with cross-region replication
    this.primaryBucket = new s3.Bucket(this, 'PrimaryBucket', {
      bucketName: `tap-primary-${props.environmentSuffix}-${cdk.Aws.ACCOUNT_ID}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          id: 'TransitionToIA',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
        },
        {
          id: 'DeleteOldVersions',
          enabled: true,
          noncurrentVersionExpiration: cdk.Duration.days(
            props.environmentSuffix === 'prod' ? 90 : 30
          ),
        },
      ],
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.POST,
            s3.HttpMethods.PUT,
          ],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
        },
      ],
    });

    // Configure cross-region replication
    const replicationConfiguration = {
      role: props.replicationRole.roleArn,
      rules: [
        {
          id: `replication-rule-${props.environmentSuffix}`,
          status: 'Enabled',
          prefix: '',
          destination: {
            bucket: this.replicationBucket.bucketArn,
            storageClass: 'STANDARD_IA',
          },
        },
      ],
    };

    // Add replication configuration to primary bucket
    const cfnPrimaryBucket = this.primaryBucket.node
      .defaultChild as s3.CfnBucket;
    cfnPrimaryBucket.replicationConfiguration = replicationConfiguration;

    // Create S3 Express One Zone bucket for high-performance workloads (prod only)
    if (props.enableS3Express) {
      // Note: S3 Express One Zone uses directory buckets with different naming
      this.expressBucket = new s3.Bucket(this, 'ExpressBucket', {
        bucketName: `tap-express-${props.environmentSuffix}--use1-az1--x-s3`,
        versioned: false, // Express One Zone doesn't support versioning
        encryption: s3.BucketEncryption.S3_MANAGED,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      });

      // Configure Express bucket for high performance
      const cfnExpressBucket = this.expressBucket.node
        .defaultChild as s3.CfnBucket;
      cfnExpressBucket.addPropertyOverride(
        'BucketConfiguration.Type',
        'Directory'
      );
      cfnExpressBucket.addPropertyOverride(
        'BucketConfiguration.Location.Type',
        'AvailabilityZone'
      );
      cfnExpressBucket.addPropertyOverride(
        'BucketConfiguration.Location.Name',
        'use1-az1'
      );
    }

    // Grant replication permissions
    this.replicationBucket.grantReadWrite(props.replicationRole);
    this.primaryBucket.grantReadWrite(props.replicationRole);

    // Add tags
    const buckets = [this.primaryBucket, this.replicationBucket];
    if (this.expressBucket) buckets.push(this.expressBucket);

    buckets.forEach(bucket => {
      bucket.node.addMetadata('Environment', props.environmentSuffix);
      bucket.node.addMetadata('Component', 'S3');
    });
  }
}
