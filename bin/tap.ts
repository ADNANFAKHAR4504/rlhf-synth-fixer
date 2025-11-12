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

import * as aws from '@pulumi/aws';
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

// CHANGE: Get AWS region from config, defaulting to us-east-1
const awsRegion = config.get('awsRegion') || 'us-east-1';

// Define a set of default tags to apply to all resources.
const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
  ManagedBy: 'Pulumi',
};

// Create AWS provider with explicit region configuration
// This ensures ALL AWS resources are created in us-east-1
const awsProvider = new aws.Provider('aws-provider', {
  region: awsRegion,
  defaultTags: {
    tags: defaultTags,
  },
});

// Instantiate the main stack component for the infrastructure.
// This encapsulates all the resources for the platform.
const stack = new TapStack(
  'pulumi-infra',
  {
    environmentSuffix,
    tags: defaultTags,
    notificationEmail: config.get('notificationEmail'),
  },
  {
    provider: awsProvider, // Pass the provider with explicit region
  }
);

// Export the stack outputs
export const apiUrl = stack.apiUrl;
export const auditBucketName = stack.auditBucketName;
export const dynamoTableName = stack.dynamoTableName;
export const dashboardUrl = stack.dashboardUrl;

// Export the configured region for reference
export const region = awsRegion;
