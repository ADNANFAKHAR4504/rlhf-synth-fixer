/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable quotes */
/* eslint-disable @typescript-eslint/quotes */
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
import { OutputData, TapStack } from '../lib/tap-stack';

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
// While not explicitly used in the TapStack instantiation here,
// this is the standard place to define them. They would typically be passed
// into the TapStack or configured on the AWS provider.
const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
};

// Instantiate the main stack component for the infrastructure.
// This encapsulates all the resources for the platform.
const stack = new TapStack('pulumi-infra', {
  tags: defaultTags,
});

// Export all stack outputs for easy access
export const outputs: pulumi.Output<OutputData> = stack.outputs;

// Export individual output sections for convenience
export const transitGatewayAttachments = stack.outputs.apply(
  (o) => o.transitGatewayAttachments
);

export const vpcEndpoints = stack.outputs.apply((o) => o.vpcEndpoints);

export const vpcIds = stack.outputs.apply((o) => o.vpcIds);

export const transitGatewayIds = stack.outputs.apply((o) => o.transitGatewayIds);

export const flowLogBuckets = stack.outputs.apply((o) => o.flowLogBuckets);

export const route53HostedZones = stack.outputs.apply((o) => o.route53HostedZones);

// Export region-specific outputs for easy access
export const usEast1 = {
  vpcId: stack.outputs.apply((o) => o.vpcIds['us-east-1']),
  transitGatewayId: stack.outputs.apply((o) => o.transitGatewayIds['us-east-1']),
  transitGatewayAttachmentId: stack.outputs.apply(
    (o) => o.transitGatewayAttachments['us-east-1']
  ),
  vpcEndpoints: stack.outputs.apply((o) => o.vpcEndpoints['us-east-1']),
  flowLogBucket: stack.outputs.apply((o) => o.flowLogBuckets['us-east-1']),
  hostedZoneId: stack.outputs.apply((o) => o.route53HostedZones['us-east-1']),
};

export const euWest1 = {
  vpcId: stack.outputs.apply((o) => o.vpcIds['eu-west-1']),
  transitGatewayId: stack.outputs.apply((o) => o.transitGatewayIds['eu-west-1']),
  transitGatewayAttachmentId: stack.outputs.apply(
    (o) => o.transitGatewayAttachments['eu-west-1']
  ),
  vpcEndpoints: stack.outputs.apply((o) => o.vpcEndpoints['eu-west-1']),
  flowLogBucket: stack.outputs.apply((o) => o.flowLogBuckets['eu-west-1']),
  hostedZoneId: stack.outputs.apply((o) => o.route53HostedZones['eu-west-1']),
};

export const apSoutheast1 = {
  vpcId: stack.outputs.apply((o) => o.vpcIds['ap-southeast-1']),
  transitGatewayId: stack.outputs.apply(
    (o) => o.transitGatewayIds['ap-southeast-1']
  ),
  transitGatewayAttachmentId: stack.outputs.apply(
    (o) => o.transitGatewayAttachments['ap-southeast-1']
  ),
  vpcEndpoints: stack.outputs.apply((o) => o.vpcEndpoints['ap-southeast-1']),
  flowLogBucket: stack.outputs.apply((o) => o.flowLogBuckets['ap-southeast-1']),
  hostedZoneId: stack.outputs.apply(
    (o) => o.route53HostedZones['ap-southeast-1']
  ),
};

// Export helper methods for dynamic region access
export const getVpcId = (region: string) => stack.getVpcId(region);
export const getTransitGatewayId = (region: string) =>
  stack.getTransitGatewayId(region);
export const getHostedZoneId = (region: string) => stack.getHostedZoneId(region);
