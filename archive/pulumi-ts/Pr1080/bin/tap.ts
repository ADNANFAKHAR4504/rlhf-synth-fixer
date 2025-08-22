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

// Export the stack outputs so they can be accessed by other systems
export const albDnsName = stack.albDnsName;
export const rdsEndpoint = stack.rdsEndpoint;
export const s3BucketName = stack.s3BucketName;
export const rdsIdentifier = stack.rdsIdentifier;
export const launchTemplateName = stack.launchTemplateName;
export const vpcId = stack.webAppStack.vpc.id;
export const publicSubnetIds = stack.webAppStack.publicSubnets.map(
  subnet => subnet.id
);
export const privateSubnetIds = stack.webAppStack.privateSubnets.map(
  subnet => subnet.id
);

// Additional exports for integration testing
export const albName = stack.albName;
export const autoScalingGroupName = stack.autoScalingGroupName;
export const ec2RoleName = stack.ec2RoleName;
export const ec2InstanceProfileName = stack.ec2InstanceProfileName;
export const ec2PolicyName = stack.ec2PolicyName;
export const rdsInstanceId = stack.rdsInstanceId;
export const rdsKmsKeyId = stack.rdsKmsKeyId;
export const rdsKmsKeyAlias = stack.rdsKmsKeyAlias;
export const projectName = stack.projectName;
export const environment = stack.environment;
export const resourcePrefix = stack.resourcePrefix;
