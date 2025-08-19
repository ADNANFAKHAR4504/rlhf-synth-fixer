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
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

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
const tapStack = new TapStack('pulumi-infra', {
  environmentSuffix,
  tags: defaultTags,
});

// Export stack outputs for integration testing and external access
// S3 Buckets
export const primaryBucketName = tapStack.primaryBucketName;
export const primaryBucketArn = tapStack.primaryBucketArn;
export const auditBucketName = tapStack.auditBucketName;
export const auditBucketArn = tapStack.auditBucketArn;

// KMS Keys
export const s3KmsKeyId = tapStack.s3KmsKeyId;
export const s3KmsKeyArn = tapStack.s3KmsKeyArn;
export const cloudTrailKmsKeyId = tapStack.cloudTrailKmsKeyId;
export const cloudTrailKmsKeyArn = tapStack.cloudTrailKmsKeyArn;

// IAM Roles
export const dataAccessRoleArn = tapStack.dataAccessRoleArn;
export const auditRoleArn = tapStack.auditRoleArn;

// CloudTrail exports
export const cloudTrailArn = tapStack.cloudTrailArn;
export const cloudTrailLogGroupArn = tapStack.cloudTrailLogGroupArn;

// Security Policies
export const securityPolicyArn = tapStack.securityPolicyArn;
export const mfaEnforcementPolicyArn = tapStack.mfaEnforcementPolicyArn;
export const ec2LifecyclePolicyArn = tapStack.ec2LifecyclePolicyArn;
export const s3SecurityPolicyArn = tapStack.s3SecurityPolicyArn;
export const cloudTrailProtectionPolicyArn =
  tapStack.cloudTrailProtectionPolicyArn;
export const kmsProtectionPolicyArn = tapStack.kmsProtectionPolicyArn;

// Region confirmation
export const region = tapStack.region;
