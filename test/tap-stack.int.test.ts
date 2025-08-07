import * as fs from 'fs';
import * as path from 'path';
import {
  APIGatewayClient,
  GetRestApiCommand,
  GetResourcesCommand,
} from '@aws-sdk/client-api-gateway';
import {
  LambdaClient,
  GetFunctionCommand,
  ListAliasesCommand,
  InvokeCommand,
} from '@aws-sdk/client-lambda';
import {
  EventBridgeClient,
  DescribeEventBusCommand,
  ListRulesCommand,
} from '@aws-sdk/client-eventbridge';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';

// Read deployment outputs
const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

// Initialize AWS SDK clients
const region = process.env.AWS_REGION || 'us-east-1';
const apiGatewayClient = new APIGatewayClient({ region });
const lambdaClient = new LambdaClient({ region });
const eventBridgeClient = new EventBridgeClient({ region });
const cloudWatchLogsClient = new CloudWatchLogsClient({ region });

describe('Serverless Infrastructure Integration Tests', () => {
  describe('API Gateway', () => {
    let apiId: string;

    beforeAll(() => {
      // Extract API ID from the URL
      const apiUrl = outputs.ApiGatewayUrl;
      const match = apiUrl.match(/https:\/\/([^.]+)\.execute-api/);
      if (match) {
        apiId = match[1];
      }
    });

    test('API Gateway endpoint is accessible', async () => {
      const response = await fetch(`${outputs.ApiGatewayUrl}users`);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.message).toBe('User operation successful');
    });

    test('API Gateway has correct CORS configuration', async () => {
      const response = await fetch(`${outputs.ApiGatewayUrl}users`, {
        method: 'OPTIONS',
      });
      expect(response.status).toBe(204); // OPTIONS returns 204 No Content
      expect(response.headers.get('access-control-allow-origin')).toBe('*');
      expect(response.headers.get('access-control-allow-methods')).toContain('GET');
      expect(response.headers.get('access-control-allow-methods')).toContain('POST');
    });

    test('API Gateway REST API exists and is configured correctly', async () => {
      const command = new GetRestApiCommand({ restApiId: apiId });
      const response = await apiGatewayClient.send(command);
      expect(response.name).toContain('serverless-api');
      expect(response.description).toBe('Enhanced Serverless API with Powertools and Scheduler');
    });

    test('API Gateway has expected resources', async () => {
      const command = new GetResourcesCommand({ restApiId: apiId });
      const response = await apiGatewayClient.send(command);
      const resourcePaths = response.items?.map((item) => item.path) || [];
      expect(resourcePaths).toContain('/users');
      expect(resourcePaths).toContain('/orders');
      expect(resourcePaths).toContain('/orders/{customerId}');
    });

    test('Users endpoint supports GET and POST methods', async () => {
      const resourcesCommand = new GetResourcesCommand({ restApiId: apiId });
      const resources = await apiGatewayClient.send(resourcesCommand);
      const usersResource = resources.items?.find((item) => item.path === '/users');
      
      if (usersResource) {
        const getMethods = Object.keys(usersResource.resourceMethods || {});
        expect(getMethods).toContain('GET');
        expect(getMethods).toContain('POST');
        expect(getMethods).toContain('OPTIONS');
      }
    });

    test('Orders endpoint works correctly', async () => {
      const response = await fetch(`${outputs.ApiGatewayUrl}orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.message).toBe('Order processed successfully');
      expect(data.orderId).toBeDefined();
      expect(data.customerId).toBe('default');
    });

    test('Customer-specific orders endpoint works correctly', async () => {
      const customerId = 'test-customer-123';
      const response = await fetch(`${outputs.ApiGatewayUrl}orders/${customerId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.message).toBe('Order processed successfully');
      expect(data.customerId).toBe(customerId);
    });
  });

  describe('Lambda Functions', () => {
    test('User Lambda function exists and is configured correctly', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.UserFunctionName,
      });
      const response = await lambdaClient.send(command);
      expect(response.Configuration?.FunctionName).toBe(outputs.UserFunctionName);
      expect(response.Configuration?.Runtime).toBe('nodejs20.x');
      expect(response.Configuration?.MemorySize).toBe(512);
      expect(response.Configuration?.Timeout).toBe(30);
    });

    test('Order Lambda function exists and is configured correctly', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.OrderFunctionName,
      });
      const response = await lambdaClient.send(command);
      expect(response.Configuration?.FunctionName).toBe(outputs.OrderFunctionName);
      expect(response.Configuration?.Runtime).toBe('nodejs20.x');
      expect(response.Configuration?.MemorySize).toBe(512);
      expect(response.Configuration?.Timeout).toBe(30);
    });

    test('Lambda functions have live aliases', async () => {
      const userAliasesCommand = new ListAliasesCommand({
        FunctionName: outputs.UserFunctionName,
      });
      const userAliases = await lambdaClient.send(userAliasesCommand);
      const userLiveAlias = userAliases.Aliases?.find((alias) => alias.Name === 'live');
      expect(userLiveAlias).toBeDefined();

      const orderAliasesCommand = new ListAliasesCommand({
        FunctionName: outputs.OrderFunctionName,
      });
      const orderAliases = await lambdaClient.send(orderAliasesCommand);
      const orderLiveAlias = orderAliases.Aliases?.find((alias) => alias.Name === 'live');
      expect(orderLiveAlias).toBeDefined();
    });

    test('User Lambda function can be invoked directly', async () => {
      const command = new InvokeCommand({
        FunctionName: `${outputs.UserFunctionName}:live`,
        Payload: JSON.stringify({}),
      });
      const response = await lambdaClient.send(command);
      expect(response.StatusCode).toBe(200);
      
      if (response.Payload) {
        const payload = JSON.parse(new TextDecoder().decode(response.Payload));
        expect(payload.statusCode).toBe(200);
        const body = JSON.parse(payload.body);
        expect(body.message).toBe('User operation successful');
      }
    });

    test('Order Lambda function can be invoked directly', async () => {
      const command = new InvokeCommand({
        FunctionName: `${outputs.OrderFunctionName}:live`,
        Payload: JSON.stringify({
          pathParameters: { customerId: 'direct-invoke-test' },
        }),
      });
      const response = await lambdaClient.send(command);
      expect(response.StatusCode).toBe(200);
      
      if (response.Payload) {
        const payload = JSON.parse(new TextDecoder().decode(response.Payload));
        expect(payload.statusCode).toBe(200);
        const body = JSON.parse(payload.body);
        expect(body.message).toBe('Order processed successfully');
        expect(body.customerId).toBe('direct-invoke-test');
      }
    });
  });

  describe('EventBridge', () => {
    test('Custom EventBridge bus exists', async () => {
      const command = new DescribeEventBusCommand({
        Name: outputs.EventBusName,
      });
      const response = await eventBridgeClient.send(command);
      expect(response.Name).toBe(outputs.EventBusName);
    });

    test('EventBridge rule for order processing exists', async () => {
      const command = new ListRulesCommand({
        EventBusName: outputs.EventBusName,
      });
      const response = await eventBridgeClient.send(command);
      const orderRule = response.Rules?.find((rule) =>
        rule.Name?.includes('order-processing')
      );
      expect(orderRule).toBeDefined();
      expect(orderRule?.State).toBe('ENABLED');
    });
  });

  describe('CloudWatch Logs', () => {
    test('EventBridge log group exists', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: '/aws/events/serverless',
      });
      const response = await cloudWatchLogsClient.send(command);
      const logGroup = response.logGroups?.find((lg) =>
        lg.logGroupName?.includes('serverless')
      );
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(7);
    });

    test('Lambda function log groups exist', async () => {
      const userLogCommand = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/lambda/${outputs.UserFunctionName}`,
      });
      const userLogResponse = await cloudWatchLogsClient.send(userLogCommand);
      expect(userLogResponse.logGroups?.length).toBeGreaterThan(0);

      const orderLogCommand = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/lambda/${outputs.OrderFunctionName}`,
      });
      const orderLogResponse = await cloudWatchLogsClient.send(orderLogCommand);
      expect(orderLogResponse.logGroups?.length).toBeGreaterThan(0);
    });
  });

  describe('CodeDeploy', () => {
    test('Deployment groups are configured', async () => {
      // Deployment groups exist as evidenced by the outputs
      expect(outputs.UserDeploymentGroupName).toBeDefined();
      expect(outputs.OrderDeploymentGroupName).toBeDefined();
      expect(outputs.UserDeploymentGroupName).toContain('UserDeploymentGroup');
      expect(outputs.OrderDeploymentGroupName).toContain('OrderDeploymentGroup');
    });
  });

  describe('End-to-End Workflows', () => {
    test('Complete user workflow through API Gateway', async () => {
      // GET users
      const getResponse = await fetch(`${outputs.ApiGatewayUrl}users`);
      expect(getResponse.status).toBe(200);
      const getData = await getResponse.json();
      expect(getData.message).toBe('User operation successful');

      // POST users
      const postResponse = await fetch(`${outputs.ApiGatewayUrl}users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test User' }),
      });
      expect(postResponse.status).toBe(200);
      const postData = await postResponse.json();
      expect(postData.message).toBe('User operation successful');
    });

    test('Complete order workflow through API Gateway', async () => {
      // GET orders
      const getResponse = await fetch(`${outputs.ApiGatewayUrl}orders`);
      expect(getResponse.status).toBe(200);
      const getData = await getResponse.json();
      expect(getData.message).toBe('Order processed successfully');

      // POST orders
      const postResponse = await fetch(`${outputs.ApiGatewayUrl}orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item: 'Test Item' }),
      });
      expect(postResponse.status).toBe(200);
      const postData = await postResponse.json();
      expect(postData.message).toBe('Order processed successfully');
      expect(postData.orderId).toBeDefined();

      // POST customer-specific order
      const customerId = 'workflow-test-customer';
      const customerResponse = await fetch(
        `${outputs.ApiGatewayUrl}orders/${customerId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ item: 'Customer Item' }),
        }
      );
      expect(customerResponse.status).toBe(200);
      const customerData = await customerResponse.json();
      expect(customerData.message).toBe('Order processed successfully');
      expect(customerData.customerId).toBe(customerId);
    });

    test('API responses include proper headers', async () => {
      const response = await fetch(`${outputs.ApiGatewayUrl}users`);
      expect(response.headers.get('content-type')).toContain('application/json');
    });

    test('Lambda functions return consistent version information', async () => {
      const userResponse = await fetch(`${outputs.ApiGatewayUrl}users`);
      const userData = await userResponse.json();
      expect(userData.version).toBeDefined();

      const orderResponse = await fetch(`${outputs.ApiGatewayUrl}orders`, {
        method: 'POST',
      });
      const orderData = await orderResponse.json();
      expect(orderData.version).toBeDefined();
    });
  });
});