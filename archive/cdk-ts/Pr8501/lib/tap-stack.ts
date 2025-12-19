import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Detect if running in LocalStack
    const isLocalStack =
      process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
      process.env.AWS_ENDPOINT_URL?.includes('4566');

    // Create S3 bucket with Block Public Access enabled
    const secureS3Bucket = new s3.Bucket(this, 'SecureS3Bucket', {
      bucketName: `tap-${environmentSuffix}-secure-bucket-${cdk.Stack.of(this).region}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      lifecycleRules: [
        {
          id: 'DeleteIncompleteMultipartUploads',
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true, // Ensure bucket can be deleted even with objects
    });

    // Apply tags to all resources
    this.applyProductionTags();

    // Outputs for reference
    new cdk.CfnOutput(this, 'S3BucketName', {
      value: secureS3Bucket.bucketName,
      description: 'Secure S3 bucket name',
    });

    // LocalStack compatibility note
    if (isLocalStack) {
      new cdk.CfnOutput(this, 'LocalStackCompatibility', {
        value: 'true',
        description: 'Stack is running in LocalStack-compatible mode',
      });
    }
  }

  private applyProductionTags(): void {
    const tags = {
      Environment: 'Production',
      Project: 'TAP',
      ManagedBy: 'CDK',
      CreatedBy: 'Infrastructure Team',
      CostCenter: 'Engineering',
    };

    Object.entries(tags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });
  }
}
