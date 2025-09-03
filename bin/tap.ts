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
  tags: defaultTags,
  environmentSuffix: environmentSuffix,
});

// Export stack outputs
export const albDnsName = stack.albDnsName;
export const cloudFrontDomainName = stack.cloudFrontDomainName;
export const vpcId = stack.vpcId;
export const rdsEndpoint = stack.rdsEndpoint;
export const publicSubnetIds = stack.publicSubnetIds;
export const privateSubnetIds = stack.privateSubnetIds;
export const autoScalingGroupName = stack.autoScalingGroupName;
export const targetGroupArn = stack.targetGroupArn;
export const launchTemplateId = stack.launchTemplateId;
export const secretArn = stack.secretArn;
export const backupVaultName = stack.backupVaultName;
// Export outputs with underscore naming convention to match expected format
export const bastion_instance_id = stack.bastionInstanceId;
export const web_server_1_id = stack.webServer1Id;
export const web_server_2_id = stack.webServer2Id;
export const s3_bucket_name = stack.s3BucketName;
export const kms_key_id = stack.kmsKeyId;
export const lambda_function_name = stack.lambdaFunctionName;
export const vpc_id = stack.vpcId;
export const public_subnet_ids = stack.publicSubnetIds.apply(ids =>
  ids.join(',')
);
export const private_subnet_ids = stack.privateSubnetIds.apply(ids =>
  ids.join(',')
);
export const rds_endpoint = stack.rdsEndpoint;
export const alb_dns_name = stack.albDnsName;
export const cloudfront_domain_name = stack.cloudFrontDomainName;
export const auto_scaling_group_name = stack.autoScalingGroupName;
export const target_group_arn = stack.targetGroupArn;
export const launch_template_id = stack.launchTemplateId;
export const secret_arn = stack.secretArn;
export const backup_vault_name = stack.backupVaultName;
