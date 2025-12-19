#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context or environment variable
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || process.env.ENVIRONMENT_SUFFIX || 'dev';

// Detect LocalStack environment
const isLocalStack = process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
                     process.env.AWS_ENDPOINT_URL?.includes('4566') ||
                     process.env.LOCALSTACK === 'true';

// Configure stack for LocalStack deployment
const stackProps: cdk.StackProps = {
  env: {
    account: isLocalStack ? '000000000000' : process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.AWS_REGION || process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
};

new TapStack(app, `TapStack${environmentSuffix}`, {
  ...stackProps,
  environmentSuffix,
});

app.synth();
