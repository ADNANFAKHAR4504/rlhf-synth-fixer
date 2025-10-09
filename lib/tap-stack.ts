import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ComputeStack } from './compute-stack';
import { DatabaseStack } from './database-stack';
import { MonitoringStack } from './monitoring-stack';
import { NetworkStack } from './network-stack';
import { StorageStack } from './storage-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Network Stack
    const networkStack = new NetworkStack(this, 'NetworkStack', {
      vpcCidr: '10.200.0.0/16',
      environmentSuffix,
    });

    // Database Stack
    const databaseStack = new DatabaseStack(this, 'DatabaseStack', {
      vpc: networkStack.vpc,
      environmentSuffix,
    });

    // Storage Stack
    const storageStack = new StorageStack(this, 'StorageStack', {
      vpc: networkStack.vpc,
      environmentSuffix,
    });

    // Compute Stack
    const computeStack = new ComputeStack(this, 'ComputeStack', {
      vpc: networkStack.vpc,
      database: databaseStack.database,
      redisCluster: storageStack.redisCluster,
      redisSecurityGroup: storageStack.redisSecurityGroup,
      openSearchDomain: storageStack.openSearchDomain,
      openSearchSecurityGroup: storageStack.openSearchSecurityGroup,
      mediaBucket: storageStack.mediaBucket,
      environmentSuffix,
    });

    // Monitoring Stack
    new MonitoringStack(this, 'MonitoringStack', {
      alb: computeStack.alb,
      autoScalingGroup: computeStack.autoScalingGroup,
      environmentSuffix,
    });

    // Stack Outputs
    new cdk.CfnOutput(this, 'VPCId', {
      value: networkStack.vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'ALBDnsName', {
      value: computeStack.alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS Name',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: storageStack.mediaBucket.bucketName,
      description: 'S3 bucket name for media uploads',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: databaseStack.database.dbInstanceEndpointAddress,
      description: 'RDS Database endpoint',
    });

    new cdk.CfnOutput(this, 'RedisEndpoint', {
      value: storageStack.redisCluster.attrRedisEndpointAddress,
      description: 'Redis cache endpoint',
    });

    new cdk.CfnOutput(this, 'OpenSearchDomainEndpoint', {
      value: storageStack.openSearchDomain.domainEndpoint,
      description: 'OpenSearch domain endpoint',
    });

    new cdk.CfnOutput(this, 'AutoScalingGroupName', {
      value: computeStack.autoScalingGroup.autoScalingGroupName,
      description: 'Auto Scaling Group name',
    });
  }
}
