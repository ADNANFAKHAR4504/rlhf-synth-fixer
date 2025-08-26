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
const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
};

// Instantiate the main stack component for the infrastructure.
// This encapsulates all the resources for the platform.
const tapStack = new TapStack('pulumi-infra', {
  tags: defaultTags,
  environment: environmentSuffix,
  regions: ['us-east-1', 'eu-west-2'], // Pass regions explicitly
});

// Export all the important outputs at the stack level so they can be accessed by integration tests
export const vpcId = tapStack.vpc.id;
export const internetGatewayId = tapStack.internetGateway.id;
export const privateSubnetIds = pulumi.all(tapStack.privateSubnets.map(s => s.id));
export const publicSubnetIds = pulumi.all(tapStack.publicSubnets.map(s => s.id));
export const cloudTrailBucketName = tapStack.cloudTrailBucket.bucket;
export const cloudTrailBucketArn = tapStack.cloudTrailBucket.arn;
export const parameterStorePrefix = tapStack.parameterStorePrefix;
export const environment = pulumi.output(environmentSuffix);
export const regions = pulumi.output(['us-east-1', 'eu-west-2']);
export const awsRegion = pulumi.output(aws.getRegion().then((r: aws.GetRegionResult) => r.name));
export const accountId = pulumi.output(aws.getCallerIdentity().then((c: aws.GetCallerIdentityResult) => c.accountId));
export const logGroupName = tapStack.logGroup.name;
export const logGroupArn = tapStack.logGroup.arn;
export const alarmTopicArn = tapStack.alarmTopic.arn;
export const dashboardArn = tapStack.dashboard.dashboardArn;
export const vpcFlowLogsId = tapStack.vpcFlowLogs.id;
export const cloudTrailRoleArn = tapStack.cloudTrailRole.arn;
export const deploymentRoleArn = tapStack.deploymentRole.arn;
export const vpcFlowLogsRoleArn = tapStack.vpcFlowLogsRole.arn;
export const stackName = pulumi.output('TapStack');
export const timestamp = pulumi.output(new Date().toISOString());
export const tags = pulumi.output(defaultTags);
export const testEnvironment = pulumi.output(
  environmentSuffix === 'integration-test' || 
  environmentSuffix.includes('test')
);
export const deploymentComplete = pulumi.output(true);

// Export the structured outputs for easy access
export const stackOutputs = tapStack.stackOutputs;

// Export all outputs as a single object for easier integration testing
// Fixed: Create the combined outputs properly by applying each output individually
export const allOutputs = pulumi.output({
  vpcId: vpcId,
  internetGatewayId: internetGatewayId,
  privateSubnetIds: privateSubnetIds,
  publicSubnetIds: publicSubnetIds,
  cloudTrailBucketName: cloudTrailBucketName,
  cloudTrailBucketArn: cloudTrailBucketArn,
  parameterStorePrefix: parameterStorePrefix,
  environment: environment,
  regions: regions,
  awsRegion: awsRegion,
  accountId: accountId,
  logGroupName: logGroupName,
  logGroupArn: logGroupArn,
  alarmTopicArn: alarmTopicArn,
  dashboardArn: dashboardArn,
  vpcFlowLogsId: vpcFlowLogsId,
  cloudTrailRoleArn: cloudTrailRoleArn,
  deploymentRoleArn: deploymentRoleArn,
  vpcFlowLogsRoleArn: vpcFlowLogsRoleArn,
  stackName: stackName,
  timestamp: timestamp,
  tags: tags,
  testEnvironment: testEnvironment,
  deploymentComplete: deploymentComplete,
});
