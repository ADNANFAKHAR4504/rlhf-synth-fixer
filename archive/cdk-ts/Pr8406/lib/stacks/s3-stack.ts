import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

interface S3StackProps {
  environment: string;
  isPrimary: boolean;
  region: string;
}

export class S3Stack extends Construct {
  public readonly dataIngestionBucket: s3.Bucket;
  public readonly bucketName: string;

  constructor(scope: Construct, id: string, props: S3StackProps) {
    super(scope, id);

    const { environment, isPrimary } = props;
    const region = cdk.Stack.of(this).region;

    // Create S3 bucket for data ingestion
    this.bucketName = `serverless-data-ingestion-${environment}-${region}`;

    this.dataIngestionBucket = new s3.Bucket(this, 'DataIngestionBucket', {
      bucketName: this.bucketName,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: 'DataLifecycleRule',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
            {
              storageClass: s3.StorageClass.DEEP_ARCHIVE,
              transitionAfter: cdk.Duration.days(365),
            },
          ],
          expiration: cdk.Duration.days(2555), // 7 years
        },
      ],
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
          ],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
          maxAge: 3000,
        },
      ],
    });

    // Add tags for cost allocation and governance
    cdk.Tags.of(this.dataIngestionBucket).add('Environment', environment);
    cdk.Tags.of(this.dataIngestionBucket).add('Service', 'DataIngestion');
    cdk.Tags.of(this.dataIngestionBucket).add('Region', region);
    cdk.Tags.of(this.dataIngestionBucket).add(
      'IsPrimary',
      isPrimary.toString()
    );

    // Create bucket policy for additional security
    const bucketPolicy = new s3.BucketPolicy(
      this,
      'DataIngestionBucketPolicy',
      {
        bucket: this.dataIngestionBucket,
      }
    );

    bucketPolicy.document.addStatements(
      new iam.PolicyStatement({
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:*'],
        resources: [
          this.dataIngestionBucket.bucketArn,
          `${this.dataIngestionBucket.bucketArn}/*`,
        ],
        conditions: {
          Bool: {
            'aws:SecureTransport': 'false',
          },
        },
      }),
      new iam.PolicyStatement({
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:PutObject'],
        resources: [`${this.dataIngestionBucket.bucketArn}/*`],
        conditions: {
          StringNotEquals: {
            's3:x-amz-server-side-encryption': 'AES256',
          },
        },
      })
    );

    // Output the bucket name and ARN
    new cdk.CfnOutput(this, 'DataIngestionBucketName', {
      value: this.dataIngestionBucket.bucketName,
      description: 'Name of the data ingestion S3 bucket',
      exportName: `serverless-data-ingestion-bucket-name-${region}`,
    });

    new cdk.CfnOutput(this, 'DataIngestionBucketArn', {
      value: this.dataIngestionBucket.bucketArn,
      description: 'ARN of the data ingestion S3 bucket',
      exportName: `serverless-data-ingestion-bucket-arn-${region}`,
    });
  }
}
