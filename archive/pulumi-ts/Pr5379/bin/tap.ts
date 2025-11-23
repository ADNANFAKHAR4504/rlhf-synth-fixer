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

// Get the environment suffix from the CI, Pulumi config, defaulting to 'dev'.
const environmentSuffix =
  process.env.ENVIRONMENT_SUFFIX || config.get('env') || 'dev';

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

// Export stack outputs for integration testing
export const KmsKeyArn = stack.kmsKeyArn;

// Export specific S3 bucket names
export const PaymentDocumentsBucketName = pulumi.interpolate`payment-documents-${environmentSuffix}`;
export const PaymentReceiptsBucketName = pulumi.interpolate`payment-receipts-${environmentSuffix}`;
export const LambdaCodeBucketName = pulumi.interpolate`lambda-code-${environmentSuffix}`;

// Export specific DynamoDB table names
export const TransactionsTableName = pulumi.interpolate`transactions-${environmentSuffix}`;
export const CustomersTableName = pulumi.interpolate`customers-${environmentSuffix}`;

// Export specific Lambda function names
export const PaymentProcessorLambdaName = pulumi.interpolate`payment-processor-${environmentSuffix}`;
export const PaymentValidatorLambdaName = pulumi.interpolate`payment-validator-${environmentSuffix}`;

// Export Lambda function ARNs
export const PaymentProcessorLambdaArn = stack.lambdaArns[0];
export const PaymentValidatorLambdaArn = stack.lambdaArns[1];

// Export DynamoDB table ARNs
export const TransactionsTableArn = stack.tableArns[0];
export const CustomersTableArn = stack.tableArns[1];

// Export API Gateway endpoint and dashboard
export const ApiEndpoint = stack.apiEndpoint;
export const DashboardName = stack.dashboardName;
