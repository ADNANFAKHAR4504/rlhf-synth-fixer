#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';
const primaryRegion = 'us-east-1';
const secondaryRegion = 'us-west-1';
const globalClusterId = `global-financial-${environmentSuffix}`;
const globalTableName = `metadata-${environmentSuffix}`;
// Only enable Security Hub if not already enabled in the account
// Pass -c enableSecurityHub=true to enable it during deployment
const enableSecurityHub =
  app.node.tryGetContext('enableSecurityHub') === 'true';

Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

const primaryStack = new TapStack(app, `TapStackPrimary${environmentSuffix}`, {
  stackName: `TapStackPrimary${environmentSuffix}`,
  environmentSuffix: environmentSuffix,
  isPrimary: true,
  primaryRegion: primaryRegion,
  secondaryRegion: secondaryRegion,
  globalClusterId: globalClusterId,
  globalTableName: globalTableName,
  enableSecurityHub: enableSecurityHub,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: primaryRegion,
  },
  crossRegionReferences: true,
});

const secondaryStack = new TapStack(
  app,
  `TapStackSecondary${environmentSuffix}`,
  {
    stackName: `TapStackSecondary${environmentSuffix}`,
    environmentSuffix: environmentSuffix,
    isPrimary: false,
    primaryRegion: primaryRegion,
    secondaryRegion: secondaryRegion,
    globalClusterId: globalClusterId,
    globalTableName: globalTableName,
    enableSecurityHub: enableSecurityHub,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: secondaryRegion,
    },
    crossRegionReferences: true,
  }
);

secondaryStack.addDependency(primaryStack);
