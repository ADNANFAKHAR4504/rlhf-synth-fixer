import fs from 'fs';
import axios from 'axios';
import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

AWS.config.update({ region: AWS_REGION });
const dynamodb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();
const stepfunctions = new AWS.StepFunctions();
const sns = new AWS.SNS();
const xray = new AWS.XRay();
const cloudwatch = new AWS.CloudWatch();
const apigateway = new AWS.APIGateway();

describe('Serverless Payment Workflow Integration Tests', () => {
  const API_ENDPOINT = outputs.ApiEndpoint;
  const API_KEY = outputs.ApiKey;
  const STATE_MACHINE_ARN = outputs.StateMachineArn;
  const TRANSACTIONS_TABLE = outputs.TransactionsTableArn.split('/').pop();
  const AUDIT_LOGS_TABLE = outputs.AuditLogsTableArn.split('/').pop();
  const ARCHIVE_BUCKET = outputs.TransactionArchivesBucketArn.split(':::').pop();

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  describe('1. Happy Path Transaction Flow', () => {
    test('Valid Payment Transaction - Complete E2E Flow', async () => {
      const transactionId = `txn-${uuidv4()}`;
      const merchantId = 'M123';
      const amount = 1000;

      const requestPayload = {
        transaction_id: transactionId,
        merchant_id: merchantId,
        customer_id: 'C456',
        amount: amount,
        payment_method: 'credit_card',
        description: 'Test transaction'
      };

      const startTime = Date.now();

      const response = await axios.post(API_ENDPOINT, requestPayload, {
        headers: {
          'x-api-key': API_KEY,
          'Content-Type': 'application/json'
        }
      });

      expect(response.status).toBe(202);
      expect(response.data).toHaveProperty('executionArn');
      expect(response.data).toHaveProperty('status', 'PROCESSING');

      const executionArn = response.data.executionArn;

      await sleep(15000);

      const execution = await stepfunctions.describeExecution({
        executionArn
      }).promise();
      expect(execution.status).toBe('SUCCEEDED');

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(60000);

      const transactionRecord = await dynamodb.get({
        TableName: TRANSACTIONS_TABLE,
        Key: { transaction_id: transactionId }
      }).promise();

      expect(transactionRecord.Item).toBeDefined();
      expect(transactionRecord.Item.merchant_id).toBe(merchantId);
      expect(transactionRecord.Item.amount).toBe(amount);
      expect(transactionRecord.Item.status).toBe('COMPLETED');
      expect(transactionRecord.Item).toHaveProperty('validation_result');
      expect(transactionRecord.Item).toHaveProperty('fraud_result');
      expect(transactionRecord.Item).toHaveProperty('settlement_result');

      const merchantQuery = await dynamodb.query({
        TableName: TRANSACTIONS_TABLE,
        IndexName: 'MerchantIndex',
        KeyConditionExpression: 'merchant_id = :merchant_id',
        ExpressionAttributeValues: {
          ':merchant_id': merchantId
        }
      }).promise();

      expect(merchantQuery.Items.length).toBeGreaterThan(0);
      expect(merchantQuery.Items[0].transaction_id).toBe(transactionId);

      const auditQuery = await dynamodb.scan({
        TableName: AUDIT_LOGS_TABLE,
        FilterExpression: 'transaction_id = :tid',
        ExpressionAttributeValues: {
          ':tid': transactionId
        }
      }).promise();

      expect(auditQuery.Items.length).toBeGreaterThan(0);
      auditQuery.Items.forEach(item => {
        expect(item).toHaveProperty('ttl');
        expect(item.ttl).toBeGreaterThan(Math.floor(Date.now() / 1000));
      });

      const traces = await xray.getTraceSummaries({
        TimeRangeType: 'TimeRangeByStartTime',
        StartTime: new Date(startTime),
        EndTime: new Date()
      }).promise();

      expect(traces.TraceSummaries.length).toBeGreaterThan(0);
    }, 70000);
  });

  describe('2. Fraud Detection Failure Path', () => {
    test('High-Risk Transaction Blocked', async () => {
      const transactionId = `fraud-${uuidv4()}`;
      const requestPayload = {
        transaction_id: transactionId,
        merchant_id: 'M999', 
        customer_id: 'C999',
        amount: 50000,
        payment_method: 'credit_card',
        new_merchant: true
      };

      const response = await axios.post(API_ENDPOINT, requestPayload, {
        headers: {
          'x-api-key': API_KEY,
          'Content-Type': 'application/json'
        }
      });

      expect(response.status).toBe(202);
      const executionArn = response.data.executionArn;

      await sleep(15000);

      const execution = await stepfunctions.describeExecution({
        executionArn
      }).promise();
      expect(execution.status).toBe('SUCCEEDED');

      const transactionRecord = await dynamodb.get({
        TableName: TRANSACTIONS_TABLE,
        Key: { transaction_id: transactionId }
      }).promise();

      expect(transactionRecord.Item.status).toBe('REJECTED');
      expect(transactionRecord.Item.fraud_result.is_fraudulent).toBe(true);
      expect(transactionRecord.Item.fraud_result.risk_score).toBeGreaterThan(0.7);
      expect(transactionRecord.Item.settlement_result.status).toBe('REJECTED');
      expect(transactionRecord.Item.settlement_result.reason).toBe('FRAUD_DETECTED');

      const auditQuery = await dynamodb.scan({
        TableName: AUDIT_LOGS_TABLE,
        FilterExpression: 'transaction_id = :tid AND action = :action',
        ExpressionAttributeValues: {
          ':tid': transactionId,
          ':action': 'SETTLEMENT_COMPLETE'
        }
      }).promise();

      expect(auditQuery.Items.length).toBeGreaterThan(0);
      const details = JSON.parse(auditQuery.Items[0].details);
      expect(details.reason).toBe('FRAUD_DETECTED');
    }, 30000);
  });

  describe('3. API Throttling Scenario', () => {
    test('Rate Limit Enforcement', async () => {
      const concurrentRequests = 50;
      const promises = [];

      for (let i = 0; i < concurrentRequests; i++) {
        const transactionId = `throttle-${i}-${uuidv4()}`;
        const requestPayload = {
          transaction_id: transactionId,
          merchant_id: 'M456',
          customer_id: 'C789',
          amount: 100,
          payment_method: 'credit_card'
        };

        promises.push(
          axios.post(API_ENDPOINT, requestPayload, {
            headers: {
              'x-api-key': API_KEY,
              'Content-Type': 'application/json'
            },
            validateStatus: () => true
          })
        );
      }

      const responses = await Promise.all(promises);
      
      const successful = responses.filter(r => r.status === 202);
      const throttled = responses.filter(r => r.status === 429);

      expect(successful.length).toBeGreaterThan(0);
      
      if (throttled.length > 0) {
        expect(throttled.length).toBeGreaterThan(0);
        expect(throttled[0].status).toBe(429);
      }

      await sleep(5000);

      const metrics = await cloudwatch.getMetricStatistics({
        Namespace: 'AWS/ApiGateway',
        MetricName: '4XXError',
        StartTime: new Date(Date.now() - 300000),
        EndTime: new Date(),
        Period: 300,
        Statistics: ['Sum']
      }).promise();

      expect(metrics.Datapoints).toBeDefined();
    }, 45000);
  });

  describe('4. Lambda Timeout & Retry Path', () => {
    test('Step Functions Retry Mechanism', async () => {
      const transactionId = `retry-${uuidv4()}`;
      const requestPayload = {
        transaction_id: transactionId,
        merchant_id: 'M789',
        customer_id: 'C012',
        amount: 500,
        payment_method: 'credit_card'
      };

      const response = await axios.post(API_ENDPOINT, requestPayload, {
        headers: {
          'x-api-key': API_KEY,
          'Content-Type': 'application/json'
        }
      });

      expect(response.status).toBe(202);
      const executionArn = response.data.executionArn;

      await sleep(20000);

      const execution = await stepfunctions.describeExecution({
        executionArn
      }).promise();
      
      const history = await stepfunctions.getExecutionHistory({
        executionArn,
        maxResults: 1000
      }).promise();

      const taskScheduledEvents = history.events.filter(e => 
        e.type === 'TaskScheduled' || e.type === 'TaskRetryScheduled'
      );
      
      expect(taskScheduledEvents.length).toBeGreaterThan(3);

      const executionTime = new Date(execution.stopDate).getTime() - new Date(execution.startDate).getTime();
      expect(executionTime).toBeLessThan(60000);
    }, 35000);
  });

  describe('5. Data Archival & Retrieval', () => {
    test('S3 Archive Storage with Proper Encryption', async () => {
      const transactionId = `archive-${uuidv4()}`;
      const requestPayload = {
        transaction_id: transactionId,
        merchant_id: 'M456',
        customer_id: 'C789',
        amount: 250,
        payment_method: 'credit_card'
      };

      const response = await axios.post(API_ENDPOINT, requestPayload, {
        headers: {
          'x-api-key': API_KEY,
          'Content-Type': 'application/json'
        }
      });

      expect(response.status).toBe(202);

      await sleep(20000);

      const objects = await s3.listObjectsV2({
        Bucket: ARCHIVE_BUCKET,
        Prefix: `transactions/${transactionId}/`
      }).promise();

      expect(objects.Contents.length).toBeGreaterThan(0);

      const archiveKey = objects.Contents[0].Key;
      const archiveObject = await s3.getObject({
        Bucket: ARCHIVE_BUCKET,
        Key: archiveKey
      }).promise();

      expect(archiveObject.ServerSideEncryption).toBe('AES256');
      expect(archiveObject.ContentType).toBe('application/json');

      const archiveData = JSON.parse(archiveObject.Body.toString());
      expect(archiveData.transaction_id).toBe(transactionId);
      expect(archiveData).toHaveProperty('validation_result');
      expect(archiveData).toHaveProperty('fraud_result');
      expect(archiveData).toHaveProperty('settlement_result');
      expect(archiveData).toHaveProperty('archived_at');

      const bucketInfo = await s3.getBucketVersioning({
        Bucket: ARCHIVE_BUCKET
      }).promise();
      expect(bucketInfo.Status).toBe('Enabled');

      const lifecycleConfig = await s3.getBucketLifecycleConfiguration({
        Bucket: ARCHIVE_BUCKET
      }).promise();
      expect(lifecycleConfig.Rules.length).toBeGreaterThan(0);
      
      const glacierRule = lifecycleConfig.Rules.find(rule => 
        rule.Transitions && rule.Transitions.some(t => t.StorageClass === 'GLACIER')
      );
      expect(glacierRule).toBeDefined();
      expect(glacierRule.Transitions[0].Days).toBe(30);
    }, 40000);
  });

  describe('6. Concurrent Execution Limits', () => {
    test('Reserved Concurrency Handling', async () => {
      const concurrentRequests = 15;
      const promises = [];

      for (let i = 0; i < concurrentRequests; i++) {
        const transactionId = `concurrent-${i}-${uuidv4()}`;
        const requestPayload = {
          transaction_id: transactionId,
          merchant_id: 'M123',
          customer_id: 'C456',
          amount: 100 + i,
          payment_method: 'credit_card'
        };

        promises.push(
          axios.post(API_ENDPOINT, requestPayload, {
            headers: {
              'x-api-key': API_KEY,
              'Content-Type': 'application/json'
            },
            validateStatus: () => true
          })
        );
      }

      const responses = await Promise.all(promises);
      
      const accepted = responses.filter(r => r.status === 202);
      expect(accepted.length).toBeGreaterThan(0);

      await sleep(25000);

      const metrics = await cloudwatch.getMetricStatistics({
        Namespace: 'AWS/Lambda',
        MetricName: 'Throttles',
        StartTime: new Date(Date.now() - 600000),
        EndTime: new Date(),
        Period: 300,
        Statistics: ['Sum']
      }).promise();

      expect(metrics.Datapoints).toBeDefined();

      for (const response of accepted) {
        if (response.status === 202) {
          const executionArn = response.data.executionArn;
          const execution = await stepfunctions.describeExecution({
            executionArn
          }).promise();
          expect(['SUCCEEDED', 'RUNNING', 'FAILED']).toContain(execution.status);
        }
      }
    }, 60000);
  });

  describe('7. GSI Query Performance', () => {
    test('Merchant Transaction Lookup via GSI', async () => {
      const merchantId = `M-${Date.now()}`;
      const transactionCount = 5;
      const transactionIds = [];

      for (let i = 0; i < transactionCount; i++) {
        const transactionId = `gsi-${i}-${uuidv4()}`;
        transactionIds.push(transactionId);
        
        const requestPayload = {
          transaction_id: transactionId,
          merchant_id: merchantId,
          customer_id: `C${i}`,
          amount: 100 + i * 10,
          payment_method: 'credit_card'
        };

        await axios.post(API_ENDPOINT, requestPayload, {
          headers: {
            'x-api-key': API_KEY,
            'Content-Type': 'application/json'
          }
        });
        
        await sleep(2000);
      }

      await sleep(30000);

      const startTime = Date.now();
      const results = await dynamodb.query({
        TableName: TRANSACTIONS_TABLE,
        IndexName: 'MerchantIndex',
        KeyConditionExpression: 'merchant_id = :merchant_id',
        ExpressionAttributeValues: {
          ':merchant_id': merchantId
        }
      }).promise();
      const queryTime = Date.now() - startTime;

      expect(results.Items.length).toBe(transactionCount);
      expect(queryTime).toBeLessThan(1000);
      expect(results.ScannedCount).toBe(results.Count);
      
      results.Items.forEach(item => {
        expect(item.merchant_id).toBe(merchantId);
        expect(transactionIds).toContain(item.transaction_id);
      });

      if (results.Items.length > 1) {
        const paginatedResults = await dynamodb.query({
          TableName: TRANSACTIONS_TABLE,
          IndexName: 'MerchantIndex',
          KeyConditionExpression: 'merchant_id = :merchant_id',
          ExpressionAttributeValues: {
            ':merchant_id': merchantId
          },
          Limit: 2
        }).promise();
        
        expect(paginatedResults.Items.length).toBe(2);
        expect(paginatedResults).toHaveProperty('LastEvaluatedKey');
      }
    }, 90000);
  });

  describe('8. Missing API Key Authentication', () => {
    test('Unauthorized Request Handling', async () => {
      const transactionId = `unauth-${uuidv4()}`;
      const requestPayload = {
        transaction_id: transactionId,
        merchant_id: 'M123',
        customer_id: 'C456',
        amount: 100,
        payment_method: 'credit_card'
      };

      const response = await axios.post(API_ENDPOINT, requestPayload, {
        headers: {
          'Content-Type': 'application/json'
        },
        validateStatus: () => true
      });

      expect(response.status).toBe(403);
      expect(response.data).toHaveProperty('message');

      const transactionCheck = await dynamodb.get({
        TableName: TRANSACTIONS_TABLE,
        Key: { transaction_id: transactionId }
      }).promise();
      
      expect(transactionCheck.Item).toBeUndefined();

      await sleep(5000);
      
      const metrics = await cloudwatch.getMetricStatistics({
        Namespace: 'AWS/ApiGateway',
        MetricName: '4XXError',
        StartTime: new Date(Date.now() - 300000),
        EndTime: new Date(),
        Period: 300,
        Statistics: ['Sum']
      }).promise();

      expect(metrics.Datapoints).toBeDefined();
    }, 15000);
  });

  describe('9. SSM Parameter Integration', () => {
    test('Environment Variables from Lambda Functions', async () => {
      const lambda = new AWS.Lambda();
      
      const validatorFunction = await lambda.getFunction({
        FunctionName: `TapStack${environmentSuffix}-validator-prod`
      }).promise();

      const envVars = validatorFunction.Configuration.Environment.Variables;
      expect(envVars).toHaveProperty('TRANSACTIONS_TABLE');
      expect(envVars).toHaveProperty('AUDIT_LOGS_TABLE');
      expect(envVars).toHaveProperty('ENVIRONMENT');
      expect(envVars).toHaveProperty('TTL_DAYS');
      expect(envVars.TTL_DAYS).toBe('90');

      const fraudFunction = await lambda.getFunction({
        FunctionName: `TapStack${environmentSuffix}-fraud-detector-prod`
      }).promise();

      expect(fraudFunction.Configuration.Environment.Variables).toHaveProperty('TRANSACTIONS_TABLE');

      const transactionId = `param-${uuidv4()}`;
      const requestPayload = {
        transaction_id: transactionId,
        merchant_id: 'M123',
        customer_id: 'C456',
        amount: 100,
        payment_method: 'credit_card'
      };

      const response = await axios.post(API_ENDPOINT, requestPayload, {
        headers: {
          'x-api-key': API_KEY,
          'Content-Type': 'application/json'
        }
      });

      expect(response.status).toBe(202);

      await sleep(15000);

      const auditQuery = await dynamodb.scan({
        TableName: AUDIT_LOGS_TABLE,
        FilterExpression: 'transaction_id = :tid',
        ExpressionAttributeValues: {
          ':tid': transactionId
        }
      }).promise();

      expect(auditQuery.Items.length).toBeGreaterThan(0);
      auditQuery.Items.forEach(item => {
        expect(item.ttl).toBeGreaterThan(Math.floor(Date.now() / 1000) + (89 * 24 * 60 * 60));
      });
    }, 30000);
  });

  describe('10. End-to-End Observability', () => {
    test('Complete Transaction Tracing with X-Ray', async () => {
      const transactionId = `trace-${uuidv4()}`;
      const requestPayload = {
        transaction_id: transactionId,
        merchant_id: 'M123',
        customer_id: 'C456',
        amount: 1500,
        payment_method: 'credit_card'
      };

      const startTime = new Date();
      
      const response = await axios.post(API_ENDPOINT, requestPayload, {
        headers: {
          'x-api-key': API_KEY,
          'Content-Type': 'application/json'
        }
      });

      expect(response.status).toBe(202);

      await sleep(20000);

      const traces = await xray.getTraceSummaries({
        TimeRangeType: 'TimeRangeByStartTime',
        StartTime: startTime,
        EndTime: new Date()
      }).promise();

      expect(traces.TraceSummaries.length).toBeGreaterThan(0);
      
      const traceId = traces.TraceSummaries[0].Id;
      const traceDetails = await xray.getTraceGraph({
        TraceIds: [traceId]
      }).promise();

      expect(traceDetails.Services.length).toBeGreaterThan(0);
      
      const serviceNames = traceDetails.Services.map(s => s.Name);
      expect(serviceNames).toContain(expect.stringContaining('lambda'));
      expect(serviceNames).toContain(expect.stringContaining('states'));

      const segments = traceDetails.Services.flatMap(s => s.Edges || []);
      expect(segments.length).toBeGreaterThan(0);

      const latencyStats = traces.TraceSummaries.map(t => t.ResponseTime);
      const p99 = latencyStats.sort((a, b) => b - a)[Math.floor(latencyStats.length * 0.01)];
      const p50 = latencyStats.sort((a, b) => a - b)[Math.floor(latencyStats.length * 0.5)];
      
      expect(p50).toBeLessThan(30);
      expect(p99).toBeLessThan(60);
    }, 45000);
  });

  describe('11. Disaster Recovery', () => {
    test('Point-in-Time Recovery Validation', async () => {
      const transactionId = `pitr-${uuidv4()}`;
      const requestPayload = {
        transaction_id: transactionId,
        merchant_id: 'M123',
        customer_id: 'C456',
        amount: 750,
        payment_method: 'credit_card'
      };

      const response = await axios.post(API_ENDPOINT, requestPayload, {
        headers: {
          'x-api-key': API_KEY,
          'Content-Type': 'application/json'
        }
      });

      expect(response.status).toBe(202);

      await sleep(15000);

      const transactionRecord = await dynamodb.get({
        TableName: TRANSACTIONS_TABLE,
        Key: { transaction_id: transactionId }
      }).promise();

      expect(transactionRecord.Item).toBeDefined();

      const tableDescription = await dynamodb.describeTable({
        TableName: TRANSACTIONS_TABLE
      }).promise();

      expect(tableDescription.Table.RestoreSummary || 
             tableDescription.Table.PointInTimeRecoveryDescription.PointInTimeRecoveryStatus).toBe('ENABLED');

      const continuousBackups = await dynamodb.describeContinuousBackups({
        TableName: TRANSACTIONS_TABLE
      }).promise();

      expect(continuousBackups.ContinuousBackupsDescription.PointInTimeRecoveryDescription.PointInTimeRecoveryStatus).toBe('ENABLED');
      expect(continuousBackups.ContinuousBackupsDescription.PointInTimeRecoveryDescription.EarliestRestorableDateTime).toBeDefined();

      const objects = await s3.listObjectsV2({
        Bucket: ARCHIVE_BUCKET,
        Prefix: `transactions/${transactionId}/`
      }).promise();

      expect(objects.Contents.length).toBeGreaterThan(0);

      const auditQuery = await dynamodb.scan({
        TableName: AUDIT_LOGS_TABLE,
        FilterExpression: 'transaction_id = :tid',
        ExpressionAttributeValues: {
          ':tid': transactionId
        }
      }).promise();

      expect(auditQuery.Items.length).toBeGreaterThan(0);
      
      const auditActions = auditQuery.Items.map(item => item.action);
      expect(auditActions).toContain('VALIDATION_ATTEMPT');
      expect(auditActions).toContain('FRAUD_DETECTION_ATTEMPT');
      expect(auditActions).toContain('SETTLEMENT_ATTEMPT');
      expect(auditActions).toContain('NOTIFICATION_ATTEMPT');
    }, 30000);
  });
});
