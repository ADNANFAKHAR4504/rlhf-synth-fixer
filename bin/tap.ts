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

const sanitizeTagValue = (value: string): string => {
  const sanitized = value
    .replace(/[^a-zA-Z0-9+\-=._:/]/g, '_')
    .trim()
    .slice(0, 256);
  return sanitized.length > 0 ? sanitized : 'unknown';
};

const stackRegion =
  process.env.AWS_REGION || process.env.CDK_DEFAULT_REGION || 'us-west-2';
const stackAccount =
  process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID;

const sanitizedEnvironment = sanitizeTagValue(environmentSuffix);
const sanitizedRepository = sanitizeTagValue(repositoryName);
const sanitizedAuthor = sanitizeTagValue(commitAuthor);

// Apply tags to all stacks in this app (optional - you can do this at stack level instead)
Tags.of(app).add('Environment', sanitizedEnvironment);
Tags.of(app).add('Repository', sanitizedRepository);
Tags.of(app).add('Author', sanitizedAuthor);

new TapStack(app, stackName, {
  stackName: stackName, // This ensures CloudFormation stack name includes the suffix
  environmentSuffix: environmentSuffix, // Pass the suffix to the stack
  env: {
    account: stackAccount,
    region: stackRegion,
  },
});
