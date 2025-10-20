#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'prod' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'prod';
const stackName = `TapStack${environmentSuffix}`;
const repositoryName = process.env.REPOSITORY || 'financial-platform';
const commitAuthor = process.env.COMMIT_AUTHOR || 'platform-team';

// Apply tags to all stacks in this app for cost tracking and management
Tags.of(app).add('Project', 'Secure-Financial-Platform');
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);
Tags.of(app).add('ManagedBy', 'CDK');
Tags.of(app).add('CostCenter', 'trading-platform');
Tags.of(app).add('Compliance', 'SOC2-PCI-DSS');

// Deploy the Secure Multi-Tier AWS Environment Stack
new TapStack(app, stackName, {
  stackName: stackName, // This ensures CloudFormation stack name includes the suffix
  environmentSuffix: environmentSuffix, // Pass the suffix to the stack

  // Stack configuration
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-2',
  },

  // Enable termination protection for production
  terminationProtection: environmentSuffix === 'prod',

  // Stack description
  description:
    'Secure multi-tier AWS environment for financial services trading platform with advanced networking capabilities',
});
