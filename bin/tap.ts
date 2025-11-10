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
  process.env.ENVIRONMENT_SUFFIX || config.get('environmentSuffix') || 'dev';

// Get container image URIs from config
const paymentApiImage =
  config.get('paymentApiImage') ||
  '123456789012.dkr.ecr.us-east-1.amazonaws.com/payment-api:latest';
const fraudDetectorImage =
  config.get('fraudDetectorImage') ||
  '123456789012.dkr.ecr.us-east-1.amazonaws.com/fraud-detector:latest';
const notificationServiceImage =
  config.get('notificationServiceImage') ||
  '123456789012.dkr.ecr.us-east-1.amazonaws.com/notification-service:latest';

// Get metadata from environment variables for tagging purposes.
// These are often injected by CI/CD systems.
const repository = config.get('repository') || 'unknown';
const commitAuthor = config.get('commitAuthor') || 'unknown';

// Define a set of default tags to apply to all resources.
const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
};

// Instantiate the main stack component for the infrastructure.
// This encapsulates all the resources for the Kubernetes microservices deployment.
const stack = new TapStack('TapStack', {
  environmentSuffix,
  paymentApiImage,
  fraudDetectorImage,
  notificationServiceImage,
  tags: defaultTags,
});

// Export stack outputs
export const namespaceName = stack.namespaceName;
export const gatewayUrl = stack.gatewayUrl;
export const paymentApiEndpoint = stack.paymentApiEndpoint;
export const fraudDetectorEndpoint = stack.fraudDetectorEndpoint;
export const notificationServiceEndpoint = stack.notificationServiceEndpoint;
export const hpaStatus = stack.hpaStatus;
