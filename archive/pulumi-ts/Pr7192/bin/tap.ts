/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable quotes */
/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable prettier/prettier */

/**
 * Pulumi application entry point for the TAP (Test Automation Platform) infrastructure.
 *
 * This module defines the core Pulumi stack and instantiates the TapStack with appropriate
 * configuration based on the deployment environment. It handles environment-specific settings,
 * tagging, and deployment configuration for AWS resources.
 *
 * The stack created by this module uses environment suffixes to distinguish between
 * different deployment environments (development, staging, production, etc.).
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { TapStack } from '../lib/tap-stack';

// Get the environment suffix from environment variables, defaulting to 'dev'.
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Get metadata from environment variables for tagging purposes.
// These are often injected by CI/CD systems.
const repository = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';
const prNumber = process.env.PR_NUMBER || 'unknown';
const team = process.env.TEAM || 'unknown';
const createdAt = new Date().toISOString();

// Define a set of default tags to apply to all resources.
const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
  PRNumber: prNumber,
  Team: team,
  CreatedAt: createdAt,
};

// Configure AWS provider with default tags
const provider = new aws.Provider('aws', {
  region: process.env.AWS_REGION || 'us-east-1',
  defaultTags: {
    tags: defaultTags,
  },
});

// Set Pulumi configuration values programmatically
const config = new pulumi.Config();

// Set environment suffix if not already configured
try {
  config.require('environmentSuffix');
} catch (error) {
  // Configuration doesn't exist, we need to set it programmatically
  // Note: We'll pass it via environment variables that the stack will read
  pulumi.log.info(`Using environment suffix from ENV: ${environmentSuffix}`);
}

// Instantiate the main stack component for the infrastructure.
// This encapsulates all the resources for the platform.
const stack = new TapStack(
  'tap-stack',
  { provider }
);

// Export comprehensive deployment outputs for visibility and integration
export const vpcIds = stack.vpcIds;
export const globalClusterIdentifier = stack.auroraGlobalCluster.id;
export const globalClusterArn = stack.auroraGlobalCluster.arn;
export const migrationTableName = stack.migrationStateTable.name;
export const migrationTableArn = stack.migrationStateTable.arn;
export const validationLambdaArn = stack.validationLambda.arn;
export const validationLambdaName = stack.validationLambda.name;
export const notificationTopicArn = stack.notificationTopic.arn;
export const notificationTopicName = stack.notificationTopic.name;

// Export environment information
export const environment = environmentSuffix;
export const deploymentRegion = process.env.AWS_REGION || 'us-east-1';
export const deploymentTags = defaultTags;

// Export stack summary for easy reference
export const stackSummary = pulumi.all([
  stack.vpcIds,
  stack.auroraGlobalCluster.id,
  stack.migrationStateTable.name,
  stack.validationLambda.arn,
  stack.notificationTopic.arn,
]).apply(([vpcIds, clusterId, tableName, lambdaArn, topicArn]) => ({
  environment: environmentSuffix,
  deploymentRegion: process.env.AWS_REGION || 'us-east-1',
  vpcs: vpcIds,
  database: {
    globalClusterId: clusterId,
    engine: 'aurora-postgresql',
    version: '14.6',
  },
  migration: {
    stateTable: tableName,
    validationLambda: lambdaArn,
  },
  notifications: {
    topicArn: topicArn,
  },
  tags: defaultTags,
  deployedAt: createdAt,
}));
