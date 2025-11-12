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

// Get service name from config or environment variable
const serviceName =
  config.get('serviceName') || process.env.SERVICE_NAME || 'financial-security';

// Get email for SNS subscription (optional)
const email = config.get('email') || process.env.SNS_EMAIL;

// Get replica region for multi-region replication
const replicaRegion =
  config.get('replicaRegion') || process.env.REPLICA_REGION || 'us-east-1';

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
  Service: serviceName,
};

// Instantiate the main stack component for the infrastructure.
// This encapsulates all the resources for the platform.
const stack = new TapStack('pulumi-infra', {
  environmentSuffix,
  serviceName,
  email,
  replicaRegion,
  tags: defaultTags,
});

// Export the stack outputs
export const piiKmsKeyArn = stack.piiKmsKeyArn;
export const financialKmsKeyArn = stack.financialKmsKeyArn;
export const generalKmsKeyArn = stack.generalKmsKeyArn;
export const crossAccountRoleArn = stack.crossAccountRoleArn;
export const securityAlertTopicArn = stack.securityAlertTopicArn;
export const complianceReport = stack.complianceReport;
export const financialBucketName = stack.financialBucketName;
export const piiBucketName = stack.piiBucketName;
export const remediationLambdaArn = stack.remediationLambdaArn;
