import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

// Import your stacks here
import { InfrastructureStack } from './infrastructure-stack';

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

    // Instantiate the Infrastructure Stack
    const infrastructureStack = new InfrastructureStack(
      this,
      `InfrastructureStack-${environmentSuffix}`,
      {
        environmentSuffix,
        env: props?.env,
      }
    );

    // Bubble up Aurora outputs to the main TapStack so integration tests can find them
    new cdk.CfnOutput(this, 'VpcId', {
      value: infrastructureStack.vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'ClusterEndpoint', {
      value: infrastructureStack.dbCluster.clusterEndpoint.socketAddress,
      description: 'Aurora cluster endpoint',
    });

    new cdk.CfnOutput(this, 'ClusterReadEndpoint', {
      value: infrastructureStack.dbCluster.clusterReadEndpoint.socketAddress,
      description: 'Aurora cluster read endpoint',
    });

    new cdk.CfnOutput(this, 'SecretArn', {
      value: infrastructureStack.dbCluster.secret!.secretArn,
      description: 'Secret ARN for database credentials',
    });

    new cdk.CfnOutput(this, 'BackupBucketName', {
      value: infrastructureStack.backupBucket.bucketName,
      description: 'S3 bucket for database backups',
    });

    new cdk.CfnOutput(this, 'AlarmTopicArn', {
      value: infrastructureStack.alarmTopic.topicArn,
      description: 'SNS topic for database alarms',
    });
  }
}
