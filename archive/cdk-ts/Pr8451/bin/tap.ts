#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID || '000000000000',
  region: process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION || 'us-east-1',
};

// Get environment suffix from CDK context (passed via --context environmentSuffix=xxx)
// This will be used in both stack names and resource names
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';

// Create ONLY the main TapStack with environment suffix in stack name
// TapStack internally creates a ServerlessStack construct (not a separate stack)
// Stack name format: TapStack-pr8451 or TapStack-dev
new TapStack(app, `TapStack-${environmentSuffix}`, {
  env,
  description: 'Main TAP stack that orchestrates serverless infrastructure',
  environmentSuffix: environmentSuffix,
});

app.synth();
