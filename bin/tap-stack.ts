#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';

// Detect LocalStack environment
const isLocalStack =
  process.env.CDK_LOCAL === 'true' ||
  process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
  process.env.LOCALSTACK_HOSTNAME !== undefined;

new TapStack(app, 'TapStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID,
    region: process.env.CDK_DEFAULT_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1',
  },
  isLocalStack,
  environmentSuffix,
});
