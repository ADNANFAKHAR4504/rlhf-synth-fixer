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

// Get the environment suffix from environment variable first, then Pulumi config, defaulting to 'dev'.
// This ensures CI/CD can override via ENVIRONMENT_SUFFIX env var
const environmentSuffix =
  process.env.ENVIRONMENT_SUFFIX || config.get('env') || 'dev';

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
};

// Instantiate the main stack component for the infrastructure.
// This encapsulates all the resources for the platform.
const stack = new TapStack('pulumi-infra', {
  environmentSuffix,
  tags: defaultTags,
});

// Export the stack outputs
export const vpcId = stack.networkStack.vpc.id;
export const albDnsName = stack.computeStack.applicationLoadBalancer.dnsName;
export const dbEndpoint = stack.databaseStack.dbCluster.endpoint;
export const logsBucketName = stack.storageStack.logsBucket.id;
