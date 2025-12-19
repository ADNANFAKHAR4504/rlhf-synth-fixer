#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Detect LocalStack environment
const isLocalStack =
  process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
  process.env.AWS_ENDPOINT_URL?.includes('4566') ||
  process.env.AWS_ENDPOINT_URL?.includes('localstack');

// Get environment suffix from context or environment variable, default to 'dev'
const environmentSuffix =
  app.node.tryGetContext('environmentSuffix') ||
  process.env.ENVIRONMENT_SUFFIX ||
  'dev';

// Get AWS region from environment or context, default to 'us-east-1'
const region =
  process.env.AWS_REGION ||
  process.env.CDK_DEFAULT_REGION ||
  app.node.tryGetContext('region') ||
  'us-east-1';

// For LocalStack, use the LocalStack default account ID
// For real AWS, get from environment or context
const account = isLocalStack
  ? '000000000000'
  : process.env.AWS_ACCOUNT_ID ||
    process.env.CURRENT_ACCOUNT_ID ||
    app.node.tryGetContext('account') ||
    process.env.CDK_DEFAULT_ACCOUNT;

new TapStack(app, `TapStack${environmentSuffix}`, {
  environmentSuffix,
  env: {
    account,
    region,
  },
  description: `ProjectX Serverless Web Service Stack (${environmentSuffix})`,
});

app.synth();
