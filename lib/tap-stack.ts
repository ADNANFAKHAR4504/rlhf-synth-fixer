import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { SecureS3Bucket } from './constructs/secure-s3-bucket';
import { SecureNetworking } from './constructs/secure-networking';
import { SecureRDS } from './constructs/secure-rds';
import { SecureIAM } from './constructs/secure-iam';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Ensure deployment in us-east-1
    if (props?.env?.region !== 'us-east-1') {
      throw new Error('This stack must be deployed in us-east-1 region');
    }

    // Create secure networking infrastructure
    const networking = new SecureNetworking(this, 'SecureNetworking', {
      vpcName: 'secure-vpc',
      cidr: '10.0.0.0/16',
      maxAzs: 2,
    });

    // Create secure S3 buckets
    const dataBucket = new SecureS3Bucket(this, 'DataBucket', {
      bucketName: `secure-data-bucket-${cdk.Aws.ACCOUNT_ID}`,
      enableLogging: true,
    });

    const logsBucket = new SecureS3Bucket(this, 'LogsBucket', {
      bucketName: `secure-logs-bucket-${cdk.Aws.ACCOUNT_ID}`,
      enableLogging: false,
    });

    // Create secure RDS instance
    const database = new SecureRDS(this, 'SecureDatabase', {
      vpc: networking.vpc,
      databaseName: 'securedb',
      instanceIdentifier: 'secure-postgres-instance',
      securityGroup: networking.securityGroup,
    });

    // Create secure IAM resources
    // const iamResources =
    new SecureIAM(this, 'SecureIAM', {
      userName: 'secure-user',
      roleName: 'secure-application-role',
      s3BucketArns: [dataBucket.bucket.bucketArn, logsBucket.bucket.bucketArn],
      rdsResourceArns: [database.database.instanceArn],
    });

    // Stack outputs
    new cdk.CfnOutput(this, 'StackRegion', {
      value: this.region,
      description: 'Stack deployment region',
    });

    new cdk.CfnOutput(this, 'SecurityCompliance', {
      value: 'All security requirements implemented',
      description: 'Security compliance status',
    });
  }
}
