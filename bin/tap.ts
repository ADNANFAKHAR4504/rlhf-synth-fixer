#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const stackName = `TapStack${environmentSuffix}`;
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Apply tags to all stacks in this app (optional - you can do this at stack level instead)
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

// 🔹 Multi-Region Configuration
const primaryRegion = 'us-east-1';
const drRegion = 'us-west-2';
const accountId = process.env.CDK_DEFAULT_ACCOUNT;

// 🔹 Deploy Primary Region Stack
const primaryStack = new TapStack(app, `${stackName}-Primary`, {
  stackName: `${stackName}-Primary`,
  environmentSuffix: environmentSuffix,
  isPrimary: true,
  drRegion: drRegion,
  crossRegionReferences: true,
  env: {
    account: accountId,
    region: primaryRegion,
  },
  description: `Aurora DR Primary Region Infrastructure (${primaryRegion})`,
  tags: {
    Environment: environmentSuffix,
    Region: 'primary',
    Repository: repositoryName,
    Author: commitAuthor,
  },
});

// 🔹 Deploy DR Region Stack
const drStack = new TapStack(app, `${stackName}-DR`, {
  stackName: `${stackName}-DR`,
  environmentSuffix: environmentSuffix,
  isPrimary: false,
  primaryRegion: primaryRegion,
  globalClusterIdentifier: primaryStack.globalClusterIdentifier,
  primaryVpcId: primaryStack.vpcId,
  primaryVpcCidr: primaryStack.vpcCidr,
  primaryKmsKeyArn: primaryStack.kmsKeyArn,
  primarySnapshotBucketArn: primaryStack.snapshotBucketArn,
  primarySecretArn: primaryStack.secretArn,
  crossRegionReferences: true,
  env: {
    account: accountId,
    region: drRegion,
  },
  description: `Aurora DR Secondary Region Infrastructure (${drRegion})`,
  tags: {
    Environment: environmentSuffix,
    Region: 'dr',
    Repository: repositoryName,
    Author: commitAuthor,
  },
});

// 🔹 Stack Dependencies
drStack.addDependency(primaryStack);
