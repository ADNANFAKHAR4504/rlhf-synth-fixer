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

// Get region from environment or use default
const region = process.env.CDK_DEFAULT_REGION || 'us-east-1';
const projectName = 'TapProject';

new TapStack(app, stackName, {
  stackName: stackName, // This ensures CloudFormation stack name includes the suffix
  region: region,
  environment: environmentSuffix,
  projectName: projectName,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: region,
  },
  description: `Secure infrastructure stack for ${projectName} in ${region}`,
  tags: {
    Project: projectName,
    Environment: environmentSuffix,
    Region: region,
    ManagedBy: 'CDK',
    Repository: repositoryName,
    Author: commitAuthor,
  },
});
