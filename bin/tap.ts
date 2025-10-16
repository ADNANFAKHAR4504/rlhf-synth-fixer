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

// Multi-region support: create stacks in both us-east-1 and us-west-2 when
// context key 'multiRegion' is truthy. Default behavior is single-stack.
const multiRegion = app.node.tryGetContext('multiRegion') || false;

if (multiRegion) {
  // Primary region (us-east-1)
  const primarySuffix = `${environmentSuffix}-use1`;
  const primaryName = `TapStack${primarySuffix}`;
  new TapStack(app, primaryName, {
    stackName: primaryName,
    environmentSuffix: primarySuffix,
    env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'us-east-1' },
  });

  // Secondary region (us-west-2)
  const secondarySuffix = `${environmentSuffix}-usw2`;
  const secondaryName = `TapStack${secondarySuffix}`;
  new TapStack(app, secondaryName, {
    stackName: secondaryName,
    environmentSuffix: secondarySuffix,
    env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'us-west-2' },
  });
} else {
  const stackName = `TapStack${environmentSuffix}`;
  new TapStack(app, stackName, {
    stackName: stackName, // ensures CloudFormation stack name includes the suffix
    environmentSuffix: environmentSuffix,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION,
    },
  });
}
