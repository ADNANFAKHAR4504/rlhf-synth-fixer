/**
 * Configuration types and utilities for the payment infrastructure migration
 */
import * as fs from 'fs';

export interface DevConfig {
  s3Buckets: S3BucketConfig[];
  dynamoTables: DynamoTableConfig[];
  lambdaFunctions: LambdaFunctionConfig[];
}

export interface S3BucketConfig {
  name: string;
  tags?: { [key: string]: string };
}

export interface DynamoTableConfig {
  name: string;
  hashKey: string;
  rangeKey?: string;
  attributes: Array<{ name: string; type: string }>;
  tags?: { [key: string]: string };
}

export interface LambdaFunctionConfig {
  name: string;
  handler: string;
  runtime: string;
  codeS3Bucket?: string;
  codeS3Key?: string;
  environment?: { [key: string]: string };
  tags?: { [key: string]: string };
}

export function loadDevConfig(configPath: string): DevConfig {
  return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}
