#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const notificationEmail = process.env.NOTIFICATION_EMAIL || 'admin@example.com';
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

const primaryStack = new TapStack(app, `TapStackPrimary${environmentSuffix}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'ap-south-1',
  },
  isPrimaryRegion: true,
  environmentSuffix,
  notificationEmail,
});

const secondaryStack = new TapStack(
  app,
  `TapStackSecondary${environmentSuffix}`,
  {
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: 'us-east-2',
    },
    isPrimaryRegion: false,
    environmentSuffix,
    notificationEmail,
  }
);

secondaryStack.addDependency(primaryStack);

cdk.Tags.of(app).add('Environment', environmentSuffix);
cdk.Tags.of(app).add('Repository', repositoryName);
cdk.Tags.of(app).add('Author', commitAuthor);
cdk.Tags.of(app).add('Project', 'TAP');
