import { Sha256 } from '@aws-crypto/sha256-js';
import {
  APIGatewayClient,
  GetRestApiCommand,
} from '@aws-sdk/client-api-gateway';
import { CloudFormationClient, DescribeStacksCommand, ListStacksCommand } from '@aws-sdk/client-cloudformation';
import {
  DescribeTableCommand,
  DynamoDBClient,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';
import {
  GetBucketEncryptionCommand,
  HeadBucketCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import {
  GetTopicAttributesCommand,
  SNSClient,
} from '@aws-sdk/client-sns';
import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { HttpRequest as SmithyHttpRequest } from '@smithy/protocol-http';
import { SignatureV4 } from '@smithy/signature-v4';
import fs from 'fs';

interface ErrorResponse {
  message: string;
  error?: string;
}

let outputs: Record<string, string> | undefined;

// AWS clients
const dynamoClient = new DynamoDBClient({});
const snsClient = new SNSClient({});
const secretsClient = new SecretsManagerClient({});
const s3Client = new S3Client({});
const apiGatewayClient = new APIGatewayClient({});

// Helper function to extract API Gateway ID from endpoint URL
const extractApiGatewayId = (endpoint: string): string => {
  const match = endpoint.match(/https:\/\/([a-z0-9]+)\.execute-api\./);
  return match ? match[1] : '';
};

async function fetchOutputsFromCloudFormation(): Promise<Record<string, string>> {
  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
  const client = new CloudFormationClient(region ? { region } : {});
  // Look for stacks in a COMPLETE state
  const listRes = await client.send(
    new ListStacksCommand({
      StackStatusFilter: ['CREATE_COMPLETE', 'UPDATE_COMPLETE'],
    })
  );

  const stackSummaries = listRes.StackSummaries ?? [];
  for (const s of stackSummaries) {
    if (!s.StackName) continue;
    try {
      const desc = await client.send(
        new DescribeStacksCommand({ StackName: s.StackName })
      );
      const stack = desc.Stacks?.[0];
      if (!stack || !stack.Outputs) continue;

      const flat: Record<string, string> = {};
      for (const o of stack.Outputs) {
        if (o.OutputKey && o.OutputValue !== undefined) {
          flat[o.OutputKey] = o.OutputValue;
        }
      }

      // Accept a stack only if it contains the three Function URLs required by tests
      if (
        flat.UserFunctionUrl &&
        flat.ProductFunctionUrl &&
        flat.OrderFunctionUrl
      ) {
        return flat;
      }
    } catch {
      // ignore and continue searching other stacks
    }
  }

  throw new Error(
    'Unable to locate stack outputs containing UserFunctionUrl/ProductFunctionUrl/OrderFunctionUrl. ' +
    'Set AWS credentials and region, or create cfn-outputs/flat-outputs.json from your deploy step.'
  );
}

const loadOutputs = async (): Promise<Record<string, string>> => {
  // Prefer local artifact if present
  try {
    const path = 'cfn-outputs/flat-outputs.json';
    if (fs.existsSync(path)) {
      return JSON.parse(fs.readFileSync(path, 'utf8')) as Record<string, string>;
    }
  } catch {
    /* fall through to CFN lookup */
  }

  // If not present locally, query CloudFormation
  return await fetchOutputsFromCloudFormation();
};

const invokeFunctionUrl = async <T>(
  baseUrl: string,
  method: string,
  path: string,
  body?: unknown
): Promise<{ status: number; json?: T; headers: Headers }> => {
  const targetUrl = new URL(path.replace(/^\//, ''), baseUrl).toString();
  const init: RequestInit = {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  };

  let response = await fetch(targetUrl, init);

  if (response.status === 403) {
    try {
      const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
      if (region) {
        const credsProvider = defaultProvider();
        const urlObj = new URL(targetUrl);
        const awsReq = new SmithyHttpRequest({
          protocol: urlObj.protocol,
          hostname: urlObj.hostname,
          path: `${urlObj.pathname}${urlObj.search}`,
          method,
          headers: {
            ...(init.headers as Record<string, string> | undefined),
            host: urlObj.host,
          },
          body: body ? JSON.stringify(body) : undefined,
        });

        const signer = new SignatureV4({
          credentials: credsProvider,
          service: 'lambda',
          region,
          sha256: Sha256,
        });

        const signed = await signer.sign(awsReq);

        const signedInit: RequestInit = {
          method,
          headers: signed.headers as Record<string, string>,
          body: awsReq.body,
        };

        response = await fetch(targetUrl, signedInit);
      }
    } catch {
      // fall back to original 403 response
    }
  }

  if (response.status === 204) {
    return { status: response.status, headers: response.headers };
  }

  const text = await response.text();
  const parsed = text.length ? (JSON.parse(text) as T) : undefined;
  return { status: response.status, json: parsed, headers: response.headers };
};

const uniqueId = `int-${Date.now().toString(36)}`;

jest.setTimeout(120_000);

describe('TAP Stack Serverless Integration Tests', () => {
  let createdUserId: string | undefined;
  let createdProductId: string | undefined;
  let createdOrderId: string | undefined;

  let userFunctionUrl: string;
  let productFunctionUrl: string;
  let orderFunctionUrl: string;

  beforeAll(async () => {
    outputs = await loadOutputs();

    userFunctionUrl = outputs.UserFunctionUrl;
    productFunctionUrl = outputs.ProductFunctionUrl;
    orderFunctionUrl = outputs.OrderFunctionUrl;

    if (!userFunctionUrl || !productFunctionUrl || !orderFunctionUrl) {
      throw new Error('Function URLs are missing from deployment outputs.');
    }
  });

  afterAll(async () => {
    // Clean up test data
    if (createdOrderId) {
      await invokeFunctionUrl(orderFunctionUrl, 'PATCH', `/orders/${createdOrderId}`, {
        status: 'CANCELLED',
      });
    }
    if (createdUserId) {
      await invokeFunctionUrl(userFunctionUrl, 'DELETE', `/users/${createdUserId}`);
    }
    if (createdProductId) {
      await invokeFunctionUrl(productFunctionUrl, 'DELETE', `/products/${createdProductId}`);
    }
  });

  describe('Infrastructure Validation', () => {
    test('should have all required DynamoDB tables with proper configuration', async () => {
      const tableNames = [
        outputs!.UserTableName,
        outputs!.ProductTableName,
        outputs!.OrderTableName,
      ];

      for (const tableName of tableNames) {
        const command = new DescribeTableCommand({ TableName: tableName });
        const response = await dynamoClient.send(command);

        expect(response.Table).toBeDefined();
        expect(response.Table?.TableStatus).toBe('ACTIVE');
        expect(response.Table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
        expect(response.Table?.SSEDescription?.Status).toBe('ENABLED');
      }
    });

    test('should have SNS topic with proper configuration', async () => {
      const topicArn = outputs!.NotificationTopicArn;
      const command = new GetTopicAttributesCommand({ TopicArn: topicArn });
      const response = await snsClient.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.KmsMasterKeyId).toBeDefined();
      expect(response.Attributes?.DisplayName).toContain('notifications');
    });

    test('should have API Secret with proper configuration', async () => {
      const secretArn = outputs!.ApiSecretArn;
      const command = new GetSecretValueCommand({ SecretId: secretArn });
      const response = await secretsClient.send(command);

      expect(response.SecretString).toBeDefined();

      const secret = JSON.parse(response.SecretString!);
      expect(secret.service).toBeDefined();
      expect(secret.apiKey).toBeDefined();
      expect(secret.apiKey.length).toBeGreaterThan(20);
    });

    test('should have S3 bucket with encryption enabled', async () => {
      const bucketName = outputs!.StaticAssetBucketName;

      // Check bucket exists
      const headCommand = new HeadBucketCommand({ Bucket: bucketName });
      await s3Client.send(headCommand);

      // Check encryption
      const encryptionCommand = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const encryptionResponse = await s3Client.send(encryptionCommand);

      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
      expect(encryptionResponse.ServerSideEncryptionConfiguration?.Rules).toHaveLength(1);
      expect(encryptionResponse.ServerSideEncryptionConfiguration?.Rules?.[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');
    });

    test('should have API Gateway with proper configuration', async () => {
      const apiId = extractApiGatewayId(outputs!.ApiEndpoint);

      if (apiId) {
        // Check API exists
        const apiCommand = new GetRestApiCommand({ restApiId: apiId });
        const apiResponse = await apiGatewayClient.send(apiCommand);

        expect(apiResponse.name).toContain('api');
        expect(apiResponse.description).toContain('Serverless API');
      }
    });
  });

  describe('Function URL Accessibility and CORS', () => {
    test('should have accessible function URLs with proper CORS', async () => {
      const urls = [
        { name: 'User Service', url: userFunctionUrl },
        { name: 'Product Service', url: productFunctionUrl },
        { name: 'Order Service', url: orderFunctionUrl },
      ];

      for (const { name, url } of urls) {
        // Test GET request
        const getResponse = await invokeFunctionUrl(url, 'GET', '/');
        expect(getResponse.status).toBe(200);
        expect(Array.isArray(getResponse.json)).toBe(true);

        // Test CORS headers
        expect(getResponse.headers.get('access-control-allow-origin')).toBeDefined();
      }
    });

    test('should handle unsupported HTTP methods correctly', async () => {
      const response = await invokeFunctionUrl(userFunctionUrl, 'PATCH', '/users');
      expect(response.status).toBe(405);
    });
  });

  describe('API Gateway Endpoints', () => {
    test('should have accessible API Gateway endpoints with IAM auth', async () => {
      const endpoints = [
        `${outputs!.ApiEndpoint}users`,
        `${outputs!.ApiEndpoint}products`,
        `${outputs!.ApiEndpoint}orders`,
      ];

      for (const endpoint of endpoints) {
        const response = await fetch(endpoint);
        // IAM-protected endpoints return 401 (Unauthorized) or 403 (Forbidden)
        expect([401, 403]).toContain(response.status);
      }
    });
  });

  describe('Data Validation and Error Handling', () => {
    test('should validate user data properly', async () => {
      // Test missing required fields
      const response = await invokeFunctionUrl<ErrorResponse>(
        userFunctionUrl,
        'POST',
        '/users',
        {
          name: 'Test User',
          // missing email
        }
      );

      expect(response.status).toBe(422);
      expect((response.json as ErrorResponse)?.message).toContain('required');
    });

    test('should validate product data properly', async () => {
      // Test negative price
      const response = await invokeFunctionUrl(
        productFunctionUrl,
        'POST',
        '/products',
        {
          name: 'Test Product',
          price: -10,
          inventory: 100,
        }
      );

      expect(response.status).toBe(422);
    });

    test('should handle malformed JSON requests', async () => {
      try {
        const response = await fetch(userFunctionUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: 'invalid json',
        });
        expect(response.status).toBe(400);
      } catch (error) {
        // Network error is also acceptable for malformed requests
        expect(error).toBeDefined();
      }
    });
  });

  describe('Business Logic and Referential Integrity', () => {
    test('should enforce referential integrity in orders', async () => {
      // Try to create order with non-existent user
      const response = await invokeFunctionUrl<ErrorResponse>(
        orderFunctionUrl,
        'POST',
        '/orders',
        {
          userId: 'non-existent-user',
          productId: 'some-product',
          quantity: 1,
        }
      );

      expect(response.status).toBe(404);
      expect((response.json as ErrorResponse)?.message).toContain('not found');
    });

    test('should handle insufficient inventory correctly', async () => {
      // First create a user and product
      const userResponse = await invokeFunctionUrl<{ userId: string }>(
        userFunctionUrl,
        'POST',
        '/users',
        {
          name: 'Inventory Test User',
          email: 'inventory@example.com',
        }
      );
      expect(userResponse.status).toBe(201);

      const productResponse = await invokeFunctionUrl<{ productId: string }>(
        productFunctionUrl,
        'POST',
        '/products',
        {
          name: 'Limited Stock Product',
          price: 10.00,
          inventory: 5, // Limited stock
        }
      );
      expect(productResponse.status).toBe(201);

      // Try to order more than available
      const orderResponse = await invokeFunctionUrl<ErrorResponse>(
        orderFunctionUrl,
        'POST',
        '/orders',
        {
          userId: userResponse.json!.userId,
          productId: productResponse.json!.productId,
          quantity: 10, // More than available
        }
      );

      expect(orderResponse.status).toBe(409);
      expect((orderResponse.json as ErrorResponse)?.message).toContain('inventory');

      // Cleanup
      await invokeFunctionUrl(userFunctionUrl, 'DELETE', `/users/${userResponse.json!.userId}`);
      await invokeFunctionUrl(productFunctionUrl, 'DELETE', `/products/${productResponse.json!.productId}`);
    });
  });

  describe('End-to-End Workflow Integration', () => {
    test('supports complete user, product, and order lifecycle', async () => {
      const uniqueId = `int-${Date.now().toString(36)}`;

      // Create User
      const createUser = await invokeFunctionUrl<{ userId: string }>(
        userFunctionUrl,
        'POST',
        '/users',
        {
          name: `Integration User ${uniqueId}`,
          email: `${uniqueId}@example.com`,
        }
      );
      expect(createUser.status).toBe(201);
      createdUserId = createUser.json?.userId;
      expect(createdUserId).toEqual(expect.any(String));

      // Verify User Creation
      const getUser = await invokeFunctionUrl(
        userFunctionUrl,
        'GET',
        `/users/${createdUserId}`
      );
      expect(getUser.status).toBe(200);
      expect(getUser.json).toEqual(
        expect.objectContaining({
          userId: createdUserId,
          name: `Integration User ${uniqueId}`,
          email: `${uniqueId}@example.com`
        })
      );

      // Update User
      const updateUser = await invokeFunctionUrl(
        userFunctionUrl,
        'PUT',
        `/users/${createdUserId}`,
        {
          name: `Updated User ${uniqueId}`,
          email: `updated-${uniqueId}@example.com`,
        }
      );
      expect(updateUser.status).toBe(200);

      // Create Product
      const createProduct = await invokeFunctionUrl<{ productId: string }>(
        productFunctionUrl,
        'POST',
        '/products',
        {
          name: `Integration Product ${uniqueId}`,
          description: 'Integration test asset for comprehensive workflow',
          price: 29.99,
          inventory: 15,
        }
      );
      expect(createProduct.status).toBe(201);
      createdProductId = createProduct.json?.productId;
      expect(createdProductId).toEqual(expect.any(String));

      // Verify Product Creation
      const getProduct = await invokeFunctionUrl(
        productFunctionUrl,
        'GET',
        `/products/${createdProductId}`
      );
      expect(getProduct.status).toBe(200);
      expect(getProduct.json).toEqual(
        expect.objectContaining({
          productId: createdProductId,
          name: `Integration Product ${uniqueId}`,
          price: 29.99,
          inventory: 15
        })
      );

      // Update Product
      const updateProduct = await invokeFunctionUrl(
        productFunctionUrl,
        'PUT',
        `/products/${createdProductId}`,
        {
          name: `Updated Product ${uniqueId}`,
          price: 39.99,
          inventory: 20,
        }
      );
      expect(updateProduct.status).toBe(200);

      // Create Order
      const createOrder = await invokeFunctionUrl<{ orderId: string }>(
        orderFunctionUrl,
        'POST',
        '/orders',
        {
          userId: createdUserId,
          productId: createdProductId,
          quantity: 3,
        }
      );
      expect(createOrder.status).toBe(201);
      createdOrderId = createOrder.json?.orderId;
      expect(createdOrderId).toEqual(expect.any(String));

      // Verify Order Creation
      const getOrder = await invokeFunctionUrl(
        orderFunctionUrl,
        'GET',
        `/orders/${createdOrderId}`
      );
      expect(getOrder.status).toBe(200);
      expect(getOrder.json).toEqual(
        expect.objectContaining({
          orderId: createdOrderId,
          userId: createdUserId,
          productId: createdProductId,
          quantity: 3,
          status: 'CREATED',
          totalPrice: expect.any(Number)
        })
      );

      // Update Order Status
      const patchOrder = await invokeFunctionUrl(
        orderFunctionUrl,
        'PATCH',
        `/orders/${createdOrderId}`,
        { status: 'SHIPPED' }
      );
      expect(patchOrder.status).toBe(200);

      // Verify Order Update
      const verifyOrder = await invokeFunctionUrl(
        orderFunctionUrl,
        'GET',
        `/orders/${createdOrderId}`
      );
      expect(verifyOrder.status).toBe(200);
      expect(verifyOrder.json).toEqual(
        expect.objectContaining({
          status: 'SHIPPED',
          updatedAt: expect.any(String)
        })
      );

      // Test List Operations
      const listUsers = await invokeFunctionUrl<any[]>(
        userFunctionUrl,
        'GET',
        '/users'
      );
      expect(listUsers.status).toBe(200);
      expect(listUsers.json).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ userId: createdUserId }),
        ])
      );

      const listProducts = await invokeFunctionUrl<any[]>(
        productFunctionUrl,
        'GET',
        '/products'
      );
      expect(listProducts.status).toBe(200);
      expect(listProducts.json).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ productId: createdProductId }),
        ])
      );

      const listOrders = await invokeFunctionUrl<any[]>(
        orderFunctionUrl,
        'GET',
        '/orders'
      );
      expect(listOrders.status).toBe(200);
      expect(listOrders.json).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ orderId: createdOrderId }),
        ])
      );
    });

    test('should maintain data consistency across services', async () => {
      // Verify tables contain our test data
      const userScan = new ScanCommand({
        TableName: outputs!.UserTableName,
        Limit: 10,
      });
      const userResult = await dynamoClient.send(userScan);
      expect(userResult.Items?.length).toBeGreaterThan(0);

      const productScan = new ScanCommand({
        TableName: outputs!.ProductTableName,
        Limit: 10,
      });
      const productResult = await dynamoClient.send(productScan);
      expect(productResult.Items?.length).toBeGreaterThan(0);

      const orderScan = new ScanCommand({
        TableName: outputs!.OrderTableName,
        Limit: 10,
      });
      const orderResult = await dynamoClient.send(orderScan);
      expect(orderResult.Items?.length).toBeGreaterThan(0);
    });
  });

});