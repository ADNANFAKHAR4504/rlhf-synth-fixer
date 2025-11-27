/**
 * Pulumi application entry point for the Advanced Observability Stack.
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

// Define default tags for cost allocation and resource management
const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
  PRNumber: prNumber,
  Team: team,
  CreatedAt: createdAt,
  CostCenter: 'FinanceOps',
};

// Configure AWS provider with default tags
const provider = new aws.Provider('aws', {
  region: process.env.AWS_REGION || 'us-east-1',
  defaultTags: {
    tags: defaultTags,
  },
});

// Instantiate the main observability stack
const stack = new TapStack(
  'observability-stack',
  {
    environmentSuffix,
    tags: defaultTags,
  },
  { provider }
);

// Export key outputs
export const metricAggregatorFunctionName = stack.metricAggregatorFunctionName;
export const snsTopicArn = stack.snsTopicArn;
export const dashboardName = stack.dashboardName;
export const deadLetterQueueUrl = stack.deadLetterQueueUrl;
