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

// Get metadata from environment variables/config for tagging purposes.
// These are often injected by CI/CD systems.
const repository = process.env.REPOSITORY || config.get('repository') || 'TuringGpt/iac-test-automations';
const commitAuthor = process.env.COMMIT_AUTHOR || config.get('commitAuthor') || 'unknown';

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
});

// EXPORTS - Stack Outputs
// These outputs are accessible via `pulumi stack output <output-name>`
// or programmatically through the Pulumi automation API.

// VPC Outputs
export const hubVpcId = stack.hubVpc.id;
export const productionVpcId = stack.productionVpc.id;
export const developmentVpcId = stack.developmentVpc.id;

// Transit Gateway Outputs
export const transitGatewayId = stack.transitGateway.id;

// S3 Bucket Outputs
export const flowLogsBucketName = stack.flowLogsBucket.bucket;

// Route53 Zone Outputs
export const hubZoneId = stack.hubZone.zoneId;
export const prodZoneId = stack.prodZone.zoneId;
export const devZoneId = stack.devZone.zoneId;

// Structured output for JSON export
export const stackOutputs = stack.outputs;

// Environment information
export const environment = {
  suffix: environmentSuffix,
  repository: repository,
  author: commitAuthor,
};
