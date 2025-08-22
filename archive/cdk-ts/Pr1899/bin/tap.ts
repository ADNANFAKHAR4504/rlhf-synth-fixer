#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Context or defaults (no deploy params needed)
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';

// Exactly two regions as requested
const primaryRegion: string =
  app.node.tryGetContext('primaryRegion') || 'us-east-1';
const backupRegion: string =
  app.node.tryGetContext('backupRegion') || 'us-east-2';

const stackBaseName = `TapStack${environmentSuffix}`;
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Global tags
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

const synth = new cdk.CliCredentialsStackSynthesizer();

// Primary (us-east-1)
new TapStack(app, `${stackBaseName}-${primaryRegion}`, {
  stackName: `${stackBaseName}-${primaryRegion}`,
  environmentSuffix,
  synthesizer: synth,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: primaryRegion,
  },
});

// Secondary (us-east-2)
new TapStack(app, `${stackBaseName}-${backupRegion}`, {
  stackName: `${stackBaseName}-${backupRegion}`,
  environmentSuffix,
  synthesizer: synth,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: backupRegion,
  },
});
