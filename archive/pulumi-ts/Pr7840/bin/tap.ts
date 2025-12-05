/**
 * Pulumi application entry point for the Order Processing Lambda Optimization.
 *
 * This module instantiates the TapStack which implements a complete optimized
 * Lambda-based order processing system with:
 * - Optimized Lambda configuration (512MB memory, 30s timeout)
 * - Reserved concurrency (50)
 * - X-Ray tracing enabled
 * - CloudWatch log retention (7 days)
 * - Comprehensive tagging (Environment, Team, CostCenter)
 * - Lambda versioning and alias
 * - CloudWatch alarms for error monitoring
 * - Dead Letter Queue (DLQ) using SQS
 * - CloudWatch dashboard for monitoring
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { TapStack } from '../lib/tap-stack';

// Get the environment suffix from environment variables, defaulting to 'dev'.
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Get metadata from environment variables for tagging purposes.
const repository = process.env.REPOSITORY || 'iac-test-automations';
const commitAuthor = process.env.COMMIT_AUTHOR || 'claude-code';
const prNumber = process.env.PR_NUMBER || 'local';
const team = process.env.TEAM || 'OrderProcessing';
const createdAt = new Date().toISOString();

// Define default tags to apply to all resources
const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
  PRNumber: prNumber,
  Team: team,
  CreatedAt: createdAt,
  CostCenter: 'Engineering',
  Application: 'OrderProcessingSystem',
};

// Configure AWS provider with default tags
const provider = new aws.Provider('aws', {
  region: process.env.AWS_REGION || 'us-east-1',
  defaultTags: {
    tags: defaultTags,
  },
});

// Instantiate the main stack component for the optimized Lambda infrastructure
const stack = new TapStack(
  'order-processing-infra',
  {
    environmentSuffix: environmentSuffix,
    tags: defaultTags,
  },
  { provider }
);

// Export stack outputs for external use
export const lambdaFunctionName = stack.lambdaFunctionName;
export const lambdaFunctionArn = stack.lambdaFunctionArn;
export const lambdaAliasName = stack.lambdaAliasName;
export const lambdaAliasArn = stack.lambdaAliasArn;
export const dlqQueueUrl = stack.dlqQueueUrl;
export const dlqQueueArn = stack.dlqQueueArn;
export const dashboardName = stack.dashboardName;
export const alarmName = stack.alarmName;
export const logGroupName = stack.logGroupName;
