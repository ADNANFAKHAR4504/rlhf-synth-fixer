// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import path from 'path';
import { DynamoDBClient, DescribeTableCommand, PutItemCommand, GetItemCommand, DeleteItemCommand } from '@aws-sdk/client-dynamodb';

const outputsPath = path.join('cfn-outputs', 'flat-outputs.json');
let outputs: any = {};

if (fs.existsSync(outputsPath)) {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
} else {
  // Warn and skip tests if outputs file is missing
  console.warn(`Warning: ${outputsPath} not found. Integration tests will be skipped.`);
  // Optionally, you can throw here to fail all tests instead of skipping
}

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';

(outputsPath && fs.existsSync(outputsPath) ? describe : describe.skip)(
  'Turn Around Prompt API Integration Tests',
  () => {
    let dynamoClient: DynamoDBClient;
    
    beforeAll(() => {
      dynamoClient = new DynamoDBClient({ region });
    });

    afterAll(() => {
      if (dynamoClient) {
        dynamoClient.destroy();
      }
    });

    describe('DynamoDB Table Operations', () => {
      test('should validate DynamoDB table exists and is accessible', async () => {
        const tableName = outputs.TurnAroundPromptTableName;
        expect(tableName).toBeDefined();
        expect(typeof tableName).toBe('string');
        expect(tableName).toMatch(new RegExp(`TurnAroundPromptTable${environmentSuffix}`));

        const command = new DescribeTableCommand({ TableName: tableName });
        const response = await dynamoClient.send(command);
        
        expect(response.Table).toBeDefined();
        expect(response.Table?.TableName).toBe(tableName);
        expect(response.Table?.TableStatus).toBe('ACTIVE');
        expect(response.Table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
        expect(response.Table?.DeletionProtectionEnabled).toBe(false);
        
        // Verify key schema
        expect(response.Table?.KeySchema).toHaveLength(1);
        expect(response.Table?.KeySchema?.[0]).toEqual({
          AttributeName: 'id',
          KeyType: 'HASH'
        });
        
        // Verify attribute definitions
        expect(response.Table?.AttributeDefinitions).toHaveLength(1);
        expect(response.Table?.AttributeDefinitions?.[0]).toEqual({
          AttributeName: 'id',
          AttributeType: 'S'
        });
      });

      test('should perform CRUD operations on DynamoDB table', async () => {
        const tableName = outputs.TurnAroundPromptTableName;
        const testId = `test-item-${Date.now()}`;
        
        // Test PUT operation
        const putCommand = new PutItemCommand({
          TableName: tableName,
          Item: {
            id: { S: testId },
            data: { S: 'test data' },
            timestamp: { N: Date.now().toString() }
          }
        });
        
        const putResponse = await dynamoClient.send(putCommand);
        expect(putResponse.$metadata.httpStatusCode).toBe(200);
        
        // Test GET operation
        const getCommand = new GetItemCommand({
          TableName: tableName,
          Key: {
            id: { S: testId }
          }
        });
        
        const getResponse = await dynamoClient.send(getCommand);
        expect(getResponse.Item).toBeDefined();
        expect(getResponse.Item?.id.S).toBe(testId);
        expect(getResponse.Item?.data.S).toBe('test data');
        
        // Test DELETE operation
        const deleteCommand = new DeleteItemCommand({
          TableName: tableName,
          Key: {
            id: { S: testId }
          }
        });
        
        const deleteResponse = await dynamoClient.send(deleteCommand);
        expect(deleteResponse.$metadata.httpStatusCode).toBe(200);
        
        // Verify item is deleted
        const verifyDeletedResponse = await dynamoClient.send(getCommand);
        expect(verifyDeletedResponse.Item).toBeUndefined();
      });

      test('should validate table ARN is correctly formatted', async () => {
        const tableArn = outputs.TurnAroundPromptTableArn;
        const tableName = outputs.TurnAroundPromptTableName;
        
        expect(tableArn).toBeDefined();
        expect(typeof tableArn).toBe('string');
        
        // ARN format: arn:aws:dynamodb:region:account:table/table-name
        const arnRegex = /^arn:aws:dynamodb:[a-z0-9-]+:\d{12}:table\/.+$/;
        expect(tableArn).toMatch(arnRegex);
        expect(tableArn).toContain(`table/${tableName}`);
      });

      test('should validate stack outputs contain required values', async () => {
        // Verify all expected outputs are present
        expect(outputs.TurnAroundPromptTableName).toBeDefined();
        expect(outputs.TurnAroundPromptTableArn).toBeDefined();
        expect(outputs.StackName).toBeDefined();
        expect(outputs.EnvironmentSuffix).toBeDefined();
        
        // Verify environment suffix matches
        expect(outputs.EnvironmentSuffix).toBe(environmentSuffix);
        
        // Verify stack name follows expected pattern
        expect(outputs.StackName).toMatch(new RegExp(`TapStack${environmentSuffix}`));
      });
    });
  }
);
