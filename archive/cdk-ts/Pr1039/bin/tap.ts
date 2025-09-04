#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { SecurityConfigStack } from '../lib/security-config-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Apply tags to all stacks in this app
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);
Tags.of(app).add('Project', 'SecurityConfiguration');

// Deploy to us-east-1 (primary region)
new SecurityConfigStack(
  app,
  `SecurityConfigStack-${environmentSuffix}-primary`,
  {
    stackName: `SecurityConfigStack-${environmentSuffix}-primary`,
    environmentSuffix: environmentSuffix,
    isPrimaryRegion: true,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: 'us-east-1',
    },
  }
);

// Deploy to us-west-2 (secondary region)
new SecurityConfigStack(
  app,
  `SecurityConfigStack-${environmentSuffix}-secondary`,
  {
    stackName: `SecurityConfigStack-${environmentSuffix}-secondary`,
    environmentSuffix: environmentSuffix,
    isPrimaryRegion: false,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: 'us-west-2',
    },
  }
);
