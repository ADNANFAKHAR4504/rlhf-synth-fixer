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
// Priority: ENVIRONMENT_SUFFIX env var > Pulumi config > default
const envSuffixFromEnv = process.env.ENVIRONMENT_SUFFIX;
const envSuffixFromConfig = config.get('environmentSuffix');
const environmentSuffix =
  envSuffixFromEnv || envSuffixFromConfig || 'synthtrainr121';

// Get metadata from environment variables for tagging purposes.
// These are often injected by CI/CD systems.
const repository =
  config.get('repository') || process.env.REPOSITORY || 'unknown';
const commitAuthor =
  config.get('commitAuthor') || process.env.COMMIT_AUTHOR || 'unknown';

// Define a set of default tags to apply to all resources.
const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
  ManagedBy: 'Pulumi',
};

// Instantiate the main stack component for the infrastructure.
// This encapsulates all the resources for the platform.
const stack = new TapStack('tap-stack', {
  environmentSuffix: environmentSuffix,
  tags: defaultTags,
});

// Export stack outputs for integration with other systems
export const apiUrl = stack.apiUrl;
export const tableName = stack.tableName;
export const functionName = stack.functionName;
