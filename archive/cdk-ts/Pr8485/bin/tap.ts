#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context or environment variable
const environmentSuffix =
  app.node.tryGetContext('environmentSuffix') ||
  process.env.ENVIRONMENT_SUFFIX ||
  'synthtrainr268';

// LocalStack detection
const isLocalStack =
  process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
  process.env.AWS_ENDPOINT_URL?.includes('4566');

// Set account and region based on environment
const account = isLocalStack ? '000000000000' : process.env.CDK_DEFAULT_ACCOUNT;
const region = isLocalStack ? 'us-east-1' : 'us-west-2';

new TapStack(app, `TapStack-${environmentSuffix}`, {
  env: {
    account: account,
    region: region,
  },
});

app.synth();
