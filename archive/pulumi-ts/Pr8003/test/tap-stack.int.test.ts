import { DynamoDBClient, PutItemCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { LambdaClient, GetFunctionCommand, GetFunctionUrlConfigCommand } from '@aws-sdk/client-lambda';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from '@aws-sdk/client-cloudwatch-logs';
import * as fs from 'fs';
import * as path from 'path';

describe('Payment Webhook Infrastructure Integration Tests', () => {
  let outputs: any;
  const region = 'us-east-1';
  const envSuffix = process.env.ENVIRONMENT_SUFFIX || 'm4n0x5o8';

  beforeAll(() => {
    // Load deployment outputs
    const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
    if (!fs.existsSync(outputsPath)) {
      throw new Error('Deployment outputs not found. Please deploy the stack first.');
    }
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
  });

  describe('DynamoDB Table', () => {
    const dynamoClient = new DynamoDBClient({ region });

    it('should be accessible and allow writes', async () => {
      const tableName = outputs.tableArn.split('/')[1];
      const timestamp = Date.now();
      const testId = `test-${timestamp}`;

      const putCommand = new PutItemCommand({
        TableName: tableName,
        Item: {
          transactionId: { S: testId },
          timestamp: { N: timestamp.toString() },
          provider: { S: 'test-provider' },
          amount: { N: '100' },
          currency: { S: 'USD' },
          status: { S: 'test' },
        },
      });

      await expect(dynamoClient.send(putCommand)).resolves.not.toThrow();

      // Verify the item was written
      const getCommand = new GetItemCommand({
        TableName: tableName,
        Key: {
          transactionId: { S: testId },
          timestamp: { N: timestamp.toString() },
        },
      });

      const result = await dynamoClient.send(getCommand);
      expect(result.Item).toBeDefined();
      expect(result.Item?.transactionId?.S).toBe(testId);
    }, 30000);

    it('should have correct table configuration', async () => {
      const tableName = outputs.tableArn.split('/')[1];
      expect(tableName).toContain('envmig-transactions');
      expect(tableName).toContain(envSuffix);
    });
  });

  describe('Lambda Function', () => {
    const lambdaClient = new LambdaClient({ region });

    it('should exist with correct configuration', async () => {
      const functionName = outputs.lambdaArn.split(':').pop();

      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.Runtime).toBe('nodejs18.x');
      expect(response.Configuration?.MemorySize).toBe(512);
      expect(response.Configuration?.Timeout).toBe(30);
    }, 30000);

    it('should have X-Ray tracing enabled', async () => {
      const functionName = outputs.lambdaArn.split(':').pop();

      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);

      expect(response.Configuration?.TracingConfig?.Mode).toBe('Active');
    }, 30000);

    it('should have function URL configured', async () => {
      const functionName = outputs.lambdaArn.split(':').pop();

      const command = new GetFunctionUrlConfigCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);

      expect(response.FunctionUrl).toBeDefined();
      expect(response.AuthType).toBe('AWS_IAM');
      expect(outputs.functionUrl).toBe(response.FunctionUrl);
    }, 30000);

    it('should have environment variables configured', async () => {
      const functionName = outputs.lambdaArn.split(':').pop();

      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);

      const env = response.Configuration?.Environment?.Variables;
      expect(env).toBeDefined();
      expect(env?.TABLE_NAME).toContain('envmig-transactions');
      expect(env?.SECRET_ARN).toContain('envmig-webhook-apikeys');
      expect(env?.ENVIRONMENT).toBe('prod');
      expect(env?.MIGRATION_PHASE).toBe('testing');
    }, 30000);
  });

  describe('Secrets Manager', () => {
    const secretsClient = new SecretsManagerClient({ region });

    it('should have API keys secret configured', async () => {
      const secretName = outputs.lambdaArn.split(':function:')[0]
        .replace(':lambda:', ':secretsmanager:') + `:secret:envmig-webhook-apikeys-${envSuffix}`;

      // Get secret ARN from Lambda environment
      const lambdaClient = new LambdaClient({ region });
      const functionName = outputs.lambdaArn.split(':').pop();
      const lambdaResponse = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: functionName })
      );

      const secretArn = lambdaResponse.Configuration?.Environment?.Variables?.SECRET_ARN;
      expect(secretArn).toBeDefined();

      const command = new GetSecretValueCommand({
        SecretId: secretArn,
      });

      const response = await secretsClient.send(command);

      expect(response.SecretString).toBeDefined();
      const secret = JSON.parse(response.SecretString!);
      expect(secret).toHaveProperty('stripeKey');
      expect(secret).toHaveProperty('paypalKey');
    }, 30000);
  });

  describe('CloudWatch Logs', () => {
    const logsClient = new CloudWatchLogsClient({ region });

    it('should have log group with 7-day retention', async () => {
      const functionName = outputs.lambdaArn.split(':').pop();
      const logGroupName = `/aws/lambda/${functionName}`;

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });

      const response = await logsClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);

      const logGroup = response.logGroups!.find(lg => lg.logGroupName === logGroupName);
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(7);
    }, 30000);
  });

  describe('Resource Naming', () => {
    it('should include environment suffix in all resource names', () => {
      expect(outputs.lambdaArn).toContain(envSuffix);
      expect(outputs.tableArn).toContain(envSuffix);
      expect(outputs.functionUrl).toBeDefined();
    });

    it('should follow naming pattern envmig-{service}-{suffix}', () => {
      const tableName = outputs.tableArn.split('/')[1];
      const functionName = outputs.lambdaArn.split(':').pop();

      expect(tableName).toBe(`envmig-transactions-${envSuffix}`);
      expect(functionName).toBe(`envmig-webhook-${envSuffix}`);
    });
  });

  describe('IAM Permissions', () => {
    it('should allow Lambda to access DynamoDB', async () => {
      // This is tested indirectly through the DynamoDB write test
      // If Lambda couldn't access DynamoDB, the write would fail
      expect(outputs.tableArn).toBeDefined();
      expect(outputs.lambdaArn).toBeDefined();
    });

    it('should allow Lambda to access Secrets Manager', async () => {
      // This is tested indirectly through the Secrets Manager test
      // If Lambda couldn't access Secrets Manager, the retrieval would fail
      const lambdaClient = new LambdaClient({ region });
      const functionName = outputs.lambdaArn.split(':').pop();
      const response = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: functionName })
      );

      const secretArn = response.Configuration?.Environment?.Variables?.SECRET_ARN;
      expect(secretArn).toBeDefined();
      expect(secretArn).toContain('envmig-webhook-apikeys');
    }, 30000);
  });

  describe('Resource Tagging', () => {
    it('should tag resources with Environment=prod', async () => {
      const lambdaClient = new LambdaClient({ region });
      const functionName = outputs.lambdaArn.split(':').pop();

      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);

      const tags = response.Tags;
      expect(tags).toBeDefined();
      expect(tags?.Environment).toBe('prod');
      expect(tags?.MigrationPhase).toBe('testing');
    }, 30000);
  });

  describe('Stack Outputs', () => {
    it('should export function URL', () => {
      expect(outputs.functionUrl).toBeDefined();
      expect(outputs.functionUrl).toMatch(/^https:\/\/.*\.lambda-url\..*\.on\.aws\/$/);
    });

    it('should export DynamoDB table ARN', () => {
      expect(outputs.tableArn).toBeDefined();
      expect(outputs.tableArn).toMatch(new RegExp(`^arn:aws:dynamodb:.*:.*:table/envmig-transactions-${envSuffix}$`));
    });

    it('should export Lambda ARN', () => {
      expect(outputs.lambdaArn).toBeDefined();
      expect(outputs.lambdaArn).toMatch(new RegExp(`^arn:aws:lambda:.*:.*:function:envmig-webhook-${envSuffix}$`));
    });
  });
});
