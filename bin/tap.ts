#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

// AWS SDK for SSO authentication (commented out until needed)
// import { SSOClient, ListAccountsCommand } from '@aws-sdk/client-sso';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const stackName = `TapStack${environmentSuffix}`;

const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// AWS Account and Region Configuration
const awsAccountId =
  process.env.AWS_ACCOUNT_ID ||
  app.node.tryGetContext('awsAccountId') ||
  '123456789012';
const awsRegion =
  process.env.AWS_DEFAULT_REGION ||
  app.node.tryGetContext('awsRegion') ||
  'us-east-1';

// Apply tags to all stacks in this app (optional - you can do this at stack level instead)
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

new TapStack(app, stackName, {
  stackName: stackName, // This ensures CloudFormation stack name includes the suffix
  environmentSuffix: environmentSuffix, // Pass the suffix to the stack
  env: {
    account: awsAccountId,
    region: awsRegion,
  },
});
