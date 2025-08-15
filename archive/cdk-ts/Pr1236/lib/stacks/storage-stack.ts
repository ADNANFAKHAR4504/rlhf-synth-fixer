import * as cdk from 'aws-cdk-lib';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface StorageStackProps extends cdk.StackProps {
  dataKey: kms.IKey;
}

export class StorageStack extends cdk.Stack {
  /** Dedicated access logs bucket (SSE-S3 due to service constraints) */
  public readonly logsBucket: s3.Bucket;
  /** Application data bucket (KMS, versioning, access logging enabled) */
  public readonly appBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    if (!props || !props.dataKey) {
      throw new Error('StorageStack: dataKey prop is required');
    }
    super(scope, id, props);

    this.logsBucket = new s3.Bucket(this, 'AccessLogsBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_PREFERRED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    this.appBucket = new s3.Bucket(this, 'AppBucket', {
      versioned: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: props.dataKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      serverAccessLogsBucket: this.logsBucket,
      serverAccessLogsPrefix: 's3-access-logs/',
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    new cdk.CfnOutput(this, 'AppBucketName', {
      value: this.appBucket.bucketName,
    });
  }
}
