/**
 * Pulumi application entry point for the TAP (Test Automation Platform) infrastructure.
 *
 * This module defines the core Pulumi stack and instantiates the TapStack with appropriate
 * configuration based on the deployment environment. It handles environment-specific settings,
 * tagging, and deployment configuration for AWS resources across multiple regions.
 *
 * The stack created by this module uses environment suffixes to distinguish between
 * different deployment environments (development, staging, production, etc.).
 */

import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Initialize Pulumi configuration for the current stack.
const config = new pulumi.Config();

// Get the environment suffix from environment variable or Pulumi config, defaulting to 'dev'.
// Environment variable takes precedence for CI/CD compatibility
const environmentSuffix =
  process.env.ENVIRONMENT_SUFFIX || config.get('env') || 'dev';

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
};

// List of AWS regions to deploy to as per requirements
const regions = ['us-east-1', 'us-west-2'];

// Create infrastructure in each region
const stacks: { [key: string]: TapStack } = {};
const outputs: { [key: string]: pulumi.Output<string> } = {};

regions.forEach(region => {
  const regionSuffix = region.replace(/-/g, '');
  const stackName = `tap-stack-${regionSuffix}`;

  // Instantiate the main stack component for each region
  const stack = new TapStack(stackName, {
    region: region,
    environmentSuffix: environmentSuffix,
    tags: defaultTags,
  });

  stacks[region] = stack;

  // Export region-specific outputs
  outputs[`${region}VpcId`] = stack.vpcId;
  outputs[`${region}AlbDnsName`] = stack.albDnsName;
  outputs[`${region}RdsEndpoint`] = stack.rdsEndpoint;
});

// Export all outputs for integration testing
export const vpcIds = pulumi.all(
  Object.values(stacks).map(stack => stack.vpcId)
);
export const albDnsNames = pulumi.all(
  Object.values(stacks).map(stack => stack.albDnsName)
);
export const rdsEndpoints = pulumi.all(
  Object.values(stacks).map(stack => stack.rdsEndpoint)
);

// Export individual region outputs
Object.keys(outputs).forEach(key => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (exports as any)[key] = outputs[key];
});
