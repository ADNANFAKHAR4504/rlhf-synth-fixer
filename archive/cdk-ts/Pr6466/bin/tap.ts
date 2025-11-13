#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { PrimaryStack, SecondaryStack, SharedConfig } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const stackName = `TapStack${environmentSuffix}`;
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// 🔹 Region Configuration
const primaryRegion =
  app.node.tryGetContext('primaryRegion') ||
  process.env.PRIMARY_REGION ||
  'us-east-1';
const secondaryRegion =
  app.node.tryGetContext('secondaryRegion') ||
  process.env.SECONDARY_REGION ||
  'us-west-2';

// 🔹 Shared Configuration
const sharedConfig: SharedConfig = {
  domainName:
    app.node.tryGetContext('domainName') ||
    process.env.DOMAIN_NAME ||
    `payment-dr-${environmentSuffix}.example.com`,
  alertEmail:
    app.node.tryGetContext('alertEmail') ||
    process.env.ALERT_EMAIL ||
    'ops-team@example.com',
  tags: {
    Environment: 'Production',
    'DR-Tier': 'Critical',
    ManagedBy: 'CDK',
    Application: 'PaymentProcessor',
  },
};

// Apply tags to all stacks in this app
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

// 🔹 Primary Region Stack
const primaryStack = new PrimaryStack(app, `${stackName}-Primary`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: primaryRegion,
  },
  stackName: `${stackName}-Primary`,
  description: 'Primary region stack for payment processing DR solution',
  environmentSuffix: environmentSuffix,
  config: sharedConfig,
  replicationRegion: secondaryRegion,
});

// 🔹 Secondary Region Stack
const secondaryStack = new SecondaryStack(app, `${stackName}-Secondary`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: secondaryRegion,
  },
  stackName: `${stackName}-Secondary`,
  description: 'Secondary region stack for payment processing DR solution',
  environmentSuffix: environmentSuffix,
  config: sharedConfig,
  primaryRegion: primaryRegion,
  primaryVpcId: primaryStack.vpcId,
  primaryVpcCidr: primaryStack.vpcCidr,
  globalDatabaseId: primaryStack.globalDatabaseId,
  primaryLambdaUrl: primaryStack.lambdaUrl,
  primaryBucketArn: primaryStack.bucketArn,
});

// Apply cross-stack dependency
secondaryStack.addDependency(primaryStack);
