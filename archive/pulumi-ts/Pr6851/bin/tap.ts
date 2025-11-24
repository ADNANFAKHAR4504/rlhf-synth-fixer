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
 * The stack created by this module implements a multi-region payment processing infrastructure
 * with automatic failover capabilities across US-EAST-1 and US-EAST-2 regions.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { TapStack } from '../lib/tap-stack';

// Get configuration
const config = new pulumi.Config();

// Get the environment suffix from Pulumi config or environment variables, defaulting to 'dev'.
const environmentSuffix =
  config.get('environmentSuffix') || process.env.ENVIRONMENT_SUFFIX || 'dev';

// Get notification email for alerts
const notificationEmail =
  config.get('notificationEmail') ||
  process.env.NOTIFICATION_EMAIL ||
  'admin@example.com';

// Define regions for multi-region deployment
const primaryRegion = config.get('primaryRegion') || process.env.PRIMARY_REGION || 'us-east-1';
const secondaryRegion = config.get('secondaryRegion') || process.env.SECONDARY_REGION || 'us-east-2';

// Get metadata from environment variables for tagging purposes.
// These are often injected by CI/CD systems.
const repository = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';
const prNumber = process.env.PR_NUMBER || 'unknown';
const team = process.env.TEAM || 'unknown';
const createdAt = new Date().toISOString();

// Define a set of default tags to apply to all resources.
const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
  PRNumber: prNumber,
  Team: team,
  CreatedAt: createdAt,
  Project: 'Payment Processing API',
  ManagedBy: 'Pulumi',
};

// Configure AWS provider with default tags
// Note: This is the default provider - regional providers are created within the stack
const provider = new aws.Provider('aws', {
  region: primaryRegion,
  defaultTags: {
    tags: defaultTags,
  },
});

// Instantiate the main stack component for the infrastructure.
// This encapsulates all the resources for the multi-region payment platform.
const stack = new TapStack(
  'payment-processing-infra',
  {
    environmentSuffix: environmentSuffix,
    notificationEmail: notificationEmail,
    primaryRegion: primaryRegion,
    secondaryRegion: secondaryRegion,
    tags: defaultTags,
  },
  { provider }
);

// ========================================
// Export all stack outputs for easy access
// ========================================

// API Endpoints
export const primaryApiUrl = stack.primaryApiUrl;
export const secondaryApiUrl = stack.secondaryApiUrl;

// Application Load Balancer DNS Names
export const primaryAlbDnsName = stack.primaryAlbDnsName;
export const secondaryAlbDnsName = stack.secondaryAlbDnsName;

// Database and Storage
export const transactionTableName = stack.transactionTableName;
export const primaryAuditBucketName = stack.primaryAuditBucketName;
export const secondaryAuditBucketName = stack.secondaryAuditBucketName;

// Security
export const secretArn = stack.secretArn;

// Monitoring
export const primaryHealthCheckId = stack.primaryHealthCheckId;
export const secondaryHealthCheckId = stack.secondaryHealthCheckId;
export const primarySnsTopicArn = stack.primarySnsTopicArn;
export const secondarySnsTopicArn = stack.secondarySnsTopicArn;

// Additional exports for operational use
export const environmentSuffix_output = environmentSuffix;
export const primaryRegion_output = primaryRegion;
export const secondaryRegion_output = secondaryRegion;
