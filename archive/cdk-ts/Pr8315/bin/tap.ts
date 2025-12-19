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

// Detect LocalStack environment - only when AWS_ENDPOINT_URL is set
// This ensures we don't use LocalStack account during CI/CD synth
const isLocalStack =
  process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
  process.env.AWS_ENDPOINT_URL?.includes('4566');

// Use fixed LocalStack account only when deploying to LocalStack
// During CI/CD synth, this will use the default AWS account
const account = isLocalStack
  ? '000000000000'
  : process.env.CDK_DEFAULT_ACCOUNT || process.env.CURRENT_ACCOUNT_ID;

const region = process.env.CDK_DEFAULT_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';

new TapStack(app, `TapStack${environmentSuffix}`, {
  environmentSuffix,
  env: {
    account,
    region,
  },
});

app.synth();
