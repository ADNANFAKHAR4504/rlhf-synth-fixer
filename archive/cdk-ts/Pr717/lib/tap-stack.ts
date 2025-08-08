import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ProjectXLambdaStack } from './lambda-stack';
import { ProjectXApiGatewayStack } from './api-gateway-stack';
import { ProjectXMonitoringStack } from './monitoring-stack';

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
    const lambdaStack = new ProjectXLambdaStack(
      scope,
      `ProjectXLambdaStack${environmentSuffix}`,
      {
        environmentSuffix,
        env: props?.env,
      }
    );

    // Create API Gateway stack with dependency on Lambda
    const apiGatewayStack = new ProjectXApiGatewayStack(
      scope,
      `ProjectXApiGatewayStack${environmentSuffix}`,
      {
        environmentSuffix,
        lambdaFunction: lambdaStack.lambdaFunction,
        env: props?.env,
      }
    );

    // Create Monitoring stack with dependencies on both Lambda and API Gateway
    const monitoringStack = new ProjectXMonitoringStack(
      scope,
      `ProjectXMonitoringStack${environmentSuffix}`,
      {
        environmentSuffix,
        lambdaFunction: lambdaStack.lambdaFunction,
        api: apiGatewayStack.api,
        env: props?.env,
      }
    );

    // Add stack dependencies
    apiGatewayStack.addDependency(lambdaStack);
    monitoringStack.addDependency(lambdaStack);
    monitoringStack.addDependency(apiGatewayStack);

    // Create outputs at the main stack level to expose nested stack outputs
    // Output for API Gateway URL (expected by integration tests)
    new cdk.CfnOutput(this, 'ProjectXApiUrl', {
      value: apiGatewayStack.api.url,
      description: 'ProjectX API Gateway URL',
      exportName: `projectX-api-url-${environmentSuffix}`,
    });

    // Output for Lambda Function ARN (expected by integration tests)
    new cdk.CfnOutput(this, 'ProjectXLambdaFunctionArn', {
      value: lambdaStack.lambdaFunction.functionArn,
      description: 'ProjectX Lambda Function ARN',
      exportName: `projectX-lambda-arn-${environmentSuffix}`,
    });

    // Output for API Gateway ID (expected by integration tests)
    new cdk.CfnOutput(this, 'ProjectXApiId', {
      value: apiGatewayStack.api.restApiId,
      description: 'ProjectX API Gateway ID',
      exportName: `projectX-api-id-${environmentSuffix}`,
    });

    // Output for CloudWatch Dashboard URL (expected by integration tests)
    new cdk.CfnOutput(this, 'ProjectXDashboardUrl', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=projectX-monitoring-${environmentSuffix}`,
      description: 'ProjectX CloudWatch Dashboard URL',
      exportName: `projectX-dashboard-url-${environmentSuffix}`,
    });

    // Keep the original output for backward compatibility
    new cdk.CfnOutput(this, 'ProjectXMainApiEndpoint', {
      value: apiGatewayStack.api.url,
      description: 'Main API endpoint for ProjectX serverless service',
      exportName: `projectX-api-endpoint-${environmentSuffix}`,
    });
  }
}
