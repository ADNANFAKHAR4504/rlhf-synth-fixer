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

// Get the environment suffix from environment variable or Pulumi config
const environmentSuffix =
  process.env.ENVIRONMENT_SUFFIX || config.get('env') || 'dev';

// Check if we should skip database creation (for quota issues)
const skipDatabase =
  process.env.SKIP_DATABASE === 'true' ||
  config.getBoolean('skipDatabase') ||
  false;

// Check if we should skip auto scaling group (for instance quota issues)
const skipAutoScaling =
  process.env.SKIP_AUTO_SCALING === 'true' ||
  config.getBoolean('skipAutoScaling') ||
  false;

// Get metadata from environment variables for tagging purposes.
// These are often injected by CI/CD systems.
const repository = config.get('repository') || 'unknown';
const commitAuthor = config.get('commitAuthor') || 'unknown';

// Define a set of default tags to apply to all resources.
const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
};

// Instantiate the main stack component for the infrastructure.
// This encapsulates all the resources for the platform.
const stack = new TapStack('pulumi-infra', {
  environmentSuffix: environmentSuffix,
  tags: defaultTags,
  skipDatabase: skipDatabase,
  skipAutoScaling: skipAutoScaling,
});

// Export stack outputs
export const vpcId = stack.vpcId;
export const loadBalancerDns = stack.loadBalancerDns;
export const staticAssetsBucketName = stack.staticAssetsBucketName;
export const staticAssetsUrl = stack.staticAssetsUrl;
export const databaseEndpoint = stack.databaseEndpoint;

// To use the stack outputs, you can export them.
// For example, if TapStack had an output `bucketName`:
// export const bucketName = stack.bucketName;
