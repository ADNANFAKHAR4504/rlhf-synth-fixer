#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Apply tags to all stacks in this app
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);
Tags.of(app).add('Project', 'tap-multi-region');

// Primary region stack (us-east-1)
const primaryStack = new TapStack(app, `TapStackPrimary${environmentSuffix}`, {
  stackName: `TapStackPrimary${environmentSuffix}`,
  environmentSuffix: environmentSuffix,
  isPrimary: true,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
});

// Secondary region stack (us-west-1)
const secondaryStack = new TapStack(
  app,
  `TapStackSecondary${environmentSuffix}`,
  {
    stackName: `TapStackSecondary${environmentSuffix}`,
    environmentSuffix: environmentSuffix,
    isPrimary: false,
    primaryRegion: 'us-east-1',
    primaryBucketArn: primaryStack.primaryBucketArn,
    primaryDatabaseIdentifier: primaryStack.databaseInstanceIdentifier,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: 'us-west-1',
    },
  }
);

// Add cross-stack dependency - Primary depends on Secondary to ensure replica bucket exists
primaryStack.addDependency(secondaryStack);
