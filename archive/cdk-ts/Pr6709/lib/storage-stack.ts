import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

interface StorageStackProps extends cdk.StackProps {
  environmentSuffix: string;
  encryptionKey: kms.IKey;
}

export class StorageStack extends cdk.Stack {
  public readonly applicationDataBucket: s3.Bucket;
  public readonly auditLogsBucket: s3.Bucket;
  public readonly accessLogsBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, props);

    // Access logs bucket (no logging on this bucket to avoid circular dependency)
    this.accessLogsBucket = new s3.Bucket(this, 'AccessLogsBucket', {
      bucketName: `access-logs-${props.environmentSuffix}-${this.account}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: props.encryptionKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: 'AccessLogsRetention',
          enabled: true,
          expiration: cdk.Duration.days(90),
        },
      ],
    });

    // Application data bucket with SSE-KMS encryption
    this.applicationDataBucket = new s3.Bucket(this, 'ApplicationDataBucket', {
      bucketName: `application-data-${props.environmentSuffix}-${this.account}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: props.encryptionKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      serverAccessLogsBucket: this.accessLogsBucket,
      serverAccessLogsPrefix: 'application-data-logs/',
      lifecycleRules: [
        {
          id: 'IntelligentTiering',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INTELLIGENT_TIERING,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
    });

    // Audit logs bucket with versioning and SSE-KMS encryption
    this.auditLogsBucket = new s3.Bucket(this, 'AuditLogsBucket', {
      bucketName: `audit-logs-${props.environmentSuffix}-${this.account}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: props.encryptionKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      serverAccessLogsBucket: this.accessLogsBucket,
      serverAccessLogsPrefix: 'audit-logs-logs/',
      lifecycleRules: [
        {
          id: 'AuditLogsRetention',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
          expiration: cdk.Duration.days(2555), // 7 years for compliance
        },
      ],
    });

    // Apply bucket policies to enforce encryption in transit
    [
      this.applicationDataBucket,
      this.auditLogsBucket,
      this.accessLogsBucket,
    ].forEach(bucket => {
      bucket.addToResourcePolicy(
        new cdk.aws_iam.PolicyStatement({
          effect: cdk.aws_iam.Effect.DENY,
          principals: [new cdk.aws_iam.AnyPrincipal()],
          actions: ['s3:*'],
          resources: [bucket.bucketArn, `${bucket.bucketArn}/*`],
          conditions: {
            Bool: {
              'aws:SecureTransport': 'false',
            },
          },
        })
      );
    });

    // Apply tags
    cdk.Tags.of(this).add('DataClassification', 'Confidential');
    cdk.Tags.of(this).add('Environment', props.environmentSuffix);
    cdk.Tags.of(this).add('Owner', 'security-team');

    // Outputs
    new cdk.CfnOutput(this, 'ApplicationDataBucketName', {
      value: this.applicationDataBucket.bucketName,
      description: 'Application Data S3 Bucket',
      exportName: `${props.environmentSuffix}-app-data-bucket`,
    });

    new cdk.CfnOutput(this, 'AuditLogsBucketName', {
      value: this.auditLogsBucket.bucketName,
      description: 'Audit Logs S3 Bucket',
      exportName: `${props.environmentSuffix}-audit-logs-bucket`,
    });
  }
}
