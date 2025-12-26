/**
 * LocalStack Configuration for Pulumi TypeScript
 * Template: pulumi-ts-config
 * 
 * Usage: Import and use when creating Pulumi resources for LocalStack
 */

import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

// Detect LocalStack environment
export const isLocalStack = (): boolean => {
  return !!(
    process.env.LOCALSTACK_HOSTNAME ||
    process.env.AWS_ENDPOINT_URL ||
    process.env.PULUMI_LOCALSTACK
  );
};

// LocalStack endpoint
export const localstackEndpoint = "http://localhost:4566";

// Create LocalStack-compatible AWS provider
export const createLocalStackProvider = (
  name: string = "localstack"
): aws.Provider => {
  return new aws.Provider(name, {
    region: "us-east-1",
    accessKey: "test",
    secretKey: "test",
    skipCredentialsValidation: true,
    skipMetadataApiCheck: true,
    skipRequestingAccountId: true,
    s3UsePathStyle: true,
    endpoints: [{
      acm: localstackEndpoint,
      apigateway: localstackEndpoint,
      cloudformation: localstackEndpoint,
      cloudwatch: localstackEndpoint,
      dynamodb: localstackEndpoint,
      ec2: localstackEndpoint,
      es: localstackEndpoint,
      events: localstackEndpoint,
      firehose: localstackEndpoint,
      iam: localstackEndpoint,
      kinesis: localstackEndpoint,
      kms: localstackEndpoint,
      lambda: localstackEndpoint,
      logs: localstackEndpoint,
      rds: localstackEndpoint,
      route53: localstackEndpoint,
      s3: localstackEndpoint,
      secretsmanager: localstackEndpoint,
      ses: localstackEndpoint,
      sns: localstackEndpoint,
      sqs: localstackEndpoint,
      ssm: localstackEndpoint,
      stepfunctions: localstackEndpoint,
      sts: localstackEndpoint,
    }],
  });
};

// Get provider based on environment
export const getProvider = (): aws.Provider | undefined => {
  if (isLocalStack()) {
    return createLocalStackProvider();
  }
  return undefined;
};

// Common resource options for LocalStack
export const getLocalStackResourceOptions = (): pulumi.ResourceOptions => ({
  provider: getProvider(),
});

// S3 bucket args for LocalStack
export const getLocalStackS3Args = (
  bucketName?: string
): Partial<aws.s3.BucketArgs> => ({
  bucket: bucketName,
  forceDestroy: isLocalStack(), // Easy cleanup for LocalStack
  tags: {
    Environment: isLocalStack() ? "localstack" : "production",
  },
});

