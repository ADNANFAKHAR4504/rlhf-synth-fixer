import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NetworkingConstruct } from './networking-construct';
import { DatabaseConstruct } from './database-construct';
import { StorageConstruct } from './storage-construct';
import { ComputeConstruct } from './compute-construct';
import { MonitoringConstruct } from './monitoring-construct';
import { SecurityConstruct } from './security-construct';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
  stackRegion: string;
  isPrimary: boolean;
  primaryVpcId?: string;
}

export class TapStack extends cdk.Stack {
  public readonly vpc: cdk.aws_ec2.Vpc;
  public readonly vpcId: string;
  public readonly networkingConstruct: NetworkingConstruct;

  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, {
      ...props,
      crossRegionReferences: true,
    });

    const { environmentSuffix, stackRegion, isPrimary, primaryVpcId } = props;

    // Common tags
    const commonTags = {
      Environment: environmentSuffix,
      Project: 'MultiRegionInfrastructure',
      Region: stackRegion,
      ManagedBy: 'CDK',
    };

    // Apply tags to all resources in the stack
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });

    // Security layer
    const securityConstruct = new SecurityConstruct(this, 'Security', {
      environmentSuffix,
      region: stackRegion,
    });

    // Networking layer
    this.networkingConstruct = new NetworkingConstruct(this, 'Networking', {
      environmentSuffix,
      region: stackRegion,
      isPrimary,
      primaryVpcId,
    });
    this.vpc = this.networkingConstruct.vpc;
    this.vpcId = this.vpc.vpcId;

    // Storage layer
    const storageConstruct = new StorageConstruct(this, 'Storage', {
      environmentSuffix,
      region: stackRegion,
      kmsKey: securityConstruct.kmsKey,
    });

    // Database layer
    const databaseConstruct = new DatabaseConstruct(this, 'Database', {
      environmentSuffix,
      region: stackRegion,
      vpc: this.vpc,
      isPrimary,
      kmsKey: securityConstruct.kmsKey,
    });

    // Compute layer
    const computeConstruct = new ComputeConstruct(this, 'Compute', {
      environmentSuffix,
      region: stackRegion,
      vpc: this.vpc,
      bucket: storageConstruct.bucket,
      dynamoDbTable: databaseConstruct.dynamoDbTable,
      executionRole: securityConstruct.lambdaExecutionRole,
    });

    // Monitoring layer
    new MonitoringConstruct(this, 'Monitoring', {
      environmentSuffix,
      region: stackRegion,
      alb: computeConstruct.alb,
      lambdaFunction: computeConstruct.lambdaFunction,
      rdsCluster: databaseConstruct.rdsCluster,
      dynamoDbTable: databaseConstruct.dynamoDbTable,
    });

    // Output important values
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: `VPC ID for ${stackRegion} region`,
    });

    new cdk.CfnOutput(this, 'ALBEndpoint', {
      value: computeConstruct.alb.loadBalancerDnsName,
      description: `ALB DNS endpoint for ${stackRegion} region`,
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: storageConstruct.bucket.bucketName,
      description: `S3 bucket name for ${stackRegion} region`,
    });

    new cdk.CfnOutput(this, 'DynamoDBTableName', {
      value: databaseConstruct.dynamoDbTable.tableName,
      description: `DynamoDB table name for ${stackRegion} region`,
    });

    new cdk.CfnOutput(this, 'RDSClusterEndpoint', {
      value: databaseConstruct.rdsCluster.clusterEndpoint.hostname,
      description: `RDS cluster endpoint for ${stackRegion} region`,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionArn', {
      value: computeConstruct.lambdaFunction.functionArn,
      description: `Lambda function ARN for ${stackRegion} region`,
    });
  }
}
