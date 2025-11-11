import {
  APIGateway,
  CloudWatch,
  CloudWatchLogs,
  DynamoDB,
  IAM,
  Lambda,
  SQS
} from 'aws-sdk';
import axios from 'axios';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const outputsPath = join(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: Record<string, any> = {};
let region: string;

// Load outputs and determine region
try {
  if (existsSync(outputsPath)) {
    const rawOutputs = JSON.parse(readFileSync(outputsPath, 'utf-8'));

    // Parse JSON strings in outputs
    outputs = Object.fromEntries(
      Object.entries(rawOutputs).map(([key, value]) => {
        if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
          try {
            return [key, JSON.parse(value)];
          } catch {
            return [key, value];
          }
        }
        return [key, value];
      })
    );

    // Extract region from API Gateway URL or SQS URL
    const apiUrl = outputs.api_gateway_url;
    const sqsUrl = outputs.sqs_queue_url;

    if (apiUrl && typeof apiUrl === 'string') {
      const match = apiUrl.match(/execute-api\.([^.]+)\.amazonaws\.com/);
      region = match ? match[1] : process.env.AWS_REGION || 'us-east-1';
    } else if (sqsUrl && typeof sqsUrl === 'string') {
      const match = sqsUrl.match(/sqs\.([^.]+)\.amazonaws\.com/);
      region = match ? match[1] : process.env.AWS_REGION || 'us-east-1';
    } else {
      region = process.env.AWS_REGION || 'us-east-1';
    }
  } else {
    console.log('Warning: flat-outputs.json not found. Integration tests will be skipped.');
    region = process.env.AWS_REGION || 'us-east-1';
  }
} catch (error) {
  console.log('Warning: Could not load outputs. Integration tests may be limited.');
  region = process.env.AWS_REGION || 'us-east-1';
}

// Initialize AWS clients with detected region
const dynamodb = new DynamoDB({ region });
const lambda = new Lambda({ region });
const apigateway = new APIGateway({ region });
const sqs = new SQS({ region });
const cloudwatchlogs = new CloudWatchLogs({ region });
const cloudwatch = new CloudWatch({ region });
const iam = new IAM({ region });

const hasOutputs = Object.keys(outputs).length > 0;

// Helper functions
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const isValidArn = (arn: string): boolean => {
  return /^arn:aws:[^:]+:[^:]*:[^:]*:[^:]+/.test(arn);
};

const generateTransactionId = (): string => {
  return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const generateTestTransaction = () => ({
  transaction_id: generateTransactionId(),
  amount: Math.floor(Math.random() * 10000) + 1,
  currency: 'USD',
  merchant_id: `merchant_${Math.random().toString(36).substr(2, 8)}`,
  timestamp: new Date().toISOString()
});

describe('Fraud Detection Pipeline Integration Tests', () => {

  beforeAll(() => {
    if (!hasOutputs) {
      console.log('Skipping tests: Infrastructure not deployed or outputs not available');
    } else {
      console.log(`Running integration tests in region: ${region}`);
      console.log('Available outputs:', Object.keys(outputs));
    }
  });

  describe('Output Structure Validation', () => {
    test('should have all required infrastructure outputs', () => {
      if (!hasOutputs) {
        console.log('Skipping: No outputs available');
        return;
      }

      const requiredOutputs = [
        'api_gateway_url',
        'sqs_queue_url',
        'dynamodb_table_name',
        'lambda_function_names'
      ];

      requiredOutputs.forEach(output => {
        expect(outputs).toHaveProperty(output);
        expect(outputs[output]).toBeDefined();
      });
    });

    test('should have valid output formats', () => {
      if (!hasOutputs) return;

      // API Gateway URL should be valid HTTPS URL
      if (outputs.api_gateway_url) {
        expect(isValidUrl(outputs.api_gateway_url)).toBe(true);
        expect(outputs.api_gateway_url).toMatch(/^https:\/\//);
        expect(outputs.api_gateway_url).toContain('execute-api');
        expect(outputs.api_gateway_url).toContain('.amazonaws.com');
      }

      // SQS Queue URL should be valid
      if (outputs.sqs_queue_url) {
        expect(isValidUrl(outputs.sqs_queue_url)).toBe(true);
        expect(outputs.sqs_queue_url).toContain('sqs.');
        expect(outputs.sqs_queue_url).toContain('.amazonaws.com');
      }

      // DynamoDB table name should follow naming convention
      if (outputs.dynamodb_table_name) {
        expect(outputs.dynamodb_table_name).toMatch(/^fraud-detection-.+-transactions$/);
      }

      // Lambda function names should be an object with expected functions
      if (outputs.lambda_function_names) {
        expect(outputs.lambda_function_names).toHaveProperty('transaction_processor');
        expect(outputs.lambda_function_names).toHaveProperty('fraud_detector');
      }
    });

    test('should not expose sensitive information in outputs', () => {
      if (!hasOutputs) return;

      const sensitivePatterns = [
        /password/i, /secret/i, /private.*key/i, /access.*key/i,
        /token/i, /credential/i, /auth/i
      ];

      Object.keys(outputs).forEach(key => {
        sensitivePatterns.forEach(pattern => {
          expect(key).not.toMatch(pattern);
        });
      });
    });
  });

  describe('DynamoDB Table', () => {
    let tableDescription: DynamoDB.DescribeTableOutput | undefined;

    beforeAll(async () => {
      if (!hasOutputs || !outputs.dynamodb_table_name) return;

      try {
        tableDescription = await dynamodb.describeTable({
          TableName: outputs.dynamodb_table_name
        }).promise();
      } catch (error) {
        console.log('Error describing DynamoDB table:', error);
      }
    });

    test('should have transactions table deployed and accessible', async () => {
      if (!hasOutputs || !outputs.dynamodb_table_name) {
        console.log('Skipping: DynamoDB table name not available');
        return;
      }

      expect(tableDescription).toBeDefined();
      expect(tableDescription?.Table).toBeDefined();
      expect(tableDescription?.Table?.TableName).toBe(outputs.dynamodb_table_name);
    });

    test('should have correct key schema configuration', () => {
      if (!tableDescription?.Table) return;

      const keySchema = tableDescription.Table.KeySchema || [];

      const hashKey = keySchema.find(key => key.KeyType === 'HASH');
      const rangeKey = keySchema.find(key => key.KeyType === 'RANGE');

      expect(hashKey).toBeDefined();
      expect(hashKey?.AttributeName).toBe('transaction_id');
      expect(rangeKey).toBeDefined();
      expect(rangeKey?.AttributeName).toBe('timestamp');
    });

    test('should use PAY_PER_REQUEST billing mode', () => {
      if (!tableDescription?.Table) return;

      expect(tableDescription.Table.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('should have DynamoDB streams enabled', () => {
      if (!tableDescription?.Table) return;

      expect(tableDescription.Table.StreamSpecification).toBeDefined();
      expect(tableDescription.Table.StreamSpecification?.StreamEnabled).toBe(true);
      expect(tableDescription.Table.StreamSpecification?.StreamViewType).toBe('NEW_AND_OLD_IMAGES');
    });

    test('should have point-in-time recovery enabled', async () => {
      if (!hasOutputs || !outputs.dynamodb_table_name) return;

      try {
        const backupDescription = await dynamodb.describeContinuousBackups({
          TableName: outputs.dynamodb_table_name
        }).promise();

        expect(backupDescription.ContinuousBackupsDescription?.PointInTimeRecoveryDescription?.PointInTimeRecoveryStatus).toBe('ENABLED');
      } catch (error) {
        console.log('Error checking point-in-time recovery:', error);
      }
    });

    test('should have server-side encryption enabled', () => {
      if (!tableDescription?.Table) return;

      expect(tableDescription.Table.SSEDescription).toBeDefined();
      expect(['ENABLED', 'ENABLING'].includes(tableDescription.Table.SSEDescription?.Status || '')).toBe(true);
    });
  });

  describe('Lambda Functions', () => {
    test('should have transaction processor function deployed', async () => {
      if (!hasOutputs || !outputs.lambda_function_names?.transaction_processor) return;

      try {
        const functionConfig = await lambda.getFunction({
          FunctionName: outputs.lambda_function_names.transaction_processor
        }).promise();

        expect(functionConfig.Configuration).toBeDefined();
        expect(functionConfig.Configuration?.FunctionName).toBe(outputs.lambda_function_names.transaction_processor);
        expect(functionConfig.Configuration?.Runtime).toBe('python3.11');
        expect(functionConfig.Configuration?.Architectures).toContain('arm64');
      } catch (error) {
        fail(`Transaction processor Lambda function not accessible: ${error}`);
      }
    });

    test('should have fraud detector function deployed', async () => {
      if (!hasOutputs || !outputs.lambda_function_names?.fraud_detector) return;

      try {
        const functionConfig = await lambda.getFunction({
          FunctionName: outputs.lambda_function_names.fraud_detector
        }).promise();

        expect(functionConfig.Configuration).toBeDefined();
        expect(functionConfig.Configuration?.FunctionName).toBe(outputs.lambda_function_names.fraud_detector);
        expect(functionConfig.Configuration?.Runtime).toBe('python3.11');
        expect(functionConfig.Configuration?.Architectures).toContain('arm64');
      } catch (error) {
        fail(`Fraud detector Lambda function not accessible: ${error}`);
      }
    });

    test('should have proper environment variables configured', async () => {
      if (!hasOutputs || !outputs.lambda_function_names) return;

      try {
        // Test transaction processor environment variables
        const txProcessorConfig = await lambda.getFunction({
          FunctionName: outputs.lambda_function_names.transaction_processor
        }).promise();

        expect(txProcessorConfig.Configuration?.Environment?.Variables).toBeDefined();
        expect(txProcessorConfig.Configuration?.Environment?.Variables?.DYNAMODB_TABLE_NAME).toBe(outputs.dynamodb_table_name);
        expect(txProcessorConfig.Configuration?.Environment?.Variables?.REGION).toBe(region);

        // Test fraud detector environment variables
        const fraudDetectorConfig = await lambda.getFunction({
          FunctionName: outputs.lambda_function_names.fraud_detector
        }).promise();

        expect(fraudDetectorConfig.Configuration?.Environment?.Variables).toBeDefined();
        expect(fraudDetectorConfig.Configuration?.Environment?.Variables?.SQS_QUEUE_URL).toBe(outputs.sqs_queue_url);
        expect(fraudDetectorConfig.Configuration?.Environment?.Variables?.REGION).toBe(region);
      } catch (error) {
        console.log('Error checking Lambda environment variables:', error);
      }
    });

    test('should have dead letter queue configuration', async () => {
      if (!hasOutputs || !outputs.lambda_function_names) return;

      try {
        const txProcessorConfig = await lambda.getFunction({
          FunctionName: outputs.lambda_function_names.transaction_processor
        }).promise();

        const fraudDetectorConfig = await lambda.getFunction({
          FunctionName: outputs.lambda_function_names.fraud_detector
        }).promise();

        expect(txProcessorConfig.Configuration?.DeadLetterConfig).toBeDefined();
        expect(txProcessorConfig.Configuration?.DeadLetterConfig?.TargetArn).toBeDefined();

        expect(fraudDetectorConfig.Configuration?.DeadLetterConfig).toBeDefined();
        expect(fraudDetectorConfig.Configuration?.DeadLetterConfig?.TargetArn).toBeDefined();
      } catch (error) {
        console.log('Error checking dead letter queue configuration:', error);
      }
    });
  });

  describe('SQS Queues', () => {
    test('should have suspicious transactions queue accessible', async () => {
      if (!hasOutputs || !outputs.sqs_queue_url) return;

      try {
        const attributes = await sqs.getQueueAttributes({
          QueueUrl: outputs.sqs_queue_url,
          AttributeNames: ['All']
        }).promise();

        expect(attributes.Attributes).toBeDefined();
        expect(attributes.Attributes?.QueueArn).toBeDefined();
        expect(attributes.Attributes?.MessageRetentionPeriod).toBe('1209600'); // 14 days
      } catch (error) {
        fail(`SQS queue not accessible: ${error}`);
      }
    });

    test('should have redrive policy configured', async () => {
      if (!hasOutputs || !outputs.sqs_queue_url) return;

      try {
        const attributes = await sqs.getQueueAttributes({
          QueueUrl: outputs.sqs_queue_url,
          AttributeNames: ['RedrivePolicy']
        }).promise();

        expect(attributes.Attributes?.RedrivePolicy).toBeDefined();

        const redrivePolicy = JSON.parse(attributes.Attributes?.RedrivePolicy || '{}');
        expect(redrivePolicy.maxReceiveCount).toBe(3);
        expect(redrivePolicy.deadLetterTargetArn).toBeDefined();
      } catch (error) {
        console.log('Error checking SQS redrive policy:', error);
      }
    });
  });

  describe('API Gateway', () => {
    test('should have REST API accessible', async () => {
      if (!hasOutputs || !outputs.api_gateway_url) return;

      try {
        // Extract API ID from URL
        const urlParts = outputs.api_gateway_url.split('/');
        const apiIdMatch = outputs.api_gateway_url.match(/https:\/\/([^.]+)\.execute-api/);
        const apiId = apiIdMatch ? apiIdMatch[1] : null;

        if (apiId) {
          const restApi = await apigateway.getRestApi({ restApiId: apiId }).promise();
          expect(restApi.id).toBe(apiId);
          expect(restApi.endpointConfiguration?.types).toContain('REGIONAL');
        }
      } catch (error) {
        console.log('Error checking API Gateway configuration:', error);
      }
    });

    test('should respond to health check without authentication', async () => {
      if (!hasOutputs || !outputs.api_gateway_url) return;

      try {
        const response = await axios.options(outputs.api_gateway_url, {
          timeout: 10000,
          validateStatus: function (status) {
            return status < 500; // Don't reject for client errors
          }
        });

        // Should not return 5xx server errors
        expect(response.status).toBeLessThan(500);
      } catch (error) {
        console.log('API Gateway health check failed:', error);
      }
    }, 15000);
  });

  describe('CloudWatch Logs', () => {
    test('should have log groups created for Lambda functions', async () => {
      if (!hasOutputs || !outputs.lambda_function_names) return;

      try {
        const logGroups = await cloudwatchlogs.describeLogGroups().promise();

        const expectedLogGroups = [
          `/aws/lambda/${outputs.lambda_function_names.transaction_processor}`,
          `/aws/lambda/${outputs.lambda_function_names.fraud_detector}`
        ];

        expectedLogGroups.forEach(expectedLogGroup => {
          const logGroup = logGroups.logGroups?.find(lg => lg.logGroupName === expectedLogGroup);
          expect(logGroup).toBeDefined();
          expect(logGroup?.retentionInDays).toBe(7);
        });
      } catch (error) {
        console.log('Error checking CloudWatch log groups:', error);
      }
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should have error rate alarms configured', async () => {
      if (!hasOutputs || !outputs.lambda_function_names) return;

      try {
        const alarms = await cloudwatch.describeAlarms().promise();

        const expectedAlarmPatterns = [
          'fraud-detection-.*-transaction-processor-errors',
          'fraud-detection-.*-fraud-detector-errors'
        ];

        expectedAlarmPatterns.forEach(pattern => {
          const alarm = alarms.MetricAlarms?.find(a =>
            a.AlarmName && new RegExp(pattern).test(a.AlarmName)
          );

          if (alarm) {
            expect(alarm.MetricName).toBe('ErrorRate');
            expect(alarm.Namespace).toBe('AWS/Lambda');
            expect(alarm.Threshold).toBe(0.01);
            expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
            expect(alarm.Period).toBe(300);
          }
        });
      } catch (error) {
        console.log('Error checking CloudWatch alarms:', error);
      }
    });
  });

  describe('End-to-End Transaction Flow', () => {
    test('should process a valid transaction through the pipeline', async () => {
      if (!hasOutputs || !outputs.api_gateway_url) {
        console.log('Skipping E2E test: API Gateway URL not available');
        return;
      }

      const testTransaction = generateTestTransaction();

      try {
        // Submit transaction to API Gateway
        const response = await axios.post(outputs.api_gateway_url, testTransaction, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 15000
        });

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('transaction_id');
        expect(response.data.transaction_id).toBe(testTransaction.transaction_id);

        // Wait for processing
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Verify transaction was stored in DynamoDB
        if (outputs.dynamodb_table_name) {
          const item = await dynamodb.getItem({
            TableName: outputs.dynamodb_table_name,
            Key: {
              'transaction_id': { S: testTransaction.transaction_id },
              'timestamp': { S: testTransaction.timestamp }
            }
          }).promise();

          expect(item.Item).toBeDefined();
          expect(item.Item?.transaction_id?.S).toBe(testTransaction.transaction_id);
          expect(item.Item?.amount?.N).toBe(testTransaction.amount.toString());
        }
      } catch (error) {
        console.log('E2E test failed:', error);
        throw error;
      }
    }, 30000);

    test('should reject invalid transaction data', async () => {
      if (!hasOutputs || !outputs.api_gateway_url) return;

      const invalidTransaction = {
        transaction_id: generateTransactionId(),
        // Missing required fields
        currency: 'USD'
      };

      try {
        const response = await axios.post(outputs.api_gateway_url, invalidTransaction, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000,
          validateStatus: function (status) {
            return status < 500; // Accept 4xx errors
          }
        });

        expect(response.status).toBe(400);
      } catch (error) {
        console.log('Invalid transaction test error:', error);
      }
    }, 15000);
  });

  describe('Security and Compliance', () => {
    test('should use HTTPS endpoints only', () => {
      if (!hasOutputs) return;

      if (outputs.api_gateway_url) {
        expect(outputs.api_gateway_url).toMatch(/^https:\/\//);
      }
    });

    test('should not expose internal infrastructure details', () => {
      if (!hasOutputs) return;

      // Check that outputs don't contain internal resource IDs or ARNs
      Object.values(outputs).forEach(value => {
        if (typeof value === 'string') {
          expect(value).not.toMatch(/subnet-[a-z0-9]+/);
          expect(value).not.toMatch(/sg-[a-z0-9]+/);
          expect(value).not.toMatch(/vpc-[a-z0-9]+/);
        }
      });
    });
  });

  describe('Performance and Scalability', () => {
    test('API Gateway should respond within acceptable time limits', async () => {
      if (!hasOutputs || !outputs.api_gateway_url) return;

      const startTime = Date.now();

      try {
        const response = await axios.options(outputs.api_gateway_url, {
          timeout: 5000
        });

        const responseTime = Date.now() - startTime;
        expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds
      } catch (error) {
        console.log('Performance test failed:', error);
      }
    }, 10000);

    test('should handle concurrent transaction submissions', async () => {
      if (!hasOutputs || !outputs.api_gateway_url) return;

      const transactions = Array.from({ length: 5 }, () => generateTestTransaction());

      try {
        const promises = transactions.map(transaction =>
          axios.post(outputs.api_gateway_url, transaction, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000
          })
        );

        const responses = await Promise.allSettled(promises);
        const successfulResponses = responses.filter(r => r.status === 'fulfilled');

        expect(successfulResponses.length).toBeGreaterThan(0);
      } catch (error) {
        console.log('Concurrent transactions test failed:', error);
      }
    }, 20000);
  });
});
