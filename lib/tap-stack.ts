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
      'ServerlessInfrastructure',
      {
        environmentSuffix: environmentSuffix,
        env: props?.env,
      }
    );

    // ============================================================
    // MAIN STACK OUTPUTS - These will be captured in flat-outputs.json
    // ============================================================

    // Environment and Region
    new cdk.CfnOutput(this, 'StackEnvironmentSuffix', {
      value: environmentSuffix,
      description: 'Environment suffix used for this stack',
      exportName: `${this.stackName}-EnvironmentSuffix`,
    });

    new cdk.CfnOutput(this, 'Region', {
      value: this.region,
      description: 'AWS Region',
      exportName: `${this.stackName}-Region`,
    });

    // API Gateway outputs
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: serverlessStack.api.url,
      description: 'Enhanced API Gateway URL with tracing',
      exportName: `${this.stackName}-ApiGatewayUrl`,
    });

    new cdk.CfnOutput(this, 'ApiGatewayRestApiId', {
      value: serverlessStack.api.restApiId,
      description: 'API Gateway REST API ID',
      exportName: `${this.stackName}-ApiGatewayRestApiId`,
    });

    // Lambda Function outputs
    new cdk.CfnOutput(this, 'UserFunctionName', {
      value: serverlessStack.userFunction.functionName,
      description: 'User Lambda Function Name with Powertools',
      exportName: `${this.stackName}-UserFunctionName`,
    });

    new cdk.CfnOutput(this, 'UserFunctionArn', {
      value: serverlessStack.userFunction.functionArn,
      description: 'User Lambda Function ARN',
      exportName: `${this.stackName}-UserFunctionArn`,
    });

    new cdk.CfnOutput(this, 'OrderFunctionName', {
      value: serverlessStack.orderFunction.functionName,
      description: 'Order Lambda Function Name with Powertools',
      exportName: `${this.stackName}-OrderFunctionName`,
    });

    new cdk.CfnOutput(this, 'OrderFunctionArn', {
      value: serverlessStack.orderFunction.functionArn,
      description: 'Order Lambda Function ARN',
      exportName: `${this.stackName}-OrderFunctionArn`,
    });

    new cdk.CfnOutput(this, 'ScheduledProcessingFunctionName', {
      value: serverlessStack.scheduledProcessingFunction.functionName,
      description: 'Scheduled Processing Lambda Function Name',
      exportName: `${this.stackName}-ScheduledProcessingFunctionName`,
    });

    new cdk.CfnOutput(this, 'ScheduledProcessingFunctionArn', {
      value: serverlessStack.scheduledProcessingFunction.functionArn,
      description: 'Scheduled Processing Lambda Function ARN',
      exportName: `${this.stackName}-ScheduledProcessingFunctionArn`,
    });
  }
}
