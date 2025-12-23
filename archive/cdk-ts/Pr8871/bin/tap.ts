#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const stackName = `TapStack${environmentSuffix}`;

// Get AWS region from environment or default to us-east-1
const region = process.env.CDK_DEFAULT_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
const account = process.env.CDK_DEFAULT_ACCOUNT;

// Create environment configuration
const env: cdk.Environment = account
  ? { account, region }
  : { region };

// Create the main stack
new TapStack(app, stackName, {
  environmentSuffix,
  env,
  description: 'Serverless application with S3, Lambda, and API Gateway',
  tags: {
    Environment: environmentSuffix,
    Project: 'TapStack',
    ManagedBy: 'CDK',
  },
});

app.synth();

