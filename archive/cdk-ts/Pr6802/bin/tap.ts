#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const hostedZoneName =
  app.node.tryGetContext('hostedZoneName') || `dr-${environmentSuffix}.com`;
const stackName = `TapStack${environmentSuffix}`;
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';
const prNumber = process.env.PR_NUMBER || 'unknown';
const team = process.env.TEAM || 'unknown';
const createdAt = new Date().toISOString();

// Apply tags to all stacks in this app (optional - you can do this at stack level instead)
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);
Tags.of(app).add('PRNumber', prNumber);
Tags.of(app).add('Team', team);
Tags.of(app).add('CreatedAt', createdAt);

new TapStack(app, stackName, {
  stackName: stackName,
  environmentSuffix: environmentSuffix,
  hostedZoneName: hostedZoneName,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  description: `High availability stack with multi-AZ deployment for ${environmentSuffix}`,
});

app.synth();
