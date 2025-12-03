/**
 * Pulumi application entry point for the TAP (Test Automation Platform) infrastructure.
 *
 * This module defines the core Pulumi stack and imports the infrastructure resources
 * from the tap-stack module. It handles environment-specific settings and tagging
 * for AWS resources.
 *
 * The stack uses environment suffixes to distinguish between different deployment
 * environments (development, staging, production, etc.).
 */

// Import the stack module - this will create all resources
import * as tapStack from '../lib/tap-stack';

// Re-export all outputs from the stack
export const vpcId = tapStack.vpcId;
export const clusterName = tapStack.clusterName;
export const clusterArn = tapStack.clusterArn;
export const albDnsName = tapStack.albDnsName;
export const albUrl = tapStack.albUrl;
export const ecrRepositoryUrl = tapStack.ecrRepositoryUrl;
export const logGroupName = tapStack.logGroupName;
export const taskDefinitionArn = tapStack.taskDefinitionArn;
export const serviceName = tapStack.serviceName;
