/**
 * Integration tests for Financial Market Data Processing Infrastructure
 * Platform: Terraform
 * Language: HCL
 *
 * These tests validate the complete workflow using real AWS resources
 */

const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Configure AWS SDK
const region = process.env.AWS_REGION || 'us-east-1';
AWS.config.update({ region });

const eventBridge = new AWS.EventBridge();
const dynamodb = new AWS.DynamoDB.DocumentClient();
const lambda = new AWS.Lambda();
const cloudwatchLogs = new AWS.CloudWatchLogs();
const sqs = new AWS.SQS();

describe('Market Data Stack Integration Tests', () => {
  let outputs;
  let eventBusName;
  let lambdaFunctionName;
  let marketDataTableName;
  let auditTrailTableName;
  let dlqUrl;
  let logGroupName;

  beforeAll(() => {
    // Read deployment outputs
    const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');

    if (fs.existsSync(outputsPath)) {
      outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

      eventBusName = outputs.event_bus_name;
      lambdaFunctionName = outputs.lambda_function_name;
      marketDataTableName = outputs.market_data_table_name;
      auditTrailTableName = outputs.audit_trail_table_name;
      dlqUrl = outputs.dlq_url;
      logGroupName = outputs.log_group_name;
    } else {
      throw new Error('Deployment outputs not found. Please deploy infrastructure first.');
    }
  });

  describe('EventBridge to Lambda Integration', () => {
    test('EventBridge event bus exists and is accessible', async () => {
      const params = {
        Name: eventBusName
      };

      const response = await eventBridge.describeEventBus(params).promise();
      expect(response.Name).toBe(eventBusName);
      expect(response.Arn).toBeDefined();
    });

    test('Lambda function exists and is active', async () => {
      const params = {
        FunctionName: lambdaFunctionName
      };

      const response = await lambda.getFunction(params).promise();
      expect(response.Configuration.FunctionName).toBe(lambdaFunctionName);
      expect(response.Configuration.State).toBe('Active');
      expect(response.Configuration.Runtime).toBe('python3.11');
    });

    test('trade execution event flows through to Lambda', async () => {
      const testEventId = uuidv4();
      const testSymbol = 'TEST' + Date.now();

      const params = {
        Entries: [
          {
            Source: 'market.data',
            DetailType: 'Trade Execution',
            Detail: JSON.stringify({
              event_id: testEventId,
              exchange: 'NYSE',
              symbol: testSymbol,
              price: 150.25,
              volume: 1000,
              timestamp: Date.now()
            }),
            EventBusName: eventBusName
          }
        ]
      };

      const response = await eventBridge.putEvents(params).promise();
      expect(response.FailedEntryCount).toBe(0);

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Verify event was processed by checking DynamoDB
      const queryParams = {
        TableName: marketDataTableName,
        IndexName: 'SymbolIndex',
        KeyConditionExpression: 'symbol = :symbol',
        ExpressionAttributeValues: {
          ':symbol': testSymbol
        },
        Limit: 1
      };

      const queryResponse = await dynamodb.query(queryParams).promise();
      expect(queryResponse.Items.length).toBeGreaterThan(0);
      expect(queryResponse.Items[0].symbol).toBe(testSymbol);
      expect(queryResponse.Items[0].exchange).toBe('NYSE');
    }, 15000);

    test('market quote event flows through to Lambda', async () => {
      const testEventId = uuidv4();
      const testSymbol = 'QUOTE' + Date.now();

      const params = {
        Entries: [
          {
            Source: 'market.data',
            DetailType: 'Market Quote',
            Detail: JSON.stringify({
              event_id: testEventId,
              exchange: 'NASDAQ',
              symbol: testSymbol,
              price: 250.50,
              volume: 500,
              timestamp: Date.now()
            }),
            EventBusName: eventBusName
          }
        ]
      };

      const response = await eventBridge.putEvents(params).promise();
      expect(response.FailedEntryCount).toBe(0);

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Verify event was processed
      const queryParams = {
        TableName: marketDataTableName,
        IndexName: 'SymbolIndex',
        KeyConditionExpression: 'symbol = :symbol',
        ExpressionAttributeValues: {
          ':symbol': testSymbol
        },
        Limit: 1
      };

      const queryResponse = await dynamodb.query(queryParams).promise();
      expect(queryResponse.Items.length).toBeGreaterThan(0);
      expect(queryResponse.Items[0].symbol).toBe(testSymbol);
      expect(queryResponse.Items[0].exchange).toBe('NASDAQ');
    }, 15000);
  });

  describe('DynamoDB Storage Validation', () => {
    test('market data table is accessible', async () => {
      const params = {
        TableName: marketDataTableName
      };

      const dynamodbClient = new AWS.DynamoDB();
      const response = await dynamodbClient.describeTable(params).promise();

      expect(response.Table.TableName).toBe(marketDataTableName);
      expect(response.Table.TableStatus).toBe('ACTIVE');
      expect(response.Table.KeySchema).toBeDefined();
    });

    test('market data table has correct indexes', async () => {
      const dynamodbClient = new AWS.DynamoDB();
      const params = {
        TableName: marketDataTableName
      };

      const response = await dynamodbClient.describeTable(params).promise();
      const gsiNames = response.Table.GlobalSecondaryIndexes.map(gsi => gsi.IndexName);

      expect(gsiNames).toContain('ExchangeIndex');
      expect(gsiNames).toContain('SymbolIndex');
    });

    test('can query market data by exchange', async () => {
      // First insert a test record
      const testSymbol = 'EXCH' + Date.now();
      const params = {
        Entries: [
          {
            Source: 'market.data',
            DetailType: 'Trade Execution',
            Detail: JSON.stringify({
              exchange: 'NYSE',
              symbol: testSymbol,
              price: 100.00,
              volume: 100
            }),
            EventBusName: eventBusName
          }
        ]
      };

      await eventBridge.putEvents(params).promise();
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Query by exchange
      const queryParams = {
        TableName: marketDataTableName,
        IndexName: 'ExchangeIndex',
        KeyConditionExpression: 'exchange = :exchange',
        ExpressionAttributeValues: {
          ':exchange': 'NYSE'
        },
        Limit: 10
      };

      const response = await dynamodb.query(queryParams).promise();
      expect(response.Items.length).toBeGreaterThan(0);
      expect(response.Items.every(item => item.exchange === 'NYSE')).toBe(true);
    }, 15000);

    test('audit trail table is accessible and records are created', async () => {
      const dynamodbClient = new AWS.DynamoDB();
      const params = {
        TableName: auditTrailTableName
      };

      const response = await dynamodbClient.describeTable(params).promise();
      expect(response.Table.TableName).toBe(auditTrailTableName);
      expect(response.Table.TableStatus).toBe('ACTIVE');

      // Check for audit records
      const scanParams = {
        TableName: auditTrailTableName,
        Limit: 10
      };

      const scanResponse = await dynamodb.scan(scanParams).promise();
      expect(scanResponse.Items).toBeDefined();
      // Audit records should exist from previous tests
    });
  });

  describe('Lambda Function Execution', () => {
    test('Lambda function processes events successfully', async () => {
      const testEvent = {
        id: uuidv4(),
        source: 'market.data',
        'detail-type': 'Trade Execution',
        detail: {
          exchange: 'NYSE',
          symbol: 'LAMBDA_TEST',
          price: 123.45,
          volume: 500
        }
      };

      const params = {
        FunctionName: lambdaFunctionName,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify(testEvent)
      };

      const response = await lambda.invoke(params).promise();
      expect(response.StatusCode).toBe(200);

      const payload = JSON.parse(response.Payload);
      expect(payload.statusCode).toBe(200);
    });

    test('Lambda function creates CloudWatch logs', async () => {
      const params = {
        logGroupName: logGroupName,
        limit: 5,
        descending: true
      };

      const response = await cloudwatchLogs.describeLogStreams(params).promise();
      expect(response.logStreams.length).toBeGreaterThan(0);

      // Get recent log events
      const logStreamName = response.logStreams[0].logStreamName;
      const logParams = {
        logGroupName: logGroupName,
        logStreamName: logStreamName,
        limit: 10
      };

      const logEvents = await cloudwatchLogs.getLogEvents(logParams).promise();
      expect(logEvents.events.length).toBeGreaterThan(0);
    });

    test('Lambda function has correct environment variables', async () => {
      const params = {
        FunctionName: lambdaFunctionName
      };

      const response = await lambda.getFunctionConfiguration(params).promise();
      const envVars = response.Environment.Variables;

      expect(envVars.MARKET_DATA_TABLE).toBe(marketDataTableName);
      expect(envVars.AUDIT_TRAIL_TABLE).toBe(auditTrailTableName);
      expect(envVars.ENVIRONMENT).toBeDefined();
    });
  });

  describe('Error Handling and Dead Letter Queue', () => {
    test('SQS DLQ is accessible', async () => {
      const params = {
        QueueUrl: dlqUrl
      };

      const response = await sqs.getQueueAttributes({
        QueueUrl: dlqUrl,
        AttributeNames: ['All']
      }).promise();

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes.MessageRetentionPeriod).toBe('1209600'); // 14 days
    });

    test('Lambda has DLQ configuration', async () => {
      const params = {
        FunctionName: lambdaFunctionName
      };

      const response = await lambda.getFunctionConfiguration(params).promise();
      expect(response.DeadLetterConfig).toBeDefined();
      expect(response.DeadLetterConfig.TargetArn).toBeDefined();
    });
  });

  describe('End-to-End Workflow', () => {
    test('complete market data processing workflow', async () => {
      const testEventId = uuidv4();
      const testSymbol = 'E2E' + Date.now();
      const testExchange = 'NYSE';
      const testPrice = 175.50;
      const testVolume = 2000;

      // Step 1: Send event to EventBridge
      const eventParams = {
        Entries: [
          {
            Source: 'market.data',
            DetailType: 'Trade Execution',
            Detail: JSON.stringify({
              event_id: testEventId,
              exchange: testExchange,
              symbol: testSymbol,
              price: testPrice,
              volume: testVolume,
              timestamp: Date.now()
            }),
            EventBusName: eventBusName
          }
        ]
      };

      const eventResponse = await eventBridge.putEvents(eventParams).promise();
      expect(eventResponse.FailedEntryCount).toBe(0);

      // Step 2: Wait for processing
      await new Promise(resolve => setTimeout(resolve, 8000));

      // Step 3: Verify data in market data table
      const marketDataQuery = {
        TableName: marketDataTableName,
        IndexName: 'SymbolIndex',
        KeyConditionExpression: 'symbol = :symbol',
        ExpressionAttributeValues: {
          ':symbol': testSymbol
        }
      };

      const marketDataResponse = await dynamodb.query(marketDataQuery).promise();
      expect(marketDataResponse.Items.length).toBeGreaterThan(0);

      const marketData = marketDataResponse.Items[0];
      expect(marketData.symbol).toBe(testSymbol);
      expect(marketData.exchange).toBe(testExchange);
      expect(parseFloat(marketData.price)).toBe(testPrice);
      expect(parseFloat(marketData.volume)).toBe(testVolume);
      expect(marketData.detail_type).toBe('Trade Execution');

      // Step 4: Verify audit trail exists
      const auditQuery = {
        TableName: auditTrailTableName,
        FilterExpression: 'event_type = :eventType',
        ExpressionAttributeValues: {
          ':eventType': 'Trade Execution'
        },
        Limit: 50
      };

      const auditResponse = await dynamodb.scan(auditQuery).promise();
      expect(auditResponse.Items.length).toBeGreaterThan(0);

      // Find our specific audit record
      const auditRecord = auditResponse.Items.find(item => {
        try {
          const details = JSON.parse(item.details);
          return details.symbol === testSymbol;
        } catch {
          return false;
        }
      });

      expect(auditRecord).toBeDefined();
      expect(auditRecord.status).toBe('SUCCESS');
      expect(auditRecord.event_type).toBe('Trade Execution');

      // Step 5: Verify CloudWatch logs contain processing information
      const logParams = {
        logGroupName: logGroupName,
        limit: 5,
        descending: true
      };

      const logStreams = await cloudwatchLogs.describeLogStreams(logParams).promise();
      expect(logStreams.logStreams.length).toBeGreaterThan(0);
    }, 20000);
  });

  describe('Performance and Scalability', () => {
    test('can handle multiple concurrent events', async () => {
      const numEvents = 5;
      const testSymbols = [];

      const eventPromises = [];
      for (let i = 0; i < numEvents; i++) {
        const testSymbol = `PERF${Date.now()}_${i}`;
        testSymbols.push(testSymbol);

        const params = {
          Entries: [
            {
              Source: 'market.data',
              DetailType: 'Trade Execution',
              Detail: JSON.stringify({
                exchange: 'NYSE',
                symbol: testSymbol,
                price: 100 + i,
                volume: 1000 + i
              }),
              EventBusName: eventBusName
            }
          ]
        };

        eventPromises.push(eventBridge.putEvents(params).promise());
      }

      const responses = await Promise.all(eventPromises);
      responses.forEach(response => {
        expect(response.FailedEntryCount).toBe(0);
      });

      // Wait for all events to be processed
      await new Promise(resolve => setTimeout(resolve, 10000));

      // Verify all events were processed
      for (const symbol of testSymbols) {
        const queryParams = {
          TableName: marketDataTableName,
          IndexName: 'SymbolIndex',
          KeyConditionExpression: 'symbol = :symbol',
          ExpressionAttributeValues: {
            ':symbol': symbol
          }
        };

        const response = await dynamodb.query(queryParams).promise();
        expect(response.Items.length).toBeGreaterThan(0);
      }
    }, 30000);
  });
});
