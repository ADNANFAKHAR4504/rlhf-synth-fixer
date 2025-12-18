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

// Deploy stack to us-west-1 with fixed capacity
// Stack naming: TapStack${suffix}UsWest1 ensures get-outputs.sh can find it
// (it searches for stacks containing "TapStack${ENVIRONMENT_SUFFIX}")
new TapStack(app, `TapStack${environmentSuffix}UsWest1`, {
  stackName: `TapStack${environmentSuffix}UsWest1`,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-west-1',
  },
  description:
    'Multi-region infrastructure stack for us-west-1 with fixed DynamoDB capacity',
});

// Deploy stack to us-west-2 with configurable capacity
new TapStack(app, `TapStack${environmentSuffix}UsWest2`, {
  stackName: `TapStack${environmentSuffix}UsWest2`,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-west-2',
  },
  description:
    'Multi-region infrastructure stack for us-west-2 with configurable DynamoDB capacity',
});
