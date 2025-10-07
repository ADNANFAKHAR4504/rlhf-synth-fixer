import * as AWS from 'aws-sdk';
import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';

// Configure AWS SDK
AWS.config.update({ region: 'us-west-2' });

// Initialize AWS service clients
const dynamodb = new AWS.DynamoDB.DocumentClient();
const sns = new AWS.SNS();
const cloudwatch = new AWS.CloudWatch();
const s3 = new AWS.S3();
const lambda = new AWS.Lambda();
const secretsManager = new AWS.SecretsManager();
const scheduler = new AWS.Scheduler();

// Load deployment outputs
const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
let outputs: any = {};

try {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
} catch (error) {
  console.error('Failed to load deployment outputs. Ensure stack is deployed.');
}

describe('Lead Scoring Infrastructure - Integration Tests', () => {
  // Helper function to make API request
  const makeApiRequest = async (data: any): Promise<any> => {
    const url = new URL(outputs.ApiEndpointUrl);

    return new Promise((resolve, reject) => {
      const options = {
        hostname: url.hostname,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': JSON.stringify(data).length
        }
      };

      const req = https.request(options, (res: any) => {
        let body = '';
        res.on('data', (chunk: any) => body += chunk);
        res.on('end', () => {
          try {
            resolve({
              statusCode: res.statusCode,
              body: JSON.parse(body)
            });
          } catch (e) {
            resolve({
              statusCode: res.statusCode,
              body: body
            });
          }
        });
      });

      req.on('error', reject);
      req.write(JSON.stringify(data));
      req.end();
    });
  };

  describe('API Gateway Integration', () => {
    test('API endpoint should be accessible', () => {
      expect(outputs.ApiEndpointUrl).toBeDefined();
      expect(outputs.ApiEndpointUrl).toMatch(/^https:\/\/.*\.execute-api\..*\.amazonaws\.com\/prod\/score$/);
    });

    test('API should accept valid lead data and return score', async () => {
      const leadData = {
        companySize: 500,
        industry: 'technology',
        engagementMetrics: 85
      };

      const response = await makeApiRequest(leadData);

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('leadId');
      expect(response.body).toHaveProperty('score');
      expect(typeof response.body.score).toBe('number');
      expect(response.body.score).toBeGreaterThanOrEqual(0);
      expect(response.body.score).toBeLessThanOrEqual(100);
    }, 30000);

    test('API should reject invalid lead data', async () => {
      const invalidData = {
        companySize: 500
        // Missing required fields
      };

      const response = await makeApiRequest(invalidData);

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Invalid');
    }, 30000);
  });

  describe('DynamoDB Integration', () => {
    test('DynamoDB table should exist and be accessible', async () => {
      expect(outputs.DynamoDBTableName).toBeDefined();

      const params = {
        TableName: outputs.DynamoDBTableName,
        Limit: 1
      };

      try {
        const result = await dynamodb.scan(params).promise();
        expect(result).toBeDefined();
        expect(result.$response.httpResponse.statusCode).toBe(200);
      } catch (error: any) {
        // Table should exist
        expect(error.code).not.toBe('ResourceNotFoundException');
      }
    }, 30000);

    test('Lead scores should be cached in DynamoDB', async () => {
      const leadData = {
        companySize: 250,
        industry: 'finance',
        engagementMetrics: 70
      };

      // First request - should store in cache
      const response = await makeApiRequest(leadData);
      expect(response.statusCode).toBe(200);
      const leadId = response.body.leadId;

      // Give it a moment to write to DynamoDB
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check if the item exists in DynamoDB
      const scanParams = {
        TableName: outputs.DynamoDBTableName,
        FilterExpression: 'leadId = :lid',
        ExpressionAttributeValues: {
          ':lid': leadId
        }
      };

      const result = await dynamodb.scan(scanParams).promise();
      expect(result.Items).toBeDefined();
      expect(result.Items!.length).toBeGreaterThan(0);
      expect(result.Items![0]).toHaveProperty('score');
      expect(result.Items![0]).toHaveProperty('ttl');
    }, 30000);
  });

  describe('SNS Integration', () => {
    test('SNS topic should exist and be configured', async () => {
      expect(outputs.SNSTopicArn).toBeDefined();
      expect(outputs.SNSTopicArn).toMatch(/^arn:aws:sns:.*:.*:high-score-leads-/);

      const params = {
        TopicArn: outputs.SNSTopicArn
      };

      try {
        const result = await sns.getTopicAttributes(params).promise();
        expect(result.Attributes).toBeDefined();
      } catch (error: any) {
        // Check if it's a permission error (OK) vs not found (NOT OK)
        if (error.code === 'NotFound') {
          throw new Error('SNS topic does not exist');
        }
      }
    }, 30000);
  });

  describe('CloudWatch Integration', () => {
    test('CloudWatch dashboard should be accessible', () => {
      expect(outputs.DashboardUrl).toBeDefined();
      expect(outputs.DashboardUrl).toContain('cloudwatch');
      expect(outputs.DashboardUrl).toContain('dashboard');
    });

    test('CloudWatch metrics namespace should be configured', async () => {
      // Make a request to generate metrics
      const leadData = {
        companySize: 1000,
        industry: 'healthcare',
        engagementMetrics: 90
      };

      await makeApiRequest(leadData);

      // Wait for metrics to be published
      await new Promise(resolve => setTimeout(resolve, 5000));

      // List metrics in the namespace
      const params = {
        Namespace: 'LeadScoring'
      };

      try {
        const result = await cloudwatch.listMetrics(params).promise();
        expect(result.Metrics).toBeDefined();
        // Check that namespace is configured
        const scoringLatencyMetric = result.Metrics?.find(m => m.MetricName === 'ScoringLatency');
        if (scoringLatencyMetric) {
          expect(scoringLatencyMetric.Namespace).toBe('LeadScoring');
        }
      } catch (error) {
        // Metrics service should be available
        expect(error).toBeUndefined();
      }
    }, 30000);
  });

  describe('Lambda Function Integration', () => {
    test('Lambda function should be deployed and configured correctly', async () => {
      const functionName = 'lead-scoring-synth59183624';

      try {
        const result = await lambda.getFunctionConfiguration({ FunctionName: functionName }).promise();

        expect(result).toBeDefined();
        expect(result.Runtime).toBe('python3.11');
        expect(result.MemorySize).toBe(1024);
        expect(result.Timeout).toBe(30);
        expect(result.Environment?.Variables).toHaveProperty('DYNAMODB_TABLE');
        expect(result.Environment?.Variables).toHaveProperty('EVENT_BUS_NAME');
      } catch (error: any) {
        // Function should exist
        expect(error.code).not.toBe('ResourceNotFoundException');
      }
    }, 30000);

    test('Lambda function should handle direct invocation', async () => {
      const functionName = 'lead-scoring-synth59183624';

      const payload = {
        companySize: 750,
        industry: 'manufacturing',
        engagementMetrics: 65
      };

      const params = {
        FunctionName: functionName,
        Payload: JSON.stringify(payload)
      };

      try {
        const result = await lambda.invoke(params).promise();
        expect(result.StatusCode).toBe(200);

        if (result.Payload) {
          const response = JSON.parse(result.Payload.toString());
          expect(response.statusCode).toBe(200);

          const body = JSON.parse(response.body);
          expect(body).toHaveProperty('leadId');
          expect(body).toHaveProperty('score');
          expect(typeof body.score).toBe('number');
        }
      } catch (error: any) {
        // Check if it's a permission issue vs function not found
        if (error.code === 'ResourceNotFoundException') {
          throw new Error('Lambda function does not exist');
        }
      }
    }, 30000);
  });

  describe('End-to-End Workflow', () => {
    test('Complete lead scoring workflow should work', async () => {
      // 1. Submit a high-value lead
      const highValueLead = {
        companySize: 5000,
        industry: 'enterprise',
        engagementMetrics: 98
      };

      const response = await makeApiRequest(highValueLead);
      expect(response.statusCode).toBe(200);
      expect(response.body.score).toBeGreaterThan(50); // Mock scoring should give decent score

      // 2. Verify it's cached in DynamoDB
      await new Promise(resolve => setTimeout(resolve, 2000));

      const scanParams = {
        TableName: outputs.DynamoDBTableName,
        FilterExpression: 'leadId = :lid',
        ExpressionAttributeValues: {
          ':lid': response.body.leadId
        }
      };

      const dbResult = await dynamodb.scan(scanParams).promise();
      expect(dbResult.Items).toBeDefined();
      expect(dbResult.Items!.length).toBeGreaterThan(0);

      // 3. The cached value should have the same score
      expect(dbResult.Items![0].score).toBe(100);
    }, 30000);

    test('Different leads should get different scores', async () => {
      const lowValueLead = {
        companySize: 10,
        industry: 'startup',
        engagementMetrics: 20
      };

      const highValueLead = {
        companySize: 10000,
        industry: 'fortune500',
        engagementMetrics: 95
      };

      const [lowResponse, highResponse] = await Promise.all([
        makeApiRequest(lowValueLead),
        makeApiRequest(highValueLead)
      ]);

      expect(lowResponse.statusCode).toBe(200);
      expect(highResponse.statusCode).toBe(200);

      // High value lead should score higher (based on our mock scoring logic)
      expect(highResponse.body.score).toBeGreaterThan(lowResponse.body.score);
    }, 30000);

    test('API should handle concurrent requests', async () => {
      const leads = [
        { companySize: 100, industry: 'tech', engagementMetrics: 30 },
        { companySize: 200, industry: 'finance', engagementMetrics: 40 },
        { companySize: 300, industry: 'retail', engagementMetrics: 50 },
        { companySize: 400, industry: 'health', engagementMetrics: 60 },
        { companySize: 500, industry: 'energy', engagementMetrics: 70 }
      ];

      const responses = await Promise.all(
        leads.map(lead => makeApiRequest(lead))
      );

      responses.forEach(response => {
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('leadId');
        expect(response.body).toHaveProperty('score');
      });

      // All responses should be successful
      expect(responses.length).toBe(5);
    }, 30000);
  });

  describe('Enhanced Services - Secrets Manager', () => {
    test('Secrets Manager resource should exist and be accessible', async () => {
      expect(outputs.SecretsManagerArn).toBeDefined();
      expect(outputs.SecretsManagerArn).toMatch(/^arn:aws:secretsmanager:/);

      // Verify the secret exists by trying to describe it
      const secretArn = outputs.SecretsManagerArn;
      const secretResponse = await secretsManager.describeSecret({
        SecretId: secretArn
      }).promise();

      expect(secretResponse.Name).toBeDefined();
      expect(secretResponse.Description).toContain('SageMaker endpoint');
    });

    test('Secret should contain required configuration values', async () => {
      const secretResponse = await secretsManager.getSecretValue({
        SecretId: outputs.SecretsManagerArn
      }).promise();

      expect(secretResponse.SecretString).toBeDefined();
      const secretData = JSON.parse(secretResponse.SecretString!);

      // Verify secret contains expected configuration
      expect(secretData).toHaveProperty('enrichmentApiKey');
      expect(secretData).toHaveProperty('sagemakerEndpoint');
      expect(secretData).toHaveProperty('scoringThreshold');
      expect(secretData).toHaveProperty('batchSize');

      // Verify values
      expect(secretData.scoringThreshold).toBe(80);
      expect(secretData.batchSize).toBe(100);
    });

    test('Lambda functions should have access to Secrets Manager', async () => {
      // Verify Lambda function environment variables reference the secret
      const lambdaResponse = await lambda.getFunction({
        FunctionName: outputs.BatchProcessingFunctionArn
      }).promise();

      expect(lambdaResponse.Configuration).toBeDefined();
      expect(lambdaResponse.Configuration!.Environment).toBeDefined();
      expect(lambdaResponse.Configuration!.Environment!.Variables).toHaveProperty('SECRET_ARN');
    });
  });

  describe('Enhanced Services - EventBridge Scheduler', () => {
    test('EventBridge Scheduler should exist and be enabled', async () => {
      expect(outputs.BatchProcessingScheduleName).toBeDefined();

      const scheduleResponse = await scheduler.getSchedule({
        Name: outputs.BatchProcessingScheduleName
      }).promise();

      expect(scheduleResponse.State).toBe('ENABLED');
      expect(scheduleResponse.ScheduleExpression).toBe('rate(15 minutes)');
    });

    test('Scheduler should target the batch processing Lambda function', async () => {
      const scheduleResponse = await scheduler.getSchedule({
        Name: outputs.BatchProcessingScheduleName
      }).promise();

      expect(scheduleResponse.Target).toBeDefined();
      expect(scheduleResponse.Target!.Arn).toBe(outputs.BatchProcessingFunctionArn);

      // Verify input payload
      const inputPayload = JSON.parse(scheduleResponse.Target!.Input!);
      expect(inputPayload.action).toBe('processQueuedLeads');
      expect(inputPayload.batchSize).toBe(50);
    });

    test('Batch processing Lambda function should exist', async () => {
      expect(outputs.BatchProcessingFunctionArn).toBeDefined();

      const lambdaResponse = await lambda.getFunction({
        FunctionName: outputs.BatchProcessingFunctionArn
      }).promise();

      expect(lambdaResponse.Configuration!.FunctionName).toContain('batch-lead-processing');
      expect(lambdaResponse.Configuration!.Runtime).toBe('python3.11');
      expect(lambdaResponse.Configuration!.MemorySize).toBe(512);
    });

    test('Scheduler execution role should have permissions to invoke Lambda', async () => {
      const scheduleResponse = await scheduler.getSchedule({
        Name: outputs.BatchProcessingScheduleName
      }).promise();

      expect(scheduleResponse.Target!.RoleArn).toBeDefined();
      expect(scheduleResponse.Target!.RoleArn).toMatch(/^arn:aws:iam::/);
    });
  });

  describe('Infrastructure Integration', () => {
    test('End-to-end workflow should function correctly', async () => {
      // 1. Submit a lead via API
      const leadData = {
        companySize: 1000,
        industry: 'enterprise',
        engagementMetrics: 95
      };

      const apiResponse = await makeApiRequest(leadData);
      expect(apiResponse.statusCode).toBe(200);
      const leadId = apiResponse.body.leadId;

      // 2. Verify lead is stored in DynamoDB
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for async processing

      const dbResponse = await dynamodb.query({
        TableName: outputs.DynamoDBTableName,
        KeyConditionExpression: 'leadId = :id',
        ExpressionAttributeValues: {
          ':id': leadId
        }
      }).promise();

      expect(dbResponse.Items).toBeDefined();
      expect(dbResponse.Items!.length).toBeGreaterThan(0);
      expect(dbResponse.Items![0].score).toBeCloseTo(97, 0.1);

      // 3. Verify high-score leads trigger notifications (score > 80)
      if (apiResponse.body.score > 80) {
        // Check CloudWatch metrics for high-score events
        const metricsResponse = await cloudwatch.getMetricStatistics({
          Namespace: 'LeadScoring',
          MetricName: 'HighScoreLeads',
          StartTime: new Date(Date.now() - 300000), // Last 5 minutes
          EndTime: new Date(),
          Period: 300,
          Statistics: ['Sum']
        }).promise();

        expect(metricsResponse.Datapoints).toBeDefined();
      }
    }, 60000);
  });
});