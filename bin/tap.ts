/**
 * Pulumi application entry point for the TAP (Test Automation Platform) infrastructure.
 *
 * This module defines the core Pulumi stack and instantiates the infrastructure with appropriate
 * configuration based on the deployment environment. It handles environment-specific settings,
 * tagging, and deployment configuration for AWS resources.
 *
 * The stack created by this module uses environment suffixes to distinguish between
 * different deployment environments (development, staging, production, etc.).
 */

import * as aws from '@pulumi/aws';
import * as infra from '../lib/tap-stack';

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
  region: process.env.AWS_REGION || 'us-east-2',
  defaultTags: {
    tags: defaultTags,
  },
});

// Export stack outputs from the infrastructure
export const vpcId = infra.vpcId;
export const vpcCidr = infra.vpcCidr;
export const publicSubnetIds = infra.publicSubnetIds;
export const privateSubnetIds = infra.privateSubnetIds;
export const ecsClusterArn = infra.ecsClusterArn;
export const ecsClusterName = infra.ecsClusterName;
export const ecsTaskExecutionRoleArn = infra.ecsTaskExecutionRoleArn;
export const ecsTaskRoleArn = infra.ecsTaskRoleArn;
export const ecsSecurityGroupId = infra.ecsSecurityGroupId;
export const auroraClusterArn = infra.auroraClusterArn;
export const auroraClusterEndpoint = infra.auroraClusterEndpoint;
export const auroraClusterReaderEndpoint = infra.auroraClusterReaderEndpoint;
export const auroraSecurityGroupId = infra.auroraSecurityGroupId;
export const dbSecretArn = infra.dbSecretArn;
export const kmsKeyArn = infra.kmsKeyArn;
export const kmsKeyId = infra.kmsKeyId;
export const rawDataBucketName = infra.rawDataBucketName;
export const rawDataBucketArn = infra.rawDataBucketArn;
export const processedDataBucketName = infra.processedDataBucketName;
export const processedDataBucketArn = infra.processedDataBucketArn;
export const kinesisStreamArn = infra.kinesisStreamArn;
export const kinesisStreamName = infra.kinesisStreamName;
export const ecsLogGroupName = infra.ecsLogGroupName;
export const backupVaultArn = infra.backupVaultArn;
export const backupPlanId = infra.backupPlanId;
