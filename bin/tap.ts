#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context or use default
const environmentSuffix =
  app.node.tryGetContext('environmentSuffix') || 'dev';

new TapStack(app, 'TapStack', {
  environmentSuffix,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT || process.env.CURRENT_ACCOUNT_ID,
    region: process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION || 'us-east-1',
  },
});
