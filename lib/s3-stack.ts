import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { EnvironmentConfig } from './environment-config';

export interface S3StackProps extends cdk.StackProps {
  environmentConfig: EnvironmentConfig;
  environmentSuffix: string;
}

export class S3Stack extends cdk.Stack {
  public readonly dataBucket: s3.Bucket;
  public readonly logsBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: S3StackProps) {
    super(scope, id, props);

    const { environmentConfig, environmentSuffix } = props;

    // Data bucket
    this.dataBucket = new s3.Bucket(this, 'DataBucket', {
      bucketName: `tap-${environmentSuffix}-data-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`,
      versioned: environmentConfig.environmentName !== 'dev',
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: 'DeleteOldObjects',
          enabled: true,
          expiration: cdk.Duration.days(
            environmentConfig.s3BucketRetentionDays
          ),
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
    });

    // Logs bucket
    this.logsBucket = new s3.Bucket(this, 'LogsBucket', {
      bucketName: `tap-${environmentSuffix}-logs-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`,
      versioned: false,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: 'ArchiveLogFiles',
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
          ],
          expiration: cdk.Duration.days(
            Math.max(environmentConfig.s3BucketRetentionDays, 365)
          ),
        },
      ],
    });

    // Bucket policies
    const dataBucketPolicy = new s3.BucketPolicy(this, 'DataBucketPolicy', {
      bucket: this.dataBucket,
    });

    // Allow Lambda to read objects without encryption condition
    dataBucketPolicy.document.addStatements(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('lambda.amazonaws.com')],
        actions: ['s3:GetObject'],
        resources: [`${this.dataBucket.bucketArn}/*`],
      })
    );

    // Allow Lambda to put objects (encryption is enforced by bucket default encryption)
    dataBucketPolicy.document.addStatements(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('lambda.amazonaws.com')],
        actions: ['s3:PutObject'],
        resources: [`${this.dataBucket.bucketArn}/*`],
      })
    );

    // Outputs
    new cdk.CfnOutput(this, 'DataBucketName', {
      value: this.dataBucket.bucketName,
      description: `Data bucket name for ${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LogsBucketName', {
      value: this.logsBucket.bucketName,
      description: `Logs bucket name for ${environmentSuffix}`,
    });

    // Add tags
    cdk.Tags.of(this).add('Environment', environmentConfig.environmentName);
    cdk.Tags.of(this).add('EnvironmentSuffix', environmentSuffix);
    cdk.Tags.of(this).add('Component', 'S3');
  }
}
