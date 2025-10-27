#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

/**
 * Main CDK Application Entry Point
 * Initializes the CI/CD Pipeline Stack with production-ready configurations
 */
const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'prod' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'prod';
const stackName = `TapStack${environmentSuffix}`;
const repositoryName = process.env.REPOSITORY || 'webapp-repo';
const commitAuthor = process.env.COMMIT_AUTHOR || 'devops-team';

// Apply tags to all stacks in this app for cost tracking and management
Tags.of(app).add('Project', 'CI-CD-Pipeline');
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);
Tags.of(app).add('ManagedBy', 'CDK');
Tags.of(app).add('CostCenter', 'Engineering');

// Deploy the CI/CD Pipeline Stack
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
    'Comprehensive CI/CD Pipeline with CodePipeline, CodeBuild, and CodeDeploy',
});
