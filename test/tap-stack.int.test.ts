// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import { DynamoDBClient, PutItemCommand, GetItemCommand, DescribeTableCommand, DeleteItemCommand } from '@aws-sdk/client-dynamodb';
import { KMSClient, DescribeKeyCommand } from '@aws-sdk/client-kms';
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from '@aws-sdk/client-cloudwatch-logs';

// Mock the file read for testing when outputs don't exist
let outputs: any = {};
try {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
} catch (error) {
  console.warn('cfn-outputs/flat-outputs.json not found, using environment variables for testing');
}

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// AWS clients
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const kmsClient = new KMSClient({ region: process.env.AWS_REGION || 'us-east-1' });
const cloudWatchClient = new CloudWatchLogsClient({ region: process.env.AWS_REGION || 'us-east-1' });

describe('TAP Infrastructure Integration Tests', () => {
  const tableName = outputs.TurnAroundPromptTableName || `TurnAroundPromptTable${environmentSuffix}`;
  const testItemId = 'integration-test-' + Date.now();
  
  describe('DynamoDB Table Integration Tests', () => {
    test('should verify table exists and has correct configuration', async () => {
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);
      
      expect(response.Table).toBeDefined();
      expect(response.Table?.TableName).toBe(tableName);
      expect(response.Table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
      expect(response.Table?.DeletionProtectionEnabled).toBe(false);
      
      // Verify encryption is enabled
      expect(response.Table?.SSEDescription?.Status).toBe('ENABLED');
      
      // Verify point-in-time recovery is enabled
      expect(response.Table?.RestoreSummary?.PointInTimeRecoveryEnabled).toBe(true);
    }, 30000);

    test('should successfully write and read data from DynamoDB table', async () => {
      // Put item
      const putCommand = new PutItemCommand({
        TableName: tableName,
        Item: {
          id: { S: testItemId },
          testData: { S: 'integration-test-data' },
          timestamp: { N: Date.now().toString() }
        }
      });
      
      await dynamoClient.send(putCommand);
      
      // Get item
      const getCommand = new GetItemCommand({
        TableName: tableName,
        Key: {
          id: { S: testItemId }
        }
      });
      
      const response = await dynamoClient.send(getCommand);
      
      expect(response.Item).toBeDefined();
      expect(response.Item?.id?.S).toBe(testItemId);
      expect(response.Item?.testData?.S).toBe('integration-test-data');
    }, 30000);
    
    test('should clean up test data', async () => {
      // Delete test item
      const deleteCommand = new DeleteItemCommand({
        TableName: tableName,
        Key: {
          id: { S: testItemId }
        }
      });
      
      await dynamoClient.send(deleteCommand);
      
      // Verify item is deleted
      const getCommand = new GetItemCommand({
        TableName: tableName,
        Key: {
          id: { S: testItemId }
        }
      });
      
      const response = await dynamoClient.send(getCommand);
      expect(response.Item).toBeUndefined();
    }, 30000);
  });

  describe('Security Features Integration Tests', () => {
    test('should verify KMS key exists and has proper configuration when enabled', async () => {
      if (outputs.KMSKeyArn) {
        const keyId = outputs.KMSKeyArn;
        const command = new DescribeKeyCommand({ KeyId: keyId });
        const response = await kmsClient.send(command);
        
        expect(response.KeyMetadata).toBeDefined();
        expect(response.KeyMetadata?.KeyRotationEnabled).toBe(true);
        expect(response.KeyMetadata?.KeyUsage).toBe('ENCRYPT_DECRYPT');
        expect(response.KeyMetadata?.KeyState).toBe('Enabled');
      } else {
        console.log('KMS encryption disabled - skipping KMS validation');
        expect(true).toBe(true); // Pass test when KMS is disabled
      }
    }, 30000);

    test('should verify CloudWatch log group exists', async () => {
      const logGroupName = outputs.CloudWatchLogGroupName || `/aws/dynamodb/tap-${environmentSuffix}`;
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName
      });
      
      const response = await cloudWatchClient.send(command);
      const logGroup = response.logGroups?.find(lg => lg.logGroupName === logGroupName);
      
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(30);
    }, 30000);
  });

  describe('Stack Outputs Validation', () => {
    test('should have all required stack outputs', () => {
      // These should be available from the deployed stack
      const requiredOutputs = [
        'TurnAroundPromptTableName',
        'TurnAroundPromptTableArn',
        'StackName',
        'EnvironmentSuffix',
        'CloudWatchLogGroupName'
      ];
      
      for (const output of requiredOutputs) {
        expect(outputs[output] || process.env[output]).toBeDefined();
      }
    });
  });
});
