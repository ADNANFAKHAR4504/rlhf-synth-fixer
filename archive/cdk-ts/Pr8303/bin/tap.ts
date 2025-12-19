#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context or environment variable
const environmentSuffix =
  app.node.tryGetContext('environmentSuffix') ||
  process.env.ENVIRONMENT_SUFFIX ||
  'synth' + (process.env.PO_ID || 'trainr10');

// Stack name includes environment suffix for proper isolation
const stackName = `TapStack${environmentSuffix}`;

new TapStack(app, stackName, {
  environmentSuffix,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: `Serverless application infrastructure with API Gateway, Lambda, and DynamoDB (${environmentSuffix})`,
});

app.synth();
