/**
 * Pulumi application entry point for the TAP (Test Automation Platform) infrastructure.
 *
 * This module defines the core Pulumi stack and instantiates the payment webhook
 * processing system with appropriate configuration based on the deployment environment.
 *
 * The stack created by this module uses environment suffixes to distinguish between
 * different deployment environments (development, staging, production, etc.).
 */
import * as aws from '@pulumi/aws';

// Import and re-export all outputs from the stack module
import * as stack from '../lib/tap-stack';

// Get the environment suffix from environment variables, defaulting to 'dev'.
const _environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Get metadata from environment variables for tagging purposes.
const repository = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';
const prNumber = process.env.PR_NUMBER || 'unknown';
const team = process.env.TEAM || 'unknown';
const createdAt = new Date().toISOString();

// Define a set of default tags to apply to all resources.
const defaultTags = {
  Environment: _environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
  PRNumber: prNumber,
  Team: team,
  CreatedAt: createdAt,
};

// Configure AWS provider with default tags (resources use this provider)
const _provider = new aws.Provider('aws', {
  region: process.env.AWS_REGION || 'us-east-1',
  defaultTags: {
    tags: defaultTags,
  },
});

// Mark intentionally unused to satisfy linter
void _provider;

// Re-export all outputs from the stack
export const apiId = stack.apiId;
export const apiEndpoint = stack.apiEndpoint;
export const apiUrl = stack.apiUrl;
export const stateMachineArn = stack.stateMachineArn;
export const paymentsTableName = stack.paymentsTableName;
export const kmsKeyId = stack.kmsKeyId;
export const webhookValidatorFunctionName = stack.webhookValidatorFunctionName;
export const paymentProcessorFunctionName = stack.paymentProcessorFunctionName;
