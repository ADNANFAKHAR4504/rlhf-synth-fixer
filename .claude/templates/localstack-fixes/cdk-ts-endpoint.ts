/**
 * LocalStack Endpoint Configuration for CDK TypeScript
 * Template: cdk-ts-endpoint
 * 
 * Usage: Import and use in your CDK stack for LocalStack compatibility
 */

import * as cdk from 'aws-cdk-lib';

// Detect LocalStack environment
export const isLocalStack = (): boolean => {
  return !!(
    process.env.LOCALSTACK_HOSTNAME ||
    process.env.AWS_ENDPOINT_URL ||
    process.env.CDK_LOCAL
  );
};

// Get LocalStack endpoint URL
export const getLocalStackEndpoint = (): string | undefined => {
  if (isLocalStack()) {
    return process.env.AWS_ENDPOINT_URL || 'http://localhost:4566';
  }
  return undefined;
};

// AWS configuration for LocalStack
export const getAwsConfig = () => ({
  endpoint: getLocalStackEndpoint(),
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: isLocalStack() ? {
    accessKeyId: 'test',
    secretAccessKey: 'test',
  } : undefined,
});

// S3 configuration (requires path-style access for LocalStack)
export const getS3Config = () => ({
  ...getAwsConfig(),
  forcePathStyle: isLocalStack(),
  s3ForcePathStyle: isLocalStack(),
});

// Common CDK props for LocalStack compatibility
export const getLocalStackProps = (): Partial<cdk.StackProps> => ({
  env: {
    account: isLocalStack() ? '000000000000' : process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.AWS_REGION || 'us-east-1',
  },
});

// Removal policy for LocalStack (always DESTROY for easy cleanup)
export const getRemovalPolicy = (): cdk.RemovalPolicy => {
  return isLocalStack() ? cdk.RemovalPolicy.DESTROY : cdk.RemovalPolicy.RETAIN;
};

