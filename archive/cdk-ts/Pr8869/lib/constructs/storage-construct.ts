import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

interface StorageConstructProps {
  environmentSuffix: string;
  region: string;
  allowedPrincipals: string[];
}

export class StorageConstruct extends Construct {
  public readonly bucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: StorageConstructProps) {
    super(scope, id);

    const { environmentSuffix, region, allowedPrincipals } = props;

    // Create S3 bucket with versioning and encryption
    this.bucket = new s3.Bucket(this, 'DevBucket', {
      // Let CDK auto-generate unique bucket name to avoid conflicts
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Allow deletion for testing
      // autoDeleteObjects disabled for LocalStack - causes custom resource asset upload failures
      // autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          expiration: cdk.Duration.days(365),
          noncurrentVersionExpiration: cdk.Duration.days(30),
          enabled: true,
        },
      ],
      publicReadAccess: false,
    });

    // Create bucket policy to restrict access to EC2 instances only
    const allowAccessStatement = new iam.PolicyStatement({
      sid: 'AllowEC2Access',
      effect: iam.Effect.ALLOW,
      principals: allowedPrincipals.map(arn =>
        iam.Role.fromRoleArn(this, `Role-${arn.split('/').pop()}`, arn)
      ),
      actions: [
        's3:GetObject',
        's3:PutObject',
        's3:DeleteObject',
        's3:ListBucket',
        's3:GetObjectVersion',
      ],
      resources: [this.bucket.bucketArn, `${this.bucket.bucketArn}/*`],
    });

    this.bucket.addToResourcePolicy(allowAccessStatement);

    // Enable S3 Metadata for comprehensive object visibility
    // Using stack name pattern: stackname-parameter-region-account (lowercase for S3)
    const metadataBucket = new s3.CfnBucket(this, 'BucketMetadata', {
      bucketName: `tapstack-${environmentSuffix}-${region}-${cdk.Aws.ACCOUNT_ID}`,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // Apply deletion policy
    metadataBucket.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // Tag storage resources
    cdk.Tags.of(this.bucket).add(
      'Name',
      `dev-bucket-${environmentSuffix}-${region}`
    );
    cdk.Tags.of(this.bucket).add('Purpose', 'DevStorage');
    cdk.Tags.of(this.bucket).add('Environment', environmentSuffix);
    cdk.Tags.of(this.bucket).add('Region', region);
    cdk.Tags.of(this.bucket).add('Versioning', 'Enabled');
    cdk.Tags.of(this.bucket).add('Encryption', 'S3Managed');

    // Output the bucket name for integration tests
    new cdk.CfnOutput(this, 'S3BucketName', {
      value: this.bucket.bucketName,
      description: 'Name of the S3 bucket',
    });
  }
}
