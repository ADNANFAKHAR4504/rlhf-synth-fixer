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
Tags.of(app).add('Project', 'SecureInfrastructure');
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

// Deploy to primary region (us-west-1)
// Stack naming: TapStack{environmentSuffix}-Primary to match CI/CD script pattern grep "TapStack${env_suffix}"
new TapStack(app, `TapStack${environmentSuffix}-Primary`, {
  stackName: `TapStack${environmentSuffix}-Primary`,
  environmentSuffix: environmentSuffix,
  isPrimaryRegion: true,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-west-1',
  },
});

// Deploy to secondary region (us-east-1)
// Stack naming: TapStack{environmentSuffix}-Secondary to match CI/CD script pattern grep "TapStack${env_suffix}"
new TapStack(app, `TapStack${environmentSuffix}-Secondary`, {
  stackName: `TapStack${environmentSuffix}-Secondary`,
  environmentSuffix: environmentSuffix,
  isPrimaryRegion: false,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
});
