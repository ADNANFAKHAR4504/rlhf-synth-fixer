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
      processingFunction: lambdaStack.processingFunction,
      streamingFunction: lambdaStack.streamingFunction,
      env: props?.env,
    });

    // Create Monitoring stack
    const monitoringStack = new MonitoringStack(this, 'MonitoringStack', {
      environmentSuffix,
      processingFunction: lambdaStack.processingFunction,
      streamingFunction: lambdaStack.streamingFunction,
      api: apiGatewayStack.api,
      env: props?.env,
    });

    // Add dependencies
    apiGatewayStack.addDependency(lambdaStack);
    monitoringStack.addDependency(lambdaStack);
    monitoringStack.addDependency(apiGatewayStack);

    // Global outputs
    new cdk.CfnOutput(this, 'Environment', {
      value: environmentSuffix,
      description: 'Environment suffix for this deployment',
    });

    new cdk.CfnOutput(this, 'Region', {
      value: this.region,
      description: 'AWS Region for this deployment',
    });
  }
}
