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
  process.env.ENVIRONMENT_SUFFIX ||
  config.get('environmentSuffix') ||
  'synth46170923';

// Get metadata from environment variables for tagging purposes.
// These are often injected by CI/CD systems.
const repository =
  process.env.REPOSITORY || config.get('repository') || 'unknown';
const commitAuthor =
  process.env.COMMIT_AUTHOR || config.get('commitAuthor') || 'unknown';

// Define a set of default tags to apply to all resources.
const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
  ManagedBy: 'Pulumi',
};

// Instantiate the main stack component for the infrastructure.
// This encapsulates all the resources for the platform.
const stack = new TapStack('TapStack', {
  environmentSuffix: environmentSuffix,
  tags: defaultTags,
});

// Export the stack outputs
export const albDnsName = stack.albDnsName;
export const staticBucketName = stack.staticBucketName;
export const vpcId = stack.vpcId;
export const instanceConnectEndpointId = stack.instanceConnectEndpointId;
