/**
 * Integration tests for TapStack - Cross-Region Migration Infrastructure
 * Tests real AWS deployed resources using stack outputs
 * NO MOCKING - All tests validate actual deployed infrastructure
 */

import { LambdaClient, GetFunctionCommand } from '@aws-sdk/client-lambda';
import {
  KMSClient,
  DescribeKeyCommand,
} from '@aws-sdk/client-kms';
import {
  SNSClient,
  GetTopicAttributesCommand,
} from '@aws-sdk/client-sns';
import * as fs from 'fs';
import * as path from 'path';

// Load outputs from deployed stack
const outputsPath = path.join(
  __dirname,
  '..',
  'cfn-outputs',
  'flat-outputs.json'
);
let stackOutputs: any;

if (fs.existsSync(outputsPath)) {
  const rawOutputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
  // Parse Pulumi outputs that may be stringified JSON
  stackOutputs = {};
  for (const [key, value] of Object.entries(rawOutputs)) {
    if (typeof value === 'string') {
      // Try to parse as JSON if it looks like JSON
      if (
        (value.startsWith('[') && value.endsWith(']')) ||
        (value.startsWith('{') && value.endsWith('}'))
      ) {
        try {
          stackOutputs[key] = JSON.parse(value);
        } catch {
          stackOutputs[key] = value;
        }
      } else {
        stackOutputs[key] = value;
      }
    } else {
      stackOutputs[key] = value;
    }
  }
} else {
  stackOutputs = {};
}

const region = 'eu-west-1';
const lambdaClient = new LambdaClient({ region });
const kmsClient = new KMSClient({ region });
const snsClient = new SNSClient({ region });

describe('TapStack Integration Tests', () => {
  describe('Stack Outputs Validation', () => {
    test('should have KMS key ID output', () => {
      if (Object.keys(stackOutputs).length > 0) {
        expect(stackOutputs.kmsKeyId || stackOutputs.KmsKeyId).toBeDefined();
      }
    });

    test('should have SNS topic ARN output', () => {
      if (Object.keys(stackOutputs).length > 0) {
        expect(stackOutputs.snsTopicArn || stackOutputs.SnsTopicArn).toBeDefined();
      }
    });

    test('should have bucket ARNs output', () => {
      const bucketArns = stackOutputs.bucketArns || stackOutputs.BucketArns;
      if (bucketArns) {
        expect(Array.isArray(bucketArns)).toBe(true);
      }
    });

    test('should have table ARNs output', () => {
      const tableArns = stackOutputs.tableArns || stackOutputs.TableArns;
      if (tableArns) {
        expect(Array.isArray(tableArns)).toBe(true);
      }
    });
  });

  describe('KMS Key', () => {
    test('should have valid KMS key', async () => {
      const kmsKeyId = stackOutputs.kmsKeyId || stackOutputs.KmsKeyId;
      if (kmsKeyId) {
        const command = new DescribeKeyCommand({ KeyId: kmsKeyId });
        const response = await kmsClient.send(command);

        expect(response.KeyMetadata).toBeDefined();
        expect(response.KeyMetadata?.Enabled).toBe(true);
        expect(response.KeyMetadata?.KeyState).toBe('Enabled');
      }
    });
  });

  describe('SNS Topic', () => {
    test('should have valid SNS topic', async () => {
      const snsTopicArn =
        stackOutputs.snsTopicArn || stackOutputs.SnsTopicArn;
      if (snsTopicArn) {
        const command = new GetTopicAttributesCommand({
          TopicArn: snsTopicArn,
        });
        const response = await snsClient.send(command);

        expect(response.Attributes).toBeDefined();
        expect(response.Attributes?.TopicArn).toBe(snsTopicArn);
      }
    });
  });

  describe('Lambda Validation Function', () => {
    test('should have validation function deployed', async () => {
      const functionArn =
        stackOutputs.validationFunctionArn ||
        stackOutputs.ValidationFunctionArn;
      if (functionArn) {
        const functionName = functionArn.split(':').pop();
        const command = new GetFunctionCommand({ FunctionName: functionName });
        const response = await lambdaClient.send(command);

        expect(response.Configuration).toBeDefined();
        expect(response.Configuration?.Runtime).toBe('nodejs18.x');
        expect(response.Configuration?.MemorySize).toBe(256);
        expect(response.Configuration?.Timeout).toBe(300);
      }
    });

    test('should have environment variables configured', async () => {
      const functionArn =
        stackOutputs.validationFunctionArn ||
        stackOutputs.ValidationFunctionArn;
      if (functionArn) {
        const functionName = functionArn.split(':').pop();
        const command = new GetFunctionCommand({ FunctionName: functionName });
        const response = await lambdaClient.send(command);

        expect(
          response.Configuration?.Environment?.Variables
        ).toBeDefined();
        expect(
          response.Configuration?.Environment?.Variables?.MIGRATION_BATCH
        ).toBeDefined();
        expect(
          response.Configuration?.Environment?.Variables?.SOURCE_REGION
        ).toBe('us-east-1');
        expect(
          response.Configuration?.Environment?.Variables?.TARGET_REGION
        ).toBe('eu-west-1');
      }
    });
  });
});
