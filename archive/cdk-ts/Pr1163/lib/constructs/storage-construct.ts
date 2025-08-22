import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

export interface StorageConstructProps {
  environment: string;
  alertTopic: sns.Topic;
}

export class StorageConstruct extends Construct {
  public readonly secureS3Bucket: s3.Bucket;
  public readonly secureS3BucketPolicy: iam.Policy;

  constructor(scope: Construct, id: string, props: StorageConstructProps) {
    super(scope, id);

    const { environment, alertTopic } = props;

    // Create secure S3 bucket
    this.secureS3Bucket = new s3.Bucket(this, `SecureBucket-${environment}`, {
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      enforceSSL: true,
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          enabled: true,
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
    });

    // Create IAM policy for S3 bucket access
    this.secureS3BucketPolicy = new iam.Policy(
      this,
      `S3AccessPolicy-${environment}`,
      {
        policyName: `secure-bucket-policy-${environment}-001`,
        statements: [
          new iam.PolicyStatement({
            actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
            resources: [
              this.secureS3Bucket.bucketArn,
              `${this.secureS3Bucket.bucketArn}/*`,
            ],
          }),
        ],
      }
    );

    // Add S3 bucket notification for security monitoring
    this.secureS3Bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.SnsDestination(alertTopic)
    );

    // Tag resources
    cdk.Tags.of(this.secureS3Bucket).add('Name', `SecureBucket-${environment}`);
    cdk.Tags.of(this.secureS3Bucket).add('Component', 'Storage');
    cdk.Tags.of(this.secureS3Bucket).add('Environment', environment);
  }
}
