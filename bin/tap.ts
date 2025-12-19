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

// Create the main TapStack
new TapStack(app, 'TapStack', {
  env,
  description: 'Main TAP stack that orchestrates serverless infrastructure',
});

// Create the ServerlessStack
new ServerlessStack(app, 'ServerlessStack', {
  env,
  description: 'Serverless infrastructure with Lambda, API Gateway, S3, KMS, and EventBridge',
  environmentSuffix: 'dev',
});

app.synth();
