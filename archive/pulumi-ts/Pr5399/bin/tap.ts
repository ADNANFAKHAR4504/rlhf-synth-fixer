/**
 * Pulumi application entry point for the Payment API ECS infrastructure.
 *
 * This module defines the core Pulumi stack and instantiates the TapStack with appropriate
 * configuration for deploying a containerized web application on ECS with auto-scaling
 * and load balancing capabilities.
 */
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Initialize Pulumi configuration for the current stack
const config = new pulumi.Config();

// Get the environment suffix from environment variable, Pulumi config, or default to 'dev'
const environmentSuffix =
  process.env.ENVIRONMENT_SUFFIX || config.get('env') || 'dev';

// Get metadata from environment variables for tagging
const repository = config.get('repository') || 'unknown';
const commitAuthor = config.get('commitAuthor') || 'unknown';

// Get container image from config or use default nginx
const containerImage =
  config.get('containerImage') || 'public.ecr.aws/nginx/nginx:latest';

// Define default tags for all resources
const defaultTags = {
  Environment: 'production',
  Project: 'payment-api',
  Repository: repository,
  Author: commitAuthor,
  ManagedBy: 'Pulumi',
};

// Instantiate the main stack component
const stack = new TapStack('payment-api-infra', {
  environmentSuffix: environmentSuffix,
  tags: defaultTags,
  containerImage: containerImage,
});

// Export stack outputs
export const vpcId = stack.vpcId;
export const albDnsName = stack.albDns;
export const ecsClusterArn = stack.clusterArn;
export const ecsServiceArn = stack.serviceArn;
