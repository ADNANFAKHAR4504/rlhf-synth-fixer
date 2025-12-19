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


// EXPORTS - Stack Outputs
 
// These outputs are accessible via `pulumi stack output <output-name>`
// or programmatically through the Pulumi automation API.

// Network Outputs
export const vpcId = stack.vpc.id;
export const vpcCidr = stack.vpc.cidrBlock;
export const publicSubnetIds = pulumi.all(stack.publicSubnets.map(s => s.id));
export const privateSubnetIds = pulumi.all(stack.privateSubnets.map(s => s.id));
export const databaseSubnetIds = pulumi.all(stack.databaseSubnets.map(s => s.id));

// Security Group Outputs
export const albSecurityGroupId = stack.albSecurityGroup.id;
export const ecsSecurityGroupId = stack.ecsSecurityGroup.id;
export const rdsSecurityGroupId = stack.rdsSecurityGroup.id;

// Load Balancer Outputs
export const albDnsName = stack.alb.dnsName;
export const albArn = stack.alb.arn;
export const albZoneId = stack.alb.zoneId;
export const albUrl = pulumi.interpolate`http://${stack.alb.dnsName}`;

// Target Group Outputs
export const apiTargetGroupBlueArn = stack.albTargetGroupBlue.arn;
export const apiTargetGroupGreenArn = stack.albTargetGroupGreen.arn;

// ECS Cluster Outputs
export const ecsClusterName = stack.ecsCluster.name;
export const ecsClusterArn = stack.ecsCluster.arn;

// ECS Service Outputs
export const apiServiceName = stack.apiService.name;
export const frontendServiceName = stack.frontendService.name;

// Database Outputs
export const auroraClusterEndpoint = stack.auroraCluster.endpoint;
export const auroraClusterReaderEndpoint = stack.auroraCluster.readerEndpoint;
export const auroraClusterArn = stack.auroraCluster.arn;
export const auroraClusterId = stack.auroraCluster.id;
export const dbSecretArn = stack.dbSecret.arn;

// ECR Repository Outputs
export const ecrApiRepositoryUrl = stack.ecrApiRepository.repositoryUrl;
export const ecrFrontendRepositoryUrl = stack.ecrFrontendRepository.repositoryUrl;

// CloudWatch Log Group Outputs
export const apiLogGroupName = stack.apiLogGroup.name;
export const frontendLogGroupName = stack.frontendLogGroup.name;

// IAM Role Outputs
export const ecsTaskExecutionRoleArn = stack.ecsTaskExecutionRole.arn;
export const ecsTaskRoleArn = stack.ecsTaskRole.arn;

// Composite Outputs for easy reference
export const apiEndpoint = pulumi.interpolate`http://${stack.alb.dnsName}/api`;
export const frontendEndpoint = pulumi.interpolate`http://${stack.alb.dnsName}`;

// Structured output for JSON export (matches the exportOutputs method)
export const allOutputs = stack.outputs;

// Environment information
export const environment = {
  suffix: environmentSuffix,
  repository: repository,
  author: commitAuthor,
};
