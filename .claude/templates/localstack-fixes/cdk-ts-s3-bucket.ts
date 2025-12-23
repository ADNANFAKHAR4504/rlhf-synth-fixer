/**
 * LocalStack-Compatible S3 Bucket Configuration for CDK TypeScript
 * Template: cdk-ts-s3-bucket
 * 
 * Usage: Use this pattern when creating S3 buckets for LocalStack
 */

import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { isLocalStack, getRemovalPolicy } from './cdk-ts-endpoint';

/**
 * Create an S3 bucket with LocalStack-compatible settings
 */
export const createLocalStackBucket = (
  scope: Construct,
  id: string,
  props?: Partial<s3.BucketProps>
): s3.Bucket => {
  const isLocal = isLocalStack();
  
  return new s3.Bucket(scope, id, {
    // LocalStack settings
    removalPolicy: getRemovalPolicy(),
    autoDeleteObjects: isLocal, // Only for LocalStack
    
    // Bucket naming - LocalStack is more permissive but AWS has stricter rules
    // Using a deterministic name helps with testing
    ...(isLocal && props?.bucketName === undefined && {
      bucketName: `${id.toLowerCase()}-${cdk.Stack.of(scope).account}`,
    }),
    
    // Default encryption (works with LocalStack)
    encryption: s3.BucketEncryption.S3_MANAGED,
    
    // Block public access by default
    blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    
    // Merge with provided props
    ...props,
  });
};

/**
 * S3 bucket props optimized for LocalStack
 */
export const getLocalStackBucketProps = (
  overrides?: Partial<s3.BucketProps>
): Partial<s3.BucketProps> => ({
  removalPolicy: getRemovalPolicy(),
  autoDeleteObjects: isLocalStack(),
  encryption: s3.BucketEncryption.S3_MANAGED,
  blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
  versioned: false, // Simpler for testing
  ...overrides,
});

