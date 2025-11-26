import {
  DynamoDBClient,
  DescribeTableCommand,
} from '@aws-sdk/client-dynamodb';
import {
  CloudFormationClient,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';
const stackName = `TapStack${environmentSuffix}`;

const dynamoDBClient = new DynamoDBClient({ region });
const cfnClient = new CloudFormationClient({ region });

describe('TAP Stack Integration Tests', () => {
  describe('CloudFormation Stack Validation', () => {
    it('should have stack deployed successfully', async () => {
      const command = new DescribeStacksCommand({ StackName: stackName });
      const response = await cfnClient.send(command);

      expect(response.Stacks).toBeDefined();
      expect(response.Stacks?.length).toBeGreaterThan(0);
      expect(response.Stacks?.[0].StackStatus).toMatch(/COMPLETE$/);
    });

    it('should have expected stack outputs', async () => {
      const command = new DescribeStacksCommand({ StackName: stackName });
      const response = await cfnClient.send(command);

      const outputs = response.Stacks?.[0].Outputs;
      expect(outputs).toBeDefined();

      const outputKeys = outputs?.map(o => o.OutputKey);
      expect(outputKeys).toContain('TurnAroundPromptTableName');
      expect(outputKeys).toContain('TurnAroundPromptTableArn');
      expect(outputKeys).toContain('StackName');
      expect(outputKeys).toContain('EnvironmentSuffix');
    });
  });

  describe('DynamoDB Table Validation', () => {
    const tableName = `TurnAroundPromptTable${environmentSuffix}`;

    it('should have DynamoDB table created', async () => {
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoDBClient.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table?.TableName).toBe(tableName);
      expect(response.Table?.TableStatus).toBe('ACTIVE');
    });

    it('should have correct billing mode', async () => {
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoDBClient.send(command);

      expect(response.Table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
    });

    it('should have correct key schema', async () => {
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoDBClient.send(command);

      const keySchema = response.Table?.KeySchema;
      expect(keySchema).toBeDefined();
      expect(keySchema?.length).toBe(1);
      expect(keySchema?.[0].AttributeName).toBe('id');
      expect(keySchema?.[0].KeyType).toBe('HASH');
    });

    it('should have correct attribute definitions', async () => {
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoDBClient.send(command);

      const attributeDefinitions = response.Table?.AttributeDefinitions;
      expect(attributeDefinitions).toBeDefined();
      expect(attributeDefinitions?.length).toBe(1);
      expect(attributeDefinitions?.[0].AttributeName).toBe('id');
      expect(attributeDefinitions?.[0].AttributeType).toBe('S');
    });

    it('should not have deletion protection enabled', async () => {
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoDBClient.send(command);

      expect(response.Table?.DeletionProtectionEnabled).toBe(false);
    });
  });
});
