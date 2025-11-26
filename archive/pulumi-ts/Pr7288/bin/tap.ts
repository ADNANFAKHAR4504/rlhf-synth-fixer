#!/usr/bin/env node
/**
 * Pulumi application entry point for the Fraud Detection Pipeline infrastructure.
 *
 * This module defines the core Pulumi stack and instantiates the FraudDetectionStack with appropriate
 * configuration based on the deployment environment. It handles environment-specific settings,
 * tagging, and deployment configuration for AWS resources.
 *
 * The stack created by this module uses environment suffixes to distinguish between
 * different deployment environments (development, staging, production, etc.).
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { FraudDetectionStack } from '../lib/tap-stack';

// Get Pulumi config
const config = new pulumi.Config();

// Get the environment suffix from config, defaulting to 'dev'.
const environmentSuffix =
  config.get('environmentSuffix') || process.env.ENVIRONMENT_SUFFIX || 'dev';

// Get AWS region from config or environment
const region = config.get('region') || process.env.AWS_REGION || 'us-east-1';

// Get email address for SNS alerts
const emailAddress =
  config.get('emailAddress') ||
  process.env.EMAIL_ADDRESS ||
  'alerts@example.com';

// Get metadata from environment variables for tagging purposes.
// These are often injected by CI/CD systems.
const repository = process.env.REPOSITORY || 'fraud-detection-pipeline';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';
const prNumber = process.env.PR_NUMBER || 'unknown';
const team = process.env.TEAM || 'platform';
const createdAt = new Date().toISOString();

// Define a set of default tags to apply to all resources.
const defaultTags = {
  Environment: 'production',
  Service: 'fraud-detection',
  Repository: repository,
  Author: commitAuthor,
  PRNumber: prNumber,
  Team: team,
  CreatedAt: createdAt,
  ManagedBy: 'pulumi',
};

// Configure AWS provider with default tags
const provider = new aws.Provider('aws', {
  region: region,
  defaultTags: {
    tags: defaultTags,
  },
});

// Instantiate the main stack component for the infrastructure.
// This encapsulates all the resources for the fraud detection platform.
const stack = new FraudDetectionStack(
  'fraud-detection-infra',
  {
    environmentSuffix: environmentSuffix,
    region: region,
    emailAddress: emailAddress,
    tags: defaultTags,
  },
  { provider }
);

// Export all stack outputs so they appear in pulumi stack output and output files
export const eventBridgeBusArn = stack.eventBridgeBusArn;
export const snsTopicArn = stack.snsTopicArn;
export const dynamoDbTableName = stack.dynamoDbTableName;
export const transactionProcessorFunctionName =
  stack.transactionProcessorFunctionName;
export const fraudDetectorFunctionName = stack.fraudDetectorFunctionName;
export const transactionProcessorFunctionArn =
  stack.transactionProcessorFunctionArn;
export const kmsKeyId = stack.kmsKeyId;
export const transactionProcessorDLQUrl = stack.transactionProcessorDLQUrl;
export const fraudDetectorDLQUrl = stack.fraudDetectorDLQUrl;
