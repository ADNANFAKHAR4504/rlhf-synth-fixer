import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface S3ConstructProps {
  environment: string;
  region: string;
  suffix: string;
  environmentSuffix: string;
}

export class S3Construct extends Construct {
  public readonly bucket: s3.Bucket;
  public readonly logsBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: S3ConstructProps) {
    super(scope, id);

    const { environment, region, suffix, environmentSuffix } = props;

    // S3 Bucket with comprehensive security - Requirement 9
    this.bucket = new s3.Bucket(
      this,
      `AppBucket${environmentSuffix}${region}`,
      {
        bucketName:
          `${environment}-${region}-app-bucket-${suffix}`.toLowerCase(),
        versioned: true, // Requirement 9
        encryption: s3.BucketEncryption.S3_MANAGED,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        enforceSSL: true, // Basic HTTPS enforcement
        lifecycleRules: [
          {
            id: 'delete-old-versions',
            noncurrentVersionExpiration: cdk.Duration.days(90),
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
        removalPolicy: cdk.RemovalPolicy.DESTROY, // Allow deletion when stack fails
        autoDeleteObjects: true,
      }
    );

    // Explicit bucket policy for robust HTTPS-only enforcement - Addresses MODEL_FAILURES item 6
    const httpsOnlyPolicy = new iam.PolicyStatement({
      sid: 'DenyInsecureConnections',
      effect: iam.Effect.DENY,
      principals: [new iam.AnyPrincipal()],
      actions: ['s3:*'],
      resources: [this.bucket.bucketArn, `${this.bucket.bucketArn}/*`],
      conditions: {
        Bool: {
          'aws:SecureTransport': 'false',
        },
      },
    });

    this.bucket.addToResourcePolicy(httpsOnlyPolicy);

    // CloudFront/ALB logs bucket
    this.logsBucket = new s3.Bucket(
      this,
      `LogsBucket${environmentSuffix}${region}`,
      {
        bucketName:
          `${environment}-${region}-logs-bucket-${suffix}`.toLowerCase(),
        encryption: s3.BucketEncryption.S3_MANAGED,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        enforceSSL: true,
        lifecycleRules: [
          {
            id: 'delete-old-logs',
            expiration: cdk.Duration.days(90),
            abortIncompleteMultipartUploadAfter: cdk.Duration.days(1),
          },
        ],
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      }
    );

    // Apply the same HTTPS-only policy to logs bucket
    this.logsBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'DenyInsecureConnections',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:*'],
        resources: [
          this.logsBucket.bucketArn,
          `${this.logsBucket.bucketArn}/*`,
        ],
        conditions: {
          Bool: {
            'aws:SecureTransport': 'false',
          },
        },
      })
    );

    // Apply tags
    cdk.Tags.of(this.bucket).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(this.bucket).add('Environment', environment);
    cdk.Tags.of(this.bucket).add('Region', region);
    cdk.Tags.of(this.bucket).add('Purpose', 'Application');

    cdk.Tags.of(this.logsBucket).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(this.logsBucket).add('Environment', environment);
    cdk.Tags.of(this.logsBucket).add('Region', region);
    cdk.Tags.of(this.logsBucket).add('Purpose', 'Logs');
  }
}
