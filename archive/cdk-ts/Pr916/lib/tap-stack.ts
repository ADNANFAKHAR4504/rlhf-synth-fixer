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
    new MonitoringStack(this, 'MonitoringStack', {
      environmentSuffix,
      lambdaFunction: lambdaStack.lambdaFunction,
      apiGateway: apiGatewayStack.restApi,
      env: props?.env,
    });

    // Add dependency
    apiGatewayStack.addDependency(lambdaStack);

    // Add stack-level outputs
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
  }
}
