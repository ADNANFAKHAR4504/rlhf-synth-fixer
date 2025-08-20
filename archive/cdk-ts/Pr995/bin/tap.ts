#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const domainName = app.node.tryGetContext('domainName');
const hostedZoneId = app.node.tryGetContext('hostedZoneId');

const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

// Primary stack in ap-south-1
new TapStack(app, `TapStack-${environmentSuffix}-aps1`, {
  stackName: `TapStack-${environmentSuffix}-aps1`,
  environmentSuffix,
  domainName,
  hostedZoneId,
  isPrimaryRegion: true,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'ap-south-1',
  },
});

// Secondary stack in us-east-2
new TapStack(app, `TapStack-${environmentSuffix}-use2`, {
  stackName: `TapStack-${environmentSuffix}-use2`,
  environmentSuffix,
  domainName,
  hostedZoneId,
  isPrimaryRegion: false,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-2',
  },
});
