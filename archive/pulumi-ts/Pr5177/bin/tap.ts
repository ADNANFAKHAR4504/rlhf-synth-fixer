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
  environmentSuffix,
  tags: defaultTags,
  firmName: 'morrison-associates',
  retentionDays: 90,
  enableVersioning: true,
  enableAuditLogging: true,
});

// Export stack outputs for external access and integration
// Storage outputs
export const documentsBucketName = stack.documentsBucketName;
export const documentsBucketArn = stack.documentsBucketArn;
export const auditLogsBucketName = stack.auditLogsBucketName;

// Security outputs
export const kmsKeyId = stack.kmsKeyId;
export const kmsKeyArn = stack.kmsKeyArn;

// IAM role outputs for different access levels
export const lawyersRoleArn = stack.lawyersRoleArn;
export const adminRoleArn = stack.adminRoleArn;
export const readOnlyRoleArn = stack.readOnlyRoleArn;

// Monitoring and alerting outputs
export const cloudWatchDashboardUrl = stack.cloudWatchDashboardUrl;
export const snsTopicArn = stack.snsTopicArn;

// Audit and compliance outputs
export const cloudTrailArn = stack.cloudTrailArn;
