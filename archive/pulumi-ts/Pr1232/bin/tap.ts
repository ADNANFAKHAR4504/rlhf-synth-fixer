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

// Get the environment suffix from the environment variable, defaulting to 'dev'.
// This is typically set by CI/CD systems or deployment scripts.
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

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
const tapStack = new TapStack('pulumi-infra', {
  environmentSuffix: environmentSuffix,
  tags: defaultTags,
});

// Export stack outputs for integration testing and CI/CD pipeline
// These outputs will be available via `pulumi stack output` command
export const vpcIds = tapStack.vpcIds;
export const ec2InstanceIds = tapStack.ec2InstanceIds;
export const rdsEndpoints = tapStack.rdsEndpoints;
export const cloudtrailArn = tapStack.cloudtrailArn;
export const webAclArn = tapStack.webAclArn;
export const cloudtrailBucketName = tapStack.cloudtrailBucketName;
export const kmsKeyArns = tapStack.kmsKeyArns;
