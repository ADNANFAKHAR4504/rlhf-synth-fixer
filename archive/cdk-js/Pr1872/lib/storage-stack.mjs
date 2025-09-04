import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';

class StorageStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    
    // S3 bucket for application logs with versioning enabled
    this.logBucket = new s3.Bucket(this, 'ApplicationLogBucket', {
      bucketName: `app-logs-${environmentSuffix}-${this.account}-${this.region}`.toLowerCase(),
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          id: 'LogRetentionRule',
          enabled: true,
          expiration: cdk.Duration.days(365),
          noncurrentVersionExpiration: cdk.Duration.days(30),
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            }
          ]
        }
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true, // This enables auto-deletion of objects when bucket is destroyed
    });

    // Grant the EC2 role permissions to write logs
    if (props.ec2Role) {
      this.logBucket.grantWrite(props.ec2Role);
      this.logBucket.grantRead(props.ec2Role);
    }

    // Output bucket name
    new cdk.CfnOutput(this, 'LogBucketName', {
      value: this.logBucket.bucketName,
      description: 'S3 bucket name for application logs',
      exportName: `${this.stackName}-LogBucketName`,
    });

    new cdk.CfnOutput(this, 'LogBucketArn', {
      value: this.logBucket.bucketArn,
      description: 'S3 bucket ARN for application logs',
      exportName: `${this.stackName}-LogBucketArn`,
    });
  }
}

export { StorageStack };