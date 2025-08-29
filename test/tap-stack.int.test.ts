// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import { DynamoDBClient, DescribeTableCommand, PutItemCommand, GetItemCommand, DeleteItemCommand } from '@aws-sdk/client-dynamodb';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });

describe('Turn Around Prompt API Integration Tests', () => {
  describe('DynamoDB Table Integration Tests', () => {
    const testId = `test-${Date.now()}`;
    
    test('should verify DynamoDB table exists', async () => {
      const tableName = outputs.TurnAroundPromptTableName;
      expect(tableName).toBeTruthy();
      expect(tableName).toMatch(new RegExp(`TurnAroundPromptTable${environmentSuffix}`));
      
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);
      
      expect(response.Table).toBeDefined();
      expect(response.Table?.TableName).toBe(tableName);
      expect(response.Table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
      expect(response.Table?.DeletionProtectionEnabled).toBe(false);
    });

    test('should be able to put item in DynamoDB table', async () => {
      const tableName = outputs.TurnAroundPromptTableName;
      
      const putCommand = new PutItemCommand({
        TableName: tableName,
        Item: {
          id: { S: testId },
          testData: { S: 'integration test data' },
          timestamp: { N: Date.now().toString() }
        }
      });
      
      const response = await dynamoClient.send(putCommand);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('should be able to get item from DynamoDB table', async () => {
      const tableName = outputs.TurnAroundPromptTableName;
      
      const getCommand = new GetItemCommand({
        TableName: tableName,
        Key: {
          id: { S: testId }
        }
      });
      
      const response = await dynamoClient.send(getCommand);
      expect(response.Item).toBeDefined();
      expect(response.Item?.id.S).toBe(testId);
      expect(response.Item?.testData.S).toBe('integration test data');
    });

    test('should be able to delete item from DynamoDB table', async () => {
      const tableName = outputs.TurnAroundPromptTableName;
      
      const deleteCommand = new DeleteItemCommand({
        TableName: tableName,
        Key: {
          id: { S: testId }
        }
      });
      
      const response = await dynamoClient.send(deleteCommand);
      expect(response.$metadata.httpStatusCode).toBe(200);
      
      // Verify item is deleted
      const getCommand = new GetItemCommand({
        TableName: tableName,
        Key: {
          id: { S: testId }
        }
      });
      
      const getResponse = await dynamoClient.send(getCommand);
      expect(getResponse.Item).toBeUndefined();
    });

    test('should verify table outputs are properly exported', async () => {
      expect(outputs.TurnAroundPromptTableName).toBeTruthy();
      expect(outputs.TurnAroundPromptTableArn).toBeTruthy();
      expect(outputs.StackName).toBeTruthy();
      expect(outputs.EnvironmentSuffix).toBe(environmentSuffix);
      
      // Verify ARN format is correct
      const expectedArnPattern = new RegExp(`arn:aws:dynamodb:[^:]+:[^:]+:table/TurnAroundPromptTable${environmentSuffix}`);
      expect(outputs.TurnAroundPromptTableArn).toMatch(expectedArnPattern);
    });
  });
});
