import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

interface StorageStackProps extends cdk.NestedStackProps {
  environmentSuffix: string;
}

export class StorageStack extends cdk.NestedStack {
  public readonly s3Bucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // CloudWatch Log Group for S3 access logs
    new logs.LogGroup(this, 'S3AccessLogGroup', {
      logGroupName: `/aws/s3/access-logs-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // S3 bucket with security best practices
    this.s3Bucket = new s3.Bucket(this, 'SecureBucket', {
      bucketName: `secure-bucket-${environmentSuffix}`.toLowerCase(),
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      serverAccessLogsPrefix: 'access-logs/',
    });

    // Apply tags
    cdk.Tags.of(this).add('Project', 'IaCChallenge');
  }
}
