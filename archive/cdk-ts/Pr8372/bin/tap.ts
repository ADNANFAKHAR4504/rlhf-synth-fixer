#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context or default to 'dev'
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';

// Detect LocalStack environment
const isLocalStack =
  process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
  process.env.AWS_ENDPOINT_URL?.includes('4566');

// Create the main stack
new TapStack(app, `TapStack-${environmentSuffix}`, {
  environmentSuffix: environmentSuffix,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT || '000000000000',
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: `Serverless S3 event processing stack for ${environmentSuffix} environment`,
  tags: {
    Environment: environmentSuffix,
    ManagedBy: 'CDK',
    LocalStack: isLocalStack ? 'true' : 'false',
  },
});

app.synth();
