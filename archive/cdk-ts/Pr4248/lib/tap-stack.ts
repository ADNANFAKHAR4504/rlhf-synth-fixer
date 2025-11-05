import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ApiStack } from './api-stack';
import { CacheStack } from './cache-stack';
import { ComputeStack } from './compute-stack';
import { DatabaseStack } from './database-stack';
import { KmsStack } from './kms-stack';
import { MonitoringStack } from './monitoring-stack';
import { NetworkStack } from './network-stack';
import { SecretsStack } from './secrets-stack';
import { StorageStack } from './storage-stack';
import { StreamingStack } from './streaming-stack';

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

    // KMS Stack - Create encryption keys first
    const kmsStack = new KmsStack(this, 'KmsStack', {
      environmentSuffix,
    });

    // Network Stack - Create VPC and networking infrastructure
    const networkStack = new NetworkStack(this, 'NetworkStack', {
      environmentSuffix,
    });

    // Secrets Stack - Create secrets for database and application
    const secretsStack = new SecretsStack(this, 'SecretsStack', {
      environmentSuffix,
      kmsKey: kmsStack.secretsKey,
    });

    // Database Stack - Create RDS PostgreSQL Multi-AZ
    const databaseStack = new DatabaseStack(this, 'DatabaseStack', {
      environmentSuffix,
      vpc: networkStack.vpc,
      databaseSecurityGroup: networkStack.databaseSecurityGroup,
      databaseSecret: secretsStack.databaseSecret,
      kmsKey: kmsStack.rdsKey,
    });

    // Cache Stack - Create ElastiCache Redis cluster
    const cacheStack = new CacheStack(this, 'CacheStack', {
      environmentSuffix,
      vpc: networkStack.vpc,
      cacheSecurityGroup: networkStack.cacheSecurityGroup,
      kmsKey: kmsStack.elasticacheKey,
    });

    // Storage Stack - Create EFS file system
    const storageStack = new StorageStack(this, 'StorageStack', {
      environmentSuffix,
      vpc: networkStack.vpc,
      efsSecurityGroup: networkStack.efsSecurityGroup,
      kmsKey: kmsStack.efsKey,
    });

    // Streaming Stack - Create Kinesis Data Streams
    const streamingStack = new StreamingStack(this, 'StreamingStack', {
      environmentSuffix,
      kmsKey: kmsStack.kinesisKey,
    });

    // Compute Stack - Create ECS Fargate cluster and services
    const computeStack = new ComputeStack(this, 'ComputeStack', {
      environmentSuffix,
      vpc: networkStack.vpc,
      ecsSecurityGroup: networkStack.ecsSecurityGroup,
      loadBalancerSecurityGroup: networkStack.loadBalancerSecurityGroup,
      fileSystem: storageStack.fileSystem,
      databaseSecret: secretsStack.databaseSecret,
      applicationSecret: secretsStack.applicationSecret,
      redisEndpoint: cacheStack.redisEndpoint,
      kinesisStream: streamingStack.transactionStream,
    });

    // API Stack - Create API Gateway with WAF
    const apiStack = new ApiStack(this, 'ApiStack', {
      environmentSuffix,
      vpc: networkStack.vpc,
      vpcLink: computeStack.vpcLink,
      loadBalancer: computeStack.loadBalancer,
    });

    // Monitoring Stack - Create CloudWatch dashboards and alarms
    new MonitoringStack(this, 'MonitoringStack', {
      environmentSuffix,
      ecsCluster: computeStack.cluster,
      ecsService: computeStack.service,
      loadBalancer: computeStack.loadBalancer,
      targetGroup: computeStack.targetGroup,
      database: databaseStack.database,
      api: apiStack.api,
      kinesisStream: streamingStack.transactionStream,
    });

    // Stack outputs
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: apiStack.api.url || 'Not Available',
      description: 'API Gateway endpoint URL',
    });

    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: computeStack.loadBalancer.loadBalancerDnsName,
      description: 'Application Load Balancer DNS name',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: databaseStack.database.dbInstanceEndpointAddress,
      description: 'RDS database endpoint',
    });

    new cdk.CfnOutput(this, 'RedisEndpoint', {
      value: cacheStack.redisEndpoint,
      description: 'ElastiCache Redis endpoint',
    });

    new cdk.CfnOutput(this, 'KinesisStreamName', {
      value: streamingStack.transactionStream.streamName,
      description: 'Kinesis Data Stream name',
    });
  }
}
