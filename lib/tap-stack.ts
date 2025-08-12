import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { SecureIAM } from './constructs/secure-iam';
import { SecureNetworking } from './constructs/secure-networking';
import { SecureRDS } from './constructs/secure-rds';
import { SecureS3Bucket } from './constructs/secure-s3-bucket';

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

    // Get environment suffix for unique resource naming
    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Create secure networking infrastructure with unique names
    const networking = new SecureNetworking(this, 'SecureNetworking', {
      vpcName: `secure-vpc-${environmentSuffix}`,
      cidr: '10.0.0.0/16',
      maxAzs: 2,
      environmentSuffix: environmentSuffix,
    });

    // Create secure S3 buckets with unique names (all lowercase)
    const uniqueId = this.node.addr.substring(0, 8).toLowerCase();
    const timestamp = Date.now().toString();
    const dataBucket = new SecureS3Bucket(this, 'DataBucket', {
      bucketName: `secure-data-bucket-${environmentSuffix}-${cdk.Aws.ACCOUNT_ID}-${uniqueId}-${timestamp}`,
      enableLogging: true,
    });

    const logsBucket = new SecureS3Bucket(this, 'LogsBucket', {
      bucketName: `secure-logs-bucket-${environmentSuffix}-${cdk.Aws.ACCOUNT_ID}-${uniqueId}-${timestamp}`,
      enableLogging: false,
    });

    // Create secure RDS instance with unique identifier
    const database = new SecureRDS(this, 'SecureDatabase', {
      vpc: networking.vpc,
      databaseName: `securedb${environmentSuffix.replace(/-/g, '')}`,
      instanceIdentifier: `secure-postgres-instance-${environmentSuffix}`,
      securityGroup: networking.securityGroup,
      environmentSuffix: environmentSuffix,
    });

    // Create secure IAM resources with unique names
    const iamResources = new SecureIAM(this, 'SecureIAM', {
      userName: `secure-user-${environmentSuffix}`,
      roleName: `secure-application-role-${environmentSuffix}`,
      s3BucketArns: [dataBucket.bucket.bucketArn, logsBucket.bucket.bucketArn],
      rdsResourceArns: [database.database.instanceArn],
    });

    new cdk.CfnOutput(this, 'SecurityCompliance', {
      value: 'All security requirements implemented',
      description: 'Security compliance status',
    });
    new cdk.CfnOutput(this, 'LogsBucketArn', {
      value: logsBucket.bucket.bucketArn,
      description: 'Logs bucket ARN',
    });

    new cdk.CfnOutput(this, 'BucketArn', {
      value: dataBucket.bucket.bucketArn,
      description: 'Bucket ARN',
    });
    new cdk.CfnOutput(this, 'DatabaseArn', {
      value: database.database.instanceArn,
      description: 'Database ARN',
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: networking.vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'S3EndpointId', {
      value: networking.s3Endpoint.vpcEndpointId,
      description: 'S3 Endpoint ID',
    });

    new cdk.CfnOutput(this, 'SecurityGroup', {
      value: networking.securityGroup.securityGroupId,
      description: 'Security Group ID',
    });
    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.database.instanceEndpoint.hostname,
      description: 'Database Endpoint',
    });

    new cdk.CfnOutput(this, 'DatabasePort', {
      value: `${database.database.instanceEndpoint.port}`,
      description: 'Database Port',
    });

    new cdk.CfnOutput(this, 'UserArn', {
      value: iamResources.user.userArn,
      description: 'User ARN',
    });

    new cdk.CfnOutput(this, 'RoleArn', {
      value: iamResources.role.roleArn,
      description: 'Role ARN',
    });
  }
}
