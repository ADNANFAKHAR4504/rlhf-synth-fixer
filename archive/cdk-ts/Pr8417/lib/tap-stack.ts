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

    // Create the serverless infrastructure stack
    const serverlessStack = new ServerlessStack(
      this,
      `ServerlessStack${environmentSuffix}`,
      {
        environmentSuffix: environmentSuffix,
        env: props?.env,
      }
    );

    // Export outputs from nested stack to parent stack for easy access
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: serverlessStack.apiEndpoint,
      description: 'API Gateway endpoint URL',
      exportName: `${this.stackName}-ApiEndpoint`,
    });

    new cdk.CfnOutput(this, 'LogGroupName', {
      value: serverlessStack.logGroup.logGroupName,
      description: 'Centralized CloudWatch log group name',
      exportName: `${this.stackName}-LogGroupName`,
    });

    new cdk.CfnOutput(this, 'MonitoringTopicArn', {
      value: serverlessStack.snsTopicArn,
      description: 'SNS topic ARN for monitoring',
      exportName: `${this.stackName}-MonitoringTopicArn`,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionCount', {
      value: serverlessStack.lambdaFunctions.length.toString(),
      description: 'Number of Lambda functions deployed',
      exportName: `${this.stackName}-LambdaFunctionCount`,
    });

    new cdk.CfnOutput(this, 'EnvironmentSuffix', {
      value: environmentSuffix,
      description: 'Environment suffix used for resource naming',
      exportName: `${this.stackName}-EnvironmentSuffix`,
    });
  }
}
