#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (used by CI/CD)
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';

// LocalStack detection
const isLocalStack = process.env.CDK_LOCAL === 'true' || 
                     process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
                     process.env.LOCALSTACK_HOSTNAME !== undefined;

new TapStack(app, `TapStack${environmentSuffix}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT || '123456789012',
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  isLocalStack,
});
