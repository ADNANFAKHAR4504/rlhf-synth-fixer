import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { PaymentStack } from './payment-stack';

// Get environment suffix from environment variable
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || pulumi.getStack();

// Get metadata from environment variables for tagging
const repository = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';
const prNumber = process.env.PR_NUMBER || 'unknown';
const team = process.env.TEAM || 'unknown';
const createdAt = new Date().toISOString();

// Define default tags
const defaultTags = {
  Repository: repository,
  Author: commitAuthor,
  PRNumber: prNumber,
  Team: team,
  CreatedAt: createdAt,
  ManagedBy: 'Pulumi',
};

// Configure AWS provider with default tags
const provider = new aws.Provider('aws-provider', {
  region: process.env.AWS_REGION || 'us-east-1',
  defaultTags: {
    tags: defaultTags,
  },
});

// Instantiate the payment processing stack
const paymentStack = new PaymentStack(
  'payment-infra',
  {
    environmentSuffix,
    tags: defaultTags,
  },
  { provider }
);

// Export all resource ARNs and endpoints for cross-stack references
export const vpcId = paymentStack.vpcId;
export const dbEndpoint = paymentStack.dbEndpoint;
export const dbArn = paymentStack.dbArn;
export const lambdaArn = paymentStack.lambdaArn;
export const apiEndpoint = paymentStack.apiEndpoint;
export const apiArn = paymentStack.apiArn;
export const dynamoTableName = paymentStack.dynamoTableName;
export const dynamoTableArn = paymentStack.dynamoTableArn;
export const auditBucketName = paymentStack.auditBucketName;
export const auditBucketArn = paymentStack.auditBucketArn;
