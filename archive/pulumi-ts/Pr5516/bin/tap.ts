/**
 * Pulumi application entry point for the TAP (Test Automation Platform) infrastructure.
 *
 * This module defines the core Pulumi stack and instantiates the TapStack with appropriate
 * configuration for a multi-AZ payment processing application with automatic failover.
 *
 * The application deploys across 3 availability zones in eu-central-1 with:
 * - Auto Scaling Group maintaining 2 instances per AZ
 * - Application Load Balancer with health checks every 30 seconds
 * - CloudWatch alarms for unhealthy target detection
 * - SNS notifications for failover events
 * - Route53 health checks with HTTPS endpoint monitoring
 */
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Initialize Pulumi configuration for the current stack
const config = new pulumi.Config();

// Get the environment suffix from the CI, Pulumi config, defaulting to 'dev'
const environmentSuffix =
  process.env.ENVIRONMENT_SUFFIX || config.get('env') || 'dev';

// Get metadata from environment variables for tagging purposes
const repository = config.get('repository') || 'iac-test-automations';
const commitAuthor = config.get('commitAuthor') || 'system';

// Define default tags for all resources
// These tags are required per the task specification
const defaultTags = {
  Environment: 'Production',
  FailoverEnabled: 'true',
  Repository: repository,
  Author: commitAuthor,
  ManagedBy: 'Pulumi',
};

// Instantiate the main stack component for the multi-AZ failover infrastructure
const stack = new TapStack('pulumi-infra', {
  environmentSuffix,
  tags: defaultTags,
});

// Export important stack outputs for use by other systems or for reference
export const vpcId = stack.vpcId;
export const albDnsName = stack.albDnsName;
export const applicationEndpoint = pulumi.interpolate`http://${stack.albDnsName}`;
export const snsTopicArn = stack.snsTopicArn;
export const autoScalingGroupName = stack.autoScalingGroupName;
