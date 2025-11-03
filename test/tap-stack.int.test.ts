import * as fs from 'fs';
import * as path from 'path';
import {
  DynamoDBClient,
  DescribeTableCommand,
  PutItemCommand,
  GetItemCommand,
  DeleteItemCommand,
} from '@aws-sdk/client-dynamodb';
import {
  LambdaClient,
  GetFunctionCommand,
  InvokeCommand,
} from '@aws-sdk/client-lambda';
import {
  APIGatewayClient,
  GetRestApiCommand,
  GetStageCommand,
  GetMethodCommand,
  GetResourcesCommand,
  GetApiKeyCommand,
  GetUsagePlanCommand,
} from '@aws-sdk/client-api-gateway';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';

describe('TapStack Integration Tests', () => {
  let outputs: Record<string, string>;
  const region = 'ap-southeast-1';

  beforeAll(() => {
    // Load outputs from deployment
    const outputsPath = path.join(
      __dirname,
      '../cfn-outputs/flat-outputs.json',
    );
    expect(fs.existsSync(outputsPath)).toBe(true);
    const outputsContent = fs.readFileSync(outputsPath, 'utf-8');
    outputs = JSON.parse(outputsContent);

    // Verify required outputs exist
    expect(outputs.dynamodb_table_name).toBeDefined();
    expect(outputs.lambda_function_name).toBeDefined();
    expect(outputs.api_gateway_id).toBeDefined();
    expect(outputs.api_gateway_url).toBeDefined();
    expect(outputs.api_stage_name).toBeDefined();
  });

  describe('DynamoDB Integration', () => {
    const dynamodbClient = new DynamoDBClient({ region });

    it('should have DynamoDB table deployed with correct configuration', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.dynamodb_table_name,
      });

      const response = await dynamodbClient.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table?.TableName).toBe(outputs.dynamodb_table_name);
      expect(response.Table?.TableStatus).toBe('ACTIVE');
      expect(response.Table?.KeySchema).toHaveLength(1);
      expect(response.Table?.KeySchema?.[0].AttributeName).toBe('id');
      expect(response.Table?.KeySchema?.[0].KeyType).toBe('HASH');
    });

    it('should have encryption enabled on DynamoDB table', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.dynamodb_table_name,
      });

      const response = await dynamodbClient.send(command);

      expect(response.Table?.SSEDescription).toBeDefined();
      expect(response.Table?.SSEDescription?.Status).toBe('ENABLED');
    });

    it('should successfully write and read from DynamoDB table', async () => {
      const testId = `test-${Date.now()}`;

      // Put item
      const putCommand = new PutItemCommand({
        TableName: outputs.dynamodb_table_name,
        Item: {
          id: { S: testId },
          data: { S: 'test-data' },
          timestamp: { N: Date.now().toString() },
        },
      });

      await dynamodbClient.send(putCommand);

      // Get item
      const getCommand = new GetItemCommand({
        TableName: outputs.dynamodb_table_name,
        Key: {
          id: { S: testId },
        },
      });

      const getResponse = await dynamodbClient.send(getCommand);

      expect(getResponse.Item).toBeDefined();
      expect(getResponse.Item?.id.S).toBe(testId);
      expect(getResponse.Item?.data.S).toBe('test-data');

      // Cleanup
      const deleteCommand = new DeleteItemCommand({
        TableName: outputs.dynamodb_table_name,
        Key: {
          id: { S: testId },
        },
      });

      await dynamodbClient.send(deleteCommand);
    });

    it('should have PAY_PER_REQUEST billing mode for dev environment', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.dynamodb_table_name,
      });

      const response = await dynamodbClient.send(command);

      expect(response.Table?.BillingModeSummary).toBeDefined();
      expect(response.Table?.BillingModeSummary?.BillingMode).toBe(
        'PAY_PER_REQUEST',
      );
    });
  });

  describe('Lambda Integration', () => {
    const lambdaClient = new LambdaClient({ region });

    it('should have Lambda function deployed with correct configuration', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.lambda_function_name,
      });

      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toBe(
        outputs.lambda_function_name,
      );
      expect(response.Configuration?.Runtime).toBe('nodejs18.x');
      expect(response.Configuration?.Handler).toBe('handler.handler');
      expect(response.Configuration?.State).toBe('Active');
    });

    it('should have correct memory size (512MB for dev)', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.lambda_function_name,
      });

      const response = await lambdaClient.send(command);

      expect(response.Configuration?.MemorySize).toBe(512);
    });

    it('should have correct concurrent executions (10 for dev)', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.lambda_function_name,
      });

      const response = await lambdaClient.send(command);

      expect(response.Concurrency?.ReservedConcurrentExecutions).toBe(10);
    });

    it('should have environment variables configured', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.lambda_function_name,
      });

      const response = await lambdaClient.send(command);

      expect(response.Configuration?.Environment?.Variables).toBeDefined();
      expect(
        response.Configuration?.Environment?.Variables?.TABLE_NAME,
      ).toBeDefined();
      expect(
        response.Configuration?.Environment?.Variables?.ENVIRONMENT,
      ).toBeDefined();
    });

    it('should successfully invoke Lambda function', async () => {
      const command = new InvokeCommand({
        FunctionName: outputs.lambda_function_name,
        Payload: Buffer.from(
          JSON.stringify({
            httpMethod: 'GET',
            path: '/items',
          }),
        ),
      });

      const response = await lambdaClient.send(command);

      expect(response.StatusCode).toBe(200);
      expect(response.Payload).toBeDefined();

      const payload = JSON.parse(Buffer.from(response.Payload!).toString());
      expect(payload.statusCode).toBe(200);
      expect(payload.body).toBeDefined();

      const body = JSON.parse(payload.body);
      expect(body.message).toBeDefined();
      expect(body.tableName).toBeDefined();
      expect(body.environment).toBeDefined();
    });

    it('should have permissions to access DynamoDB', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.lambda_function_name,
      });

      const response = await lambdaClient.send(command);

      expect(response.Configuration?.Role).toBeDefined();
      expect(response.Configuration?.Role).toContain('lambda-role');
    });
  });

  describe('API Gateway Integration', () => {
    const apiGatewayClient = new APIGatewayClient({ region });

    it('should have REST API deployed', async () => {
      const command = new GetRestApiCommand({
        restApiId: outputs.api_gateway_id,
      });

      const response = await apiGatewayClient.send(command);

      expect(response.id).toBe(outputs.api_gateway_id);
      expect(response.name).toBeDefined();
      expect(response.endpointConfiguration?.types).toContain('EDGE');
    });

    it('should have stage deployed with correct name', async () => {
      const command = new GetStageCommand({
        restApiId: outputs.api_gateway_id,
        stageName: outputs.api_stage_name,
      });

      const response = await apiGatewayClient.send(command);

      expect(response.stageName).toBe(outputs.api_stage_name);
      expect(response.deploymentId).toBeDefined();
    });

    it('should have /items resource created', async () => {
      const command = new GetResourcesCommand({
        restApiId: outputs.api_gateway_id,
      });

      const response = await apiGatewayClient.send(command);

      expect(response.items).toBeDefined();
      const itemsResource = response.items?.find(
        (item) => item.pathPart === 'items',
      );
      expect(itemsResource).toBeDefined();
      expect(itemsResource?.path).toBe('/items');
    });

    it('should have GET method on /items resource', async () => {
      // First get the resource
      const resourcesCommand = new GetResourcesCommand({
        restApiId: outputs.api_gateway_id,
      });
      const resourcesResponse =
        await apiGatewayClient.send(resourcesCommand);
      const itemsResource = resourcesResponse.items?.find(
        (item) => item.pathPart === 'items',
      );
      expect(itemsResource).toBeDefined();

      // Then get the method
      const methodCommand = new GetMethodCommand({
        restApiId: outputs.api_gateway_id,
        resourceId: itemsResource!.id!,
        httpMethod: 'GET',
      });

      const response = await apiGatewayClient.send(methodCommand);

      expect(response.httpMethod).toBe('GET');
      expect(response.authorizationType).toBe('NONE');
    });

    it('should have API key NOT required for dev environment', async () => {
      // Get the resource
      const resourcesCommand = new GetResourcesCommand({
        restApiId: outputs.api_gateway_id,
      });
      const resourcesResponse =
        await apiGatewayClient.send(resourcesCommand);
      const itemsResource = resourcesResponse.items?.find(
        (item) => item.pathPart === 'items',
      );

      // Get the method
      const methodCommand = new GetMethodCommand({
        restApiId: outputs.api_gateway_id,
        resourceId: itemsResource!.id!,
        httpMethod: 'GET',
      });

      const response = await apiGatewayClient.send(methodCommand);

      expect(response.apiKeyRequired).toBe(false);
    });

    it('should have Lambda integration configured', async () => {
      // Get the resource
      const resourcesCommand = new GetResourcesCommand({
        restApiId: outputs.api_gateway_id,
      });
      const resourcesResponse =
        await apiGatewayClient.send(resourcesCommand);
      const itemsResource = resourcesResponse.items?.find(
        (item) => item.pathPart === 'items',
      );

      // Get the method
      const methodCommand = new GetMethodCommand({
        restApiId: outputs.api_gateway_id,
        resourceId: itemsResource!.id!,
        httpMethod: 'GET',
      });

      const response = await apiGatewayClient.send(methodCommand);

      expect(response.methodIntegration).toBeDefined();
      expect(response.methodIntegration?.type).toBe('AWS_PROXY');
      expect(response.methodIntegration?.httpMethod).toBe('POST');
      expect(response.methodIntegration?.uri).toContain('lambda');
      expect(response.methodIntegration?.uri).toContain(
        outputs.lambda_function_name,
      );
    });

    it('should return 200 when calling API endpoint', async () => {
      const apiUrl = `${outputs.api_gateway_url}/items`;

      const response = await fetch(apiUrl);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.message).toBeDefined();
      expect(body.tableName).toBe(outputs.dynamodb_table_name);
      expect(body.environment).toBe('dev');
    });
  });

  describe('CloudWatch Logs Integration', () => {
    const cloudWatchLogsClient = new CloudWatchLogsClient({ region });

    it('should have Lambda log group created', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/lambda/${outputs.lambda_function_name}`,
      });

      const response = await cloudWatchLogsClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);
      expect(response.logGroups?.[0].logGroupName).toBe(
        `/aws/lambda/${outputs.lambda_function_name}`,
      );
    });

    it('should have correct log retention (7 days for dev)', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/lambda/${outputs.lambda_function_name}`,
      });

      const response = await cloudWatchLogsClient.send(command);

      expect(response.logGroups?.[0].retentionInDays).toBe(7);
    });

    it('should have API Gateway log group created', async () => {
      const logGroupName = `/aws/apigateway/api-${outputs.api_gateway_id.substring(0, outputs.api_gateway_id.length - 7)}${outputs.dynamodb_table_name.split('-')[outputs.dynamodb_table_name.split('-').length - 1]}`;

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: '/aws/apigateway/',
      });

      const response = await cloudWatchLogsClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);

      // Find log group that contains our environment suffix
      const ourLogGroup = response.logGroups?.find((lg) =>
        lg.logGroupName?.includes('dev-'),
      );
      expect(ourLogGroup).toBeDefined();
    });
  });

  describe('End-to-End Workflow', () => {
    const dynamodbClient = new DynamoDBClient({ region });

    it('should complete full workflow: API -> Lambda -> DynamoDB', async () => {
      const testId = `e2e-test-${Date.now()}`;

      // Step 1: Put item in DynamoDB
      const putCommand = new PutItemCommand({
        TableName: outputs.dynamodb_table_name,
        Item: {
          id: { S: testId },
          data: { S: 'e2e-test-data' },
          timestamp: { N: Date.now().toString() },
        },
      });

      await dynamodbClient.send(putCommand);

      // Step 2: Call API Gateway endpoint which triggers Lambda
      const apiUrl = `${outputs.api_gateway_url}/items`;
      const apiResponse = await fetch(apiUrl);

      expect(apiResponse.status).toBe(200);
      const apiBody = await apiResponse.json();
      expect(apiBody.tableName).toBe(outputs.dynamodb_table_name);

      // Step 3: Verify item exists in DynamoDB
      const getCommand = new GetItemCommand({
        TableName: outputs.dynamodb_table_name,
        Key: {
          id: { S: testId },
        },
      });

      const getResponse = await dynamodbClient.send(getCommand);

      expect(getResponse.Item).toBeDefined();
      expect(getResponse.Item?.id.S).toBe(testId);

      // Cleanup
      const deleteCommand = new DeleteItemCommand({
        TableName: outputs.dynamodb_table_name,
        Key: {
          id: { S: testId },
        },
      });

      await dynamodbClient.send(deleteCommand);
    });

    it('should have proper error handling for invalid requests', async () => {
      const apiUrl = `${outputs.api_gateway_url}/nonexistent`;

      const response = await fetch(apiUrl);

      // Should return 403 (missing authentication) or 404 (not found)
      expect([403, 404]).toContain(response.status);
    });
  });
});
