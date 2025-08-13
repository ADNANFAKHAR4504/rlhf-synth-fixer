#!/usr/bin/env node
/// <reference types="node" />
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const stackBaseName = `TapStack${environmentSuffix}`;

// Multi-region configuration (defaults align with requirements)
const primaryRegion: string =
  app.node.tryGetContext('primaryRegion') || 'us-east-1';
const backupRegion: string =
  app.node.tryGetContext('backupRegion') || 'us-west-2';

const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Apply tags to all stacks in this app (optional - you can do this at stack level instead)
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

// Primary region stack
new TapStack(app, `${stackBaseName}-${primaryRegion}`, {
  stackName: `${stackBaseName}-${primaryRegion}`,
  environmentSuffix: environmentSuffix,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: primaryRegion,
  },
});

// Backup region stack
new TapStack(app, `${stackBaseName}-${backupRegion}`, {
  stackName: `${stackBaseName}-${backupRegion}`,
  environmentSuffix: environmentSuffix,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: backupRegion,
  },
});
