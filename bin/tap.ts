#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';
import { ServerlessStack } from '../lib/serverless-stack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID || '000000000000',
  region: process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION || 'us-east-1',
};

// Get environment suffix from context or environment variable
const environmentSuffix =
  app.node.tryGetContext('environmentSuffix') ||
  process.env.ENVIRONMENT_SUFFIX ||
  'dev';

// Create the main TapStack with environment suffix in stack name
new TapStack(app, `TapStack-${environmentSuffix}`, {
  env,
  description: 'Main TAP stack that orchestrates serverless infrastructure',
  environmentSuffix: environmentSuffix,
});

// Create the ServerlessStack with environment suffix in stack name
new ServerlessStack(app, `ServerlessStack-${environmentSuffix}`, {
  env,
  description: 'Serverless infrastructure with Lambda, API Gateway, S3, KMS, and EventBridge',
  environmentSuffix: environmentSuffix,
});

app.synth();
