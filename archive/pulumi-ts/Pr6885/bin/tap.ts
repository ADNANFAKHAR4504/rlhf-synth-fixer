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
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { PaymentEnvironmentComponent } from '../lib/payment-environment';
import { EnvironmentConfig } from '../lib/types';

// Get the environment suffix from environment variables, defaulting to 'dev'.
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const environment = process.env.ENVIRONMENT || 'dev';

// Get metadata from environment variables for tagging purposes.
// These are often injected by CI/CD systems.
const repository = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';
const prNumber = process.env.PR_NUMBER || 'unknown';
const team = process.env.TEAM || 'unknown';
const createdAt = new Date().toISOString();

// Define a set of default tags to apply to all resources.
const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
  PRNumber: prNumber,
  Team: team,
  CreatedAt: createdAt,
};

// Configure AWS provider with default tags
const provider = new aws.Provider('aws', {
  region: process.env.AWS_REGION || 'us-east-1',
  defaultTags: {
    tags: defaultTags,
  },
});

// Define environment configurations
const environments: { [key: string]: EnvironmentConfig } = {
  dev: {
    name: 'dev',
    logRetentionDays: 7,
    lambdaConcurrency: 10,
    rdsAlarmThreshold: 80,
    enableWaf: false,
  },
  staging: {
    name: 'staging',
    logRetentionDays: 30,
    lambdaConcurrency: 50,
    rdsAlarmThreshold: 75,
    enableWaf: false,
  },
  prod: {
    name: 'prod',
    logRetentionDays: 90,
    lambdaConcurrency: 200,
    rdsAlarmThreshold: 70,
    enableWaf: true,
  },
};

// Get the configuration for the current environment
const envConfig = environments[environment];
if (!envConfig) {
  throw new Error(
    `Invalid environment: ${environment}. Must be one of: dev, staging, prod`
  );
}

// Instantiate the main stack component for the infrastructure.
// This encapsulates all the resources for the platform.
const paymentInfra = new PaymentEnvironmentComponent(
  `${environment}-payment-infra`,
  {
    environment: environment,
    environmentSuffix: environmentSuffix,
    config: envConfig,
  },
  { provider }
);

// Export stack outputs
export const vpcId = paymentInfra.network.vpc.id;
export const subnetIds = pulumi
  .output(paymentInfra.network.privateSubnets)
  .apply(subnets => subnets.map(s => s.id));
export const databaseEndpoint = paymentInfra.database.cluster.endpoint;
export const databaseArn = paymentInfra.database.cluster.arn;
export const apiEndpoint = paymentInfra.api.stage.invokeUrl;
export const transactionTableName = paymentInfra.storage.transactionTable.name;
export const transactionTableArn = paymentInfra.storage.transactionTable.arn;
export const auditBucketName = paymentInfra.storage.auditBucket.bucket;
export const auditBucketArn = paymentInfra.storage.auditBucket.arn;
export const lambdaFunctionArn =
  paymentInfra.compute.paymentProcessorFunction.arn;
export const lambdaFunctionName =
  paymentInfra.compute.paymentProcessorFunction.name;
export const validationFunctionArn =
  paymentInfra.compute.validationFunction.arn;
export const validationFunctionName =
  paymentInfra.compute.validationFunction.name;
export const wafAclArn = paymentInfra.api.wafAcl?.arn;
