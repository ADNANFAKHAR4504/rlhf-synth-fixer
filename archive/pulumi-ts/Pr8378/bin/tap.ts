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
import * as aws from '@pulumi/aws';
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
  environmentSuffix: environmentSuffix,
  tags: defaultTags,
});

// Export stack outputs for use by other stacks or external systems
export const vpcId = stack.network.vpc.id;
export const cloudfrontDomain =
  stack.frontend.cloudfrontDistribution.domainName;
export const kinesisStreamName = stack.dataProcessing.kinesisStream.name;
export const snsTopicArn = stack.monitoring.snsTopic.arn;

// Additional useful exports
export const apiGatewayUrl = pulumi.interpolate`https://${stack.backend.apiGateway.id}.execute-api.${pulumi.output(aws.getRegion()).name}.amazonaws.com/v1`;
export const lambdaFunctionName = stack.backend.lambdaFunction.name;
export const dynamodbTableName = stack.backend.table.name;
export const s3BucketName = stack.frontend.bucket.bucket;
