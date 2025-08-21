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
  environmentSuffix,
  tags: defaultTags,
});

// Export key stack outputs for reference and testing
export const vpcId = stack.vpcId;
export const apiUrl = stack.apiUrl;
export const bucketName = stack.bucketName;
export const lambdaFunctionName = stack.lambdaFunctionName;

// Export all networking outputs
export const privateSubnetIds = stack.privateSubnetIds;
export const publicSubnetIds = stack.publicSubnetIds;
export const vpcSecurityGroupId = stack.vpcSecurityGroupId;
export const s3VpcEndpointId = stack.s3VpcEndpointId;
export const vpcCidrBlock = stack.vpcCidrBlock;

// Export all Lambda outputs
export const lambdaFunctionUrl = stack.lambdaFunctionUrl;
export const lambdaFunctionArn = stack.lambdaFunctionArn;
export const lambdaRoleArn = stack.lambdaRoleArn;
export const lambdaRoleName = stack.lambdaRoleName;

// Export all S3 outputs
export const s3BucketArn = stack.s3BucketArn;
export const s3AccessLogsBucketName = stack.s3AccessLogsBucketName;
export const s3AccessLogsBucketArn = stack.s3AccessLogsBucketArn;

// Export all CloudWatch outputs
export const lambdaLogGroupName = stack.lambdaLogGroupName;
export const lambdaLogGroupArn = stack.lambdaLogGroupArn;
export const apiGatewayLogGroupName = stack.apiGatewayLogGroupName;
export const apiGatewayLogGroupArn = stack.apiGatewayLogGroupArn;

// Export all API Gateway outputs
export const apiGatewayId = stack.apiGatewayId;
export const apiGatewayStageId = stack.apiGatewayStageId;
export const apiGatewayStageName = stack.apiGatewayStageName;
export const apiGatewayIntegrationId = stack.apiGatewayIntegrationId;
export const apiGatewayMethodId = stack.apiGatewayMethodId;
export const apiGatewayResourceId = stack.apiGatewayResourceId;

// Export environment and configuration
export const region = stack.region;
export const stackTags = stack.tags;
