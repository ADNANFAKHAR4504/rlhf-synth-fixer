#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const stackName = `TapStack${environmentSuffix}`;
const repositoryName = process.env.REPOSITORY || 'iac-test-automations';
const commitAuthor = process.env.COMMIT_AUTHOR || 'iac-developer';

// Apply global tags to all stacks in this app
Tags.of(app).add('Project', 'iac-rlhf-amazon');
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);
Tags.of(app).add('ManagedBy', 'AWS-CDK');

// Create the main stack
const tapStack = new TapStack(app, stackName, {
  stackName: stackName, // This ensures CloudFormation stack name includes the suffix
  environmentSuffix: environmentSuffix, // Pass the suffix to the stack
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  terminationProtection: false, // Allow destruction for testing
});

// Add additional stack-level tags
Tags.of(tapStack).add('StackType', 'MainStack');
Tags.of(tapStack).add('CreatedBy', 'CDK-v2');

app.synth();
