import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

// Import your stacks here
import { ServerlessDataPipelineStack } from './serverless-data-pipeline-stack';

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

    // Create the consolidated serverless data pipeline stack
    const pipelineStack = new ServerlessDataPipelineStack(
      scope,
      `ServerlessDataPipelineStack${environmentSuffix}`,
      {
        ...props,
        env: {
          account: props?.env?.account,
          region: props?.env?.region || 'us-east-1',
        },
        environmentSuffix,
        notificationEmail: process.env.NOTIFICATION_EMAIL, // Optional email notifications
      }
    );

    // Apply production tags to the main stack
    cdk.Tags.of(this).add('Environment', 'Production');

    // Main stack outputs
    new cdk.CfnOutput(this, 'DeploymentSummary', {
      value: JSON.stringify({
        region: props?.env?.region || 'us-east-1',
        environmentSuffix: environmentSuffix,
        stacksDeployed: ['ServerlessDataPipeline'],
      }),
      description: 'Deployment summary information',
    });

    // Import all outputs from ServerlessDataPipelineStack for integration testing
    new cdk.CfnOutput(this, 'PipelineStackName', {
      value: pipelineStack.stackName,
      description: 'Pipeline stack name containing all resources',
      exportName: `PipelineStackName-${environmentSuffix}`,
    });

    // Key integration testing outputs from pipeline stack
    new cdk.CfnOutput(this, 'APIEndpoint', {
      value: pipelineStack.apiEndpoint,
      description: 'API Gateway endpoint URL for testing',
      exportName: `APIEndpoint-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'BucketName', {
      value: pipelineStack.bucketName,
      description: 'S3 bucket name for data uploads and testing',
      exportName: `DataBucket-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: pipelineStack.lambdaFunctionName,
      description: 'Lambda function name for testing',
      exportName: `LambdaFunctionName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'SNSTopicArn', {
      value: pipelineStack.snsTopicArn,
      description: 'SNS topic ARN for notifications and testing',
      exportName: `SNSTopicArn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'Region', {
      value: props?.env?.region || 'us-east-1',
      description: 'AWS region where resources are deployed',
      exportName: `Region-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'EnvironmentSuffix', {
      value: environmentSuffix,
      description: 'Environment suffix used for resource naming',
      exportName: `EnvironmentSuffix-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'IAMRoleName', {
      value: pipelineStack.iamRoleName,
      description: 'IAM role name for testing',
      exportName: `IAMRoleName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'IAMRoleArn', {
      value: pipelineStack.iamRoleArn,
      description: 'IAM role ARN for testing',
      exportName: `IAMRoleArn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'CloudWatchDashboardName', {
      value: pipelineStack.cloudWatchDashboardName,
      description: 'CloudWatch dashboard name for testing',
      exportName: `CloudWatchDashboardName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DashboardUrl', {
      value: pipelineStack.dashboardUrl,
      description: 'CloudWatch dashboard URL for testing',
      exportName: `DashboardUrl-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'SNSTopicName', {
      value: pipelineStack.snsTopicName,
      description: 'SNS topic name for testing',
      exportName: `SNSTopicName-${environmentSuffix}`,
    });
  }
}
