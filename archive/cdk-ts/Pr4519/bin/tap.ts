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
Tags.of(app).add('environment', environmentSuffix);
Tags.of(app).add('repository', repositoryName);
Tags.of(app).add('author', commitAuthor);
Tags.of(app).add('project', 'tap-stack');
Tags.of(app).add('component', 'cicd-pipeline');

// Create TapStack for us-east-1 region
new TapStack(app, `${stackName}-us-east-1`, {
  stackName: `${stackName}-us-east-1`, // Region-specific stack name
  environmentSuffix: environmentSuffix, // Pass the suffix to the stack
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
  // CI/CD Pipeline Configuration
  githubOwner: process.env.GITHUB_OWNER || 'TuringGpt',
  githubRepo: process.env.GITHUB_REPO || 'iac-test-automations',
  githubBranch: process.env.GITHUB_BRANCH || 'main',
  notificationEmail: process.env.NOTIFICATION_EMAIL || 'prakhar.j@turing.com',
});

// Create TapStack for us-west-2 region
new TapStack(app, `${stackName}-us-west-2`, {
  stackName: `${stackName}-us-west-2`, // Region-specific stack name
  environmentSuffix: environmentSuffix, // Pass the suffix to the stack
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-west-2',
  },
  // CI/CD Pipeline Configuration
  githubOwner: process.env.GITHUB_OWNER || 'TuringGpt',
  githubRepo: process.env.GITHUB_REPO || 'iac-test-automations',
  githubBranch: process.env.GITHUB_BRANCH || 'main',
  notificationEmail: process.env.NOTIFICATION_EMAIL || 'prakhar.j@turing.com',
});
