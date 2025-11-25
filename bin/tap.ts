/**
 * Pulumi application entry point for the financial services platform infrastructure.
 *
 * This module defines the core Pulumi stack and instantiates the TapStack with appropriate
 * configuration for the financial services platform deployment in eu-central-1.
 */
import * as aws from '@pulumi/aws';
import { TapStack } from '../lib/tap-stack';

// Get the environment suffix from environment variables (required for CI/CD)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX;
if (!environmentSuffix) {
  throw new Error('ENVIRONMENT_SUFFIX environment variable is required');
}

// Get metadata from environment variables for tagging purposes
const repository = process.env.REPOSITORY || 'financial-services-platform';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';
const prNumber = process.env.PR_NUMBER || 'unknown';
const team = process.env.TEAM || 'synth';
const createdAt = new Date().toISOString();

// Define mandatory tags for compliance
const defaultTags = {
  Environment: environmentSuffix,
  Project: 'FinancialServicesPlatform',
  CostCenter: 'Engineering',
  Repository: repository,
  Author: commitAuthor,
  PRNumber: prNumber,
  Team: team,
  CreatedAt: createdAt,
};

// Configure AWS provider with eu-central-1 region and default tags
const provider = new aws.Provider('aws', {
  region: process.env.AWS_REGION || 'eu-central-1',
  defaultTags: {
    tags: defaultTags,
  },
});

// Instantiate the main stack component for the infrastructure
const stack = new TapStack(
  'financial-services-infra',
  {
    environmentSuffix: environmentSuffix,
    tags: defaultTags,
    region: 'eu-central-1',
  },
  { provider }
);

// Export stack outputs for reference
export const vpcId = stack.vpcId;
export const privateSubnetIds = stack.privateSubnetIds;
export const publicSubnetIds = stack.publicSubnetIds;
export const databaseClusterId = stack.databaseClusterId;
export const databaseEndpoint = stack.databaseEndpoint;
export const ecrRepositoryUrl = stack.ecrRepositoryUrl;
