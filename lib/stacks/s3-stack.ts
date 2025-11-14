import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { BaseStack, BaseStackProps } from './base-stack';

export class S3Stack extends BaseStack {
  public readonly tradeDataBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: BaseStackProps) {
    super(scope, id, props);

    // Create S3 bucket with environment-specific configuration
    this.tradeDataBucket = new s3.Bucket(this, 'TradeDataBucket', {
      bucketName: this.getResourceName('trade-data'),
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: this.environmentConfig.s3Config.versioning,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      enforceSSL: true,
      lifecycleRules: this.getLifecycleRules(),
    });

    // Export bucket name and ARN
    this.exportToParameterStore(
      'trade-data-bucket-name',
      this.tradeDataBucket.bucketName
    );
    this.exportToParameterStore(
      'trade-data-bucket-arn',
      this.tradeDataBucket.bucketArn
    );
  }

  private getLifecycleRules(): s3.LifecycleRule[] {
    const rules: s3.LifecycleRule[] = [];

    // Add transition to Intelligent-Tiering after 30 days
    rules.push({
      id: 'IntelligentTiering',
      enabled: true,
      transitions: [
        {
          storageClass: s3.StorageClass.INTELLIGENT_TIERING,
          transitionAfter: cdk.Duration.days(30),
        },
      ],
    });

    // Add environment-specific expiration policy
    if (this.environmentConfig.s3Config.lifecycleDays !== undefined) {
      rules.push({
        id: 'Expiration',
        enabled: true,
        expiration: cdk.Duration.days(
          this.environmentConfig.s3Config.lifecycleDays
        ),
      });
    }

    // Clean up incomplete multipart uploads
    rules.push({
      id: 'CleanupMultipartUploads',
      enabled: true,
      abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
    });

    return rules;
  }
}
