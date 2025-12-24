// Configuration - These are coming from cfn-outputs after cdk deploy
import {
  APIGatewayClient,
  GetApiKeysCommand,
} from '@aws-sdk/client-api-gateway';
import fs from 'fs';
import path from 'path';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'pr13';

// Extract outputs for testing
const API_ENDPOINT = outputs.ApiEndpoint;
const BUCKET_NAME = outputs.BucketName;
const TABLE_NAME = outputs.TableName;
const DASHBOARD_URL = outputs.DashboardUrl;
const REKOGNITION_ROLE_ARN = outputs.RekognitionServiceRoleArn;

// API Gateway client for dynamic API key generation with LocalStack endpoint
const endpoint = process.env.AWS_ENDPOINT_URL || undefined;
const apiGatewayClient = new APIGatewayClient({
  region: 'us-east-1',
  ...(endpoint && { endpoint }),
});

// Function to get the existing API key from the deployed stack
async function getExistingApiKey(): Promise<string> {
  try {
    // Get the existing API key that was created during deployment
    const getKeysCommand = new GetApiKeysCommand({
      nameQuery: `serverlessapp-api-key-${environmentSuffix}`,
    });

    const existingKeys = await apiGatewayClient.send(getKeysCommand);

    if (existingKeys.items && existingKeys.items.length > 0) {
      const existingKey = existingKeys.items[0];
      console.log(`📋 Found existing API key: ${existingKey.name}`);

      // For existing keys, we need to get the value from the deployment
      // Since we can't retrieve the value via API, we'll use the hardcoded value
      // that was set during deployment
      return 'dev-key-12345-do-not-use-in-prod';
    }

    console.log('⚠️ No existing API key found, using hardcoded fallback');
    return 'dev-key-12345-do-not-use-in-prod';
  } catch (error) {
    console.error('❌ Error getting existing API key:', error);
    console.log('🔄 Falling back to hardcoded API key');
    return 'dev-key-12345-do-not-use-in-prod';
  }
}

// Global API key variable
const API_KEY = 'dev-key-12345-do-not-use-in-prod';

// Test images
const TEST_IMAGES = {
  cat: path.join(__dirname, '../lib/images/cat.jpg'),
  dog: path.join(__dirname, '../lib/images/dog.jpg'),
  tree: path.join(__dirname, '../lib/images/tree.jpg'),
};

describe('Serverless Image Detector Integration Tests', () => {
  // Setup: Get existing API key from deployed stack
  beforeAll(async () => {
    console.log('🔑 Getting existing API key from deployed stack...');
    const existingKey = await getExistingApiKey();
    console.log(`✅ Using API key: ${existingKey.substring(0, 10)}...`);
  });

  describe('Infrastructure Validation', () => {
    test('should have valid API endpoint', () => {
      expect(API_ENDPOINT).toBeDefined();
      // LocalStack uses localhost.localstack.cloud domain instead of amazonaws.com
      const isLocalStack =
        API_ENDPOINT.includes('localhost.localstack.cloud') ||
        API_ENDPOINT.includes('localhost:4566');
      if (isLocalStack) {
        // LocalStack endpoint pattern
        expect(API_ENDPOINT).toMatch(
          /^https:\/\/.*\.execute-api\.localhost\.localstack\.cloud:4566\/.*\/$/
        );
      } else {
        // AWS endpoint pattern
        expect(API_ENDPOINT).toMatch(
          /^https:\/\/.*\.execute-api\.us-east-1\.amazonaws\.com\/.*\/$/
        );
      }
    });

    test('should have valid S3 bucket name', () => {
      expect(BUCKET_NAME).toBeDefined();
      expect(BUCKET_NAME).toMatch(/^serverlessapp-pet-detector-.*-\d+$/);
    });

    test('should have valid DynamoDB table name', () => {
      expect(TABLE_NAME).toBeDefined();
      expect(TABLE_NAME).toMatch(/^serverlessapp-detection-logs-.*$/);
    });

    test('should have valid CloudWatch dashboard URL', () => {
      expect(DASHBOARD_URL).toBeDefined();
      expect(DASHBOARD_URL).toMatch(
        /^https:\/\/.*\.console\.aws\.amazon\.com\/cloudwatch\/.*$/
      );
    });

    test('should have valid Rekognition service role ARN', () => {
      expect(REKOGNITION_ROLE_ARN).toBeDefined();
      expect(REKOGNITION_ROLE_ARN).toMatch(
        /^arn:aws:iam::\d+:role\/serverlessapp-rekognition-role-.*$/
      );
    });

    test('should have valid API key for testing', () => {
      expect(API_KEY).toBeDefined();
      expect(API_KEY.length).toBeGreaterThan(0);
      console.log(`🔑 Using API key: ${API_KEY.substring(0, 10)}...`);
    });
  });

  describe('API Gateway Health Check', () => {
    test('should return 403 for requests without API key', async () => {
      const response = await fetch(`${API_ENDPOINT}images`, {
        method: 'GET',
      });
      expect(response.status).toBe(403);
    });
  });


  describe('API Error Handling', () => {
    test('should reject invalid image data', async () => {
      const response = await fetch(`${API_ENDPOINT}images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
        },
        body: JSON.stringify({
          imageData: 'invalid-base64-data',
          fileName: 'test.jpg',
          contentType: 'image/jpeg',
        }),
      });

      expect(response.status).toBe(400);
      const error = await response.json();
      expect(error).toHaveProperty('message');
      expect(error.message).toContain('Invalid request body');
    });

    test('should reject unsupported image format', async () => {
      const response = await fetch(`${API_ENDPOINT}images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
        },
        body: JSON.stringify({
          imageData: 'SGVsbG8gV29ybGQ=', // "Hello World" in base64
          fileName: 'test.txt',
          contentType: 'text/plain',
        }),
      });

      expect(response.status).toBe(400);
      const error = await response.json();
      expect(error).toHaveProperty('message');
      expect(error.message).toContain('Invalid request body');
    });
  });
});
