#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get context parameters
const environmentSuffix =
  process.env.ENVIRONMENT_SUFFIX ||
  app.node.tryGetContext('environmentSuffix') ||
  'dev';
const githubOwner =
  process.env.GITHUB_OWNER ||
  app.node.tryGetContext('githubOwner') ||
  'example-owner';
const githubRepo =
  process.env.GITHUB_REPO ||
  app.node.tryGetContext('githubRepo') ||
  'example-repo';
const githubBranch =
  process.env.GITHUB_BRANCH || app.node.tryGetContext('githubBranch') || 'main';

new TapStack(app, `TapStack${environmentSuffix}`, {
  environmentSuffix,
  githubOwner,
  githubRepo,
  githubBranch,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region:
      process.env.AWS_REGION || process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
});

app.synth();
