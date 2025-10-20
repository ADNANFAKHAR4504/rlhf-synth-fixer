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
// You can set this value using the command: `pulumi config set env <environment>`
const environmentSuffix = config.get('env') || 'dev';

// Get metadata from environment variables/config for tagging purposes.
// These are often injected by CI/CD systems.
const repository = config.get('repository') || process.env.REPOSITORY || 'tap-infrastructure';
const commitAuthor = config.get('commitAuthor') || process.env.COMMIT_AUTHOR || 'pulumi';

// Set environment variables so TapStack can use them for tagging
process.env.REPOSITORY = repository;
process.env.COMMIT_AUTHOR = commitAuthor;

// Get the AWS region, defaulting to us-east-1
const region = config.get('region') || 'us-east-1';

// Instantiate the main stack component for the infrastructure.
// This encapsulates all the resources for the platform.
const stack = new TapStack('pulumi-infra', {
  environmentSuffix: environmentSuffix,
  region: region,
});

// Export stack outputs for easy access
export const hubVpcId = stack.hubVpc.id;
export const productionVpcId = stack.productionVpc.id;
export const developmentVpcId = stack.developmentVpc.id;
export const transitGatewayId = stack.transitGateway.id;
export const flowLogsBucketName = stack.flowLogsBucket.bucket;
export const hubZoneId = stack.hubZone.zoneId;
export const prodZoneId = stack.prodZone.zoneId;
export const devZoneId = stack.devZone.zoneId;
export const stackOutputs = stack.outputs;
