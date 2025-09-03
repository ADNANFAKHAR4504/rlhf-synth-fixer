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
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

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
  environmentSuffix: environmentSuffix,
  tags: defaultTags,
});

// Export all stack outputs
export const vpcId = stack.vpcId;
export const publicSubnetIds = stack.publicSubnetIds;
export const privateSubnetIds = stack.privateSubnetIds;
export const albDnsName = stack.albDnsName;
export const s3BucketName = stack.s3BucketName;
export const rdsEndpoint = stack.rdsEndpoint;
export const natGatewayIp = stack.natGatewayIp;
export const albArn = stack.albArn;
export const targetGroupArn = stack.targetGroupArn;
export const autoScalingGroupName = stack.autoScalingGroupName;
export const kmsKeyId = stack.kmsKeyId;
export const ec2SecurityGroupId = stack.ec2SecurityGroupId;
export const rdsSecurityGroupId = stack.rdsSecurityGroupId;
export const albSecurityGroupId = stack.albSecurityGroupId;
export const rdsInstanceId = stack.rdsInstanceId;
export const launchTemplateId = stack.launchTemplateId;
export const vpcFlowLogGroupName = stack.vpcFlowLogGroupName;
export const cpuAlarmHighName = stack.cpuAlarmHighName;
export const cpuAlarmLowName = stack.cpuAlarmLowName;
export const rdsConnectionsAlarmName = stack.rdsConnectionsAlarmName;
export const rdsCpuAlarmName = stack.rdsCpuAlarmName;
