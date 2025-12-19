#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const stackName = `TapStack${environmentSuffix}`;
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Apply tags to all stacks in this app (optional - you can do this at stack level instead)
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);
const regionList = ['us-east-1', 'us-west-2']; // Add more regions as needed
regionList.forEach(region => {
  new TapStack(app, `${stackName}-multi-${region}`, {
    stackName: `${stackName}-multi-${region}`, // This ensures CloudFormation stack name includes the suffix
    environmentSuffix: environmentSuffix,
    region: region,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: region,
    },
  });
});
