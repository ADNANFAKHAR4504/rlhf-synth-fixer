#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CICDPipelineStack } from '../lib/cicd-pipeline-stack';

const app = new cdk.App();

// Get configuration from context or environment variables
const githubOwner = app.node.tryGetContext('githubOwner') || process.env.GITHUB_OWNER || 'your-org';
const githubRepo = app.node.tryGetContext('githubRepo') || process.env.GITHUB_REPO || 'your-repo';
const githubBranch = app.node.tryGetContext('githubBranch') || process.env.GITHUB_BRANCH || 'main';
const notificationEmail = app.node.tryGetContext('notificationEmail') || process.env.NOTIFICATION_EMAIL || 'admin@example.com';

// Primary region deployment
const primaryStack = new CICDPipelineStack(app, 'CICDPipelineStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  githubOwner,
  githubRepo,
  githubBranch,
  notificationEmail,
  deploymentRegions: ['us-east-1', 'us-west-2', 'eu-west-1'], // Multi-region deployment
  tags: {
    Environment: 'Production',
    Project: 'CICD-Pipeline',
    ManagedBy: 'CDK',
    CostCenter: 'Engineering',
  },
});

// Secondary region for high availability (pipeline redundancy)
const secondaryStack = new CICDPipelineStack(app, 'CICDPipelineStackSecondary', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-west-2',
  },
  githubOwner,
  githubRepo,
  githubBranch,
  notificationEmail,
  deploymentRegions: ['us-west-2', 'us-east-1', 'eu-west-1'],
  tags: {
    Environment: 'Production',
    Project: 'CICD-Pipeline',
    ManagedBy: 'CDK',
    CostCenter: 'Engineering',
    Type: 'Secondary',
  },
});