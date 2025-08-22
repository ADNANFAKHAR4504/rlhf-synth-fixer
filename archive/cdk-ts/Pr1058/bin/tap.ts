#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';

const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Apply global tags to all stacks in this app
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

// Primary region (us-east-1) deployment
const primaryRegion = 'us-east-1';
const primaryStackName = `TapStack${environmentSuffix}Primary`;

new TapStack(app, primaryStackName, {
  stackName: primaryStackName,
  environmentSuffix: environmentSuffix,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: primaryRegion,
  },
});

// Secondary region deployment commented out for now to focus on primary
// Uncomment when ready for multi-region deployment
// const secondaryRegion = 'us-west-2';
// const secondaryStackName = `TapStack${environmentSuffix}Secondary`;

// new TapStack(app, secondaryStackName, {
//   stackName: secondaryStackName,
//   environmentSuffix: environmentSuffix,
//   env: {
//     account: process.env.CDK_DEFAULT_ACCOUNT,
//     region: secondaryRegion,
//   },
// });
