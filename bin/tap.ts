#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context or environment variable
const environmentSuffix =
  app.node.tryGetContext('environmentSuffix') ||
  process.env.ENVIRONMENT_SUFFIX ||
  process.env.PR_NUMBER ||
  'dev';

// Detect LocalStack environment
const isLocalStack =
  process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
  process.env.AWS_ENDPOINT_URL?.includes('4566') ||
  app.node.tryGetContext('localstack') === true ||
  app.node.tryGetContext('localstack') === 'true';

// Use fixed LocalStack account for CDK bootstrap compatibility
const account = isLocalStack
  ? '000000000000'
  : process.env.CDK_DEFAULT_ACCOUNT || process.env.CURRENT_ACCOUNT_ID;

const region = process.env.CDK_DEFAULT_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';

new TapStack(app, `TapStack-${environmentSuffix}`, {
  environmentSuffix,
  env: {
    account,
    region,
  },
});

app.synth();
