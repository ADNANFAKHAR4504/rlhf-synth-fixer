#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags, CliCredentialsStackSynthesizer } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const stackName = `TapStack${environmentSuffix}`;

const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Check if running in LocalStack environment
const isLocalStack = process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
                     process.env.AWS_ENDPOINT_URL?.includes('4566') ||
                     process.env.CDK_DEFAULT_ACCOUNT === '000000000000';

// Apply tags to all stacks in this app (optional - you can do this at stack level instead)
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

new TapStack(app, stackName, {
  stackName: stackName, // This ensures CloudFormation stack name includes the suffix
  environmentSuffix: environmentSuffix, // Pass the suffix to the stack
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  // Use CliCredentialsStackSynthesizer for LocalStack to avoid ECR (Pro-only service)
  // This synthesizer uses direct CloudFormation deployment without bootstrap stack
  synthesizer: isLocalStack ? new CliCredentialsStackSynthesizer({
    // Use direct file assets - no ECR needed
    fileAssetsBucketName: `cdk-assets-${process.env.CDK_DEFAULT_ACCOUNT || '000000000000'}-${process.env.CDK_DEFAULT_REGION || 'us-east-1'}`,
  }) : undefined,
});
