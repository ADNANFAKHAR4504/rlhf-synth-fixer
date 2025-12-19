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
import { TapStack } from '../lib/tap-stack';

// Initialize Pulumi configuration for the current stack.
const config = new pulumi.Config();

// Get the environment suffix from the Pulumi config, defaulting to 'dev'.
// You can set this value using the command: `pulumi config set env <value>`
const environmentSuffix = config.get('env') || 'dev';

// Get metadata from environment variables for tagging purposes.
// These are often injected by CI/CD systems.
const repository = config.get('repository') || 'unknown';
const commitAuthor = config.get('commitAuthor') || 'unknown';

// Define a set of default tags to apply to all resources.
// While not explicitly used in the TapStack instantiation here,
// this is the standard place to define them. They would typically be passed
// into the TapStack or configured on the AWS provider.
const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
};

// Instantiate the main stack component for the infrastructure.
// This encapsulates all the resources for the platform.
const stack = new TapStack('TapStack', {
  tags: defaultTags,
});

// Export stack outputs for deployment verification
export const regions = stack.regions;
export const logsBucketName = stack.logsBucket.bucket;
export const logsBucketArn = stack.logsBucket.arn;
export const lambdaFunctionArn = stack.logProcessingLambda.arn;
export const lambdaFunctionName = stack.logProcessingLambda.name;

// Export VPC IDs for each region
export const vpcIds = Object.fromEntries(
  stack.regions.map(region => [region, stack.vpcs[region].id])
);

// Export KMS Key ARNs for each region
export const kmsKeyArns = Object.fromEntries(
  stack.regions.map(region => [region, stack.kmsKeys[region].arn])
);

// Export WAF WebACL ARNs for each region
export const wafWebAclArns = Object.fromEntries(
  stack.regions.map(region => [region, stack.wafWebAcls[region].arn])
);

// Export RDS endpoints for each region
export const rdsEndpoints = Object.fromEntries(
  stack.regions.map(region => [region, stack.rdsInstances[region].endpoint])
);

// Export Auto Scaling Group names for each region
export const asgNames = Object.fromEntries(
  stack.regions.map(region => [region, stack.autoScalingGroups[region].name])
);
