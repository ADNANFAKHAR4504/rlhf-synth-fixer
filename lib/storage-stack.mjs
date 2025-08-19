import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';

export class StorageStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const { kmsKey } = props;

    // S3 Bucket with versioning and KMS encryption
    this.s3Bucket = new s3.Bucket(this, `WebAppS3Bucket${environmentSuffix}`, {
      bucketName: `webapp-storage-${environmentSuffix}-${cdk.Aws.ACCOUNT_ID}`, // Ensure unique naming
      versioned: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For demo purposes
      autoDeleteObjects: true, // For demo purposes - allows clean deletion
      lifecycleRules: [
        {
          id: `LifecycleRule${environmentSuffix}`,
          enabled: true,
          noncurrentVersionExpiration: cdk.Duration.days(30),
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(1),
        },
      ],
    });

    // Note: EC2 instances will get S3 access through their IAM role
    // This is configured in the AutoScaling stack

    // Apply environment tags
    cdk.Tags.of(this.s3Bucket).add('Environment', environmentSuffix);
    cdk.Tags.of(this.s3Bucket).add('Service', 'WebApp');
    cdk.Tags.of(this.s3Bucket).add('Purpose', 'ApplicationStorage');

    // Outputs
    new cdk.CfnOutput(this, `S3BucketName${environmentSuffix}`, {
      value: this.s3Bucket.bucketName,
      exportName: `WebAppS3BucketName${environmentSuffix}`,
      description: 'S3 Bucket name for web application storage',
    });

    new cdk.CfnOutput(this, `S3BucketArn${environmentSuffix}`, {
      value: this.s3Bucket.bucketArn,
      exportName: `WebAppS3BucketArn${environmentSuffix}`,
      description: 'S3 Bucket ARN for web application storage',
    });

    new cdk.CfnOutput(this, `S3BucketDomainName${environmentSuffix}`, {
      value: this.s3Bucket.bucketDomainName,
      exportName: `WebAppS3BucketDomainName${environmentSuffix}`,
      description: 'S3 Bucket domain name',
    });

    new cdk.CfnOutput(this, `S3BucketWebsiteURL${environmentSuffix}`, {
      value: this.s3Bucket.bucketWebsiteUrl,
      exportName: `WebAppS3BucketWebsiteURL${environmentSuffix}`,
      description: 'S3 Bucket website URL',
    });
  }
}