#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from environment variable or default to 'dev'
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

new TapStack(app, `TapStack-${environmentSuffix}`, {
  environmentSuffix,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT || process.env.CURRENT_ACCOUNT_ID,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1'
  },
  description: 'Image Processing Pipeline with API Gateway, Lambda, S3, and SNS'
});

app.synth();
