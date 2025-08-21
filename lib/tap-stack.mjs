import * as cdk from 'aws-cdk-lib';
// import { LambdaStack } from './lambda-stack.mjs'; // Disabled due to IAM constraints
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

    // Lambda Stack - DISABLED DUE TO IAM PERMISSION CONSTRAINTS
    // const lambdaStack = new LambdaStack(scope, `LambdaStack${environmentSuffix}`, {
    //   environmentSuffix,
    //   env: props?.env,
    //   stackName: `prod-lambda-stack-${environmentSuffix}`,
    // });

    // API Gateway Stack - handles API routing (with mock integrations)
    const apiGatewayStack = new ApiGatewayStack(scope, `ApiGatewayStack${environmentSuffix}`, {
      environmentSuffix,
      env: props?.env,
      stackName: `prod-api-gateway-stack-${environmentSuffix}`,
      // Lambda functions disabled due to IAM constraints
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
      // Lambda functions disabled due to IAM constraints
      api: apiGatewayStack.api,
    });

    // Stack dependencies
    // Lambda stack disabled due to IAM constraints
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
