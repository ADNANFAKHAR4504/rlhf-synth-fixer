#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { EnvironmentConfigurations } from '../lib/config/environment-config';
import { VpcStack } from '../lib/stacks/vpc-stack';
import { DynamoDbStack } from '../lib/stacks/dynamodb-stack';
import { S3Stack } from '../lib/stacks/s3-stack';
import { SqsStack } from '../lib/stacks/sqs-stack';
import { LambdaStack } from '../lib/stacks/lambda-stack';
import { ApiGatewayStack } from '../lib/stacks/api-gateway-stack';
import { MonitoringStack } from '../lib/stacks/monitoring-stack';

const app = new cdk.App();

// Get environment from context or default to dev
const targetEnv = app.node.tryGetContext('env') || 'dev';
const environmentConfig = EnvironmentConfigurations.getByName(targetEnv);

// Get environmentSuffix from context or environment variable
const environmentSuffix =
  app.node.tryGetContext('environmentSuffix') ||
  process.env.ENVIRONMENT_SUFFIX ||
  environmentConfig.name;

// Create VPC stack
const vpcStack = new VpcStack(app, 'VpcStack', {
  environmentConfig: environmentConfig,
  stackName: `trading-vpc-${environmentSuffix}`,
  environmentSuffix: environmentSuffix,
  env: environmentConfig.env,
});

// Create DynamoDB stack
new DynamoDbStack(app, 'DynamoDbStack', {
  environmentConfig: environmentConfig,
  stackName: `trading-dynamodb-${environmentSuffix}`,
  environmentSuffix: environmentSuffix,
  env: environmentConfig.env,
});

// Create S3 stack
new S3Stack(app, 'S3Stack', {
  environmentConfig: environmentConfig,
  stackName: `trading-s3-${environmentSuffix}`,
  environmentSuffix: environmentSuffix,
  env: environmentConfig.env,
});

// Create SQS stack
new SqsStack(app, 'SqsStack', {
  environmentConfig: environmentConfig,
  stackName: `trading-sqs-${environmentSuffix}`,
  environmentSuffix: environmentSuffix,
  env: environmentConfig.env,
});

// Create Lambda stack
const lambdaStack = new LambdaStack(app, 'LambdaStack', {
  environmentConfig: environmentConfig,
  vpc: vpcStack.vpc,
  stackName: `trading-lambda-${environmentSuffix}`,
  environmentSuffix: environmentSuffix,
  env: environmentConfig.env,
});

// Create API Gateway stack
const apiGatewayStack = new ApiGatewayStack(app, 'ApiGatewayStack', {
  environmentConfig: environmentConfig,
  orderProcessingFunction: lambdaStack.orderProcessingFunction,
  stackName: `trading-api-${environmentSuffix}`,
  environmentSuffix: environmentSuffix,
  env: environmentConfig.env,
});

// Create Monitoring stack
new MonitoringStack(app, 'MonitoringStack', {
  environmentConfig: environmentConfig,
  stackName: `trading-monitoring-${environmentSuffix}`,
  environmentSuffix: environmentSuffix,
  env: environmentConfig.env,
});

// Stack dependencies
lambdaStack.addDependency(vpcStack);
apiGatewayStack.addDependency(lambdaStack);

// Export API endpoint
new cdk.CfnOutput(apiGatewayStack, 'ApiEndpoint', {
  value: apiGatewayStack.api.url,
  description: 'API Gateway endpoint URL',
  exportName: `trading-api-endpoint-${environmentSuffix}`,
});

app.synth();
