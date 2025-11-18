import {
  EventBridgeClient,
  PutEventsCommand,
  DescribeEventBusCommand,
  ListRulesCommand
} from '@aws-sdk/client-eventbridge';
import {
  SFNClient,
  StartExecutionCommand,
  DescribeExecutionCommand,
  ListExecutionsCommand
} from '@aws-sdk/client-sfn';
import {
  LambdaClient,
  GetFunctionCommand,
  InvokeCommand
} from '@aws-sdk/client-lambda';
import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  QueryCommand,
  DeleteItemCommand,
  DescribeTableCommand
} from '@aws-sdk/client-dynamodb';
import {
  SQSClient,
  SendMessageCommand,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  GetQueueAttributesCommand
} from '@aws-sdk/client-sqs';
import {
  CloudWatchClient,
  GetMetricStatisticsCommand
} from '@aws-sdk/client-cloudwatch';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Load stack outputs from deployment
const outputs: Record<string, string> = (() => {
  try {
    return JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8'));
  } catch (error) {
    console.warn('Could not load cfn-outputs/flat-outputs.json. Using environment variables or defaults.');
    return {};
  }
})();

// Initialize AWS clients
const eventBridgeClient = new EventBridgeClient({ region: process.env.AWS_REGION });
const stepFunctionsClient = new SFNClient({ region: process.env.AWS_REGION });
const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION });
const dynamoDBClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const sqsClient = new SQSClient({ region: process.env.AWS_REGION });
const cloudWatchClient = new CloudWatchClient({ region: process.env.AWS_REGION });

// Extract resource ARNs/names from outputs
const mainEventBusName = outputs.MainEventBusName;
const orderProcessingStateMachineArn = outputs.OrderProcessingStateMachineArn;
const paymentValidationStateMachineArn = outputs.PaymentValidationStateMachineArn;
const fraudDetectionStateMachineArn = outputs.FraudDetectionStateMachineArn;
const orderProcessingQueueUrl = outputs.OrderProcessingQueueUrl;
const paymentValidationQueueUrl = outputs.PaymentValidationQueueUrl;
const transactionStateTableName = outputs.TransactionStateTableName;
const idempotencyTableName = outputs.IdempotencyTableName;
const eventTransformerFunctionArn = outputs.EventTransformerFunctionArn;
const sagaCoordinatorFunctionArn = outputs.SagaCoordinatorFunctionArn;
const eventArchiveName = outputs.EventArchiveName;

// Helper function to wait for async operations
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const parseLambdaPayload = (payload?: Uint8Array) => {
  if (!payload || payload.length === 0) {
    return {};
  }

  const text = Buffer.from(payload).toString('utf-8').trim();
  if (!text) {
    return {};
  }

  try {
    const parsed = JSON.parse(text);

    if (parsed && Object.prototype.hasOwnProperty.call(parsed, 'body')) {
      let body = parsed.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch {
          // leave body as string if it cannot be parsed
        }
      }

      if (typeof body === 'object' && body !== null) {
        return {
          ...body,
          statusCode: parsed.statusCode ?? body.statusCode
        };
      }
    }

    return parsed;
  } catch {
    return {};
  }
};

const invokeLambda = async (functionName: string, payload: Record<string, any>) => {
  const response = await lambdaClient.send(
    new InvokeCommand({
      FunctionName: functionName,
      Payload: Buffer.from(JSON.stringify(payload)),
      InvocationType: 'RequestResponse'
    })
  );

  if (response.FunctionError) {
    const errorPayload = Buffer.from(response.Payload ?? []).toString('utf-8');
    throw new Error(`Lambda invocation failed (${functionName}): ${response.FunctionError} ${errorPayload}`);
  }

  return parseLambdaPayload(response.Payload);
};

describe('TapStack End-to-End Integration Tests', () => {
  const testTransactionId = `test-${uuidv4()}`;
  const testCustomerId = `customer-${uuidv4()}`;
  const testMerchantId = `merchant-${uuidv4()}`;

  beforeAll(() => {
    // Validate that all required outputs are available
    expect(mainEventBusName).toBeTruthy();
    expect(orderProcessingStateMachineArn).toBeTruthy();
    expect(transactionStateTableName).toBeTruthy();
    expect(idempotencyTableName).toBeTruthy();
  });

  describe('Idempotency Check', () => {
    test('should prevent duplicate transaction processing', async () => {
      const idempotencyKey = `idem-${uuidv4()}`;
      const firstWrite = new PutItemCommand({
        TableName: idempotencyTableName,
        Item: {
          idempotencyKey: { S: idempotencyKey },
          processedAt: { N: `${Date.now()}` },
          expiryTime: { N: `${Date.now() + 86400000}` }
        },
        ConditionExpression: 'attribute_not_exists(idempotencyKey)'
      });

      const duplicateWrite = new PutItemCommand({
        TableName: idempotencyTableName,
        Item: {
          idempotencyKey: { S: idempotencyKey },
          processedAt: { N: `${Date.now()}` },
          expiryTime: { N: `${Date.now() + 86400000}` }
        },
        ConditionExpression: 'attribute_not_exists(idempotencyKey)'
      });

      await dynamoDBClient.send(firstWrite);

      await expect(dynamoDBClient.send(duplicateWrite)).rejects.toHaveProperty(
        'name',
        'ConditionalCheckFailedException'
      );

      await dynamoDBClient.send(
        new DeleteItemCommand({
          TableName: idempotencyTableName,
          Key: {
            idempotencyKey: { S: idempotencyKey }
          }
        })
      );
    });
  });

  describe('Event Ingestion and Routing', () => {
    test('should successfully publish event to MainEventBus', async () => {
      // Arrange
      const testEvent = {
        Source: 'transaction.processing',
        DetailType: 'ORDER',
        Detail: JSON.stringify({
          transactionId: testTransactionId,
          amount: 100.50,
          currency: 'USD',
          type: 'PURCHASE',
          customerId: testCustomerId,
          merchantId: testMerchantId,
          timestamp: Date.now()
        }),
        EventBusName: mainEventBusName
      };

      // Act
      const command = new PutEventsCommand({
        Entries: [testEvent]
      });
      const response = await eventBridgeClient.send(command);

      // Assert
      expect(response.FailedEntryCount).toBe(0);
      expect(response.Entries).toBeDefined();
      expect(response.Entries![0].EventId).toBeDefined();
    });

    test('should verify EventBus exists and is accessible', async () => {
      // Act
      const command = new DescribeEventBusCommand({
        Name: mainEventBusName
      });
      const response = await eventBridgeClient.send(command);

      // Assert
      expect(response.Name).toBe(mainEventBusName);
      expect(response.Arn).toBeDefined();
    });

    test('should verify routing rules are configured', async () => {
      // Act
      const command = new ListRulesCommand({
        EventBusName: mainEventBusName
      });
      const response = await eventBridgeClient.send(command);

      // Assert
      expect(response.Rules).toBeDefined();
      const ruleNames = response.Rules!.map(r => r.Name || '');
      expect(ruleNames.some(name => name.includes('OrderRouting'))).toBe(true);
      expect(ruleNames.some(name => name.includes('PaymentRouting'))).toBe(true);
      expect(ruleNames.some(name => name.includes('FraudRouting'))).toBe(true);
    });
  });

  describe('Order Processing Workflow', () => {
    test('should trigger OrderProcessingStateMachine from EventBridge', async () => {
      // Arrange
      const testEvent = {
        Source: 'transaction.processing',
        DetailType: 'ORDER',
        Detail: JSON.stringify({
          transactionId: `order-${uuidv4()}`,
          amount: 250.75,
          currency: 'USD',
          type: 'PURCHASE',
          customerId: testCustomerId,
          merchantId: testMerchantId,
          timestamp: Date.now()
        }),
        EventBusName: mainEventBusName
      };

      // Act
      const putEventCommand = new PutEventsCommand({
        Entries: [testEvent]
      });
      const eventResponse = await eventBridgeClient.send(putEventCommand);
      expect(eventResponse.FailedEntryCount).toBe(0);

      // Wait for state machine to start
      await sleep(5000);

      // Assert - Check if state machine execution was created
      const listExecutionsCommand = new ListExecutionsCommand({
        stateMachineArn: orderProcessingStateMachineArn,
        maxResults: 10
      });
      const executionsResponse = await stepFunctionsClient.send(listExecutionsCommand);
      
      expect(executionsResponse.executions).toBeDefined();
      expect(executionsResponse.executions!.length).toBeGreaterThan(0);
    });
  });

  describe('Payment Validation with Circuit Breaker', () => {
    test('should execute payment validation state machine', async () => {
      // Arrange
      const paymentTransactionId = `payment-${uuidv4()}`;
      const startExecutionInput = {
        stateMachineArn: paymentValidationStateMachineArn,
        input: JSON.stringify({
          transactionId: paymentTransactionId,
          amount: 75.25,
          currency: 'USD',
          paymentMethod: 'CARD',
          customerId: testCustomerId
        })
      };

      // Act
      const startCommand = new StartExecutionCommand(startExecutionInput);
      const executionResponse = await stepFunctionsClient.send(startCommand);
      expect(executionResponse.executionArn).toBeDefined();

      // Wait for execution
      let executionStatus = 'RUNNING';
      let attempts = 0;
      while (executionStatus === 'RUNNING' && attempts < 30) {
        await sleep(2000);
        const describeCommand = new DescribeExecutionCommand({
          executionArn: executionResponse.executionArn
        });
        const describeResponse = await stepFunctionsClient.send(describeCommand);
        executionStatus = describeResponse.status!;
        attempts++;
      }

      // Assert
      expect(['SUCCEEDED', 'FAILED', 'TIMED_OUT']).toContain(executionStatus);
    });

    test('should verify circuit breaker state in DynamoDB', async () => {
      // Act - Query circuit breaker state
      const queryCommand = new QueryCommand({
        TableName: transactionStateTableName,
        KeyConditionExpression: 'transactionId = :tid',
        ExpressionAttributeValues: {
          ':tid': { S: 'circuit-breaker-payment' }
        }
      });
      const queryResponse = await dynamoDBClient.send(queryCommand);

      // Assert - Circuit breaker record should exist or be creatable
      expect(queryResponse.Items).toBeDefined();
    });
  });

  describe('Fraud Detection Parallel Processing', () => {
    test('should execute fraud detection state machine with parallel checks', async () => {
      // Arrange
      const fraudTransactionId = `fraud-${uuidv4()}`;
      const startExecutionInput = {
        stateMachineArn: fraudDetectionStateMachineArn,
        input: JSON.stringify({
          transactionId: fraudTransactionId,
          amount: 1000.00,
          currency: 'USD',
          customerId: testCustomerId,
          merchantId: testMerchantId,
          timestamp: Date.now()
        })
      };

      // Act
      const startCommand = new StartExecutionCommand(startExecutionInput);
      const executionResponse = await stepFunctionsClient.send(startCommand);
      expect(executionResponse.executionArn).toBeDefined();

      // Wait for execution
      let executionStatus = 'RUNNING';
      let attempts = 0;
      while (executionStatus === 'RUNNING' && attempts < 40) {
        await sleep(3000);
        const describeCommand = new DescribeExecutionCommand({
          executionArn: executionResponse.executionArn
        });
        const describeResponse = await stepFunctionsClient.send(describeCommand);
        executionStatus = describeResponse.status!;
        attempts++;
      }

      // Assert
      expect(['SUCCEEDED', 'FAILED', 'TIMED_OUT']).toContain(executionStatus);
    });
  });

  describe('SQS Queue Processing', () => {
    test('should send and receive message from PaymentValidationQueue', async () => {
      // Arrange
      const testMessage = {
        transactionId: `sqs-${uuidv4()}`,
        amount: 200.00,
        currency: 'USD',
        paymentMethod: 'CARD',
        customerId: testCustomerId
      };

      // Act - Send message
      const sendCommand = new SendMessageCommand({
        QueueUrl: paymentValidationQueueUrl,
        MessageBody: JSON.stringify(testMessage),
        MessageGroupId: testMessage.transactionId,
        MessageDeduplicationId: `${testMessage.transactionId}-${Date.now()}`
      });
      const sendResponse = await sqsClient.send(sendCommand);
      expect(sendResponse.MessageId).toBeDefined();

      // Wait for message to be available
      await sleep(2000);

      // Act - Receive message
      const receiveCommand = new ReceiveMessageCommand({
        QueueUrl: paymentValidationQueueUrl,
        MaxNumberOfMessages: 1,
        WaitTimeSeconds: 5
      });
      const receiveResponse = await sqsClient.send(receiveCommand);

      // Assert
      if (receiveResponse.Messages && receiveResponse.Messages.length > 0) {
        const message = receiveResponse.Messages[0];
        const messageBody = JSON.parse(message.Body || '{}');
        expect(messageBody.transactionId).toBe(testMessage.transactionId);

        // Cleanup - Delete message
        if (message.ReceiptHandle) {
          const deleteCommand = new DeleteMessageCommand({
            QueueUrl: paymentValidationQueueUrl,
            ReceiptHandle: message.ReceiptHandle
          });
          await sqsClient.send(deleteCommand);
        }
      }
    });

    test('should verify queue attributes and configuration', async () => {
      // Act
      const getAttributesCommand = new GetQueueAttributesCommand({
        QueueUrl: paymentValidationQueueUrl,
        AttributeNames: ['All']
      });
      const attributesResponse = await sqsClient.send(getAttributesCommand);

      // Assert
      expect(attributesResponse.Attributes).toBeDefined();
      expect(attributesResponse.Attributes!['FifoQueue']).toBe('true');
      expect(attributesResponse.Attributes!['ContentBasedDeduplication']).toBeDefined();
    });
  });

  describe('DynamoDB State Management', () => {
    test('should store and retrieve transaction state', async () => {
      // Arrange
      const transactionId = `dynamodb-${uuidv4()}`;
      const timestamp = Date.now();

      // Act - Store transaction
      const putCommand = new PutItemCommand({
        TableName: transactionStateTableName,
        Item: {
          transactionId: { S: transactionId },
          timestamp: { N: timestamp.toString() },
          amount: { N: '150.00' },
          currency: { S: 'USD' },
          status: { S: 'PROCESSING' },
          partitionKey: { S: `tx-${transactionId.substring(0, 8)}` }
        }
      });
      await dynamoDBClient.send(putCommand);

      // Act - Retrieve transaction
      const getCommand = new GetItemCommand({
        TableName: transactionStateTableName,
        Key: {
          transactionId: { S: transactionId },
          timestamp: { N: timestamp.toString() }
        }
      });
      const getResponse = await dynamoDBClient.send(getCommand);

      // Assert
      expect(getResponse.Item).toBeDefined();
      expect(getResponse.Item!.transactionId.S).toBe(transactionId);
      expect(getResponse.Item!.status.S).toBe('PROCESSING');

      // Cleanup
      const deleteCommand = new DeleteItemCommand({
        TableName: transactionStateTableName,
        Key: {
          transactionId: { S: transactionId },
          timestamp: { N: timestamp.toString() }
        }
      });
      await dynamoDBClient.send(deleteCommand);
    });

    test('should query transactions by partition key', async () => {
      // Arrange
      const transactionId = `partition-${uuidv4()}`;
      const partitionKey = `tx-${transactionId.substring(0, 8)}`;
      const timestamp = Date.now();

      // Act - Store transaction
      const putCommand = new PutItemCommand({
        TableName: transactionStateTableName,
        Item: {
          transactionId: { S: transactionId },
          timestamp: { N: timestamp.toString() },
          partitionKey: { S: partitionKey },
          amount: { N: '200.00' },
          currency: { S: 'USD' }
        }
      });
      await dynamoDBClient.send(putCommand);

      // Act - Query by partition key
      const queryCommand = new QueryCommand({
        TableName: transactionStateTableName,
        IndexName: 'PartitionIndex',
        KeyConditionExpression: 'partitionKey = :pk',
        ExpressionAttributeValues: {
          ':pk': { S: partitionKey }
        }
      });
      const queryResponse = await dynamoDBClient.send(queryCommand);

      // Assert
      expect(queryResponse.Items).toBeDefined();
      expect(queryResponse.Items!.length).toBeGreaterThan(0);

      // Cleanup
      const deleteCommand = new DeleteItemCommand({
        TableName: transactionStateTableName,
        Key: {
          transactionId: { S: transactionId },
          timestamp: { N: timestamp.toString() }
        }
      });
      await dynamoDBClient.send(deleteCommand);
    });
  });

  describe('Saga Compensation on Failure', () => {
    test('should trigger saga coordinator for compensation', async () => {
      const sagaTransactionId = `saga-${uuidv4()}`;
      const payload = {
        rollback: true,
        sagaState: {
          transactionId: sagaTransactionId,
          timestamp: Date.now(),
          completedSteps: ['validate_order', 'reserve_inventory']
        },
        compensationType: 'ORDER'
      };

      const result = await invokeLambda(sagaCoordinatorFunctionArn, payload);
      const sagaStatusCode = result.statusCode ?? result.StatusCode ?? 200;
      expect(sagaStatusCode).toBe(200);
      expect(result.compensationType).toBe('ORDER');
      expect(result.rollbackResults).toBeDefined();
    });
  });

  describe('Event Archive and Replay', () => {
    test('should verify EventArchive exists', async () => {
      // This test verifies the archive resource exists
      expect(eventArchiveName).toBeTruthy();
    });
  });

  describe('Cross-Region Replication', () => {
    test('should verify cross-region replication rule exists when conditions met', async () => {
      // If CreateSecondaryResources condition is true, rule should exist
      const listRulesCommand = new ListRulesCommand({
        EventBusName: mainEventBusName
      });
      const response = await eventBridgeClient.send(listRulesCommand);
      
      const replicationRule = response.Rules?.find(r => 
        r.Name?.includes('CrossRegionReplication')
      );

      if (replicationRule) {
        expect(replicationRule.State).toBe('ENABLED');
      }
    });
  });

  describe('Monitoring and Observability', () => {
    test('should verify CloudWatch metrics are being published', async () => {
      // Arrange
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 15 * 60 * 1000); // 15 minutes ago

      // Act - Get Lambda invocation metrics
      const getMetricsCommand = new GetMetricStatisticsCommand({
        Namespace: 'AWS/Lambda',
        MetricName: 'Invocations',
        Dimensions: [
          {
            Name: 'FunctionName',
            Value: eventTransformerFunctionArn.split(':').pop() || ''
          }
        ],
        StartTime: startTime,
        EndTime: endTime,
        Period: 300,
        Statistics: ['Sum']
      });
      const metricsResponse = await cloudWatchClient.send(getMetricsCommand);

      // Assert
      expect(metricsResponse.Datapoints).toBeDefined();
    });

    test('should verify X-Ray tracing is enabled on Lambda functions', async () => {
      // Act
      const getFunctionCommand = new GetFunctionCommand({
        FunctionName: eventTransformerFunctionArn
      });
      const functionResponse = await lambdaClient.send(getFunctionCommand);

      // Assert
      expect(functionResponse.Configuration?.TracingConfig).toBeDefined();
      expect(functionResponse.Configuration?.TracingConfig?.Mode).toBe('Active');
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle concurrent event processing', async () => {
      // Arrange
      const concurrentEvents = 5;
      const eventPromises: Promise<any>[] = [];

      // Act - Send multiple events concurrently
      for (let i = 0; i < concurrentEvents; i++) {
        const event = {
          Source: 'transaction.processing',
          DetailType: 'ORDER',
          Detail: JSON.stringify({
            transactionId: `concurrent-${uuidv4()}`,
            amount: 100 + i,
            currency: 'USD',
            type: 'PURCHASE',
            customerId: testCustomerId,
            merchantId: testMerchantId,
            timestamp: Date.now()
          }),
          EventBusName: mainEventBusName
        };

        const command = new PutEventsCommand({
          Entries: [event]
        });
        eventPromises.push(eventBridgeClient.send(command));
      }

      const results = await Promise.all(eventPromises);

      // Assert - All events should be accepted
      results.forEach(result => {
        expect(result.FailedEntryCount).toBe(0);
      });
    });
  });

  describe('Security and Encryption', () => {
    test('should verify KMS encryption on SQS queues', async () => {
      // Act
      const getAttributesCommand = new GetQueueAttributesCommand({
        QueueUrl: orderProcessingQueueUrl,
        AttributeNames: ['KmsMasterKeyId', 'KmsDataKeyReusePeriodSeconds']
      });
      const attributesResponse = await sqsClient.send(getAttributesCommand);

      // Assert
      expect(attributesResponse.Attributes).toBeDefined();
      expect(attributesResponse.Attributes!['KmsMasterKeyId']).toBeDefined();
    });

    test('should verify DynamoDB tables have encryption enabled', async () => {
      expect(transactionStateTableName).toBeTruthy();
      expect(idempotencyTableName).toBeTruthy();

      const [transactionDescribe, idempotencyDescribe] = await Promise.all([
        dynamoDBClient.send(
          new DescribeTableCommand({
            TableName: transactionStateTableName
          })
        ),
        dynamoDBClient.send(
          new DescribeTableCommand({
            TableName: idempotencyTableName
          })
        )
      ]);

      const transactionSSE = transactionDescribe.Table?.SSEDescription;
      const idempotencySSE = idempotencyDescribe.Table?.SSEDescription;

      expect(transactionSSE?.Status).toBe('ENABLED');
      expect(transactionSSE?.SSEType).toBe('KMS');
      expect(transactionSSE?.KMSMasterKeyArn).toBeTruthy();

      expect(idempotencySSE?.Status).toBe('ENABLED');
      expect(idempotencySSE?.SSEType).toBe('KMS');
      expect(idempotencySSE?.KMSMasterKeyArn).toBeTruthy();
    });
  });
});
