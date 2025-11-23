#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack.mjs';

const app = new cdk.App();

const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';
const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION;

Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

new TapStack(app, `TapStack${environmentSuffix}`, {
  stackName: `TapStack${environmentSuffix}`,
  environmentSuffix: environmentSuffix,
  env: {
    account: account,
    region: region,
  },
});

app.synth();
