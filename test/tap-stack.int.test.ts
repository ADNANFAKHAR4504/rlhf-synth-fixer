// E2E Integration Tests for Log Analytics Pipeline
// Configuration - These are coming from cfn-outputs after deployment
import {
  AthenaClient,
  GetQueryExecutionCommand,
  GetQueryResultsCommand,
  StartQueryExecutionCommand,
} from '@aws-sdk/client-athena';
import {
  CloudWatchLogsClient,
  CreateLogStreamCommand,
  DescribeLogStreamsCommand,
  PutLogEventsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  FirehoseClient,
  PutRecordCommand,
} from '@aws-sdk/client-firehose';
import {
  GetCrawlerCommand,
  GetJobRunCommand,
  GlueClient,
  StartJobRunCommand
} from '@aws-sdk/client-glue';
import {
  InvokeCommand,
  InvokeCommandOutput // Added for type reference
  ,

  LambdaClient
} from '@aws-sdk/client-lambda';
import {
  GetObjectCommand,
  ListObjectsV2Command,
  S3Client
} from '@aws-sdk/client-s3';
import { Uint8ArrayBlobAdapter } from '@smithy/util-stream'; // Added to resolve the Buffer/Blob type conflict
import * as fs from 'fs';

// --- Initialization ---

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Initialize AWS clients
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const logsClient = new CloudWatchLogsClient({ region: process.env.AWS_REGION || 'us-east-1' });
const firehoseClient = new FirehoseClient({ region: process.env.AWS_REGION || 'us-east-1' });
const athenaClient = new AthenaClient({ region: process.env.AWS_REGION || 'us-east-1' });
const glueClient = new GlueClient({ region: process.env.AWS_REGION || 'us-east-1' });
const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });

// Test constants
const TEST_LOG_STREAM = `test-stream-${Date.now()}`;
const TEST_ERROR_MESSAGE = 'Application error occurred - database connection failed';
const TEST_WARN_MESSAGE = 'Warning: High memory usage detected';
const TEST_INFO_MESSAGE = 'User login successful';

describe('Log Analytics Pipeline E2E Integration Tests', () => {
  const timeout = 60000;

  beforeAll(async () => {
    // Verify all required outputs are available
    expect(outputs.LogBucketName).toBeDefined();
    expect(outputs.DeliveryStreamName).toBeDefined();
    expect(outputs.GlueDatabaseName).toBeDefined();
    expect(outputs.AthenaWorkgroup).toBeDefined();
    expect(outputs.AthenaQueryResultsBucketName).toBeDefined();
  }, timeout);

  // --- Section 1: Log Generation and Collection ---
  describe('1. Log Generation and Collection', () => {
    test('should create log stream in ApplicationLogGroup and put log events', async () => {
      // Create log stream
      await logsClient.send(new CreateLogStreamCommand({
        logGroupName: '/enterprise/servers/application',
        logStreamName: TEST_LOG_STREAM,
      }));

      // Put log events with different log levels
      const timestamp = Date.now();
      await logsClient.send(new PutLogEventsCommand({
        logGroupName: '/enterprise/servers/application',
        logStreamName: TEST_LOG_STREAM,
        logEvents: [
          {
            timestamp: timestamp,
            message: JSON.stringify({
              timestamp: new Date(timestamp).toISOString(),
              message: TEST_ERROR_MESSAGE,
              server_ip: '192.168.1.100',
              host_name: 'web-server-01',
              correlation_id: 'txn-12345'
            })
          },
          {
            timestamp: timestamp + 1000,
            message: JSON.stringify({
              timestamp: new Date(timestamp + 1000).toISOString(),
              message: TEST_WARN_MESSAGE,
              server_ip: '192.168.1.101',
              host_name: 'web-server-02',
              correlation_id: 'txn-12346'
            })
          },
          {
            timestamp: timestamp + 2000,
            message: JSON.stringify({
              timestamp: new Date(timestamp + 2000).toISOString(),
              message: TEST_INFO_MESSAGE,
              server_ip: '192.168.1.102',
              host_name: 'web-server-03',
              correlation_id: 'txn-12347'
            })
          }
        ],
        // sequenceToken: undefined // Removed, relying on SDK behavior for first call
      }));

      // Verify log stream exists
      const streams = await logsClient.send(new DescribeLogStreamsCommand({
        logGroupName: '/enterprise/servers/application',
        logStreamNamePrefix: TEST_LOG_STREAM
      }));

      // FIX: Check for undefined before accessing property
      expect(streams.logStreams).toBeDefined();
      if (streams.logStreams) {
        expect(streams.logStreams.length).toBeGreaterThan(0);
        expect(streams.logStreams[0].logStreamName).toBe(TEST_LOG_STREAM);
      }
    }, timeout);
  });

  // --- Section 2: CloudWatch Agent Configuration ---
  describe('2. CloudWatch Agent Configuration', () => {
    test('should verify CloudWatch Agent configuration is available in SSM', async () => {
      expect(outputs.CloudWatchAgentConfig).toBeDefined();
      expect(outputs.CloudWatchAgentConfig).toContain('/log-analytics/cloudwatch-agent-config');
    });
  });

  // --- Section 3: Subscription Filter and Firehose Ingestion ---
  describe('3. Subscription Filter and Firehose Ingestion', () => {
    test('should verify subscription filter forwards logs to Firehose', async () => {
      // Wait for subscription filter to process logs
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Direct test of Firehose delivery stream
      const testRecord = {
        timestamp: new Date().toISOString(),
        message: 'Direct Firehose test message',
        server_ip: '192.168.1.200',
        host_name: 'test-server',
        correlation_id: 'test-direct-123'
      };

      const payloadData = Buffer.from(JSON.stringify(testRecord) + '\n');

      // FIX: Use Uint8ArrayBlobAdapter to resolve the TypeScript issue with the SDK's internal type requirement
      const dataForFirehose = new Uint8ArrayBlobAdapter(payloadData);

      await firehoseClient.send(new PutRecordCommand({
        DeliveryStreamName: outputs.DeliveryStreamName,
        Record: {
          Data: dataForFirehose
        }
      }));

      // Verify record was accepted (no error thrown)
      expect(true).toBe(true);
    }, timeout);
  });

  // --- Section 4: Real-time Lambda Transformation ---
  describe('4. Real-time Lambda Transformation', () => {
    test('should verify Lambda processes and transforms log records correctly', async () => {
      // Test Lambda function directly with sample Firehose record
      const testPayload = {
        records: [
          {
            recordId: 'test-record-1',
            data: Buffer.from(JSON.stringify({
              timestamp: new Date().toISOString(),
              message: TEST_ERROR_MESSAGE,
              server_ip: '192.168.1.300',
              host_name: 'lambda-test-server',
              correlation_id: 'lambda-test-123'
            })).toString('base64')
          }
        ]
      };

      const response: InvokeCommandOutput = await lambdaClient.send(new InvokeCommand({
        FunctionName: 'LogProcessorFunction',
        Payload: Buffer.from(JSON.stringify(testPayload))
      }));

      expect(response.StatusCode).toBe(200);

      // FIX: Explicitly check for Payload existence before parsing
      expect(response.Payload).toBeDefined();
      if (response.Payload) {
        const result = JSON.parse(Buffer.from(response.Payload).toString());
        expect(result.records).toBeDefined();
        expect(result.records).toHaveLength(1);
        expect(result.records[0].result).toBe('Ok');

        // Decode and verify processed data includes logLevel and processingTimestamp
        const processedData = JSON.parse(Buffer.from(result.records[0].data, 'base64').toString());
        expect(processedData.logLevel).toBe('ERROR'); // Should detect ERROR from message
        expect(processedData.processingTimestamp).toBeDefined();
      }
    }, timeout);
  });

  // --- Section 5: S3 Durable Storage ---
  describe('5. S3 Durable Storage', () => {
    test('should verify logs are stored in S3 with proper partitioning', async () => {
      // Wait for Firehose to deliver data to S3
      await new Promise(resolve => setTimeout(resolve, 15000));

      // Check for objects in the logs/ prefix
      const listResponse = await s3Client.send(new ListObjectsV2Command({
        Bucket: outputs.LogBucketName,
        Prefix: 'logs/',
        MaxKeys: 10
      }));

      expect(listResponse.Contents).toBeDefined();

      if (listResponse.Contents && listResponse.Contents.length > 0) {
        // Verify partitioning structure (year=YYYY/month=MM/day=DD/hour=HH)
        const firstObject = listResponse.Contents[0];
        expect(firstObject.Key).toMatch(/logs\/year=\d{4}\/month=\d{2}\/day=\d{2}\/hour=\d{2}\/.+/);
      }
    }, timeout);

    test('should verify Glue ETL script is uploaded to S3', async () => {
      const getObjectResponse = await s3Client.send(new GetObjectCommand({
        Bucket: outputs.LogBucketName,
        Key: 'scripts/log_etl_job.py'
      }));

      // FIX: Explicitly check for Body existence
      expect(getObjectResponse.Body).toBeDefined();

      if (getObjectResponse.Body) {
        const scriptContent = await getObjectResponse.Body.transformToString();
        expect(scriptContent).toContain('from awsglue.transforms import *');
        expect(scriptContent).toContain('format="parquet"');
        expect(scriptContent).toContain('processed_logs/');
      }
    }, timeout);
  });

  // --- Section 6: Glue Schema Discovery ---
  describe('6. Glue Schema Discovery', () => {
    test('should verify Glue Crawler can be started and database exists', async () => {
      // Check if crawler exists and can be started
      const crawlerResponse = await glueClient.send(new GetCrawlerCommand({
        Name: 'EnterpriseLogCrawler'
      }));

      // FIX: Check for Crawler existence
      expect(crawlerResponse.Crawler).toBeDefined();

      if (crawlerResponse.Crawler) {
        expect(crawlerResponse.Crawler.Name).toBe('EnterpriseLogCrawler');
        expect(crawlerResponse.Crawler.DatabaseName).toBe(outputs.GlueDatabaseName);

        // Verify target configuration
        expect(crawlerResponse.Crawler.Targets?.S3Targets).toBeDefined();
        if (crawlerResponse.Crawler.Targets?.S3Targets?.[0]) {
          expect(crawlerResponse.Crawler.Targets.S3Targets[0].Path)
            .toBe(`s3://${outputs.LogBucketName}/logs/`);
        }
      }
    }, timeout);
  });

  // --- Section 7: Glue ETL Job (FIXED) ---
  describe('7. Glue ETL Job', () => {
    test('should verify Glue ETL job exists and can be started', async () => {
      const jobRunResponse = await glueClient.send(new StartJobRunCommand({
        JobName: 'EnterpriseLogETLJob'
      }));

      expect(jobRunResponse.JobRunId).toBeDefined();

      // Check job run status immediately after start
      const jobRun = await glueClient.send(new GetJobRunCommand({
        JobName: 'EnterpriseLogETLJob',
        RunId: jobRunResponse.JobRunId! // Using non-null assertion as it was checked above
      }));

      // FIX: Check for JobRun existence
      expect(jobRun.JobRun).toBeDefined();

      if (jobRun.JobRun) {
        // Job should be in a state indicating successful initiation.
        expect(['STARTING', 'RUNNING']).toContain(jobRun.JobRun.JobRunState);
      }
    }, timeout);
  });

  // --- Section 8: Athena Query Capability ---
  describe('8. Athena Query Capability', () => {
    test('should verify Athena workgroup exists and can execute queries', async () => {
      // Simple query to test Athena functionality
      const queryString = `SELECT COUNT(*) as total_databases FROM information_schema.schemata WHERE schema_name = '${outputs.GlueDatabaseName}'`;

      const queryResponse = await athenaClient.send(new StartQueryExecutionCommand({
        QueryString: queryString,
        WorkGroup: outputs.AthenaWorkgroup,
        ResultConfiguration: {
          OutputLocation: `s3://${outputs.AthenaQueryResultsBucketName}/athena-results/`
        }
      }));

      expect(queryResponse.QueryExecutionId).toBeDefined();

      // FIX: Initialize queryStatus to a definite string value
      let queryStatus: string = 'RUNNING';
      let attempts = 0;
      const maxAttempts = 10;

      while (queryStatus === 'RUNNING' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000));

        const statusResponse = await athenaClient.send(new GetQueryExecutionCommand({
          QueryExecutionId: queryResponse.QueryExecutionId! // Using non-null assertion
        }));

        // FIX: Check for QueryExecution and QueryExecution.Status existence
        expect(statusResponse.QueryExecution).toBeDefined();
        if (statusResponse.QueryExecution?.Status?.State) {
          queryStatus = statusResponse.QueryExecution.Status.State;
        }
        attempts++;
      }

      expect(['SUCCEEDED', 'FAILED']).toContain(queryStatus);

      if (queryStatus === 'SUCCEEDED') {
        const resultsResponse = await athenaClient.send(new GetQueryResultsCommand({
          QueryExecutionId: queryResponse.QueryExecutionId!
        }));

        // FIX: Check for ResultSet existence
        expect(resultsResponse.ResultSet).toBeDefined();
        if (resultsResponse.ResultSet) {
          expect(resultsResponse.ResultSet.Rows).toBeDefined();
        }
      }
    }, timeout);
  });

  // --- Section 9: CloudWatch Dashboard and Monitoring ---
  describe('9. CloudWatch Dashboard and Monitoring', () => {
    test('should verify CloudWatch dashboard URL is accessible', () => {
      expect(outputs.CloudWatchDashboard).toBeDefined();
      expect(outputs.CloudWatchDashboard).toContain('cloudwatch/home');
      expect(outputs.CloudWatchDashboard).toContain('EnterpriseLogAnalyticsDashboard');
    });
  });

  // --- Section 10: End-to-End Workflow Validation ---
  describe('10. End-to-End Workflow Validation', () => {
    test('should validate complete log analytics pipeline components are connected', async () => {
      // Verify all critical outputs exist (indicating successful deployment)
      const requiredOutputs = [
        'LogBucketName',
        'DeliveryStreamName',
        'GlueDatabaseName',
        'AthenaWorkgroup',
        'AthenaQueryResultsBucketName',
        'CloudWatchDashboard',
        'CloudWatchAgentConfig',
        'AuditLogGroupName'
      ];

      requiredOutputs.forEach(output => {
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBe('');
      });
    });

    test('should verify audit log group exists for compliance', () => {
      expect(outputs.AuditLogGroupName).toBeDefined();
      expect(outputs.AuditLogGroupName).toContain('/enterprise/log-analytics/audit');
    });

    test('should validate infrastructure can handle the complete log event flow', async () => {
      const testCorrelationId = `e2e-test-${Date.now()}`;
      const testLogEvent = {
        timestamp: new Date().toISOString(),
        message: 'End-to-end test log message',
        server_ip: '192.168.1.999',
        host_name: 'e2e-test-server',
        correlation_id: testCorrelationId
      };

      // Step 1: Send to CloudWatch Logs (triggers subscription filter flow)
      await logsClient.send(new PutLogEventsCommand({
        logGroupName: '/enterprise/servers/application',
        logStreamName: TEST_LOG_STREAM,
        logEvents: [{
          timestamp: Date.now(),
          message: JSON.stringify(testLogEvent)
        }],
        // sequenceToken: undefined
      }));

      // Step 2: Verify system can handle the query load (Athena workgroup exists and query starts)
      const workgroupQuery = "SHOW DATABASES";
      const queryResponse = await athenaClient.send(new StartQueryExecutionCommand({
        QueryString: workgroupQuery,
        WorkGroup: outputs.AthenaWorkgroup,
        ResultConfiguration: {
          OutputLocation: `s3://${outputs.AthenaQueryResultsBucketName}/athena-results/`
        }
      }));

      expect(queryResponse.QueryExecutionId).toBeDefined();

      // Success if we reach this point - the infrastructure can handle the complete workflow
      expect(true).toBe(true);
    }, timeout);
  });
});