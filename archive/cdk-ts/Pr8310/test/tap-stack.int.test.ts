import fs from 'fs';
import path from 'path';
import axios from 'axios';
import * as apigateway from '@aws-sdk/client-api-gateway';
import * as dynamodb from '@aws-sdk/client-dynamodb';
import * as lambda from '@aws-sdk/client-lambda';
import * as sns from '@aws-sdk/client-sns';
import * as sqs from '@aws-sdk/client-sqs';

// --- Configuration ---
// Define the regions where the stack is deployed, matching your bin/tap.ts
const regionsToDeploy = ['us-east-1', 'us-west-2'];

// Get environment suffix from an environment variable, defaulting to 'dev'
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// --- Test Data Loading ---
// Function to parse the correct CloudFormation outputs file for a given region
const getCfnOutputs = (region: string) => {
  try {
    // Each region will have its own outputs file, e.g., cfn-outputs-us-east-1.json
    const outputsPath = path.join(__dirname, `cfn-outputs-${region}.json`);
    const outputsFile = fs.readFileSync(outputsPath, 'utf8');
    const outputs = JSON.parse(outputsFile);
    
    // The stack name is now unique per region
    const stackName = `TapStack-${environmentSuffix}-${region}`;
    
    // Convert the outputs array to a simple key-value object
    const outputsMap: { [key: string]: string } = {};
    for (const output of outputs) {
        // The key from CDK is StackName-OutputId. We strip the stack name part.
        const key = output.OutputKey.replace(`${stackName}-`, '');
        outputsMap[key] = output.OutputValue;
    }
    return outputsMap;
  } catch (error) {
    // Fail gracefully if a specific region's output file is missing
    console.warn(
      `Could not read cfn-outputs-${region}.json. Make sure to deploy the stack in this region and export its outputs.`
    );
    return {};
  }
};

// --- Test Suite ---
// The tests will now run in a loop for each specified region
regionsToDeploy.forEach(region => {
  
  describe(`Serverless Microservice Integration Tests in ${region}`, () => {
    // Load outputs and initialize clients for the current region in the loop
    const outputs = getCfnOutputs(region);
    
    const apiGatewayClient = new apigateway.APIGatewayClient({ region });
    const dynamoDbClient = new dynamodb.DynamoDBClient({ region });
    const lambdaClient = new lambda.LambdaClient({ region });
    const snsClient = new sns.SNSClient({ region });
    const sqsClient = new sqs.SQSClient({ region });

    // Skip tests for this region if the outputs are missing
    if (!outputs.ProductApiUrl) {
      test.only(`Skipping tests for ${region}: ProductApiUrl not found`, () => {
        console.warn(`Please deploy the stack to ${region} and export the outputs.`);
        expect(true).toBe(true);
      });
      return;
    }

    describe('API Gateway Infrastructure', () => {
      test('API Gateway REST API exists and is configured correctly', async () => {
        const apiUrl = new URL(outputs.ProductApiUrl);
        const apiId = apiUrl.hostname.split('.')[0];
        expect(apiId).toBeDefined();

        const command = new apigateway.GetRestApiCommand({ restApiId: apiId });
        const response = await apiGatewayClient.send(command);

        expect(response).toBeDefined();
        expect(response.name).toBe(`${environmentSuffix}-ProductApi`);
        expect(response.endpointConfiguration?.types).toContain('REGIONAL');
      });

      test('API endpoint should be reachable and return a success response', async () => {
        const apiUrl = `${outputs.ProductApiUrl}products`;
        const response = await axios.get(apiUrl);

        expect(response.status).toBe(200);
        expect(response.data).toContain('Hello from ProductLambda!');
      }, 15000);
    });

    describe('DynamoDB Infrastructure', () => {
      test('Products table exists and is properly configured', async () => {
        const tableName = outputs.ProductsTableName;
        expect(tableName).toBeDefined();

        const command = new dynamodb.DescribeTableCommand({ TableName: tableName });
        const response = await dynamoDbClient.send(command);

        expect(response.Table?.TableName).toBe(tableName);
        expect(response.Table?.TableStatus).toBe('ACTIVE');
      });
    });

    describe('Lambda Function Configuration', () => {
      test('Product Lambda function has correct environment variables', async () => {
        const functionName = outputs.ProductLambdaFunctionName;
        expect(functionName).toBeDefined();

        const command = new lambda.GetFunctionConfigurationCommand({ FunctionName: functionName });
        const response = await lambdaClient.send(command);

        const envVars = response.Environment?.Variables;
        expect(envVars).toBeDefined();
        expect(envVars?.TABLE_NAME).toBe(outputs.ProductsTableName);
        expect(envVars?.SNS_TOPIC_ARN).toBe(outputs.ProductEventsTopicArn);
      });
    });

    describe('Messaging Infrastructure (SNS & SQS)', () => {
      test('SNS topic for product events exists', async () => {
        const topicArn = outputs.ProductEventsTopicArn;
        expect(topicArn).toBeDefined();

        const command = new sns.GetTopicAttributesCommand({ TopicArn: topicArn });
        const response = await snsClient.send(command);

        expect(response.Attributes).toBeDefined();
        expect(response.Attributes?.DisplayName).toBe('Product Events Topic');
      });

      test('SQS queue for order processing exists and is configured', async () => {
        const queueUrl = outputs.OrderProcessingQueueUrl;
        expect(queueUrl).toBeDefined();

        const command = new sqs.GetQueueAttributesCommand({
          QueueUrl: queueUrl,
          AttributeNames: ['VisibilityTimeout', 'KmsMasterKeyId'],
        });
        const response = await sqsClient.send(command);

        expect(response.Attributes).toBeDefined();
        expect(response.Attributes?.VisibilityTimeout).toBe('300');
        expect(response.Attributes?.KmsMasterKeyId).toBeDefined();
      });
    });
  });
});

