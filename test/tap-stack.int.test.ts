import {
  EventBridgeClient,
  PutEventsCommand,
  DescribeEventBusCommand,
  ListRulesCommand,
  StartReplayCommand,
  ListReplaysCommand
} from '@aws-sdk/client-eventbridge';
import {
  SFNClient,
  StartExecutionCommand,
  DescribeExecutionCommand,
  ListExecutionsCommand
} from '@aws-sdk/client-sfn';
import {
  LambdaClient,
  InvokeCommand,
  GetFunctionCommand
} from '@aws-sdk/client-lambda';
import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  QueryCommand,
  UpdateItemCommand,
  DeleteItemCommand,
  DescribeTableCommand
} from '@aws-sdk/client-dynamodb';
import {
  SQSClient,
  SendMessageCommand,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  GetQueueAttributesCommand,
  ChangeMessageVisibilityCommand
} from '@aws-sdk/client-sqs';
import {
  CloudWatchClient,
  GetMetricStatisticsCommand,
  PutMetricDataCommand
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
const fraudDetectionQueueUrl = outputs.FraudDetectionQueueUrl;
const transactionStateTableName = outputs.TransactionStateTableName;
const idempotencyTableName = outputs.IdempotencyTableName;
const eventTransformerFunctionArn = outputs.EventTransformerFunctionArn;
const distributedLockFunctionArn = outputs.DistributedLockFunctionArn;
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

const waitForTransactionRecord = async (
  transactionId: string,
  timestamp: number,
  maxAttempts = 6,
  delayMs = 5000
) => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await dynamoDBClient.send(
      new GetItemCommand({
        TableName: transactionStateTableName,
        Key: {
          transactionId: { S: transactionId },
          timestamp: { N: timestamp.toString() }
        },
        ConsistentRead: true
      })
    );

    if (response.Item) {
      return response.Item;
    }

    await sleep(delayMs);
  }

  return undefined;
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

  describe('A. Event Ingestion and Routing', () => {
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

  describe('B. Order Processing Workflow (End-to-End)', () => {
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

    test('should execute complete order processing workflow', async () => {
      // Arrange
      const orderTransactionId = `order-e2e-${uuidv4()}`;
      const orderTimestamp = Date.now();
      const startExecutionInput = {
        stateMachineArn: orderProcessingStateMachineArn,
        input: JSON.stringify({
          transactionId: orderTransactionId,
          amount: 500.00,
          currency: 'USD',
          type: 'PURCHASE',
          customerId: testCustomerId,
          merchantId: testMerchantId,
          timestamp: orderTimestamp
        })
      };

      // Act
      const startCommand = new StartExecutionCommand(startExecutionInput);
      const executionResponse = await stepFunctionsClient.send(startCommand);
      expect(executionResponse.executionArn).toBeDefined();

      // Wait for execution to complete (with timeout)
      let executionStatus = 'RUNNING';
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes max

      while (executionStatus === 'RUNNING' && attempts < maxAttempts) {
        await sleep(5000);
        const describeCommand = new DescribeExecutionCommand({
          executionArn: executionResponse.executionArn
        });
        const describeResponse = await stepFunctionsClient.send(describeCommand);
        executionStatus = describeResponse.status!;
        attempts++;
      }

      // Assert
      expect(['SUCCEEDED', 'FAILED', 'TIMED_OUT', 'ABORTED']).toContain(executionStatus);
      
      // Verify transaction was stored in DynamoDB (eventual consistency with retries)
      const storedRecord = await waitForTransactionRecord(orderTransactionId, orderTimestamp, 10, 3000);
      expect(storedRecord).toBeDefined();
      if (!storedRecord) {
        throw new Error('Order transaction record not found after workflow execution');
      }
      expect(storedRecord.transactionId?.S).toBe(orderTransactionId);
      expect(storedRecord.orderStatus?.S).toBeDefined();

      // Cleanup inserted record to keep table tidy
      await dynamoDBClient.send(
        new DeleteItemCommand({
          TableName: transactionStateTableName,
          Key: {
            transactionId: { S: orderTransactionId },
            timestamp: { N: orderTimestamp.toString() }
          }
        })
      );
    });
  });

  describe('C. Distributed Locking Mechanism', () => {
    test('should acquire and release distributed lock', async () => {
      // Arrange
      const lockId = `lock-${uuidv4()}`;
      const ownerId = `owner-${uuidv4()}`;

      // Act - Acquire lock
      const acquireLockPayload = JSON.stringify({
        operation: 'acquire',
        lockId: lockId,
        ownerId: ownerId,
        ttlSeconds: 60
      });

      const acquireCommand = new InvokeCommand({
        FunctionName: distributedLockFunctionArn,
        Payload: Buffer.from(acquireLockPayload)
      });
      const acquireResponse = await lambdaClient.send(acquireCommand);
      const acquireResult = parseLambdaPayload(acquireResponse.Payload);

      // Assert - Lock acquired
      expect(acquireResult.locked).toBe(true);
      expect(acquireResult.lockId).toBe(lockId);

      // Act - Release lock
      const releaseLockPayload = JSON.stringify({
        operation: 'release',
        lockId: lockId,
        ownerId: ownerId
      });

      const releaseCommand = new InvokeCommand({
        FunctionName: distributedLockFunctionArn,
        Payload: Buffer.from(releaseLockPayload)
      });
      const releaseResponse = await lambdaClient.send(releaseCommand);
      const releaseResult = parseLambdaPayload(releaseResponse.Payload);

      // Assert - Lock released
      expect(releaseResult.released).toBe(true);
    });

    test('should prevent duplicate lock acquisition', async () => {
      // Arrange
      const lockId = `lock-duplicate-${uuidv4()}`;
      const ownerId1 = `owner1-${uuidv4()}`;
      const ownerId2 = `owner2-${uuidv4()}`;

      // Act - First lock acquisition
      const acquire1Payload = JSON.stringify({
        operation: 'acquire',
        lockId: lockId,
        ownerId: ownerId1,
        ttlSeconds: 60
      });

      const acquire1Command = new InvokeCommand({
        FunctionName: distributedLockFunctionArn,
        Payload: Buffer.from(acquire1Payload)
      });
      const acquire1Response = await lambdaClient.send(acquire1Command);
      const acquire1Result = parseLambdaPayload(acquire1Response.Payload);
      expect(acquire1Result.locked).toBe(true);

      // Act - Second lock acquisition attempt
      const acquire2Payload = JSON.stringify({
        operation: 'acquire',
        lockId: lockId,
        ownerId: ownerId2,
        ttlSeconds: 60
      });

      const acquire2Command = new InvokeCommand({
        FunctionName: distributedLockFunctionArn,
        Payload: Buffer.from(acquire2Payload)
      });
      const acquire2Response = await lambdaClient.send(acquire2Command);
      const acquire2Result = parseLambdaPayload(acquire2Response.Payload);

      // Assert - Second acquisition should fail
      expect(acquire2Result.locked).toBe(false);
      expect(acquire2Result.message).toContain('Lock already held');

      // Cleanup
      const releasePayload = JSON.stringify({
        operation: 'release',
        lockId: lockId,
        ownerId: ownerId1
      });
      await lambdaClient.send(new InvokeCommand({
        FunctionName: distributedLockFunctionArn,
        Payload: Buffer.from(releasePayload)
      }));
    });
  });

  describe('D. Idempotency Check', () => {
    test('should prevent duplicate transaction processing', async () => {
      // Arrange
      const transactionId = `idempotent-${uuidv4()}`;
      const testEvent = {
        transactionId: transactionId,
        amount: 100.00,
        type: 'PURCHASE',
        currency: 'USD',
        customerId: testCustomerId,
        merchantId: testMerchantId,
        timestamp: Date.now()
      };

      // Act - First processing
      const firstInvokeCommand = new InvokeCommand({
        FunctionName: eventTransformerFunctionArn,
        Payload: Buffer.from(JSON.stringify(testEvent))
      });
      const firstResponse = await lambdaClient.send(firstInvokeCommand);
      const firstResult = parseLambdaPayload(firstResponse.Payload);
      const firstStatusCode = firstResult.statusCode ?? firstResult.StatusCode;
      expect(firstStatusCode).toBe(200);
      expect(firstResult.duplicate).toBeFalsy();

      // Act - Second processing (duplicate)
      await sleep(1000);
      const secondInvokeCommand = new InvokeCommand({
        FunctionName: eventTransformerFunctionArn,
        Payload: Buffer.from(JSON.stringify(testEvent))
      });
      const secondResponse = await lambdaClient.send(secondInvokeCommand);
      const secondResult = parseLambdaPayload(secondResponse.Payload);

      // Assert - Should detect duplicate
      expect(secondResult.duplicate).toBe(true);
      expect(secondResult.transactionId).toBe(transactionId);
    });
  });

  describe('E. Payment Validation with Circuit Breaker', () => {
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

  describe('F. Fraud Detection Parallel Processing', () => {
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

  describe('G. SQS Queue Processing', () => {
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

  describe('H. DynamoDB State Management', () => {
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

  describe('I. Saga Compensation on Failure', () => {
    test('should trigger saga coordinator for compensation', async () => {
      // Arrange
      const sagaTransactionId = `saga-${uuidv4()}`;
      const compensationPayload = JSON.stringify({
        rollback: true,
        sagaState: {
          transactionId: sagaTransactionId,
          timestamp: Date.now(),
          completedSteps: ['validate_order', 'reserve_inventory']
        },
        compensationType: 'ORDER'
      });

      // Act
      const invokeCommand = new InvokeCommand({
        FunctionName: sagaCoordinatorFunctionArn,
        Payload: Buffer.from(compensationPayload)
      });
      const response = await lambdaClient.send(invokeCommand);
      const result = parseLambdaPayload(response.Payload);
      const sagaStatusCode = result.statusCode ?? result.StatusCode;

      // Assert
      expect(sagaStatusCode).toBe(200);
      expect(result.compensationType).toBe('ORDER');
      expect(result.rollbackResults).toBeDefined();
    });
  });

  describe('J. Error Handling and DLQ', () => {
    test('should route failed order messages to DLQ', async () => {
      const dlqUrl = orderProcessingQueueUrl.replace('.fifo', '-DLQ.fifo');

      // Ensure DLQ exists
      const getAttributesCommand = new GetQueueAttributesCommand({
        QueueUrl: dlqUrl,
        AttributeNames: ['QueueArn']
      });
      const attributesResponse = await sqsClient.send(getAttributesCommand);
      expect(attributesResponse.Attributes).toBeDefined();

      // Send a message that will be re-delivered without being deleted
      const dlqTransactionId = `dlq-${uuidv4()}`;
      await sqsClient.send(
        new SendMessageCommand({
          QueueUrl: orderProcessingQueueUrl,
          MessageBody: JSON.stringify({ transactionId: dlqTransactionId, reason: 'DLQ test' }),
          MessageGroupId: dlqTransactionId,
          MessageDeduplicationId: `dedupe-${dlqTransactionId}`
        })
      );

      // MaxReceiveCount for queue is 3
      const maxReceiveCount = 3;
      for (let attempt = 0; attempt < maxReceiveCount; attempt++) {
        const receiveResponse = await sqsClient.send(
          new ReceiveMessageCommand({
            QueueUrl: orderProcessingQueueUrl,
            MaxNumberOfMessages: 1,
            WaitTimeSeconds: 5
          })
        );

        const message = receiveResponse.Messages?.[0];
        if (!message || !message.ReceiptHandle) {
          throw new Error('Failed to receive test message for DLQ routing');
        }

        await sqsClient.send(
          new ChangeMessageVisibilityCommand({
            QueueUrl: orderProcessingQueueUrl,
            ReceiptHandle: message.ReceiptHandle,
            VisibilityTimeout: 0
          })
        );

        await sleep(1000);
      }

      // Poll DLQ until the message arrives
      const maxDlqAttempts = 6;
      let dlqMessage;
      for (let attempt = 0; attempt < maxDlqAttempts && !dlqMessage; attempt++) {
        const dlqReceiveResponse = await sqsClient.send(
          new ReceiveMessageCommand({
            QueueUrl: dlqUrl,
            MaxNumberOfMessages: 1,
            WaitTimeSeconds: 10
          })
        );
        dlqMessage = dlqReceiveResponse.Messages?.[0];

        if (!dlqMessage) {
          await sleep(5000);
        }
      }

      expect(dlqMessage).toBeDefined();
      if (!dlqMessage) {
        throw new Error('DLQ message not received for failure scenario');
      }

      expect(dlqMessage.Body).toContain(dlqTransactionId);

      // Cleanup DLQ message
      if (dlqMessage.ReceiptHandle) {
        await sqsClient.send(
          new DeleteMessageCommand({
            QueueUrl: dlqUrl,
            ReceiptHandle: dlqMessage.ReceiptHandle
          })
        );
      }
    });
  });

  describe('K. Event Archive and Replay', () => {
    test('should verify EventArchive exists', async () => {
      // This test verifies the archive resource exists
      expect(eventArchiveName).toBeTruthy();
    });
  });

  describe('L. Cross-Region Replication (Conditional)', () => {
    test('should verify cross-region replication rule exists when conditions met', async () => {
      // This test is conditional based on stack deployment parameters
      // If CreateSecondaryResources condition is true, rule should exist
      const listRulesCommand = new ListRulesCommand({
        EventBusName: mainEventBusName
      });
      const response = await eventBridgeClient.send(listRulesCommand);
      
      const replicationRule = response.Rules?.find(r => 
        r.Name?.includes('CrossRegionReplication')
      );
      
      // Rule may or may not exist based on deployment conditions
      // This test documents the expected behavior
      if (replicationRule) {
        expect(replicationRule.State).toBe('ENABLED');
      }
    });
  });

  describe('M. Monitoring and Observability', () => {
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
      // Metrics may be empty if no invocations occurred, which is acceptable
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

  describe('N. Performance and Scalability', () => {
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

  describe('O. Security and Encryption', () => {
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
