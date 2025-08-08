#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';

const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Apply global tags to all stacks
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);
Tags.of(app).add('Project', 'MultiRegionDevEnvironment');

// Deploy infrastructure to both regions
const usEast1Stack = new TapStack(app, `TapStack${environmentSuffix}-useast1`, {
  stackName: `TapStack${environmentSuffix}-useast1`,
  environmentSuffix: environmentSuffix,
  region: 'us-east-1',
  isPrimaryRegion: true,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
});

const usWest1Stack = new TapStack(app, `TapStack${environmentSuffix}-uswest1`, {
  stackName: `TapStack${environmentSuffix}-uswest1`,
  environmentSuffix: environmentSuffix,
  region: 'us-west-1',
  isPrimaryRegion: false,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-west-1',
  },
});

// Add region-specific tags
Tags.of(usEast1Stack).add('Region', 'us-east-1');
Tags.of(usEast1Stack).add('RegionType', 'primary');
Tags.of(usWest1Stack).add('Region', 'us-west-1');
Tags.of(usWest1Stack).add('RegionType', 'secondary');
