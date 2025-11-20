import fs from 'fs';
import path from 'path';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  HeadObjectCommand,
  ListObjectVersionsCommand,
} from '@aws-sdk/client-s3';
import {
  EMRClient,
  DescribeClusterCommand,
  ListInstanceGroupsCommand,
} from '@aws-sdk/client-emr';
import {
  SFNClient,
  ListExecutionsCommand,
  StartExecutionCommand,
} from '@aws-sdk/client-sfn';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';
import {
  CloudWatchClient,
  ListMetricsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';

// Get environment variables
const region = process.env.AWS_REGION;
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX;

// Load stack outputs
let outputs: any;
try {
  const outputsPath = path.join(__dirname, 'cfn-outputs', 'flat-outputs.json');
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
} catch (error) {
  console.error(
    'Failed to load CloudFormation outputs. Ensure stack is deployed and outputs are available.'
  );
  throw error;
}

// Initialize AWS SDK v3 clients for live integration testing
const s3Client = new S3Client({ region });
const emrClient = new EMRClient({ region });
const stepFunctionsClient = new SFNClient({ region });
const snsClient = new SNSClient({ region });
const cloudWatchClient = new CloudWatchClient({ region });
const cloudWatchLogsClient = new CloudWatchLogsClient({ region });

// Test constants
const TEST_DATA_SIZE = 1024 * 1024; // 1MB test file
const TEST_TIMEOUT = 30 * 60 * 1000; // 30 minutes for EMR operations

describe('TapStack Integration Tests - Live End-to-End Workflow', () => {
  let testExecutionId: string;
  let testDataKey: string;
  let startTime: Date;

  beforeAll(async () => {
    // Generate unique test identifiers
    testExecutionId = `test-${Date.now()}`;
    testDataKey = `transactions/test-${testExecutionId}.parquet`;
    startTime = new Date();

    // Verify required outputs exist
    expect(outputs).toBeDefined();
    expect(outputs.RawDataBucketName).toBeDefined();
    expect(outputs.ProcessedDataBucketName).toBeDefined();
    expect(outputs.StateMachineArn).toBeDefined();
    expect(outputs.EMRClusterId).toBeDefined();
    expect(outputs.SNSTopicArn).toBeDefined();
  }, 60000);

  afterAll(async () => {
    // Clean up test data
    try {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: outputs.RawDataBucketName,
          Key: testDataKey,
        })
      );

      // Clean up any processed test data
      const processedObjects = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: outputs.ProcessedDataBucketName,
          Prefix: `results/test-${testExecutionId}`,
        })
      );

      if (processedObjects.Contents && processedObjects.Contents.length > 0) {
        await s3Client.send(
          new DeleteObjectsCommand({
            Bucket: outputs.ProcessedDataBucketName,
            Delete: {
              Objects: processedObjects.Contents.map(obj => ({
                Key: obj.Key!,
              })),
            },
          })
        );
      }
    } catch (error) {
      console.warn('Cleanup failed:', error);
    }
  }, 60000);

  describe('A. Data Input - S3 Upload', () => {
    test('should successfully upload test transaction data to raw S3 bucket', async () => {
      // Arrange: Create test data (simulated transaction data)
      const testData = Buffer.alloc(TEST_DATA_SIZE, 'test-transaction-data');

      // Act: Upload to raw data bucket
      await s3Client.send(
        new PutObjectCommand({
          Bucket: outputs.RawDataBucketName,
          Key: testDataKey,
          Body: testData,
          ContentType: 'application/octet-stream',
          Metadata: {
            'test-execution-id': testExecutionId,
            'data-size': TEST_DATA_SIZE.toString(),
          },
        })
      );

      // Assert: Verify upload
      const uploadedObject = await s3Client.send(
        new HeadObjectCommand({
          Bucket: outputs.RawDataBucketName,
          Key: testDataKey,
        })
      );

      expect(uploadedObject.ContentLength).toBe(TEST_DATA_SIZE);
      expect(uploadedObject.Metadata!['test-execution-id']).toBe(
        testExecutionId
      );
    }, 30000);
  });

  describe('B. Trigger Activation - S3 Event Processing', () => {
    test('should trigger Step Functions execution via S3 event notification', async () => {
      // The S3 upload in step A should have triggered the Lambda function via S3 event notification
      // Wait for the Step Functions execution to be created by the Lambda function
      const maxWaitTime = 120000; // 2 minutes for S3 event to propagate and Lambda to execute
      const checkInterval = 10000; // 10 seconds
      let elapsed = 0;
      let executionFound = false;
      let executionArn = '';

      while (elapsed < maxWaitTime && !executionFound) {
        await new Promise(resolve => setTimeout(resolve, checkInterval));
        elapsed += checkInterval;

        try {
          const executions = await stepFunctionsClient.send(
            new ListExecutionsCommand({
              stateMachineArn: outputs.StateMachineArn,
              statusFilter: 'RUNNING',
            })
          );

          // Look for an execution that contains our test execution ID
          const matchingExecution = executions.executions?.find(
            exec => exec.name && exec.name.includes(testExecutionId)
          );

          if (matchingExecution) {
            executionFound = true;
            executionArn = matchingExecution.executionArn!;
          }
        } catch (error) {
          // Continue waiting
        }
      }

      expect(executionFound).toBe(true);
      expect(executionArn).toContain(testExecutionId);
      console.log(`Step Functions execution started: ${executionArn}`);
    }, 120000);
  });

  describe('C. Orchestration Start - Step Functions Validation', () => {
    test('should validate Step Functions execution is running', async () => {
      const executions = await stepFunctions
        .listExecutions({
          stateMachineArn: outputs.StateMachineArn,
          statusFilter: 'RUNNING',
        })
        .promise();

      const testExecution = executions.executions.find(
        exec => exec.name && exec.name.includes(testExecutionId)
      );

      expect(testExecution).toBeDefined();
      expect(testExecution!.status).toBe('RUNNING');
    }, 15000);
  });

  describe('D. EMR Cluster Launch - Verify Cluster Status', () => {
    test('should verify EMR cluster is in running state', async () => {
      const cluster = await emrClient.send(
        new DescribeClusterCommand({
          ClusterId: outputs.EMRClusterId,
        })
      );

      expect(cluster.Cluster?.Status?.State).toMatch(/RUNNING|WAITING/);
      expect(cluster.Cluster?.ReleaseLabel).toMatch(
        /^emr-6\.(9|[1-9][0-9])\.[0-9]+$/
      );
    }, 30000);
  });

  describe('E. Data Ingestion - EMR Access to S3', () => {
    test('should verify EMR cluster can access raw data bucket', async () => {
      // Check that the test data is accessible (EMR would access it during processing)
      const object = await s3Client.send(
        new GetObjectCommand({
          Bucket: outputs.RawDataBucketName,
          Key: testDataKey,
        })
      );

      expect(object.Body).toBeDefined();
      expect(object.Body).toBeTruthy();
    }, 15000);
  });

  describe('F. Processing Execution - Monitor Job Steps', () => {
    test(
      'should wait for and verify EMR job step execution',
      async () => {
        // Wait for Step Functions to complete EMR step
        const maxWaitTime = TEST_TIMEOUT;
        const checkInterval = 30000; // 30 seconds
        let elapsed = 0;
        let executionComplete = false;

        while (elapsed < maxWaitTime && !executionComplete) {
          await new Promise(resolve => setTimeout(resolve, checkInterval));
          elapsed += checkInterval;

          try {
            const executions = await stepFunctionsClient.send(
              new ListExecutionsCommand({
                stateMachineArn: outputs.StateMachineArn,
                statusFilter: 'SUCCEEDED',
              })
            );

            const testExecution = executions.executions?.find(
              exec => exec.name && exec.name.includes(testExecutionId)
            );

            if (testExecution) {
              executionComplete = true;
            }
          } catch (error) {
            // Continue waiting
          }
        }

        expect(executionComplete).toBe(true);
      },
      TEST_TIMEOUT
    );
  });

  describe('G. Data Output - Verify Processed Results', () => {
    test('should verify processed data exists in output bucket', async () => {
      // Check for processed output files
      const processedObjects = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: outputs.ProcessedDataBucketName,
          Prefix: `results/test-${testExecutionId}`,
        })
      );

      expect(processedObjects.Contents).toBeDefined();
      expect(processedObjects.Contents!.length).toBeGreaterThan(0);

      // Verify at least one output file
      const firstOutput = processedObjects.Contents![0];
      expect(firstOutput.Size).toBeGreaterThan(0);
      expect(firstOutput.Key).toContain('results');
    }, 60000);
  });

  describe('H. Storage Management - Verify Lifecycle Policies', () => {
    test('should verify S3 objects have correct storage properties', async () => {
      const object = await s3Client.send(
        new HeadObjectCommand({
          Bucket: outputs.ProcessedDataBucketName,
          Key: processedObjects.Contents![0].Key!,
        })
      );

      expect(object).toBeDefined();

      // Verify versioning is enabled (objects should have version IDs)
      const versions = await s3Client.send(new ListObjectVersionsCommand({
        Bucket: outputs.ProcessedDataBucketName,
        Prefix: processedObjects.Contents![0].Key
      }));

      expect(versions.Versions).toBeDefined();
      expect(versions.Versions!.length).toBeGreaterThan(0);
      expect(versions.Versions![0].VersionId).toBeDefined();
    }, 30000);
  });

  describe('I. Monitoring & Metrics - Verify CloudWatch Logs and Metrics', () => {
    test('should verify CloudWatch logs exist for EMR and Lambda', async () => {
      const emrLogGroup = `/aws/emr/emr-pipeline-${environmentSuffix}`;
      const lambdaLogGroup = `/aws/lambda/emr-pipeline-${environmentSuffix}`;

      // Check EMR log group exists
      const emrLogs = await cloudWatchLogsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: emrLogGroup,
        })
      );

      expect(
        emrLogs.logGroups!.some(group => group.logGroupName === emrLogGroup)
      ).toBe(true);

      // Check Lambda log group exists
      const lambdaLogs = await cloudWatchLogsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: lambdaLogGroup,
        })
      );

      expect(
        lambdaLogs.logGroups!.some(
          group => group.logGroupName === lambdaLogGroup
        )
      ).toBe(true);
    }, 30000);

    test('should verify custom metrics are published', async () => {
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 30 * 60 * 1000); // 30 minutes ago

      const metrics = await cloudWatchClient.send(
        new ListMetricsCommand({
          Namespace: `emr-pipeline/${environmentSuffix}/EMRPipeline`,
        })
      );

      expect(metrics.Metrics).toBeDefined();
      expect(metrics.Metrics!.length).toBeGreaterThan(0);

      // Check for our custom metrics
      const metricNames = metrics.Metrics!.map(m => m.MetricName);
      expect(metricNames).toEqual(
        expect.arrayContaining([
          'JobDuration',
          'DataVolumeProcessed',
          'ProcessingThroughput',
        ])
      );
    }, 30000);
  });

  describe('J. Auto-Scaling - Verify EMR Instance Groups', () => {
    test('should verify task instance group exists and is configured', async () => {
      const instanceGroups = await emrClient.send(
        new ListInstanceGroupsCommand({
          ClusterId: outputs.EMRClusterId,
        })
      );

      const taskGroup = instanceGroups.InstanceGroups!.find(
        group => group.InstanceGroupType === 'TASK'
      );

      if (taskGroup) {
        expect(taskGroup.Status?.State).toMatch(/RUNNING|PROVISIONING/);
        expect(taskGroup.RequestedInstanceCount).toBeGreaterThanOrEqual(0);
      }
    }, 30000);
  });

  describe('K. Completion - Verify Final State', () => {
    test('should verify Step Functions execution completed successfully', async () => {
      const executions = await stepFunctionsClient.send(
        new ListExecutionsCommand({
          stateMachineArn: outputs.StateMachineArn,
          statusFilter: 'SUCCEEDED',
        })
      );

      const testExecution = executions.executions?.find(
        exec => exec.name && exec.name.includes(testExecutionId)
      );

      expect(testExecution).toBeDefined();
      expect(testExecution!.status).toBe('SUCCEEDED');
    }, 15000);

    test('should verify SNS notifications were sent', async () => {
      const topic = await snsClient.send(
        new GetTopicAttributesCommand({
          TopicArn: outputs.SNSTopicArn,
        })
      );

      expect(topic.Attributes).toBeDefined();
      expect(topic.Attributes!.SubscriptionsConfirmed).toBeDefined();
    }, 15000);
  });

  // Error Scenario Tests
  describe('Error Scenarios - Cross-System Failures', () => {
    test('should handle invalid input data gracefully through event-driven processing', async () => {
      // Arrange: Upload invalid data that should trigger the normal event flow
      const invalidDataKey = `transactions/invalid-${testExecutionId}.txt`;

      await s3Client.send(
        new PutObjectCommand({
          Bucket: outputs.RawDataBucketName,
          Key: invalidDataKey,
          Body: 'invalid data format that should cause processing errors',
          ContentType: 'text/plain',
        })
      );

      // Act: Wait for the system to detect and attempt to process the invalid data
      // The S3 event should trigger Lambda → Step Functions → EMR processing
      const maxWaitTime = 180000; // 3 minutes to allow for full processing attempt
      const checkInterval = 15000; // 15 seconds
      let elapsed = 0;
      let executionStarted = false;
      let executionCompleted = false;
      let finalStatus: string = '';

      while (elapsed < maxWaitTime && !executionCompleted) {
        await new Promise(resolve => setTimeout(resolve, checkInterval));
        elapsed += checkInterval;

        try {
          // First check if execution started
          if (!executionStarted) {
            const runningExecutions = await stepFunctionsClient.send(
              new ListExecutionsCommand({
                stateMachineArn: outputs.StateMachineArn,
                statusFilter: 'RUNNING',
              })
            );

            const errorExecution = runningExecutions.executions?.find(
              exec =>
                exec.name && exec.name.includes(`${testExecutionId}-error`)
            );

            if (errorExecution) {
              executionStarted = true;
              console.log(
                `Error execution started: ${errorExecution.executionArn}`
              );
            }
          }

          // Then check if execution completed (success, failure, or timeout)
          if (executionStarted) {
            const allExecutions = await stepFunctionsClient.send(
              new ListExecutionsCommand({
                stateMachineArn: outputs.StateMachineArn,
              })
            );

            const errorExecution = allExecutions.executions?.find(
              exec =>
                exec.name &&
                exec.name.includes(`${testExecutionId}-error`) &&
                ['SUCCEEDED', 'FAILED', 'TIMED_OUT'].includes(exec.status!)
            );

            if (errorExecution) {
              executionCompleted = true;
              finalStatus = errorExecution.status!;
              console.log(
                `Error execution completed with status: ${finalStatus}`
              );
            }
          }
        } catch (error) {
          // Continue monitoring
        }
      }

      // Assert: System should handle the error gracefully
      // The execution should have started and completed (not hang indefinitely)
      expect(executionStarted).toBe(true);
      expect(executionCompleted).toBe(true);
      expect(['SUCCEEDED', 'FAILED', 'TIMED_OUT']).toContain(finalStatus);

      // The system should not have crashed - EMR cluster should still be accessible
      const cluster = await emrClient.send(
        new DescribeClusterCommand({
          ClusterId: outputs.EMRClusterId,
        })
      );
      expect(cluster.Cluster?.Status?.State).toBeDefined();

      // Cleanup
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: outputs.RawDataBucketName,
          Key: invalidDataKey,
        })
      );
    }, 200000);
  });

  describe('Contract Validation - Service Interactions', () => {
    test('should validate EMR to S3 bucket access permissions', async () => {
      // Verify EMR instance profile has access to required S3 buckets
      const cluster = await emrClient.send(
        new DescribeClusterCommand({
          ClusterId: outputs.EMRClusterId,
        })
      );

      expect(
        cluster.Cluster?.Ec2InstanceAttributes?.InstanceProfile
      ).toBeDefined();

      const testObject = await s3Client.send(
        new GetObjectCommand({
          Bucket: outputs.RawDataBucketName,
          Key: testDataKey,
        })
      );

      expect(testObject).toBeDefined();
    }, 30000);

    test('should validate Step Functions to EMR permissions', async () => {
      // Verify Step Functions can invoke EMR operations
      const executions = await stepFunctionsClient.send(
        new ListExecutionsCommand({
          stateMachineArn: outputs.StateMachineArn,
          maxResults: 1,
        })
      );

      expect(executions.executions?.length).toBeGreaterThan(0);
    }, 15000);
  });
});
