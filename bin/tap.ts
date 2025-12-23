#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const awsRegion = process.env.AWS_REGION || process.env.CDK_DEFAULT_REGION || 'us-east-1';
// For LocalStack deployments, always use 000000000000
const awsAccountId = process.env.CURRENT_ACCOUNT_ID || process.env.CDK_DEFAULT_ACCOUNT || '000000000000';

new TapStack(app, `TapStack-${environmentSuffix}`, {
  env: {
    account: awsAccountId,
    region: awsRegion,
  },
  environmentSuffix,
});

app.synth();
