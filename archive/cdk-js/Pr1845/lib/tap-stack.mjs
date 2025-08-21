import * as cdk from 'aws-cdk-lib';
import { LambdaStack } from './lambda-stack.mjs';
import { ApiGatewayStack } from './api-gateway-stack.mjs';
import { SecurityStack } from './security-stack.mjs';
import { MonitoringStack } from './monitoring-stack.mjs';

export class TapStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Lambda Stack - contains all Lambda functions with proper security
    const lambdaStack = new LambdaStack(scope, `LambdaStack${environmentSuffix}`, {
      environmentSuffix,
      env: props?.env,
      stackName: `prod-lambda-stack-${environmentSuffix}`,
    });

    // API Gateway Stack - handles API routing with Lambda integrations
    const apiGatewayStack = new ApiGatewayStack(scope, `ApiGatewayStack${environmentSuffix}`, {
      environmentSuffix,
      env: props?.env,
      stackName: `prod-api-gateway-stack-${environmentSuffix}`,
      lambdaStack,
    });

    // Security Stack - handles WAF and security policies
    const securityStack = new SecurityStack(scope, `SecurityStack${environmentSuffix}`, {
      environmentSuffix,
      env: props?.env,
      stackName: `prod-security-stack-${environmentSuffix}`,
      api: apiGatewayStack.api,
    });

    // Monitoring Stack - handles CloudWatch, alarms, and Config
    const monitoringStack = new MonitoringStack(scope, `MonitoringStack${environmentSuffix}`, {
      environmentSuffix,
      env: props?.env,
      stackName: `prod-monitoring-stack-${environmentSuffix}`,
      lambdaStack,
      api: apiGatewayStack.api,
    });

    // Stack dependencies
    apiGatewayStack.addDependency(lambdaStack);
    securityStack.addDependency(apiGatewayStack);
    monitoringStack.addDependency(apiGatewayStack);

    // Global outputs
    new cdk.CfnOutput(this, 'StackRegion', {
      value: this.region,
      description: 'Deployment region',
    });

    new cdk.CfnOutput(this, 'Environment', {
      value: environmentSuffix,
      description: 'Environment suffix',
    });
  }
}
