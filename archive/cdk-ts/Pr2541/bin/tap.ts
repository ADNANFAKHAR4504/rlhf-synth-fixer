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
const primaryRegion = 'us-east-1';
const secondaryRegion = 'us-west-2';
const account = process.env.CDK_DEFAULT_ACCOUNT;

// Apply tags to all stacks in this app
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);
Tags.of(app).add('ManagedBy', 'aws-cdk');

// Primary region stack
new TapStack(app, `TapStack${environmentSuffix}-${primaryRegion}`, {
  stackName: `TapStack${environmentSuffix}-${primaryRegion}`,
  environmentSuffix: environmentSuffix,
  env: {
    account: account,
    region: primaryRegion,
  },
  // Enable termination protection for production
  terminationProtection: environmentSuffix === 'prod',
});

// Secondary region stack
new TapStack(app, `TapStack${environmentSuffix}-${secondaryRegion}`, {
  stackName: `TapStack${environmentSuffix}-${secondaryRegion}`,
  environmentSuffix: environmentSuffix,
  env: {
    account: account,
    region: secondaryRegion,
  },
  // Enable termination protection for production
  terminationProtection: environmentSuffix === 'prod',
});
