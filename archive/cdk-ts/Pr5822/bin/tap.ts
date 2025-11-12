#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { GlobalResourcesStack } from '../lib/global-resources-stack';
import { MultiRegionDRStack } from '../lib/multi-region-dr-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Apply tags to all stacks in this app
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

// Global resources (Route53, DynamoDB Global Tables)
const globalStack = new GlobalResourcesStack(
  app,
  `GlobalResourcesStack-${environmentSuffix}`,
  {
    stackName: `GlobalResourcesStack-${environmentSuffix}`,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: 'us-east-1',
    },
    environment: environmentSuffix,
  }
);

// Primary Region Stack
const primaryStack = new MultiRegionDRStack(
  app,
  `DRStackPrimary-${environmentSuffix}`,
  {
    stackName: `DRStackPrimary-${environmentSuffix}`,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: 'us-east-1',
    },
    isPrimary: true,
    environment: environmentSuffix,
    globalTableName: globalStack.globalTableName,
  }
);

// Secondary Region Stack
const secondaryStack = new MultiRegionDRStack(
  app,
  `DRStackSecondary-${environmentSuffix}`,
  {
    stackName: `DRStackSecondary-${environmentSuffix}`,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: 'us-west-2',
    },
    isPrimary: false,
    environment: environmentSuffix,
    globalTableName: globalStack.globalTableName,
  }
);

// Add dependencies
primaryStack.addDependency(globalStack);
secondaryStack.addDependency(globalStack);
