// Configuration - These are coming from cfn-outputs after CloudFormation deploy
import fs from 'fs';
import path from 'path';
import { DynamoDBClient, DescribeTableCommand, PutItemCommand, GetItemCommand, DeleteItemCommand } from '@aws-sdk/client-dynamodb';

// Read outputs from cfn-outputs/flat-outputs.json
const outputsPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');

if (!fs.existsSync(outputsPath)) {
  throw new Error(
    `Outputs file not found at ${outputsPath}. ` +
    `Please deploy infrastructure first:\n` +
    `  LocalStack: npm run localstack:cfn:deploy\n` +
    `  AWS: npm run cfn:deploy-yaml`
  );
}

const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

console.log('📊 Loaded outputs from:', outputsPath);
console.log('📋 Available outputs:', Object.keys(outputs));

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Detect if running against LocalStack or AWS
const isLocalStack = !!process.env.AWS_ENDPOINT_URL;
console.log(`🌐 Running tests against: ${isLocalStack ? 'LocalStack' : 'AWS'}`);
console.log(`📍 Region: ${process.env.AWS_REGION || 'us-east-1'}`);
if (isLocalStack) {
  console.log(`🔗 Endpoint: ${process.env.AWS_ENDPOINT_URL}`);
}

// Configure DynamoDB client for LocalStack or AWS
const clientConfig: any = {
  region: process.env.AWS_REGION || 'us-east-1',
};

// Add endpoint only for LocalStack
if (process.env.AWS_ENDPOINT_URL) {
  clientConfig.endpoint = process.env.AWS_ENDPOINT_URL;
}

const dynamoDBClient = new DynamoDBClient(clientConfig);

describe('Turn Around Prompt API Integration Tests', () => {
  describe('Infrastructure Validation', () => {
    test('should have valid outputs from cfn-outputs/flat-outputs.json', () => {
      expect(outputs).toHaveProperty('TurnAroundPromptTableName');
      expect(outputs).toHaveProperty('TurnAroundPromptTableArn');
      expect(outputs).toHaveProperty('EnvironmentSuffix');
      expect(outputs).toHaveProperty('StackName');

      // Validate output values are not empty
      expect(outputs.TurnAroundPromptTableName).toBeTruthy();
      expect(outputs.TurnAroundPromptTableArn).toBeTruthy();
      expect(outputs.EnvironmentSuffix).toBeTruthy();
      expect(outputs.StackName).toBeTruthy();

      console.log('✅ Outputs validation passed');
      console.log('  - Table Name:', outputs.TurnAroundPromptTableName);
      console.log('  - Table ARN:', outputs.TurnAroundPromptTableArn);
      console.log('  - Environment:', outputs.EnvironmentSuffix);
      console.log('  - Stack Name:', outputs.StackName);
    });

    test('DynamoDB table should exist and be active', async () => {
      console.log('🔍 Describing DynamoDB table:', outputs.TurnAroundPromptTableName);

      const command = new DescribeTableCommand({
        TableName: outputs.TurnAroundPromptTableName,
      });

      const response = await dynamoDBClient.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table?.TableName).toBe(outputs.TurnAroundPromptTableName);
      expect(response.Table?.TableStatus).toBe('ACTIVE');
      expect(response.Table?.KeySchema).toEqual([
        { AttributeName: 'id', KeyType: 'HASH' },
      ]);
      expect(response.Table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');

      console.log('✅ Table is ACTIVE with correct configuration');
      console.log('  - Billing Mode:', response.Table?.BillingModeSummary?.BillingMode);
      console.log('  - Key Schema:', JSON.stringify(response.Table?.KeySchema));
    });
  });

  describe('DynamoDB Operations', () => {
    // Generate unique test ID to avoid conflicts
    const testId = `integration-test-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    test('should write item to DynamoDB table', async () => {
      console.log('✍️  Writing test item with id:', testId);

      const command = new PutItemCommand({
        TableName: outputs.TurnAroundPromptTableName,
        Item: {
          id: { S: testId },
          data: { S: 'test data' },
          description: { S: 'Integration test data from CloudFormation deployment' },
          timestamp: { N: Date.now().toString() },
          environment: { S: outputs.EnvironmentSuffix },
        },
      });

      const response = await dynamoDBClient.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);

      console.log('✅ Successfully wrote item to DynamoDB');
    });

    test('should read item from DynamoDB table', async () => {
      console.log('📖 Reading test item with id:', testId);

      const command = new GetItemCommand({
        TableName: outputs.TurnAroundPromptTableName,
        Key: {
          id: { S: testId },
        },
      });

      const response = await dynamoDBClient.send(command);

      expect(response.Item).toBeDefined();
      expect(response.Item?.id.S).toBe(testId);
      expect(response.Item?.data.S).toBe('test data');
      expect(response.Item?.description.S).toBe('Integration test data from CloudFormation deployment');
      expect(response.Item?.environment.S).toBe(outputs.EnvironmentSuffix);

      console.log('✅ Successfully read item from DynamoDB');
      console.log('  - Data:', response.Item?.data.S);
      console.log('  - Environment:', response.Item?.environment.S);
    });

    test('should delete item from DynamoDB table', async () => {
      console.log('🗑️  Deleting test item with id:', testId);

      const command = new DeleteItemCommand({
        TableName: outputs.TurnAroundPromptTableName,
        Key: {
          id: { S: testId },
        },
      });

      const response = await dynamoDBClient.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);

      // Verify item was deleted
      const getCommand = new GetItemCommand({
        TableName: outputs.TurnAroundPromptTableName,
        Key: {
          id: { S: testId },
        },
      });

      const getResponse = await dynamoDBClient.send(getCommand);
      expect(getResponse.Item).toBeUndefined();

      console.log('✅ Successfully deleted item from DynamoDB');
    });
  });

  afterAll(() => {
    console.log('\n🎉 All integration tests completed successfully!');
    console.log(`📊 Tested against: ${isLocalStack ? 'LocalStack' : 'AWS'}`);
    console.log(`📋 Stack: ${outputs.StackName}`);
    console.log(`🗄️  Table: ${outputs.TurnAroundPromptTableName}`);
  });
});
