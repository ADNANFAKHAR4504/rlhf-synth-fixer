import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

interface S3StackProps {
  environmentSuffix?: string;
}

export class S3Stack extends Construct {
  public readonly bucket: s3.Bucket;
  public readonly s3Key: kms.Key;

  constructor(scope: Construct, id: string, props?: S3StackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Create KMS key for S3 encryption
    this.s3Key = new kms.Key(this, 'S3EncryptionKey', {
      description: 'KMS key for S3 bucket encryption',
      enableKeyRotation: true,
    });

    // Create S3 bucket with encryption and security best practices
    this.bucket = new s3.Bucket(this, 'SecureBucket', {
      bucketName: `secure-vpc-bucket-${environmentSuffix}-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: this.s3Key,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      enforceSSL: true,
      serverAccessLogsPrefix: 'access-logs/',
      lifecycleRules: [
        {
          id: 'DeleteIncompleteMultipartUploads',
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
        {
          id: 'TransitionToIA',
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
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Bucket notifications can be added later for security monitoring
    // this.bucket.addEventNotification(
    //   s3.EventType.OBJECT_CREATED,
    //   // You can add SNS topic or Lambda function here for monitoring
    // );
  }
}
