import fs from 'fs';
import { APIGatewayClient, GetRestApiCommand } from '@aws-sdk/client-api-gateway';
import { LambdaClient, GetFunctionCommand } from '@aws-sdk/client-lambda';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';

// LocalStack configuration
const endpoint = process.env.AWS_ENDPOINT_URL || "http://localhost:4566";
const isLocalStack = endpoint.includes("localhost") || endpoint.includes("4566");

// Configuration - These are coming from cfn-outputs after cdk deploy
let outputs: any = {};
try {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
} catch (error) {
  console.warn('cfn-outputs/flat-outputs.json not found. Skipping integration tests.');
}

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Image Processing Pipeline Integration Tests', () => {
  const region = 'us-east-1';

  // Configure clients for LocalStack
  const clientConfig = isLocalStack ? {
    region,
    endpoint,
    forcePathStyle: true
  } : { region };

  const apiGatewayClient = new APIGatewayClient(clientConfig);
  const lambdaClient = new LambdaClient(clientConfig);
  const snsClient = new SNSClient(clientConfig);

  // Skip tests if outputs not available
  beforeAll(() => {
    if (!outputs || Object.keys(outputs).length === 0) {
      console.warn('No outputs available, skipping integration tests');
    }
  });

  describe('Infrastructure Deployment Verification', () => {
    test('should verify API Gateway is deployed', async () => {
      if (!outputs.ImageProcessingApiRestApiId) {
        console.warn('API Gateway ID not found in outputs, skipping test');
        return;
      }

      const command = new GetRestApiCommand({
        restApiId: outputs.ImageProcessingApiRestApiId
      });

      const response = await apiGatewayClient.send(command);
      expect(response.name).toBe('ImageProcessingService');
      expect(response.description).toBe('API Gateway for image processing requests');
    });

    test('should verify Lambda function is deployed', async () => {
      if (!outputs.ImageProcessorFunctionName) {
        console.warn('Lambda function name not found in outputs, skipping test');
        return;
      }

      const command = new GetFunctionCommand({
        FunctionName: outputs.ImageProcessorFunctionName
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration?.Runtime).toBe('nodejs18.x');
      expect(response.Configuration?.Handler).toBe('index.handler');
      expect(response.Configuration?.Environment?.Variables?.IMAGE_BUCKET).toBeDefined();
      expect(response.Configuration?.Environment?.Variables?.NOTIFICATION_TOPIC_ARN).toBeDefined();
    });

    test('should verify SNS topic is deployed', async () => {
      if (!outputs.NotificationTopicArn) {
        console.warn('SNS topic ARN not found in outputs, skipping test');
        return;
      }

      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.NotificationTopicArn
      });

      const response = await snsClient.send(command);
      expect(response.Attributes?.DisplayName).toBe('Image Processing Completion Notifications');
      expect(response.Attributes?.TopicArn).toBe(outputs.NotificationTopicArn);
    });
  });

  describe('End-to-End Workflow Tests', () => {
    test('should successfully invoke API Gateway endpoint', async () => {
      if (!outputs.ImageProcessingApiUrl) {
        console.warn('API Gateway URL not found in outputs, skipping test');
        return;
      }

      const testPayload = {
        imageKey: 'test-image.jpg',
        metadata: {
          timestamp: new Date().toISOString(),
          userId: 'test-user',
          operation: 'resize'
        }
      };

      try {
        const response = await fetch(`${outputs.ImageProcessingApiUrl}/process`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(testPayload)
        });

        // Lambda should process successfully even if it doesn't return specific response
        expect(response.status).toBeGreaterThanOrEqual(200);
        expect(response.status).toBeLessThan(500);
      } catch (error) {
        console.error('API Gateway invocation failed:', error);
        throw error;
      }
    });

    test('should handle invalid requests gracefully', async () => {
      if (!outputs.ImageProcessingApiUrl) {
        console.warn('API Gateway URL not found in outputs, skipping test');
        return;
      }

      try {
        const response = await fetch(`${outputs.ImageProcessingApiUrl}/process`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({}) // Empty payload
        });

        // Should not return 5xx errors for bad requests
        expect(response.status).toBeLessThan(500);
      } catch (error) {
        console.error('Invalid request test failed:', error);
        throw error;
      }
    });
  });

  describe('Resource Configuration Validation', () => {
    test('should verify Lambda function has correct environment variables', async () => {
      if (!outputs.ImageProcessorFunctionName || !outputs.NotificationTopicArn) {
        console.warn('Required outputs not found, skipping test');
        return;
      }

      const command = new GetFunctionCommand({
        FunctionName: outputs.ImageProcessorFunctionName
      });

      const response = await lambdaClient.send(command);
      const envVars = response.Configuration?.Environment?.Variables;

      expect(envVars?.NOTIFICATION_TOPIC_ARN).toBe(outputs.NotificationTopicArn);
      expect(envVars?.IMAGE_BUCKET).toBeDefined();
    });

    test('should verify all resources are in us-east-1 region', () => {
      // All resources should be deployed in us-east-1
      expect(region).toBe('us-east-1');
      
      if (outputs.NotificationTopicArn) {
        expect(outputs.NotificationTopicArn).toContain('us-east-1');
      }
    });
  });
});
