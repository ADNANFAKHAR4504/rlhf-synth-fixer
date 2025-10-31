import * as cdk from 'aws-cdk-lib';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface SecureBucketProps {
  bucketName: string;
  serverAccessLogsBucket: s3.IBucket;
  serverAccessLogsPrefix: string;
  environmentSuffix: string;
}

export class SecureBucket extends Construct {
  public readonly bucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: SecureBucketProps) {
    super(scope, id);

    // Create KMS key for encryption
    const encryptionKey = new kms.Key(this, 'BucketEncryptionKey', {
      enableKeyRotation: true,
      description: `Encryption key for ${props.bucketName} (${props.environmentSuffix})`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create secure bucket
    this.bucket = new s3.Bucket(this, 'SecureBucket', {
      bucketName: props.bucketName,
      versioned: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      serverAccessLogsBucket: props.serverAccessLogsBucket,
      serverAccessLogsPrefix: props.serverAccessLogsPrefix,
      lifecycleRules: [
        {
          id: 'delete-incomplete-multipart-uploads',
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
        {
          id: 'transition-to-ia',
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Add bucket policy for secure access
    this.bucket.addToResourcePolicy(
      new cdk.aws_iam.PolicyStatement({
        sid: 'DenyUnencryptedObjectUploads',
        effect: cdk.aws_iam.Effect.DENY,
        principals: [new cdk.aws_iam.AnyPrincipal()],
        actions: ['s3:PutObject'],
        resources: [`${this.bucket.bucketArn}/*`],
        conditions: {
          StringNotEquals: {
            's3:x-amz-server-side-encryption': 'aws:kms',
          },
        },
      })
    );
  }
}
