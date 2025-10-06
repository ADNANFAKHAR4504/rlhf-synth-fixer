// Configuration - These are coming from cfn-outputs after cdk deploy
import AWS from 'aws-sdk';

import fs from 'fs';
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Initialize AWS clients
const dynamodb = new AWS.DynamoDB.DocumentClient();
const lambda = new AWS.Lambda();
const cloudwatch = new AWS.CloudWatch();
const sns = new AWS.SNS();

describe('Serverless Inventory Update Scheduling System Integration Tests', () => {
  describe('End-to-End System Tests', () => {
    test('should have all required stack outputs', async () => {
      expect(outputs.InventoryTableName).toBeDefined();
      expect(outputs.JobExecutionTableName).toBeDefined();
      expect(outputs.LambdaFunctionName).toBeDefined();
      expect(outputs.LambdaFunctionArn).toBeDefined();
      expect(outputs.AlertTopicArn).toBeDefined();
      expect(outputs.ScheduleRuleName).toBeDefined();
      expect(outputs.MonitoringNamespace).toBeDefined();
    });

    test('should be able to access DynamoDB inventory table', async () => {
      const tableName = outputs.InventoryTableName;

      try {
        const result = await dynamodb.scan({
          TableName: tableName,
          Limit: 1
        }).promise();

        expect(result).toBeDefined();
        expect(typeof result.Count).toBe('number');
      } catch (error: any) {
        // Table should be accessible even if empty
        expect(error.code).not.toBe('ResourceNotFoundException');
      }
    });

    test('should be able to access DynamoDB job execution table', async () => {
      const tableName = outputs.JobExecutionTableName;

      try {
        const result = await dynamodb.scan({
          TableName: tableName,
          Limit: 1
        }).promise();

        expect(result).toBeDefined();
        expect(typeof result.Count).toBe('number');
      } catch (error: any) {
        // Table should be accessible even if empty
        expect(error.code).not.toBe('ResourceNotFoundException');
      }
    });

    test('should be able to invoke Lambda function manually', async () => {
      const functionName = outputs.LambdaFunctionName;

      const params = {
        FunctionName: functionName,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify({
          testInvocation: true,
          source: 'integration-test'
        })
      };

      const result = await lambda.invoke(params).promise();

      expect(result.StatusCode).toBe(200);
      expect(result.Payload).toBeDefined();

      const payload = JSON.parse(result.Payload as string);
      expect(payload.statusCode).toBe(200);

      const body = JSON.parse(payload.body);
      expect(body.executionId).toBeDefined();
      expect(typeof body.itemsProcessed).toBe('number');
      expect(typeof body.itemsFailed).toBe('number');
      expect(typeof body.executionTime).toBe('number');
    }, 30000); // 30 second timeout for Lambda execution

    test('should verify Lambda function creates inventory data when none exists', async () => {
      const inventoryTableName = outputs.InventoryTableName;
      const jobExecutionTableName = outputs.JobExecutionTableName;

      // First, invoke the Lambda function
      const functionName = outputs.LambdaFunctionName;
      const invokeParams = {
        FunctionName: functionName,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify({
          testInvocation: true,
          source: 'integration-test'
        })
      };

      const lambdaResult = await lambda.invoke(invokeParams).promise();
      const payload = JSON.parse(lambdaResult.Payload as string);
      const body = JSON.parse(payload.body);

      // Verify inventory items were created
      const inventoryResult: any = await dynamodb.scan({
        TableName: inventoryTableName,
        Limit: 50
      }).promise();

      expect(inventoryResult.Items.length).toBeGreaterThan(0);

      // Check that items have the expected structure
      const item = inventoryResult.Items[0];
      expect(item.itemId).toBeDefined();
      expect(item.name).toBeDefined();
      expect(typeof item.stock).toBe('number');
      expect(item.lastUpdated).toBeDefined();
      expect(item.category).toBeDefined();

      // Verify job execution was tracked
      const jobResult: any = await dynamodb.scan({
        TableName: jobExecutionTableName,
        Limit: 10
      }).promise();

      expect(jobResult.Items.length).toBeGreaterThan(0);

      const jobExecution = jobResult.Items.find((job: any) => job.executionId === body.executionId);
      expect(jobExecution).toBeDefined();
      expect(jobExecution.status).toBe('COMPLETED');
      expect(typeof jobExecution.itemsProcessed).toBe('number');
      expect(typeof jobExecution.executionTime).toBe('number');
    }, 60000); // 60 second timeout

    test('should verify inventory items are updated on subsequent runs', async () => {
      const inventoryTableName = outputs.InventoryTableName;
      const functionName = outputs.LambdaFunctionName;

      // Get current inventory items
      const initialInventory: any = await dynamodb.scan({
        TableName: inventoryTableName,
        Limit: 5
      }).promise();

      expect(initialInventory.Items.length).toBeGreaterThan(0);

      const initialItem = initialInventory.Items[0];
      const initialStock = initialItem.stock;
      const initialLastUpdated = initialItem.lastUpdated;

      // Wait a moment to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Invoke Lambda function again
      const invokeParams = {
        FunctionName: functionName,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify({
          testInvocation: true,
          source: 'integration-test-update'
        })
      };

      const lambdaResult = await lambda.invoke(invokeParams).promise();
      const payload = JSON.parse(lambdaResult.Payload as string);
      expect(payload.statusCode).toBe(200);

      // Verify the item was updated
      const updatedItem: any = await dynamodb.get({
        TableName: inventoryTableName,
        Key: { itemId: initialItem.itemId }
      }).promise();

      expect(updatedItem.Item).toBeDefined();
      expect(updatedItem.Item.stock).toBeGreaterThan(initialStock);
      expect(updatedItem.Item.lastUpdated).toBeGreaterThan(initialLastUpdated);
      expect(updatedItem.Item.lastExecutionId).toBeDefined();
    }, 60000); // 60 second timeout

    test('should verify CloudWatch custom metrics are published', async () => {
      const namespace = outputs.MonitoringNamespace;

      // List metrics in the custom namespace
      const metricsResult: any = await cloudwatch.listMetrics({
        Namespace: namespace
      }).promise();

      expect(metricsResult.Metrics).toBeDefined();

      // Verify expected metric names exist
      const metricNames = metricsResult.Metrics.map((metric: any) => metric.MetricName);
      expect(metricNames).toContain('ItemsProcessed');
      expect(metricNames).toContain('ItemsFailed');
      expect(metricNames).toContain('ExecutionTime');
      expect(metricNames).toContain('SuccessRate');
    }, 30000);

    test('should verify SNS topic exists and is accessible', async () => {
      const topicArn = outputs.AlertTopicArn;

      const topicAttributes: any = await sns.getTopicAttributes({
        TopicArn: topicArn
      }).promise();

      expect(topicAttributes.Attributes).toBeDefined();
      expect(topicAttributes.Attributes.TopicArn).toBe(topicArn);
      expect(topicAttributes.Attributes.DisplayName).toBe('Inventory Scheduler Alerts');
    });

    test('should verify inventory table has Global Secondary Index', async () => {
      const tableName = outputs.InventoryTableName;

      const tableDescription: any = await new AWS.DynamoDB().describeTable({
        TableName: tableName
      }).promise();

      expect(tableDescription.Table.GlobalSecondaryIndexes).toBeDefined();
      expect(tableDescription.Table.GlobalSecondaryIndexes.length).toBeGreaterThan(0);

      const lastUpdatedIndex = tableDescription.Table.GlobalSecondaryIndexes.find(
        (index: any) => index.IndexName === 'LastUpdatedIndex'
      );
      expect(lastUpdatedIndex).toBeDefined();
      expect(lastUpdatedIndex.IndexStatus).toBe('ACTIVE');
    });

    test('should verify end-to-end data flow integrity', async () => {
      const inventoryTableName = outputs.InventoryTableName;
      const jobExecutionTableName = outputs.JobExecutionTableName;
      const functionName = outputs.LambdaFunctionName;

      // Get initial count of job executions
      const initialJobCount: any = await dynamodb.scan({
        TableName: jobExecutionTableName,
        Select: 'COUNT'
      }).promise();

      // Invoke Lambda function
      const invokeParams = {
        FunctionName: functionName,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify({
          testInvocation: true,
          source: 'e2e-test'
        })
      };

      const lambdaResult = await lambda.invoke(invokeParams).promise();
      const payload = JSON.parse(lambdaResult.Payload as string);
      const body = JSON.parse(payload.body);

      expect(payload.statusCode).toBe(200);
      expect(body.executionId).toBeDefined();
      expect(body.itemsProcessed).toBeGreaterThan(0);

      // Verify new job execution record was created
      const newJobCount = await dynamodb.scan({
        TableName: jobExecutionTableName,
        Select: 'COUNT'
      }).promise();

      expect(newJobCount.Count).toBe(initialJobCount.Count + 1);

      // Verify specific job execution record
      const jobExecution: any = await dynamodb.get({
        TableName: jobExecutionTableName,
        Key: { executionId: body.executionId }
      }).promise();

      expect(jobExecution.Item).toBeDefined();
      expect(jobExecution.Item.status).toBe('COMPLETED');
      expect(jobExecution.Item.itemsProcessed).toBe(body.itemsProcessed);
      expect(jobExecution.Item.ttl).toBeDefined();

      // Verify inventory items have the correct executionId
      const inventoryItems: any = await dynamodb.scan({
        TableName: inventoryTableName,
        FilterExpression: 'lastExecutionId = :execId',
        ExpressionAttributeValues: {
          ':execId': body.executionId
        },
        Limit: 20
      }).promise();

      expect(inventoryItems.Items.length).toBe(body.itemsProcessed);

      // Verify all items have required fields
      inventoryItems.Items.forEach((item: any) => {
        expect(item.itemId).toBeDefined();
        expect(item.name).toBeDefined();
        expect(typeof item.stock).toBe('number');
        expect(item.lastUpdated).toBeDefined();
        expect(item.lastExecutionId).toBe(body.executionId);
        expect(item.category).toBeDefined();
      });
    }, 90000); // 90 second timeout for comprehensive test
  });
});
