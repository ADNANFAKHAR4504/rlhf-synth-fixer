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

// Export stack outputs for CI/CD validation
export const vpcIds = pulumi.output(stack.vpcs).apply(vpcs =>
  Object.fromEntries(Object.entries(vpcs).map(([region, vpc]) => [region, vpc.id]))
);

export const s3BucketNames = pulumi.output(stack.s3Buckets).apply(buckets =>
  Object.fromEntries(Object.entries(buckets).map(([region, bucket]) => [region, bucket.bucket]))
);

export const kmsKeyArns = pulumi.output(stack.kmsKeys).apply(keys =>
  Object.fromEntries(Object.entries(keys).map(([region, key]) => [region, key.arn]))
);

export const apiGatewayIds = pulumi.output(stack.apiGateways).apply(apis =>
  Object.fromEntries(Object.entries(apis).map(([region, api]) => [region, api.id]))
);

export const securityGroupIds = pulumi.output(stack.securityGroups).apply(sgs =>
  Object.fromEntries(Object.entries(sgs).map(([region, sg]) => [region, sg.id]))
);
