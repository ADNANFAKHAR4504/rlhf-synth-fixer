#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment from context or environment variable
const environment =
  app.node.tryGetContext('environment') ||
  process.env.ENVIRONMENT ||
  'dev';

// Get region from environment variable or default to us-east-1
const region = process.env.AWS_REGION || process.env.CDK_DEFAULT_REGION || 'us-east-1';
const account = process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID || '000000000000';

new TapStack(app, `TapStack${environment}`, {
  env: {
    account,
    region,
  },
  description: 'LocalStack-compatible healthcare application stack',
});

app.synth();
