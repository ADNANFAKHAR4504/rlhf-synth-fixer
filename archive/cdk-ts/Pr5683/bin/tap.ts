#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

const sourceRegion = 'us-east-1';
const targetRegion = 'us-east-2';

const sourceStack = new TapStack(
  app,
  `TapStack-${sourceRegion}-${environmentSuffix}`,
  {
    stackName: `TapStack-${sourceRegion}-${environmentSuffix}`,
    environmentSuffix: environmentSuffix,
    isSourceRegion: true,
    sourceRegion: sourceRegion,
    targetRegion: targetRegion,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: sourceRegion,
    },
  }
);

const targetStack = new TapStack(
  app,
  `TapStack-${targetRegion}-${environmentSuffix}`,
  {
    stackName: `TapStack-${targetRegion}-${environmentSuffix}`,
    environmentSuffix: environmentSuffix,
    isSourceRegion: false,
    sourceRegion: sourceRegion,
    targetRegion: targetRegion,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: targetRegion,
    },
  }
);

targetStack.addDependency(sourceStack);
