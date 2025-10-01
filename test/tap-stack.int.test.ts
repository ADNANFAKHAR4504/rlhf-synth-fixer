import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  ListDashboardsCommand
} from '@aws-sdk/client-cloudwatch';
import {
  DeleteItemCommand,
  DescribeTableCommand,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  UpdateItemCommand
} from '@aws-sdk/client-dynamodb';
import {
  DescribeKeyCommand,
  KMSClient
} from '@aws-sdk/client-kms';
import {
  GetTopicAttributesCommand,
  SNSClient
} from '@aws-sdk/client-sns';
import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack Integration Tests', () => {
  let template: any;
  let outputs: any;
  let hasOutputs = false;

  // AWS Clients
  let dynamoClient: DynamoDBClient;
  let snsClient: SNSClient;
  let cloudwatchClient: CloudWatchClient;
  let kmsClient: KMSClient;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);

    // Try to load deployment outputs
    try {
      const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
      outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
      hasOutputs = true;

      // Initialize AWS clients
      const region = process.env.AWS_REGION || 'us-east-1';
      dynamoClient = new DynamoDBClient({ region });
      snsClient = new SNSClient({ region });
      cloudwatchClient = new CloudWatchClient({ region });
      kmsClient = new KMSClient({ region });
    } catch (error) {
      console.log('No deployment outputs found, skipping live AWS tests');
      hasOutputs = false;
    }
  });

  describe('Deployment Readiness', () => {
    test('template should have all required sections', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
      expect(template.Resources).toBeDefined();
      expect(template.Parameters).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('all resources should have valid AWS types', () => {
      const validTypes = [
        'AWS::DynamoDB::Table',
        'AWS::KMS::Key',
        'AWS::KMS::Alias',
        'AWS::SNS::Topic',
        'AWS::CloudWatch::Alarm',
        'AWS::CloudWatch::Dashboard'
      ];

      Object.keys(template.Resources).forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(validTypes).toContain(resource.Type);
      });
    });
  });

  describe('Resource Dependencies', () => {
    test('DynamoDB table should reference KMS key', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.Properties.SSESpecification.KMSMasterKeyId).toEqual({ Ref: 'KMSKey' });
    });

    test('CloudWatch alarms should reference SNS topic', () => {
      const alarms = Object.keys(template.Resources).filter(
        key => template.Resources[key].Type === 'AWS::CloudWatch::Alarm'
      );

      alarms.forEach(alarmName => {
        const alarm = template.Resources[alarmName];
        expect(alarm.Properties.AlarmActions[0]).toEqual({ Ref: 'SNSTopic' });
      });
    });
  });

  describe('Security Configuration', () => {
    test('DynamoDB should have KMS encryption enabled', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
      expect(table.Properties.SSESpecification.SSEType).toBe('KMS');
    });

    test('SNS topic should have encryption', () => {
      const topic = template.Resources.SNSTopic;
      expect(topic.Properties.KmsMasterKeyId).toBeDefined();
    });

    test('all major resources should have proper tags', () => {
      const resources = ['KMSKey', 'TurnAroundPromptTable', 'SNSTopic'];

      resources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const tags = resource.Properties.Tags;
        expect(tags).toBeDefined();
        expect(tags.some((t: any) => t.Key === 'Environment')).toBe(true);
      });
    });
  });

  describe('Monitoring Configuration', () => {
    test('should have multiple CloudWatch alarms', () => {
      const alarms = Object.keys(template.Resources).filter(
        key => template.Resources[key].Type === 'AWS::CloudWatch::Alarm'
      );
      expect(alarms.length).toBeGreaterThanOrEqual(4);
    });

    test('alarms should monitor DynamoDB metrics', () => {
      const alarms = Object.keys(template.Resources).filter(
        key => template.Resources[key].Type === 'AWS::CloudWatch::Alarm'
      );

      const metrics = alarms.map(
        alarmName => template.Resources[alarmName].Properties.MetricName
      );

      expect(metrics).toContain('UserErrors');
      expect(metrics).toContain('SystemErrors');
    });

    test('should have CloudWatch dashboard', () => {
      expect(template.Resources.CloudWatchDashboard).toBeDefined();
      expect(template.Resources.CloudWatchDashboard.Type).toBe('AWS::CloudWatch::Dashboard');
    });
  });

  describe('Best Practices', () => {
    test('DynamoDB should use on-demand billing', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('DynamoDB should have streams enabled', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.Properties.StreamSpecification.StreamViewType).toBe('NEW_AND_OLD_IMAGES');
    });

    test('template should use parameterized values', () => {
      const templateString = JSON.stringify(template);
      expect(templateString).toContain('${EnvironmentSuffix}');
      expect(templateString).toContain('${ProjectName}');
    });

    test('resources should be deletable', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.DeletionPolicy).toBe('Delete');
    });
  });

  // End-to-End Tests with Real AWS Resources
  describe('End-to-End Tests (Live AWS)', () => {
    const testId = `test-${Date.now()}`;

    beforeAll(() => {
      if (!hasOutputs) {
        console.log('Skipping E2E tests - no deployment outputs available');
      }
    });

    test('should have valid deployment outputs', () => {
      if (!hasOutputs) {
        console.log('Skipping - no outputs');
        return;
      }

      expect(outputs.TurnAroundPromptTableName).toBeDefined();
      expect(outputs.TurnAroundPromptTableArn).toBeDefined();
      expect(outputs.KMSKeyId).toBeDefined();
      expect(outputs.SNSTopicArn).toBeDefined();
      expect(outputs.EnvironmentSuffix).toBeDefined();
    });

    test('DynamoDB table should exist and be accessible', async () => {
      if (!hasOutputs) {
        console.log('Skipping - no outputs');
        return;
      }

      const command = new DescribeTableCommand({
        TableName: outputs.TurnAroundPromptTableName
      });

      const response = await dynamoClient.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table?.TableName).toBe(outputs.TurnAroundPromptTableName);
      expect(response.Table?.TableStatus).toBe('ACTIVE');
      expect(response.Table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
      expect(response.Table?.SSEDescription?.Status).toBe('ENABLED');
      expect(response.Table?.StreamSpecification?.StreamEnabled).toBe(true);
    });

    test('KMS key should exist and be enabled', async () => {
      if (!hasOutputs) {
        console.log('Skipping - no outputs');
        return;
      }

      const command = new DescribeKeyCommand({
        KeyId: outputs.KMSKeyId
      });

      const response = await kmsClient.send(command);

      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata?.KeyId).toBe(outputs.KMSKeyId);
      expect(response.KeyMetadata?.Enabled).toBe(true);
      expect(response.KeyMetadata?.KeyState).toBe('Enabled');
    });

    test('SNS topic should exist', async () => {
      if (!hasOutputs) {
        console.log('Skipping - no outputs');
        return;
      }

      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.SNSTopicArn
      });

      const response = await snsClient.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(outputs.SNSTopicArn);
      expect(response.Attributes?.KmsMasterKeyId).toBeDefined();
    });

    test('CloudWatch alarms should exist', async () => {
      if (!hasOutputs) {
        console.log('Skipping - no outputs');
        return;
      }

      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: `tap-${outputs.EnvironmentSuffix}`
      });

      const response = await cloudwatchClient.send(command);

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBeGreaterThanOrEqual(4);

      const alarmNames = response.MetricAlarms!.map(a => a.AlarmName);
      expect(alarmNames.some(name => name?.includes('throttles'))).toBe(true);
      expect(alarmNames.some(name => name?.includes('system-errors'))).toBe(true);
    });

    test('CloudWatch dashboard should exist', async () => {
      if (!hasOutputs) {
        console.log('Skipping - no outputs');
        return;
      }

      const command = new ListDashboardsCommand({
        DashboardNamePrefix: `tap-${outputs.EnvironmentSuffix}`
      });

      const response = await cloudwatchClient.send(command);

      expect(response.DashboardEntries).toBeDefined();
      expect(response.DashboardEntries!.length).toBeGreaterThanOrEqual(1);
      expect(response.DashboardEntries![0].DashboardName).toContain('tap');
    });

    test('E2E: Create item in DynamoDB table', async () => {
      if (!hasOutputs) {
        console.log('Skipping - no outputs');
        return;
      }

      const ttl = Math.floor(Date.now() / 1000) + 86400; // 24 hours from now

      const command = new PutItemCommand({
        TableName: outputs.TurnAroundPromptTableName,
        Item: {
          id: { S: testId },
          prompt_text: { S: 'Review the following code for security vulnerabilities' },
          task_type: { S: 'code_review' },
          priority: { S: 'high' },
          status: { S: 'pending' },
          created_at: { S: new Date().toISOString() },
          ttl: { N: ttl.toString() }
        }
      });

      const response = await dynamoClient.send(command);

      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('E2E: Read item from DynamoDB table', async () => {
      if (!hasOutputs) {
        console.log('Skipping - no outputs');
        return;
      }

      const command = new GetItemCommand({
        TableName: outputs.TurnAroundPromptTableName,
        Key: {
          id: { S: testId }
        }
      });

      const response = await dynamoClient.send(command);

      expect(response.Item).toBeDefined();
      expect(response.Item?.id.S).toBe(testId);
      expect(response.Item?.prompt_text.S).toBe('Review the following code for security vulnerabilities');
      expect(response.Item?.status.S).toBe('pending');
    });

    test('E2E: Update item in DynamoDB table', async () => {
      if (!hasOutputs) {
        console.log('Skipping - no outputs');
        return;
      }

      const command = new UpdateItemCommand({
        TableName: outputs.TurnAroundPromptTableName,
        Key: {
          id: { S: testId }
        },
        UpdateExpression: 'SET #status = :status, updated_at = :updated_at',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':status': { S: 'completed' },
          ':updated_at': { S: new Date().toISOString() }
        },
        ReturnValues: 'ALL_NEW'
      });

      const response = await dynamoClient.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.status.S).toBe('completed');
      expect(response.Attributes?.updated_at.S).toBeDefined();
    });

    test('E2E: Verify item was updated', async () => {
      if (!hasOutputs) {
        console.log('Skipping - no outputs');
        return;
      }

      const command = new GetItemCommand({
        TableName: outputs.TurnAroundPromptTableName,
        Key: {
          id: { S: testId }
        }
      });

      const response = await dynamoClient.send(command);

      expect(response.Item?.status.S).toBe('completed');
      expect(response.Item?.updated_at.S).toBeDefined();
    });

    test('E2E: Delete item from DynamoDB table', async () => {
      if (!hasOutputs) {
        console.log('Skipping - no outputs');
        return;
      }

      const command = new DeleteItemCommand({
        TableName: outputs.TurnAroundPromptTableName,
        Key: {
          id: { S: testId }
        }
      });

      const response = await dynamoClient.send(command);

      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('E2E: Verify item was deleted', async () => {
      if (!hasOutputs) {
        console.log('Skipping - no outputs');
        return;
      }

      const command = new GetItemCommand({
        TableName: outputs.TurnAroundPromptTableName,
        Key: {
          id: { S: testId }
        }
      });

      const response = await dynamoClient.send(command);

      expect(response.Item).toBeUndefined();
    });

    test('E2E: Complete workflow - Create, Read, Update, Delete', async () => {
      if (!hasOutputs) {
        console.log('Skipping - no outputs');
        return;
      }

      const workflowId = `workflow-${Date.now()}`;
      const ttl = Math.floor(Date.now() / 1000) + 86400;

      // 1. Create
      await dynamoClient.send(new PutItemCommand({
        TableName: outputs.TurnAroundPromptTableName,
        Item: {
          id: { S: workflowId },
          prompt_text: { S: 'Complete E2E workflow test' },
          task_type: { S: 'integration_test' },
          status: { S: 'pending' },
          created_at: { S: new Date().toISOString() },
          ttl: { N: ttl.toString() }
        }
      }));

      // 2. Read
      let getResponse = await dynamoClient.send(new GetItemCommand({
        TableName: outputs.TurnAroundPromptTableName,
        Key: { id: { S: workflowId } }
      }));
      expect(getResponse.Item?.status.S).toBe('pending');

      // 3. Update to processing
      await dynamoClient.send(new UpdateItemCommand({
        TableName: outputs.TurnAroundPromptTableName,
        Key: { id: { S: workflowId } },
        UpdateExpression: 'SET #status = :status',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: { ':status': { S: 'processing' } }
      }));

      // 4. Verify update
      getResponse = await dynamoClient.send(new GetItemCommand({
        TableName: outputs.TurnAroundPromptTableName,
        Key: { id: { S: workflowId } }
      }));
      expect(getResponse.Item?.status.S).toBe('processing');

      // 5. Update to completed
      await dynamoClient.send(new UpdateItemCommand({
        TableName: outputs.TurnAroundPromptTableName,
        Key: { id: { S: workflowId } },
        UpdateExpression: 'SET #status = :status, result = :result',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':status': { S: 'completed' },
          ':result': { S: 'success' }
        }
      }));

      // 6. Final read
      getResponse = await dynamoClient.send(new GetItemCommand({
        TableName: outputs.TurnAroundPromptTableName,
        Key: { id: { S: workflowId } }
      }));
      expect(getResponse.Item?.status.S).toBe('completed');
      expect(getResponse.Item?.result.S).toBe('success');

      // 7. Cleanup
      await dynamoClient.send(new DeleteItemCommand({
        TableName: outputs.TurnAroundPromptTableName,
        Key: { id: { S: workflowId } }
      }));

      // 8. Verify deletion
      getResponse = await dynamoClient.send(new GetItemCommand({
        TableName: outputs.TurnAroundPromptTableName,
        Key: { id: { S: workflowId } }
      }));
      expect(getResponse.Item).toBeUndefined();
    });

    test('E2E: Batch operations - Multiple items', async () => {
      if (!hasOutputs) {
        console.log('Skipping - no outputs');
        return;
      }

      const batchIds = [
        `batch-1-${Date.now()}`,
        `batch-2-${Date.now()}`,
        `batch-3-${Date.now()}`
      ];
      const ttl = Math.floor(Date.now() / 1000) + 86400;

      // Create multiple items
      for (const id of batchIds) {
        await dynamoClient.send(new PutItemCommand({
          TableName: outputs.TurnAroundPromptTableName,
          Item: {
            id: { S: id },
            prompt_text: { S: `Batch test item ${id}` },
            task_type: { S: 'batch_test' },
            status: { S: 'pending' },
            created_at: { S: new Date().toISOString() },
            ttl: { N: ttl.toString() }
          }
        }));
      }

      // Verify all items exist
      for (const id of batchIds) {
        const response = await dynamoClient.send(new GetItemCommand({
          TableName: outputs.TurnAroundPromptTableName,
          Key: { id: { S: id } }
        }));
        expect(response.Item).toBeDefined();
        expect(response.Item?.id.S).toBe(id);
      }

      // Cleanup all items
      for (const id of batchIds) {
        await dynamoClient.send(new DeleteItemCommand({
          TableName: outputs.TurnAroundPromptTableName,
          Key: { id: { S: id } }
        }));
      }
    });
  });
});
