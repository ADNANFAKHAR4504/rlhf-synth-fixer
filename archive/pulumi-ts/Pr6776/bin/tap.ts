/**
 * Pulumi application entry point for the payment processing infrastructure.
 *
 * This module defines the core Pulumi stack and instantiates the TapStack with appropriate
 * configuration based on the deployment environment.
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
  Application: 'payment-processor',
  CostCenter: 'fintech-payments',
};

// Configure AWS provider with default tags and region
const provider = new aws.Provider('aws', {
  region: process.env.AWS_REGION || 'us-east-2',
  defaultTags: {
    tags: defaultTags,
  },
});

// Instantiate the main stack component
const stack = new TapStack(
  'payment-infra',
  {
    environmentSuffix,
    tags: defaultTags,
  },
  { provider }
);

// Export stack outputs
export const albDnsName = stack.albDnsName;
export const rdsClusterEndpoint = stack.rdsClusterEndpoint;
export const flowLogsBucketName = stack.flowLogsBucketName;
export const vpcId = stack.vpcId;
