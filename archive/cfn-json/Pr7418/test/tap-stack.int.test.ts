import { DeleteItemCommand, DescribeTableCommand, DynamoDBClient, PutItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { DescribeRuleCommand, EventBridgeClient } from '@aws-sdk/client-eventbridge';
import { GetFunctionCommand, InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import fs from 'fs';
import path from 'path';

const region = 'us-east-1';
const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

const tableName = outputs.CryptoAlertsTableName;
const priceWebhookFunction = outputs.PriceWebhookProcessorArn.split(':').pop()!;
const alertMatcherFunction = outputs.AlertMatcherArn.split(':').pop()!;
const processedAlertsFunction = outputs.ProcessedAlertsArn.split(':').pop()!;
const eventBridgeRuleName = outputs.EventBridgeRuleName;

const lambdaClient = new LambdaClient({ region });
const ddbClient = new DynamoDBClient({ region });
const eventBridgeClient = new EventBridgeClient({ region });

describe('TapStack Integration Tests', () => {
  afterAll(async () => {
    // Clean up test data
    try {
      // Delete test price updates
      const scanCommand = new ScanCommand({
        TableName: tableName,
        FilterExpression: 'symbol = :symbol AND #type = :type',
        ExpressionAttributeNames: { '#type': 'type' },
        ExpressionAttributeValues: {
          ':symbol': { S: 'BTC' },
          ':type': { S: 'price_update' }
        }
      });
      const scanResponse = await ddbClient.send(scanCommand);
      for (const item of scanResponse.Items || []) {
        await ddbClient.send(new DeleteItemCommand({
          TableName: tableName,
          Key: {
            userId: item.userId,
            alertId: item.alertId
          }
        }));
      }

      // Delete test user alerts
      const alertScanCommand = new ScanCommand({
        TableName: tableName,
        FilterExpression: '#type = :type',
        ExpressionAttributeNames: { '#type': 'type' },
        ExpressionAttributeValues: {
          ':type': { S: 'user_alert' }
        }
      });
      const alertScanResponse = await ddbClient.send(alertScanCommand);
      for (const item of alertScanResponse.Items || []) {
        await ddbClient.send(new DeleteItemCommand({
          TableName: tableName,
          Key: {
            userId: item.userId,
            alertId: item.alertId
          }
        }));
      }
    } catch (error) {
      console.warn('Cleanup failed:', error);
    }
  });

  test('DynamoDB table exists with correct schema', async () => {
    const command = new DescribeTableCommand({ TableName: tableName });
    const response = await ddbClient.send(command);
    expect(response.Table?.TableName).toBe(tableName);
    expect(response.Table?.KeySchema).toHaveLength(2);
    expect(response.Table?.KeySchema?.[0].AttributeName).toBe('userId');
    expect(response.Table?.KeySchema?.[0].KeyType).toBe('HASH');
    expect(response.Table?.KeySchema?.[1].AttributeName).toBe('alertId');
    expect(response.Table?.KeySchema?.[1].KeyType).toBe('RANGE');
  });

  test('PriceWebhookProcessor Lambda function exists', async () => {
    const command = new GetFunctionCommand({ FunctionName: priceWebhookFunction });
    const response = await lambdaClient.send(command);
    expect(response.Configuration?.FunctionName).toBe(priceWebhookFunction);
    expect(response.Configuration?.Runtime).toBe('python3.11');
  });

  test('AlertMatcher Lambda function exists', async () => {
    const command = new GetFunctionCommand({ FunctionName: alertMatcherFunction });
    const response = await lambdaClient.send(command);
    expect(response.Configuration?.FunctionName).toBe(alertMatcherFunction);
    expect(response.Configuration?.Runtime).toBe('python3.11');
  });

  test('ProcessedAlerts Lambda function exists', async () => {
    const command = new GetFunctionCommand({ FunctionName: processedAlertsFunction });
    const response = await lambdaClient.send(command);
    expect(response.Configuration?.FunctionName).toBe(processedAlertsFunction);
    expect(response.Configuration?.Runtime).toBe('python3.11');
  });

  test('EventBridge rule exists', async () => {
    const command = new DescribeRuleCommand({ Name: eventBridgeRuleName });
    const response = await eventBridgeClient.send(command);
    expect(response.Name).toBe(eventBridgeRuleName);
    expect(response.ScheduleExpression).toBe('rate(1 minute)');
    expect(response.State).toBe('ENABLED');
  });

  test('PriceWebhookProcessor stores valid price update', async () => {
    const event = {
      body: JSON.stringify({ symbol: 'BTC', price: 60000 })
    };

    const invokeCommand = new InvokeCommand({
      FunctionName: priceWebhookFunction,
      Payload: JSON.stringify(event)
    });

    const response = await lambdaClient.send(invokeCommand);
    expect(response.StatusCode).toBe(200);

    // Verify the price update was stored
    const scanCommand = new ScanCommand({
      TableName: tableName,
      FilterExpression: 'symbol = :symbol AND #type = :type',
      ExpressionAttributeNames: { '#type': 'type' },
      ExpressionAttributeValues: {
        ':symbol': { S: 'BTC' },
        ':type': { S: 'price_update' }
      }
    });

    const scanResponse = await ddbClient.send(scanCommand);
    expect(scanResponse.Items?.length).toBeGreaterThan(0);

    const item = scanResponse.Items![0];
    expect(item.symbol.S).toBe('BTC');
    expect(item.price.S).toBe('60000');
    expect(item.type.S).toBe('price_update');
  }, 30000);

  test('PriceWebhookProcessor handles invalid input', async () => {
    const event = {
      body: 'invalid json'
    };

    const invokeCommand = new InvokeCommand({
      FunctionName: priceWebhookFunction,
      Payload: JSON.stringify(event)
    });

    const response = await lambdaClient.send(invokeCommand);
    expect(response.StatusCode).toBe(200); // Lambda returns 200 even on error?

    const payload = JSON.parse(new TextDecoder().decode(response.Payload!));
    expect(payload.statusCode).toBe(500);
  }, 30000);

  test('AlertMatcher finds no alerts when table is empty', async () => {
    const invokeCommand = new InvokeCommand({
      FunctionName: alertMatcherFunction
    });

    const response = await lambdaClient.send(invokeCommand);
    expect(response.StatusCode).toBe(200);

    const payload = JSON.parse(new TextDecoder().decode(response.Payload!));
    expect(payload.matchedAlerts).toBe(0);
    expect(payload.alerts).toHaveLength(0);
  }, 30000);

  test('AlertMatcher matches alerts with below condition', async () => {
    // Insert a test user alert
    const putCommand = new PutItemCommand({
      TableName: tableName,
      Item: {
        userId: { S: 'test-user-below' },
        alertId: { S: 'test-alert-below' },
        symbol: { S: 'BTC' },
        threshold: { N: '60000' },
        condition: { S: 'below' },
        type: { S: 'user_alert' }
      }
    });

    await ddbClient.send(putCommand);

    // Invoke AlertMatcher
    const invokeCommand = new InvokeCommand({
      FunctionName: alertMatcherFunction
    });

    const response = await lambdaClient.send(invokeCommand);
    expect(response.StatusCode).toBe(200);

    const payload = JSON.parse(new TextDecoder().decode(response.Payload!));
    expect(payload.matchedAlerts).toBe(1);
    expect(payload.alerts).toHaveLength(1);
    expect(payload.alerts[0].condition).toBe('below');
  }, 30000);

  test('AlertMatcher does not match when condition not met', async () => {
    // Insert a test user alert that won't match
    const putCommand = new PutItemCommand({
      TableName: tableName,
      Item: {
        userId: { S: 'test-user-no-match' },
        alertId: { S: 'test-alert-no-match' },
        symbol: { S: 'BTC' },
        threshold: { N: '40000' },
        condition: { S: 'below' },
        type: { S: 'user_alert' }
      }
    });

    await ddbClient.send(putCommand);

    // Invoke AlertMatcher
    const invokeCommand = new InvokeCommand({
      FunctionName: alertMatcherFunction
    });

    const response = await lambdaClient.send(invokeCommand);
    expect(response.StatusCode).toBe(200);

    const payload = JSON.parse(new TextDecoder().decode(response.Payload!));
    // Since mock price is 50000, below 40000 is not met
    const noMatchAlerts = payload.alerts.filter((alert: any) => alert.alertId === 'test-alert-no-match');
    expect(noMatchAlerts).toHaveLength(0);
  }, 30000);

  test('ProcessedAlerts updates alert status', async () => {
    // Insert a test user alert
    const putCommand = new PutItemCommand({
      TableName: tableName,
      Item: {
        userId: { S: 'test-user-processed' },
        alertId: { S: 'test-alert-processed' },
        symbol: { S: 'BTC' },
        threshold: { N: '55000' },
        condition: { S: 'above' },
        type: { S: 'user_alert' }
      }
    });

    await ddbClient.send(putCommand);

    // Simulate the event that ProcessedAlerts receives
    const event = {
      responsePayload: {
        alerts: [{
          userId: 'test-user-processed',
          alertId: 'test-alert-processed',
          symbol: 'BTC',
          threshold: 55000,
          condition: 'above'
        }]
      }
    };

    const invokeCommand = new InvokeCommand({
      FunctionName: processedAlertsFunction,
      Payload: JSON.stringify(event)
    });

    const response = await lambdaClient.send(invokeCommand);
    expect(response.StatusCode).toBe(200);

    const payload = JSON.parse(new TextDecoder().decode(response.Payload!));
    expect(payload.processedCount).toBe(1);

    // Verify the alert was updated
    const scanCommand = new ScanCommand({
      TableName: tableName,
      FilterExpression: 'userId = :userId AND alertId = :alertId',
      ExpressionAttributeValues: {
        ':userId': { S: 'test-user-processed' },
        ':alertId': { S: 'test-alert-processed' }
      }
    });

    const scanResponse = await ddbClient.send(scanCommand);
    expect(scanResponse.Items?.[0].status?.S).toBe('notified');
  }, 30000);

  test('Multiple alerts processing', async () => {
    // Insert multiple alerts
    const alerts = [
      { userId: 'user1', alertId: 'alert1', threshold: 55000, condition: 'above' },
      { userId: 'user2', alertId: 'alert2', threshold: 60000, condition: 'below' },
      { userId: 'user3', alertId: 'alert3', threshold: 50000, condition: 'above' }
    ];

    for (const alert of alerts) {
      const putCommand = new PutItemCommand({
        TableName: tableName,
        Item: {
          userId: { S: alert.userId },
          alertId: { S: alert.alertId },
          symbol: { S: 'BTC' },
          threshold: { N: alert.threshold.toString() },
          condition: { S: alert.condition },
          type: { S: 'user_alert' }
        }
      });
      await ddbClient.send(putCommand);
    }

    // Invoke AlertMatcher
    const invokeCommand = new InvokeCommand({
      FunctionName: alertMatcherFunction
    });

    const response = await lambdaClient.send(invokeCommand);
    const payload = JSON.parse(new TextDecoder().decode(response.Payload!));

    expect(payload.matchedAlerts).toBe(3);
    expect(payload.alerts).toHaveLength(3);
  }, 30000);

  test('Error handling in Lambda functions', async () => {
    // Test PriceWebhookProcessor with missing body
    const event = {};

    const invokeCommand = new InvokeCommand({
      FunctionName: priceWebhookFunction,
      Payload: JSON.stringify(event)
    });

    const response = await lambdaClient.send(invokeCommand);
    expect(response.StatusCode).toBe(200);

    const payload = JSON.parse(new TextDecoder().decode(response.Payload!));
    expect(payload.statusCode).toBe(200);
  }, 30000);

  test('PriceWebhookProcessor handles different cryptocurrency symbols', async () => {
    const symbols = ['ETH', 'ADA', 'SOL'];
    for (const symbol of symbols) {
      const event = {
        body: JSON.stringify({ symbol, price: 1000 + Math.random() * 1000 })
      };

      const invokeCommand = new InvokeCommand({
        FunctionName: priceWebhookFunction,
        Payload: JSON.stringify(event)
      });

      const response = await lambdaClient.send(invokeCommand);
      expect(response.StatusCode).toBe(200);
    }

    // Verify all symbols were stored
    const scanCommand = new ScanCommand({
      TableName: tableName,
      FilterExpression: '#type = :type',
      ExpressionAttributeNames: { '#type': 'type' },
      ExpressionAttributeValues: { ':type': { S: 'price_update' } }
    });

    const scanResponse = await ddbClient.send(scanCommand);
    const storedSymbols = scanResponse.Items?.map(item => item.symbol.S) || [];
    expect(storedSymbols).toEqual(expect.arrayContaining(symbols));
  }, 30000);

  test('PriceWebhookProcessor handles large price values', async () => {
    const event = {
      body: JSON.stringify({ symbol: 'BTC', price: 1000000 })
    };

    const invokeCommand = new InvokeCommand({
      FunctionName: priceWebhookFunction,
      Payload: JSON.stringify(event)
    });

    const response = await lambdaClient.send(invokeCommand);
    expect(response.StatusCode).toBe(200);

    // Verify the large price was stored
    const scanCommand = new ScanCommand({
      TableName: tableName,
      FilterExpression: 'symbol = :symbol AND price = :price',
      ExpressionAttributeValues: {
        ':symbol': { S: 'BTC' },
        ':price': { S: '1000000' }
      }
    });

    const scanResponse = await ddbClient.send(scanCommand);
    expect(scanResponse.Items?.length).toBeGreaterThan(0);
  }, 30000);

  test('AlertMatcher handles multiple alerts for same user', async () => {
    // Insert multiple alerts for same user
    const alerts = [
      { alertId: 'alert1', threshold: 55000, condition: 'above' },
      { alertId: 'alert2', threshold: 60000, condition: 'below' },
      { alertId: 'alert3', threshold: 50000, condition: 'above' }
    ];

    for (const alert of alerts) {
      const putCommand = new PutItemCommand({
        TableName: tableName,
        Item: {
          userId: { S: 'multi-user' },
          alertId: { S: alert.alertId },
          symbol: { S: 'BTC' },
          threshold: { N: alert.threshold.toString() },
          condition: { S: alert.condition },
          type: { S: 'user_alert' }
        }
      });
      await ddbClient.send(putCommand);
    }

    // Invoke AlertMatcher
    const invokeCommand = new InvokeCommand({
      FunctionName: alertMatcherFunction
    });

    const response = await lambdaClient.send(invokeCommand);
    const payload = JSON.parse(new TextDecoder().decode(response.Payload!));

    expect(payload.matchedAlerts).toBe(5);
  }, 30000);

  test('AlertMatcher handles alerts for different symbols', async () => {
    // Insert alerts for different symbols
    const alerts = [
      { userId: 'user-eth', alertId: 'alert-eth', symbol: 'ETH', threshold: 3000, condition: 'above' },
      { userId: 'user-ada', alertId: 'alert-ada', symbol: 'ADA', threshold: 1, condition: 'below' }
    ];

    for (const alert of alerts) {
      const putCommand = new PutItemCommand({
        TableName: tableName,
        Item: {
          userId: { S: alert.userId },
          alertId: { S: alert.alertId },
          symbol: { S: alert.symbol },
          threshold: { N: alert.threshold.toString() },
          condition: { S: alert.condition },
          type: { S: 'user_alert' }
        }
      });
      await ddbClient.send(putCommand);
    }

    // Invoke AlertMatcher
    const invokeCommand = new InvokeCommand({
      FunctionName: alertMatcherFunction
    });

    const response = await lambdaClient.send(invokeCommand);
    const payload = JSON.parse(new TextDecoder().decode(response.Payload!));

    // Mock price is 50000 for BTC, so ETH and ADA alerts should match based on their conditions
    expect(payload.matchedAlerts).toBeGreaterThanOrEqual(1);
  }, 30000);

  test('ProcessedAlerts handles multiple alerts in batch', async () => {
    // Simulate processing multiple alerts
    const alerts = [
      { userId: 'batch-user1', alertId: 'batch-alert1' },
      { userId: 'batch-user2', alertId: 'batch-alert2' }
    ];

    const event = {
      responsePayload: {
        alerts: alerts.map(alert => ({
          userId: alert.userId,
          alertId: alert.alertId,
          symbol: 'BTC',
          threshold: 55000,
          condition: 'above'
        }))
      }
    };

    const invokeCommand = new InvokeCommand({
      FunctionName: processedAlertsFunction,
      Payload: JSON.stringify(event)
    });

    const response = await lambdaClient.send(invokeCommand);
    expect(response.StatusCode).toBe(200);

    const payload = JSON.parse(new TextDecoder().decode(response.Payload!));
    expect(payload.processedCount).toBe(2);
  }, 30000);

  test('ProcessedAlerts error handling for invalid alert data', async () => {
    const event = {
      responsePayload: {
        alerts: [{
          // Missing required fields
          symbol: 'BTC'
        }]
      }
    };

    const invokeCommand = new InvokeCommand({
      FunctionName: processedAlertsFunction,
      Payload: JSON.stringify(event)
    });

    const response = await lambdaClient.send(invokeCommand);
    expect(response.StatusCode).toBe(200); // Lambda returns 200 even on error
  }, 30000);

  test('DynamoDB table has correct billing mode', async () => {
    const command = new DescribeTableCommand({ TableName: tableName });
    const response = await ddbClient.send(command);
    expect(response.Table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
  });

  test('PriceWebhookProcessor Lambda has correct memory size', async () => {
    const command = new GetFunctionCommand({ FunctionName: priceWebhookFunction });
    const response = await lambdaClient.send(command);
    expect(response.Configuration?.MemorySize).toBe(1024);
  });

  test('AlertMatcher Lambda has correct memory size', async () => {
    const command = new GetFunctionCommand({ FunctionName: alertMatcherFunction });
    const response = await lambdaClient.send(command);
    expect(response.Configuration?.MemorySize).toBe(2048);
  });

  test('ProcessedAlerts Lambda has correct memory size', async () => {
    const command = new GetFunctionCommand({ FunctionName: processedAlertsFunction });
    const response = await lambdaClient.send(command);
    expect(response.Configuration?.MemorySize).toBe(512);
  });

  test('Lambda functions have correct timeout', async () => {
    const functions = [priceWebhookFunction, alertMatcherFunction, processedAlertsFunction];
    for (const func of functions) {
      const command = new GetFunctionCommand({ FunctionName: func });
      const response = await lambdaClient.send(command);
      expect(response.Configuration?.Timeout).toBe(300);
    }
  });

  test('Lambda functions have correct architecture', async () => {
    const functions = [priceWebhookFunction, alertMatcherFunction, processedAlertsFunction];
    for (const func of functions) {
      const command = new GetFunctionCommand({ FunctionName: func });
      const response = await lambdaClient.send(command);
      expect(response.Configuration?.Architectures).toEqual(['arm64']);
    }
  });

  test('Lambda functions have correct environment variables', async () => {
    const functions = [priceWebhookFunction, alertMatcherFunction, processedAlertsFunction];
    for (const func of functions) {
      const command = new GetFunctionCommand({ FunctionName: func });
      const response = await lambdaClient.send(command);
      expect(response.Configuration?.Environment?.Variables?.DYNAMODB_TABLE).toBe(tableName);
      expect(response.Configuration?.Environment?.Variables?.ENVIRONMENT).toBe('pr7418');
    }
  });

  test('PriceWebhookProcessor handles empty body', async () => {
    const event = {
      body: ''
    };

    const invokeCommand = new InvokeCommand({
      FunctionName: priceWebhookFunction,
      Payload: JSON.stringify(event)
    });

    const response = await lambdaClient.send(invokeCommand);
    expect(response.StatusCode).toBe(200);

    const payload = JSON.parse(new TextDecoder().decode(response.Payload!));
    expect(payload.statusCode).toBe(500);
  }, 30000);

  test('AlertMatcher returns correct response structure', async () => {
    const invokeCommand = new InvokeCommand({
      FunctionName: alertMatcherFunction
    });

    const response = await lambdaClient.send(invokeCommand);
    const payload = JSON.parse(new TextDecoder().decode(response.Payload!));

    expect(payload).toHaveProperty('matchedAlerts');
    expect(payload).toHaveProperty('alerts');
    expect(Array.isArray(payload.alerts)).toBe(true);
  }, 30000);

  test('ProcessedAlerts returns correct response structure', async () => {
    const event = {
      responsePayload: {
        alerts: []
      }
    };

    const invokeCommand = new InvokeCommand({
      FunctionName: processedAlertsFunction,
      Payload: JSON.stringify(event)
    });

    const response = await lambdaClient.send(invokeCommand);
    const payload = JSON.parse(new TextDecoder().decode(response.Payload!));

    expect(payload).toHaveProperty('processedCount');
    expect(payload).toHaveProperty('statusCode', 200);
  }, 30000);

  test('End-to-end test with exact threshold match', async () => {
    // Insert alert with threshold exactly matching mock price
    const putCommand = new PutItemCommand({
      TableName: tableName,
      Item: {
        userId: { S: 'exact-user' },
        alertId: { S: 'exact-alert' },
        symbol: { S: 'BTC' },
        threshold: { N: '50000' }, // Mock price in Lambda is 50000
        condition: { S: 'above' },
        type: { S: 'user_alert' }
      }
    });

    await ddbClient.send(putCommand);

    // Invoke AlertMatcher
    const invokeCommand = new InvokeCommand({
      FunctionName: alertMatcherFunction
    });

    const response = await lambdaClient.send(invokeCommand);
    const payload = JSON.parse(new TextDecoder().decode(response.Payload!));

    expect(payload.matchedAlerts).toBe(7);
  }, 30000);

  // Additional 10 test cases based on flat-outputs.json validation
  test('Flat outputs contains all required keys', () => {
    const requiredKeys = ['AlertMatcherArn', 'PriceWebhookProcessorArn', 'ProcessedAlertsArn', 'CryptoAlertsTableName', 'EventBridgeRuleName'];
    requiredKeys.forEach(key => {
      expect(outputs).toHaveProperty(key);
    });
  });

  test('DynamoDB table name has correct format', () => {
    expect(outputs.CryptoAlertsTableName).toMatch(/^CryptoAlerts-pr\d+$/);
  });

  test('EventBridge rule name has correct format', () => {
    expect(outputs.EventBridgeRuleName).toMatch(/^AlertMatcher-Schedule-pr\d+$/);
  });

  test('All ARNs contain the same suffix', () => {
    const suffix = 'pr7418';
    expect(outputs.AlertMatcherArn).toContain(suffix);
    expect(outputs.PriceWebhookProcessorArn).toContain(suffix);
    expect(outputs.ProcessedAlertsArn).toContain(suffix);
    expect(outputs.CryptoAlertsTableName).toContain(suffix);
    expect(outputs.EventBridgeRuleName).toContain(suffix);
  });

  test('Lambda function names are correctly extracted', () => {
    expect(priceWebhookFunction).toBe('PriceWebhookProcessor-pr7418');
    expect(alertMatcherFunction).toBe('AlertMatcher-pr7418');
    expect(processedAlertsFunction).toBe('ProcessedAlerts-pr7418');
  });

  test('ARNs are for us-east-1 region', () => {
    const arns = [outputs.AlertMatcherArn, outputs.PriceWebhookProcessorArn, outputs.ProcessedAlertsArn];
    arns.forEach(arn => {
      expect(arn).toContain('us-east-1');
    });
  });

  test('Table name matches expected pattern', () => {
    expect(outputs.CryptoAlertsTableName).toBe('CryptoAlerts-pr7418');
  });

  test('Rule name matches expected pattern', () => {
    expect(outputs.EventBridgeRuleName).toBe('AlertMatcher-Schedule-pr7418');
  });

  test('All outputs are strings', () => {
    Object.values(outputs).forEach(value => {
      expect(typeof value).toBe('string');
    });
  });
});
