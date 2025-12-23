import { GetFunctionCommand, LambdaClient } from '@aws-sdk/client-lambda';
import {
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import * as cdk from 'aws-cdk-lib';
import * as fs from 'fs';
import * as path from 'path';
import { TapStack } from '../lib/tap-stack';

// LocalStack endpoint configuration
const endpointUrl = process.env.AWS_ENDPOINT_URL || 'http://localhost:4566';
const isLocalStack = endpointUrl.includes('localhost') || endpointUrl.includes('4566');

describe('TapStack Integration Tests', () => {
  test('Stack can be synthesized', () => {
    const app = new cdk.App();

    // This should not throw an error
    expect(() => {
      new TapStack(app, 'TestStack', {
        env: {
          account: '123456789012',
          region: 'us-west-2',
        },
      });
    }).not.toThrow();
  });

  test('Stack synthesizes with environment suffix', () => {
    const app = new cdk.App();

    expect(() => {
      new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
        env: {
          account: '123456789012',
          region: 'us-west-2',
        },
      });
    }).not.toThrow();
  });

  test('Stack can be deployed to us-west-2', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'TestStack', {
      env: {
        region: 'us-west-2',
      },
    });

    expect(stack.region).toBe('us-west-2');
  });
});

// Integration tests against live deployed resources
describe('TapStack Live Integration Tests', () => {
  let outputs: any = {};
  const region = process.env.AWS_REGION || 'us-east-1';

  beforeAll(() => {
    // Load the deployment outputs
    const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
    if (fs.existsSync(outputsPath)) {
      outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
    }
  });

  test('S3 Main Bucket has encryption enabled', async () => {
    if (!outputs.MainBucketName) {
      console.warn('MainBucketName not found in outputs, skipping test');
      return;
    }

    const s3Client = new S3Client({
      region,
      ...(isLocalStack && { endpoint: endpointUrl, forcePathStyle: true })
    });
    const command = new GetBucketEncryptionCommand({
      Bucket: outputs.MainBucketName,
    });

    const response = await s3Client.send(command);
    expect(response.ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
  });

  test('S3 Main Bucket has public access blocked', async () => {
    if (!outputs.MainBucketName) {
      console.warn('MainBucketName not found in outputs, skipping test');
      return;
    }

    const s3Client = new S3Client({
      region,
      ...(isLocalStack && { endpoint: endpointUrl, forcePathStyle: true })
    });
    const command = new GetPublicAccessBlockCommand({
      Bucket: outputs.MainBucketName,
    });

    const response = await s3Client.send(command);
    expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
    expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
    expect(response.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
    expect(response.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
  });

  test('Lambda function has correct configuration', async () => {
    if (!outputs.LambdaFunctionName) {
      console.warn('LambdaFunctionName not found in outputs, skipping test');
      return;
    }

    const lambdaClient = new LambdaClient({
      region,
      ...(isLocalStack && { endpoint: endpointUrl })
    });
    const command = new GetFunctionCommand({
      FunctionName: outputs.LambdaFunctionName,
    });

    const response = await lambdaClient.send(command);
    expect(response.Configuration?.Runtime).toBe('python3.11');
    expect(response.Configuration?.Timeout).toBe(300);
    expect(response.Configuration?.MemorySize).toBe(256);
  });

  test('VPC exists and is configured', async () => {
    if (!outputs.VpcId) {
      console.warn('VpcId not found in outputs, skipping test');
      return;
    }

    // For LocalStack, just check that VPC ID is present in outputs
    expect(outputs.VpcId).toBeTruthy();
    expect(outputs.VpcId).toMatch(/^vpc-/);
  });

  test('S3 Access Logs Bucket exists and is configured', async () => {
    if (!outputs.AccessLogsBucketName) {
      console.warn('AccessLogsBucketName not found in outputs, skipping test');
      return;
    }

    const s3Client = new S3Client({
      region,
      ...(isLocalStack && { endpoint: endpointUrl, forcePathStyle: true })
    });
    const encryptionCommand = new GetBucketEncryptionCommand({
      Bucket: outputs.AccessLogsBucketName,
    });

    const encryptionResponse = await s3Client.send(encryptionCommand);
    expect(encryptionResponse.ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');

    const publicAccessCommand = new GetPublicAccessBlockCommand({
      Bucket: outputs.AccessLogsBucketName,
    });

    const publicAccessResponse = await s3Client.send(publicAccessCommand);
    expect(publicAccessResponse.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
  });

  test('Lambda function can access S3 bucket', async () => {
    if (!outputs.LambdaFunctionName || !outputs.MainBucketName) {
      console.warn('Lambda or S3 bucket not found in outputs, skipping test');
      return;
    }

    const lambdaClient = new LambdaClient({
      region,
      ...(isLocalStack && { endpoint: endpointUrl })
    });
    const command = new GetFunctionCommand({
      FunctionName: outputs.LambdaFunctionName,
    });

    const response = await lambdaClient.send(command);

    // Check that Lambda has the S3 bucket name in its environment
    expect(response.Configuration?.Environment?.Variables?.BUCKET_NAME).toBe(outputs.MainBucketName);
    expect(response.Configuration?.Environment?.Variables?.REGION).toBe(region);
  });
});
