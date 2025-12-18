#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// LocalStack detection
const isLocalStack = process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
                     process.env.AWS_ENDPOINT_URL?.includes('4566');

// Get AWS region from environment or use default
const region = process.env.AWS_REGION || process.env.CDK_DEFAULT_REGION || 'us-east-1';
const account = process.env.CDK_DEFAULT_ACCOUNT || '000000000000';

// Get environment suffix from CDK context or environment variable
const envSuffix = app.node.tryGetContext('environmentSuffix') || process.env.ENVIRONMENT_SUFFIX || '';
const stackName = envSuffix ? `TapStack${envSuffix}` : 'TapStack';

new TapStack(app, stackName, {
  env: {
    account: account,
    region: region,
  },
  description: 'TAP Stack - LocalStack Compatible Infrastructure',
});

app.synth();
