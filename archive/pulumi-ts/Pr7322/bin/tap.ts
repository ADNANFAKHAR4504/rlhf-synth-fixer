/**
 * Pulumi application entry point for Security Compliance Monitoring Infrastructure.
 */
import * as aws from '@pulumi/aws';
import { TapStack } from '../lib/tap-stack';

// Get the environment suffix from environment variables, defaulting to 'dev'.
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Get metadata from environment variables for tagging purposes.
const repository = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';
const prNumber = process.env.PR_NUMBER || 'unknown';
const team = process.env.TEAM || 'unknown';
const createdAt = new Date().toISOString();

// Define default tags to apply to all resources.
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

// Instantiate the main stack component for the infrastructure.
const stack = new TapStack(
  'pulumi-infra',
  {
    environmentSuffix: environmentSuffix,
    tags: defaultTags,
  },
  { provider }
);

// Export stack outputs
export const configBucketName = stack.configBucketName;
export const complianceTableName = stack.complianceTableName;
export const complianceFunctionArn = stack.complianceFunctionArn;
export const snsTopicArn = stack.snsTopicArn;
export const dashboardName = stack.dashboardName;
