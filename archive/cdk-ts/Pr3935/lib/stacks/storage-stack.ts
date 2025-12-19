import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

interface StorageStackProps extends cdk.NestedStackProps {
  environmentSuffix: string;
  kmsKey: kms.Key;
  tags?: { [key: string]: string };
}

export class StorageStack extends cdk.NestedStack {
  public readonly logBucket: s3.Bucket;
  public readonly cloudTrailBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, props);

    // Apply tags to all resources in this stack
    cdk.Tags.of(this).add('iac-rlhf-amazon', 'true');

    // Create S3 bucket for ALB logs (ALB doesn't support KMS encryption)
    this.logBucket = new s3.Bucket(this, 'ALBLogBucket', {
      bucketName: `${cdk.Stack.of(this).account}-${props.environmentSuffix}-alb-logs-v4`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: true,
      lifecycleRules: [
        {
          id: 'delete-old-logs',
          enabled: true,
          expiration: cdk.Duration.days(90),
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
    });

    // Add bucket policy for ALB access
    this.logBucket.addToResourcePolicy(
      new cdk.aws_iam.PolicyStatement({
        effect: cdk.aws_iam.Effect.ALLOW,
        principals: [
          new cdk.aws_iam.ServicePrincipal(
            'elasticloadbalancing.amazonaws.com'
          ),
        ],
        actions: ['s3:PutObject'],
        resources: [`${this.logBucket.bucketArn}/*`],
      })
    );

    // Create S3 bucket for CloudTrail logs
    this.cloudTrailBucket = new s3.Bucket(this, 'CloudTrailBucket', {
      bucketName: `${cdk.Stack.of(this).account}-${props.environmentSuffix}-cloudtrail-v4`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: props.kmsKey,
      enforceSSL: true,
      versioned: true,
      lifecycleRules: [
        {
          id: 'delete-old-trails',
          enabled: true,
          expiration: cdk.Duration.days(365),
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
    });

    // Add bucket policy for CloudTrail access
    this.cloudTrailBucket.addToResourcePolicy(
      new cdk.aws_iam.PolicyStatement({
        sid: 'AWSCloudTrailAclCheck',
        effect: cdk.aws_iam.Effect.ALLOW,
        principals: [
          new cdk.aws_iam.ServicePrincipal('cloudtrail.amazonaws.com'),
        ],
        actions: ['s3:GetBucketAcl'],
        resources: [this.cloudTrailBucket.bucketArn],
      })
    );

    this.cloudTrailBucket.addToResourcePolicy(
      new cdk.aws_iam.PolicyStatement({
        sid: 'AWSCloudTrailWrite',
        effect: cdk.aws_iam.Effect.ALLOW,
        principals: [
          new cdk.aws_iam.ServicePrincipal('cloudtrail.amazonaws.com'),
        ],
        actions: ['s3:PutObject'],
        resources: [`${this.cloudTrailBucket.bucketArn}/*`],
        conditions: {
          StringEquals: {
            's3:x-amz-server-side-encryption': 'aws:kms',
            's3:x-amz-server-side-encryption-aws-kms-key-id':
              props.kmsKey.keyArn,
          },
        },
      })
    );
  }
}
