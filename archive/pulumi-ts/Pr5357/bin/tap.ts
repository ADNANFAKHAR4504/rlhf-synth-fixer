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
import * as pulumi from "@pulumi/pulumi";
import { TapStack } from "../lib/tap-stack";

// Get environment suffix from context or environment variable
const config = new pulumi.Config();
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX ||
  config.get("environmentSuffix") ||
  pulumi.getStack().split("-").pop() ||
  "dev";

const repositoryName = process.env.REPOSITORY || "unknown";
const commitAuthor = process.env.COMMIT_AUTHOR || "unknown";

// Create the stack with environment suffix
const stack = new TapStack("tap-stack", {
  environmentSuffix: environmentSuffix
});

// Export all outputs
export const vpcId = stack.outputs.vpcId;
export const vpcCidr = stack.outputs.vpcCidr;
export const albDnsName = stack.outputs.albDnsName;
export const albArn = stack.outputs.albArn;
export const ecsClusterArn = stack.outputs.ecsClusterArn;
export const ecsServiceName = stack.outputs.ecsServiceName;
export const rdsEndpoint = stack.outputs.rdsEndpoint;
export const rdsPort = stack.outputs.rdsPort;
export const rdsSecretArn = stack.outputs.rdsSecretArn;
export const s3BucketName = stack.outputs.s3BucketName;
export const route53ZoneId = stack.outputs.route53ZoneId;
export const route53ZoneName = stack.outputs.route53ZoneName;
export const cloudwatchDashboardArn = stack.outputs.cloudwatchDashboardArn;
export const publicSubnetIds = stack.outputs.publicSubnetIds;
export const privateSubnetIds = stack.outputs.privateSubnetIds;
export const vpcPeeringConnectionIds = stack.outputs.vpcPeeringConnectionIds;
export const repository = repositoryName;
export const author = commitAuthor;
