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
const environmentSuffix =
  process.env.ENVIRONMENT_SUFFIX || config.get('env') || 'dev';

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
const stack = new TapStack('pulumi-infra', {
  tags: defaultTags,
});

// Export stack outputs
export const vpcId = stack.vpcId;
export const publicSubnetIds = stack.publicSubnetIds;
export const privateSubnetIds = stack.privateSubnetIds;
export const databaseSubnetIds = stack.databaseSubnetIds;
export const webSecurityGroupId = stack.webSecurityGroupId;
export const appSecurityGroupId = stack.appSecurityGroupId;
export const dbSecurityGroupId = stack.dbSecurityGroupId;
export const s3BucketName = stack.s3BucketName;
