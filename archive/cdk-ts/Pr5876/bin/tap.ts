#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import 'source-map-support/register';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment configuration - use AWS_REGION override
const environment =
  app.node.tryGetContext('environmentSuffix') ||
  app.node.tryGetContext('environment') ||
  process.env.ENVIRONMENT ||
  'dev';
const region =
  process.env.AWS_REGION || process.env.CDK_DEFAULT_REGION || 'us-east-1';
const account = process.env.CDK_DEFAULT_ACCOUNT;

// Generate environment suffix for unique resource naming (keep original case)
const environmentSuffix = environment;
const stackName = `TapStack${environmentSuffix}`;

// Create the main stack with all constructs
new TapStack(app, stackName, {
  env: {
    account: account,
    region: region,
  },
  environment,
  environmentSuffix,
  description: `Multi-environment AWS infrastructure stack for ${environment}`,
  tags: {
    'iac-rlhf-amazon': 'true',
    Environment: environment,
    ManagedBy: 'CDK',
    Application: 'tap-stack',
    Repository: process.env.REPOSITORY || 'iac-test-automations',
    Author: process.env.COMMIT_AUTHOR || 'system',
  },
});

// Apply global tags to all resources
cdk.Tags.of(app).add('iac-rlhf-amazon', 'true');
cdk.Tags.of(app).add('Environment', environment);
cdk.Tags.of(app).add('ManagedBy', 'CDK');
