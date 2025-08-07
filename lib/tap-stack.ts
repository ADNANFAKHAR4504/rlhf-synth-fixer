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

    // Output main API endpoint
    new cdk.CfnOutput(this, 'ProjectXMainApiEndpoint', {
      value: apiGatewayStack.api.url,
      description: 'Main API endpoint for ProjectX serverless service',
      exportName: `projectX-api-endpoint-${environmentSuffix}`,
    });
  }
}
