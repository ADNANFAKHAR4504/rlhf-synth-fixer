#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack.mjs';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Required regions for global deployment
const primaryRegion = 'us-east-1';
const secondaryRegion = 'ap-south-1';

// Apply global tags
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);
Tags.of(app).add('Project', 'GlobalAPI');
Tags.of(app).add('GDPRCompliant', 'Yes');

// Deploy to primary region (us-east-1)
const primaryStack = new TapStack(app, `TapStack${environmentSuffix}-${primaryRegion}`, {
  stackName: `TapStack${environmentSuffix}-${primaryRegion}`,
  environmentSuffix: environmentSuffix,
  isPrimary: true,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: primaryRegion,
  },
});

// Deploy to secondary region (ap-south-1)
const secondaryStack = new TapStack(app, `TapStack${environmentSuffix}-${secondaryRegion}`, {
  stackName: `TapStack${environmentSuffix}-${secondaryRegion}`,
  environmentSuffix: environmentSuffix,
  isPrimary: false,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: secondaryRegion,
  },
});
