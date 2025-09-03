import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NetworkingStack } from './networking-stack';
import { SecurityStack } from './security-stack';
import { StorageStack } from './storage-stack';
import { DatabaseStack } from './database-stack';
import { MonitoringStack } from './monitoring-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create Security Stack first (provides KMS key and roles)
    const securityStack = new SecurityStack(this, 'SecurityStack', {
      environmentSuffix,
      env: props?.env,
    });

    // Create Networking Stack
    const networkingStack = new NetworkingStack(this, 'NetworkingStack', {
      environmentSuffix,
      env: props?.env,
    });

    // Create Storage Stack
    const storageStack = new StorageStack(this, 'StorageStack', {
      environmentSuffix,
      encryptionKey: securityStack.encryptionKey,
      env: props?.env,
    });

    // Create Database Stack
    const databaseStack = new DatabaseStack(this, 'DatabaseStack', {
      environmentSuffix,
      vpc: networkingStack.vpc,
      encryptionKey: securityStack.encryptionKey,
      env: props?.env,
    });

    // Create Monitoring Stack
    const monitoringStack = new MonitoringStack(this, 'MonitoringStack', {
      environmentSuffix,
      encryptionKey: securityStack.encryptionKey,
      env: props?.env,
    });

    // Add dependencies
    storageStack.addDependency(securityStack);
    databaseStack.addDependency(networkingStack);
    databaseStack.addDependency(securityStack);
    monitoringStack.addDependency(securityStack);

    // Apply global tags
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('ProjectName', 'secure-infrastructure');
    cdk.Tags.of(this).add('CostCenter', 'security-team');

    // Stack outputs for integration tests
    new cdk.CfnOutput(this, 'VPCId', {
      value: networkingStack.vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'KMSKeyId', {
      value: securityStack.encryptionKey.keyId,
      description: 'KMS Key ID',
    });

    new cdk.CfnOutput(this, 'StateBucketName', {
      value: storageStack.stateBucket.bucketName,
      description: 'State Bucket Name',
    });

    new cdk.CfnOutput(this, 'LockTableName', {
      value: storageStack.lockTable.tableName,
      description: 'DynamoDB Lock Table Name',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: databaseStack.database.dbInstanceEndpointAddress,
      description: 'RDS Database Endpoint',
    });

    new cdk.CfnOutput(this, 'LogGroupName', {
      value: monitoringStack.logGroup.logGroupName,
      description: 'CloudWatch Log Group Name',
    });

    new cdk.CfnOutput(this, 'AlertsTopicArn', {
      value: monitoringStack.alertsTopic.topicArn,
      description: 'SNS Alerts Topic ARN',
    });
  }
}
