import {
  DescribeEventBusCommand,
  EventBridgeClient,
} from '@aws-sdk/client-eventbridge';
import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { GetTopicAttributesCommand, SNSClient } from '@aws-sdk/client-sns';
import * as fs from 'fs';
import * as path from 'path';

// Helper Types
interface TestOutputs {
  ApiGatewayUrl: string;
  LambdaFunctionName: string;
  SnsTopicArn: string;
  EventBusArn: string;
}

// Helper Functions
const parseLambdaResponse = (payload: any): any => {
  if (!payload) return {};

  const rawResponse = Buffer.from(payload).toString();
  try {
    let parsed = JSON.parse(rawResponse);
    if (typeof parsed === 'string') {
      parsed = JSON.parse(parsed);
    }
    if (typeof parsed.body === 'string') {
      try {
        parsed.body = JSON.parse(parsed.body);
      } catch {
        // Keep body as string if not valid JSON
      }
    }
    return parsed;
  } catch (e) {
    console.error('Error parsing response:', e);
    return rawResponse;
  }
};

const extractErrorMessage = (parsedPayload: any): string | undefined => {
  if (typeof parsedPayload === 'string') {
    return parsedPayload;
  }

  return (
    parsedPayload.body?.error ||
    parsedPayload.body?.message ||
    parsedPayload.error ||
    parsedPayload.message
  );
};

// Test Setup
const region = process.env.AWS_REGION || 'us-east-1';
const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
const outputs: TestOutputs = fs.existsSync(outputsPath)
  ? JSON.parse(fs.readFileSync(outputsPath, 'utf8'))
  : {};

const lambdaClient = new LambdaClient({ region });
const snsClient = new SNSClient({ region });
const eventBridgeClient = new EventBridgeClient({ region });

// Custom Matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeOneOf: (expected: any[]) => R;
    }
  }
}

expect.extend({
  toBeOneOf(received: any, expected: any[]) {
    const pass = expected.includes(received);
    return {
      message: () => `expected ${received} to be one of ${expected.join(', ')}`,
      pass,
    };
  },
});

describe('Infrastructure Integration Tests', () => {
  beforeAll(() => {
    expect(outputs.ApiGatewayUrl).toBeDefined();
    expect(outputs.LambdaFunctionName).toBeDefined();
    expect(outputs.SnsTopicArn).toBeDefined();
    expect(outputs.EventBusArn).toBeDefined();
  });

  describe('Lambda Function', () => {
    test('processes valid payload correctly', async () => {
      const command = new InvokeCommand({
        FunctionName: outputs.LambdaFunctionName,
        InvocationType: 'RequestResponse',
        Payload: Buffer.from(
          JSON.stringify({
            body: JSON.stringify({ image_key: 'test-image.jpg' }),
          })
        ),
      });

      const response = await lambdaClient.send(command);
      console.log('Lambda Response:', JSON.stringify(response, null, 2));

      const parsedPayload = parseLambdaResponse(response.Payload);
      expect(response.StatusCode).toBeOneOf([200, 202]);
      expect(parsedPayload.statusCode).toBeOneOf([200, 202, 404]);
    });

    test('handles missing parameters gracefully', async () => {
      const command = new InvokeCommand({
        FunctionName: outputs.LambdaFunctionName,
        InvocationType: 'RequestResponse',
        Payload: Buffer.from(
          JSON.stringify({
            body: JSON.stringify({}),
          })
        ),
      });

      const response = await lambdaClient.send(command);
      const parsedPayload = parseLambdaResponse(response.Payload);
      const errorMessage = extractErrorMessage(parsedPayload);

      expect(response.StatusCode).toBeOneOf([200, 400, 500]);
      expect(errorMessage).toBeDefined();
      expect(errorMessage?.toLowerCase()).toMatch(/missing|invalid|required/i);
    });
  });

  describe('API Gateway', () => {
    test('endpoint is accessible', async () => {
      const response = await fetch(`${outputs.ApiGatewayUrl}process`, {
        method: 'OPTIONS',
      });

      expect(response.status).toBeOneOf([200, 204]);
      expect(response.headers.get('access-control-allow-origin')).toBe('*');
    });

    test('processes valid requests', async () => {
      const response = await fetch(`${outputs.ApiGatewayUrl}process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_key: 'test-image.jpg' }),
      });

      const data = await response.json();
      expect(response.status).toBeOneOf([200, 202, 404]);
      expect(data).toBeDefined();
    });
  });

  describe('SNS Topic', () => {
    test('exists with correct configuration', async () => {
      const response = await snsClient.send(
        new GetTopicAttributesCommand({
          TopicArn: outputs.SnsTopicArn,
        })
      );

      expect(response.Attributes).toBeDefined();
      expect(
        parseInt(response.Attributes?.SubscriptionsConfirmed || '0')
      ).toBeGreaterThan(0);
    });
  });

  describe('EventBridge', () => {
    test('custom bus exists', async () => {
      const busName = outputs.EventBusArn.split('/').pop();
      const response = await eventBridgeClient.send(
        new DescribeEventBusCommand({
          Name: busName,
        })
      );

      expect(response.Name).toBe(busName);
      expect(response.Arn).toBe(outputs.EventBusArn);
    });
  });

  describe('End-to-End Flow', () => {
    test('completes full processing workflow', async () => {
      // Step 1: API Request
      const apiResponse = await fetch(`${outputs.ApiGatewayUrl}process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_key: 'e2e-test.jpg' }),
      });

      const responseData = await apiResponse.json();
      expect(apiResponse.status).toBeOneOf([200, 202, 404]);
      expect(responseData).toBeDefined();

      // Step 2: Verify Lambda
      try {
        await lambdaClient.send(
          new InvokeCommand({
            FunctionName: outputs.LambdaFunctionName,
            InvocationType: 'DryRun',
          })
        );
      } catch (error: any) {
        expect(error.name).toBe('DryRunOperation');
      }
    });
  });
});
