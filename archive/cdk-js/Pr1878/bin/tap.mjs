#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack.mjs';

const app = new cdk.App();

// Get environment suffix from context or environment variable
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || process.env.ENVIRONMENT_SUFFIX || 'dev';

// Create stack with environment suffix in the stack name
const stack = new TapStack(app, `TapStack${environmentSuffix}`, {
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.AWS_REGION || 'us-east-1'
  },
  description: `Secure web application infrastructure with VPC, ALB, and Auto Scaling - ${environmentSuffix}`,
  stackName: `TapStack${environmentSuffix}`
});

// Add output for stack name
new cdk.CfnOutput(stack, 'StackName', {
  value: stack.stackName,
  description: 'CloudFormation stack name'
});