#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';

// Create the stack
new TapStack(app, `TapStack${environmentSuffix}`, {
  environmentSuffix,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID,
    region: process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION || 'us-east-1',
  },
  description: `TAP Stack for ${environmentSuffix} environment - VPC with public and private subnets`,
});

app.synth();
