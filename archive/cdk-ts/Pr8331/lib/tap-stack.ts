import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ServerlessStack } from './serverless-stack';

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

    // Create the serverless stack
    const serverlessStack = new ServerlessStack(this, 'ServerlessStack', {
      environmentSuffix: environmentSuffix,
      env: props?.env,
    });

    // Add outputs at the parent stack level (required for CI/CD validation)
    new cdk.CfnOutput(this, 'StackName', {
      value: this.stackName,
      description: 'Name of the deployed stack',
      exportName: `${this.stackName}-StackName`,
    });

    new cdk.CfnOutput(this, 'Region', {
      value: this.region,
      description: 'AWS region where the stack is deployed',
      exportName: `${this.stackName}-Region`,
    });

    new cdk.CfnOutput(this, 'EnvironmentSuffix', {
      value: environmentSuffix,
      description: 'Environment suffix used for resource naming',
      exportName: `${this.stackName}-EnvironmentSuffix`,
    });

    // Re-export ServerlessStack outputs at parent level for integration tests
    new cdk.CfnOutput(this, 'ProcessingBucketName', {
      value: serverlessStack.processingBucket.bucketName,
      description: 'S3 bucket for file processing input',
    });

    new cdk.CfnOutput(this, 'ProcessedBucketName', {
      value: serverlessStack.processedBucket.bucketName,
      description: 'S3 bucket for processed files output',
    });

    new cdk.CfnOutput(this, 'StateMachineArn', {
      value: serverlessStack.processingStateMachine.stateMachineArn,
      description: 'Step Functions state machine ARN',
    });

    new cdk.CfnOutput(this, 'EventBusName', {
      value: serverlessStack.processingBus.eventBusName,
      description: 'EventBridge custom bus name',
    });

    new cdk.CfnOutput(this, 'DashboardURL', {
      value: `https://${this.region}.console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${serverlessStack.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
    });

    new cdk.CfnOutput(this, 'AlertsTopicArn', {
      value: serverlessStack.alertsTopic.topicArn,
      description: 'SNS topic for processing alerts',
    });
  }
}
