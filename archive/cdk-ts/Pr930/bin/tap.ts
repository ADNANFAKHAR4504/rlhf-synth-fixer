#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import 'source-map-support/register';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

const environmentSuffix =
  app.node.tryGetContext('environmentSuffix') ||
  process.env.ENVIRONMENT_SUFFIX ||
  'dev';

const region = process.env.AWS_REGION || 'us-east-1';
const regionSuffix = region.toLowerCase().replace(/-/g, '');

new TapStack(app, `TapStack${environmentSuffix}${regionSuffix}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: region,
  },
  description: 'Secure Financial Institution Infrastructure Stack',
});

// Apply default tags to all resources
cdk.Tags.of(app).add('Environment', environmentSuffix);
cdk.Tags.of(app).add('Owner', 'FinanceIT');
