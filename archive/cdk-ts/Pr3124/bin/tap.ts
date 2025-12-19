#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import 'source-map-support/register';
import { CICDPipelineStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get configuration from context or environment variables
const githubOwner =
  app.node.tryGetContext('githubOwner') ||
  process.env.GITHUB_OWNER ||
  'TuringGpt';
const githubRepo =
  app.node.tryGetContext('githubRepo') ||
  process.env.GITHUB_REPO ||
  'iac-test-automations';
const githubBranch =
  app.node.tryGetContext('githubBranch') || process.env.GITHUB_BRANCH || 'main';
const notificationEmail =
  app.node.tryGetContext('notificationEmail') ||
  process.env.NOTIFICATION_EMAIL ||
  'admin@example.com';
const environmentName =
  app.node.tryGetContext('environment') || process.env.ENVIRONMENT || 'dev';
const projectName =
  app.node.tryGetContext('projectName') ||
  process.env.PROJECT_NAME ||
  'iac-test';
const costCenter =
  app.node.tryGetContext('costCenter') ||
  process.env.COST_CENTER ||
  'engineering';

// Primary region deployment
new CICDPipelineStack(app, 'CICDPipelineStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT || '123456789012', // Explicit account required for cross-region support
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  githubOwner,
  githubRepo,
  githubBranch,
  notificationEmail,
  environmentName,
  projectName,
  costCenter,
  deploymentRegions: ['us-east-1', 'us-west-2', 'eu-west-1'], // Multi-region deployment
  tags: {
    Environment: environmentName,
    Project: projectName,
    ManagedBy: 'CDK',
    CostCenter: costCenter,
    'iac-rlhf-amazon': 'true',
  },
});

// Secondary region for high availability (pipeline redundancy)
new CICDPipelineStack(app, 'CICDPipelineStackSecondary', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT || '123456789012', // Explicit account required for cross-region support
    region: 'us-west-2',
  },
  githubOwner,
  githubRepo,
  githubBranch,
  notificationEmail,
  environmentName: `${environmentName}-secondary`,
  projectName,
  costCenter,
  deploymentRegions: ['us-west-2', 'us-east-1', 'eu-west-1'],
  tags: {
    Environment: `${environmentName}-secondary`,
    Project: projectName,
    ManagedBy: 'CDK',
    CostCenter: costCenter,
    Type: 'Secondary',
    'iac-rlhf-amazon': 'true',
  },
});
