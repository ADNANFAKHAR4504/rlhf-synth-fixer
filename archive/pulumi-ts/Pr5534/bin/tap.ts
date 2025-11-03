/**
 * Pulumi application entry point for the highly available web application
 * with auto-scaling and failure recovery.
 *
 * This module instantiates the TapStack with environment-specific configuration
 * and handles tagging for the ca-central-1 region deployment.
 */
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Initialize Pulumi configuration for the current stack
const config = new pulumi.Config();

// Get the environment suffix from environment variable or Pulumi config, defaulting to 'dev'
const environmentSuffix =
  process.env.ENVIRONMENT_SUFFIX || config.get('env') || 'dev';

// Get metadata from environment variables for tagging purposes
const repository = config.get('repository') || 'iac-test-automations';
const commitAuthor = config.get('commitAuthor') || 'synth-team';

// Define default tags to apply to all resources
const defaultTags = {
  Environment: 'production',
  ManagedBy: 'pulumi',
  Repository: repository,
  Author: commitAuthor,
};

// Instantiate the main TapStack component
const stack = new TapStack('tap-ha-stack', {
  environmentSuffix: environmentSuffix,
  tags: defaultTags,
});

// Export stack outputs for easy access
export const vpcId = stack.vpcId;
export const albDnsName = stack.albDnsName;
export const asgName = stack.asgName;
export const applicationUrl = pulumi.interpolate`http://${stack.albDnsName}`;
