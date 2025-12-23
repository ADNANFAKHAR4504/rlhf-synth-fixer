import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { LambdaStack } from './lambda-stack';
import { ApiGatewayStack } from './api-gateway-stack';
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

    // Create Lambda stack
    const lambdaStack = new LambdaStack(this, 'LambdaStack', {
      environmentSuffix,
      env: props?.env,
    });

    // Create API Gateway stack
    const apiGatewayStack = new ApiGatewayStack(this, 'ApiGatewayStack', {
      environmentSuffix,
      lambdaFunction: lambdaStack.lambdaFunction,
      env: props?.env,
    });

    // Create Monitoring stack
    const monitoringStack = new MonitoringStack(this, 'MonitoringStack', {
      environmentSuffix,
      lambdaFunction: lambdaStack.lambdaFunction,
      apiGateway: apiGatewayStack.restApi,
      env: props?.env,
    });

    // Add dependency
    apiGatewayStack.addDependency(lambdaStack);

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

    // Lambda outputs
    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: lambdaStack.lambdaFunction.functionName,
      description: 'Lambda Function Name',
      exportName: `${this.stackName}-LambdaFunctionName`,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionArn', {
      value: lambdaStack.lambdaFunction.functionArn,
      description: 'Lambda Function ARN',
      exportName: `${this.stackName}-LambdaFunctionArn`,
    });

    new cdk.CfnOutput(this, 'FunctionUrl', {
      value: lambdaStack.functionUrl.url,
      description: 'Lambda Function URL',
      exportName: `${this.stackName}-FunctionUrl`,
    });

    // API Gateway outputs
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: apiGatewayStack.restApi.url,
      description: 'API Gateway URL',
      exportName: `${this.stackName}-ApiGatewayUrl`,
    });

    new cdk.CfnOutput(this, 'ApiGatewayRestApiId', {
      value: apiGatewayStack.restApi.restApiId,
      description: 'API Gateway REST API ID',
      exportName: `${this.stackName}-ApiGatewayRestApiId`,
    });

    // Monitoring outputs
    new cdk.CfnOutput(this, 'AlertTopicArn', {
      value: monitoringStack.alertTopic.topicArn,
      description: 'SNS Topic ARN for alerts',
      exportName: `${this.stackName}-AlertTopicArn`,
    });

    new cdk.CfnOutput(this, 'DashboardName', {
      value: monitoringStack.dashboard.dashboardName,
      description: 'CloudWatch Dashboard Name',
      exportName: `${this.stackName}-DashboardName`,
    });

    new cdk.CfnOutput(this, 'DashboardUrl', {
      value: `https://${this.region}.console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${monitoringStack.dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
      exportName: `${this.stackName}-DashboardUrl`,
    });
  }
}
