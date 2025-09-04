#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environmentSuffix from context or environment variable, default to 'dev'
const environmentSuffix =
  app.node.tryGetContext('environmentSuffix') ||
  process.env.ENVIRONMENT_SUFFIX ||
  'dev';

// Get environment from context or default to 'staging'
const environment = app.node.tryGetContext('environment') || 'staging';
const owner = app.node.tryGetContext('owner') || 'cloud-team';

// Create the stack with proper naming convention
new TapStack(app, `TapStack${environmentSuffix}`, {
  environment,
  owner,
  environmentSuffix,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-west-2',
  },
  stackName: `TapStack${environmentSuffix}`,
  description: `Cloud Environment Setup for ${environment} (${environmentSuffix})`,
});

// Add tags to the entire app
cdk.Tags.of(app).add('Project', 'CloudEnvironmentSetup');
cdk.Tags.of(app).add('ManagedBy', 'CDK');
cdk.Tags.of(app).add('EnvironmentSuffix', environmentSuffix);
