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

// Get the environment suffix from the Pulumi config, defaulting to 'development'.
// You can set this value using the command: `pulumi config set env <value>`
const environmentSuffix = config.get('env') || 'development';

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
  environmentSuffix: environmentSuffix,
  tags: defaultTags,
});

// Export stack outputs for integration testing and external access
export const bucketArn = stack.bucketArn;
export const bucketName = stack.bucketName;
export const bucketId = stack.bucketId;
export const bucketDomainName = stack.bucketDomainName;
export const bucketRegionalDomainName = stack.bucketRegionalDomainName;
export const kmsKeyArn = stack.kmsKeyArn;
export const kmsKeyId = stack.kmsKeyId;
export const kmsKeyAlias = stack.kmsKeyAlias;
export const roleArn = stack.roleArn;
export const roleName = stack.roleName;
export const roleId = stack.roleId;
export const rolePath = stack.rolePath;
export const metricAlarmArn = stack.metricAlarmArn;
export const metricAlarmName = stack.metricAlarmName;
export const logGroupArn = stack.logGroupArn;
export const logGroupName = stack.logGroupName;
export const eventRuleArn = stack.eventRuleArn;
export const eventRuleName = stack.eventRuleName;
export const eventTargetId = stack.eventTargetId;
export const bucketVersioningId = stack.bucketVersioningId;
export const bucketEncryptionId = stack.bucketEncryptionId;
export const bucketPublicAccessBlockId = stack.bucketPublicAccessBlockId;
export const rolePolicyId = stack.rolePolicyId;
export const rolePolicyName = stack.rolePolicyName;
