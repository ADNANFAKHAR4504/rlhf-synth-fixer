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
import { TapStack } from '../lib/tap-stack';

// Initialize Pulumi configuration for the current stack.
const config = new pulumi.Config();

// Get the environment suffix from the CI, Pulumi config, defaulting to 'dev'.
const requestedEnvironmentSuffix =
  process.env.ENVIRONMENT_SUFFIX || config.get('env') || 'dev';

// Get metadata from environment variables for tagging purposes.
// These are often injected by CI/CD systems.
const repository = config.get('repository') || 'unknown';
const commitAuthor = config.get('commitAuthor') || 'unknown';

// Define a set of default tags to apply to all resources.
// While not explicitly used in the TapStack instantiation here,
// this is the standard place to define them. They would typically be passed
// into the TapStack or configured on the AWS provider.
const defaultTags = {
  Environment: requestedEnvironmentSuffix,
  Repository: repository,
  Author: commitAuthor,
};

// Instantiate the main stack component for the infrastructure.
// This encapsulates all the resources for the platform.
const tapStack = new TapStack('pulumi-infra', {
  tags: defaultTags,
  environmentSuffix: requestedEnvironmentSuffix,
});

// Export the stack outputs so they are available for CI tooling and live tests
export const apiEndpoint = tapStack.apiEndpoint;
export const apiUrl = tapStack.apiUrl;
export const dynamoTableName = tapStack.dynamoTableName;
export const lambdaFunctionName = tapStack.lambdaFunctionName;
export const lambdaRoleArn = tapStack.lambdaRoleArn;
export const snsTopicArn = tapStack.snsTopicArn;
export const dlqUrl = tapStack.dlqUrl;
export const usagePlanId = tapStack.usagePlanId;
export const lambdaLogGroupName = tapStack.lambdaLogGroupName;
export const lambdaErrorAlarmName = tapStack.lambdaErrorAlarmName;
export const environmentSuffix = tapStack.environmentSuffix;
export const region = tapStack.region;
export const stateBucket = tapStack.stateBucket;
export const stateBucketRegion = tapStack.stateBucketRegion;
