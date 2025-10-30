/**
 * Pulumi application entry point for the TAP (Test Automation Platform) infrastructure.
 *
 * This module defines the core Pulumi stack and instantiates the TapStack with appropriate
 * configuration based on the deployment environment.
 */
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Initialize Pulumi configuration for the current stack.
const config = new pulumi.Config();

// Get the environment suffix from the CI, Pulumi config, defaulting to 'dev'.
const environmentSuffix =
  process.env.ENVIRONMENT_SUFFIX || config.get('env') || 'dev';

// Get metadata from environment variables for tagging purposes.
const repository = config.get('repository') || 'unknown';
const commitAuthor = config.get('commitAuthor') || 'unknown';

// Define default tags to apply to all resources.
const defaultTags = {
  Environment: 'production',
  ManagedBy: 'pulumi',
  Repository: repository,
  Author: commitAuthor,
};

// Instantiate the main stack component for the infrastructure.
const stack = new TapStack('pulumi-infra', {
  environmentSuffix,
  tags: defaultTags,
});

// Export stack outputs
export const albDnsName = stack.albDnsName;
export const ecsClusterName = stack.ecsClusterName;
export const vpcId = stack.vpcId;
