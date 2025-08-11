#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

const environmentSuffix =
  app.node.tryGetContext('environmentSuffix') ||
  process.env.ENVIRONMENT_SUFFIX ||
  'dev';

new TapStack(app, `TapStack${environmentSuffix}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.AWS_REGION || 'us-east-1',
  },
  description: 'Secure Financial Institution Infrastructure Stack',
});

// Apply default tags to all resources
cdk.Tags.of(app).add('Environment', 'production');
cdk.Tags.of(app).add('Owner', 'FinanceIT');
