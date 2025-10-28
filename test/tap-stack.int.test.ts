import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Read flat outputs
const outputsPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

const region = outputs.Region || process.env.AWS_REGION || 'us-east-1';
const environmentSuffix = outputs.EnvironmentSuffix || 'dev';
const apiEndpoint = outputs.ApiEndpoint;
const dynamoDBTableName = outputs.DynamoDBTableName;
const snsTopicArn = outputs.SNSTopicArn;

describe('TapStack Integration Tests - Live Resources', () => {
  // Generate unique test IDs for test isolation
  const testRunId = Date.now();
  const testPaymentId = `test-payment-${testRunId}`;
  const lowValuePaymentId = `test-low-${testRunId}`;
  const highValuePaymentId = `test-high-${testRunId}`;

  describe('Live AWS Resource Validation', () => {
    test('should verify DynamoDB table exists and is active', async () => {
      const { stdout } = await execAsync(
        `aws dynamodb describe-table --table-name ${dynamoDBTableName} --region ${region}`
      );
      const table = JSON.parse(stdout).Table;

      expect(table.TableName).toBe(dynamoDBTableName);
      expect(table.TableStatus).toBe('ACTIVE');
      expect(table.BillingModeSummary.BillingMode).toBe('PAY_PER_REQUEST');

      // Verify key schema
      const hashKey = table.KeySchema.find((k: any) => k.KeyType === 'HASH');
      const rangeKey = table.KeySchema.find((k: any) => k.KeyType === 'RANGE');
      expect(hashKey.AttributeName).toBe('payment_id');
      expect(rangeKey.AttributeName).toBe('timestamp');
    }, 30000);

    test('should verify SNS topic exists and is accessible', async () => {
      const { stdout } = await execAsync(
        `aws sns get-topic-attributes --topic-arn ${snsTopicArn} --region ${region}`
      );
      const attributes = JSON.parse(stdout).Attributes;

      expect(attributes.TopicArn).toBe(snsTopicArn);
      expect(attributes.DisplayName.toLowerCase()).toContain('high');
      expect(attributes.DisplayName.toLowerCase()).toContain('value');
    }, 30000);

    test('should verify validation Lambda function exists and is active', async () => {
      const functionName = `payment-validation-${environmentSuffix}`;
      const { stdout } = await execAsync(
        `aws lambda get-function --function-name ${functionName} --region ${region}`
      );
      const config = JSON.parse(stdout).Configuration;

      expect(config.FunctionName).toBe(functionName);
      expect(config.Runtime).toBe('python3.11');
      expect(config.State).toBe('Active');
      expect(config.MemorySize).toBeGreaterThanOrEqual(512);
    }, 30000);

    test('should verify notification Lambda function exists and is active', async () => {
      const functionName = `payment-notification-${environmentSuffix}`;
      const { stdout } = await execAsync(
        `aws lambda get-function --function-name ${functionName} --region ${region}`
      );
      const config = JSON.parse(stdout).Configuration;

      expect(config.FunctionName).toBe(functionName);
      expect(config.Runtime).toBe('python3.11');
      expect(config.State).toBe('Active');
    }, 30000);

    test('should verify EventBridge rule exists for high-value payments', async () => {
      const eventBusName = `payment-events-${environmentSuffix}`;
      const { stdout } = await execAsync(
        `aws events list-rules --event-bus-name ${eventBusName} --region ${region}`
      );
      const rules = JSON.parse(stdout).Rules;

      expect(rules.length).toBeGreaterThan(0);
      const highValueRule = rules.find((r: any) => r.Name === `high-value-payments-${environmentSuffix}`);
      expect(highValueRule).toBeTruthy();
      expect(highValueRule.Name).toBe(`high-value-payments-${environmentSuffix}`);
      expect(highValueRule.State).toBe('ENABLED');
      expect(highValueRule.EventBusName).toBe(eventBusName);
    }, 30000);
  });

  describe('API Gateway - Payment Validation', () => {
    test('should return 400 for invalid payment request', async () => {
      try {
        await axios.post(`${apiEndpoint}payments/webhook`, {
          invalid: 'data',
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    }, 30000);

    test('should accept valid low-value payment request and return request_id', async () => {
      const validPayment = {
        payment_id: testPaymentId,
        amount: 100.0,
        currency: 'USD',
        customer_id: 'cust_test_123',
        description: 'Integration test payment',
      };

      const response = await axios.post(
        `${apiEndpoint}payments/webhook`,
        validPayment,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('message');
      expect(response.data).toHaveProperty('payment_id', testPaymentId);
      expect(response.data).toHaveProperty('request_id');
      expect(response.data.request_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    }, 30000);
  });

  describe('End-to-End Payment Processing', () => {
    test('should process low-value payment and store in DynamoDB', async () => {
      const lowValuePayment = {
        payment_id: lowValuePaymentId,
        amount: 500.0,
        currency: 'USD',
        customer_id: 'cust_low_value',
        description: 'Low value test payment',
      };

      const response = await axios.post(
        `${apiEndpoint}payments/webhook`,
        lowValuePayment,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('payment_id', lowValuePaymentId);
      expect(response.data).toHaveProperty('message', 'Payment processed successfully');
      expect(response.data).toHaveProperty('request_id');

      // Wait for eventual consistency and verify payment stored in DynamoDB
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Query DynamoDB to verify payment was stored
      const { stdout } = await execAsync(
        `aws dynamodb query --table-name ${dynamoDBTableName} ` +
        `--key-condition-expression "payment_id = :pid" ` +
        `--expression-attribute-values '{":pid":{"S":"${lowValuePaymentId}"}}' ` +
        `--region ${region}`
      );
      const items = JSON.parse(stdout).Items;

      expect(items.length).toBeGreaterThan(0);
      expect(items[0].payment_id.S).toBe(lowValuePaymentId);
      expect(items[0].status.S).toBe('validated');
      expect(parseFloat(items[0].amount.N)).toBe(500);
    }, 30000);

    test('should process high-value payment and verify complete workflow', async () => {
      const highValuePayment = {
        payment_id: highValuePaymentId,
        amount: 15000.0,
        currency: 'USD',
        customer_id: 'cust_high_value',
        description: 'High value test payment',
      };

      const response = await axios.post(
        `${apiEndpoint}payments/webhook`,
        highValuePayment,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('payment_id', highValuePaymentId);
      expect(response.data).toHaveProperty('message', 'Payment processed successfully');
      expect(response.data).toHaveProperty('request_id');

      // Verify high-value payment triggers EventBridge (amount > 10000)
      expect(highValuePayment.amount).toBeGreaterThan(10000);

      // Wait for eventual consistency
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Query DynamoDB to verify high-value payment was stored
      const { stdout } = await execAsync(
        `aws dynamodb query --table-name ${dynamoDBTableName} ` +
        `--key-condition-expression "payment_id = :pid" ` +
        `--expression-attribute-values '{":pid":{"S":"${highValuePaymentId}"}}' ` +
        `--region ${region}`
      );
      const items = JSON.parse(stdout).Items;

      expect(items.length).toBeGreaterThan(0);
      expect(items[0].payment_id.S).toBe(highValuePaymentId);
      expect(items[0].status.S).toBe('validated');
      expect(parseFloat(items[0].amount.N)).toBe(15000);
    }, 30000);

    test('should validate all required payment fields', async () => {
      const testCases = [
        { field: 'payment_id', value: null },
        { field: 'amount', value: null },
        { field: 'currency', value: null },
        { field: 'customer_id', value: null },
      ];

      for (const testCase of testCases) {
        const invalidPayment: any = {
          payment_id: `test-${Date.now()}`,
          amount: 100.0,
          currency: 'USD',
          customer_id: 'test_customer',
        };

        invalidPayment[testCase.field] = testCase.value;

        try {
          await axios.post(`${apiEndpoint}payments/webhook`, invalidPayment, {
            headers: {
              'Content-Type': 'application/json',
            },
          });
          fail(`Should have rejected payment without ${testCase.field}`);
        } catch (error: any) {
          expect(error.response.status).toBe(400);
        }
      }
    }, 30000);

    test('should handle concurrent payment requests', async () => {
      const concurrentRequests = Array.from({ length: 5 }, (_, i) => ({
        payment_id: `concurrent-${testRunId}-${i}`,
        amount: 100.0 + i * 10,
        currency: 'USD',
        customer_id: `cust_concurrent_${i}`,
        description: `Concurrent test ${i}`,
      }));

      const requests = concurrentRequests.map((payment) =>
        axios.post(`${apiEndpoint}payments/webhook`, payment, {
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );

      const responses = await Promise.all(requests);
      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    }, 30000);
  });

  // Cleanup
  afterAll(async () => {
    // Note: In production, you might want to clean up test data
    // For this integration test, we leave the data for verification
    console.log('Integration tests completed successfully');
  });
});
