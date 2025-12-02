import { TapStack } from './tap-stack';

// Get environment suffix from environment variable or use default
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const awsRegion = process.env.AWS_REGION || 'us-east-1';

// Create the stack
const stack = new TapStack(`TapStack${environmentSuffix}`, {
  environmentSuffix,
  awsRegion,
});

// Export stack outputs
export const pipelineUrl = stack.pipelineUrl;
export const ecrRepositoryUri = stack.ecrRepositoryUri;
export const bucketName = stack.bucketName;
export const snsTopicArn = stack.snsTopicArn;
export const sqsQueueUrl = stack.sqsQueueUrl;
export const lambdaFunctionArn = stack.lambdaFunctionArn;
export const dynamodbTableName = stack.dynamodbTableName;
