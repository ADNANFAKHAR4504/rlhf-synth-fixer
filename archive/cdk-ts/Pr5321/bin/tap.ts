#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Multi-region configuration
const deployRegion =
  app.node.tryGetContext('region') ||
  process.env.CDK_DEFAULT_REGION ||
  'us-east-1';
const isPrimary = deployRegion === 'us-east-1';
const primaryRegion = 'us-east-1';
const drRegion = 'eu-west-1';

// Apply tags to all stacks in this app
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

// Create the primary or DR stack based on the deployment region
const stackName = `TapStack${environmentSuffix}`;
new TapStack(app, stackName, {
  stackName: stackName,
  environmentSuffix: environmentSuffix,
  isPrimary: isPrimary,
  primaryRegion: primaryRegion,
  drRegion: drRegion,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: deployRegion,
  },
});
