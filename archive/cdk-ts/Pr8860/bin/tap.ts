#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const awsRegion = process.env.AWS_REGION || process.env.CDK_DEFAULT_REGION || 'us-east-1';
// Prioritize CDK_DEFAULT_ACCOUNT for LocalStack deployments (set to 000000000000)
// Falls back to CURRENT_ACCOUNT_ID for real AWS deployments
const awsAccountId = process.env.CDK_DEFAULT_ACCOUNT || process.env.CURRENT_ACCOUNT_ID || '000000000000';

new TapStack(app, `TapStack-${environmentSuffix}`, {
  env: {
    account: awsAccountId,
    region: awsRegion,
  },
  environmentSuffix,
});

app.synth();
