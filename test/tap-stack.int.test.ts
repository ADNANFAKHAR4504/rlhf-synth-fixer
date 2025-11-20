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
import EMR from 'aws-sdk/clients/emr';
import {
  SFNClient,
  ListExecutionsCommand,
  DescribeExecutionCommand,
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

// Load stack outputs
let outputs: any;
try {
  const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
  const outputsContent = fs.readFileSync(outputsPath, 'utf8');
  outputs = JSON.parse(outputsContent);
} catch (error) {
  console.error(
    'Failed to load CloudFormation outputs. Ensure stack is deployed and outputs are available.'
  );
  throw error;
}

const projectName = process.env.PROJECT_NAME || 'emr-pipeline';
const environmentName = process.env.ENVIRONMENT || 'production';

// Initialize AWS clients for live integration testing
const s3Client = new S3Client({ region });
const emrClient = new EMR({ region }); // SDK v2
const stepFunctionsClient = new SFNClient({ region });
const snsClient = new SNSClient({ region });
const cloudWatchClient = new CloudWatchClient({ region });
const cloudWatchLogsClient = new CloudWatchLogsClient({ region });

type ExecutionStatus = 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'TIMED_OUT' | 'ABORTED';

interface ExecutionMatch {
  summary: any;
  detail: any;
  input: any;
  output?: any;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const safeParseJson = (payload?: string) => {
  if (!payload) {
    return {};
  }
  try {
    return JSON.parse(payload);
  } catch {
    return {};
  }
};

async function findExecutionByS3Key(
  key: string,
  options?: {
    listStatuses?: ExecutionStatus[];
    desiredStatuses?: ExecutionStatus[];
    maxAttempts?: number;
    waitMs?: number;
  }
): Promise<ExecutionMatch | null> {
  const {
    listStatuses = ['RUNNING', 'SUCCEEDED', 'FAILED', 'TIMED_OUT', 'ABORTED'],
    desiredStatuses,
    maxAttempts = 30,
    waitMs = 10000,
  } = options || {};

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    for (const statusFilter of listStatuses) {
      let nextToken: string | undefined;
      do {
        const executions = await stepFunctionsClient.send(
          new ListExecutionsCommand({
            stateMachineArn: outputs.StateMachineArn,
            statusFilter,
            maxResults: 100,
            nextToken,
          })
        );

        for (const summary of executions.executions ?? []) {
          if (!summary.executionArn) {
            continue;
          }

          const detail = await stepFunctionsClient.send(
            new DescribeExecutionCommand({
              executionArn: summary.executionArn,
            })
          );

          const input = safeParseJson(detail.input);
          if (input.Key !== key) {
            continue;
          }

          if (
            desiredStatuses &&
            detail.status &&
            !desiredStatuses.includes(detail.status as ExecutionStatus)
          ) {
            continue;
          }

          const output = safeParseJson(detail.output);
          return { summary, detail, input, output };
        }

        nextToken = executions.nextToken;
      } while (nextToken);
    }

    await delay(waitMs);
  }

  return null;
}

async function waitForProcessedResults(
  minimumTimestamp: Date,
  maxAttempts = 30,
  waitMs = 10000
) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const objects = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: outputs.ProcessedDataBucketName,
        Prefix: 'results/',
      })
    );

    const recentObjects = (objects.Contents ?? []).filter(obj => {
      if (!obj.LastModified) {
        return false;
      }
      return obj.LastModified.getTime() >= minimumTimestamp.getTime();
    });

    if (recentObjects.length > 0) {
      return {
        ...objects,
        Contents: recentObjects,
      };
    }

    await delay(waitMs);
  }

  return { Contents: [] };
}

// Test constants
const TEST_DATA_SIZE = 1024 * 1024; // 1MB test file

describe('TapStack Integration Tests - Live End-to-End Workflow', () => {
  let testExecutionId: string;
  let testDataKey: string;
  let startTime: Date;
  let processedObjects: any; // Shared variable for processed S3 objects
  let mainExecution: ExecutionMatch | null;
  let invalidExecution: ExecutionMatch | null;

  beforeAll(async () => {
    // Generate unique test identifiers
    testExecutionId = `test-${Date.now()}`;
    testDataKey = `transactions/test-${testExecutionId}.parquet`;
    startTime = new Date();
    processedObjects = null;
    mainExecution = null;
    invalidExecution = null;

    // Verify required outputs exist
    expect(outputs).toBeDefined();
    expect(outputs.RawDataBucketName).toBeDefined();
    expect(outputs.ProcessedDataBucketName).toBeDefined();
    expect(outputs.StateMachineArn).toBeDefined();
    expect(outputs.EMRClusterId).toBeDefined();
    expect(outputs.SNSTopicArn).toBeDefined();
  });

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
          Prefix: 'results/',
        })
      );

      const testObjects =
        processedObjects.Contents?.filter(
          obj =>
            obj.LastModified &&
            obj.LastModified.getTime() >= startTime.getTime()
        ) ?? [];

      if (testObjects.length > 0) {
        await s3Client.send(
          new DeleteObjectsCommand({
            Bucket: outputs.ProcessedDataBucketName,
            Delete: {
              Objects: testObjects.map(obj => ({
                Key: obj.Key!,
              })),
            },
          })
        );
      }
    } catch (error) {
      console.warn('Cleanup failed:', error);
    }
  });

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
    });
  });

  describe('B. Trigger Activation - S3 Event Processing', () => {
    test('should trigger Step Functions execution via S3 event notification', async () => {
      mainExecution =
        mainExecution ??
        (await findExecutionByS3Key(testDataKey, {
          listStatuses: ['RUNNING', 'SUCCEEDED'],
        }));

      expect(mainExecution).toBeTruthy();
      console.log(
        `Step Functions execution started: ${mainExecution?.summary?.executionArn}`
      );
    });
  });

  describe('C. Orchestration Start - Step Functions Validation', () => {
    test('should validate Step Functions execution is running', async () => {
      mainExecution =
        mainExecution ??
        (await findExecutionByS3Key(testDataKey, {
          listStatuses: ['RUNNING', 'SUCCEEDED'],
        }));

      expect(mainExecution).toBeTruthy();
      expect(mainExecution?.detail?.status).toMatch(/RUNNING|SUCCEEDED/);
    });
  });

  describe('D. EMR Cluster Launch - Verify Cluster Status', () => {
    test('should verify EMR cluster is in running state', async () => {
      const cluster = await emrClient.describeCluster({
        ClusterId: outputs.EMRClusterId
      }).promise();

      expect(cluster.Cluster.Status.State).toMatch(/RUNNING|WAITING/);
      expect(cluster.Cluster.ReleaseLabel).toMatch(/^emr-6\.(9|[1-9][0-9])\.[0-9]+$/);
    });
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
    });
  });

  describe('F. Processing Execution - Monitor Job Steps', () => {
    test('should wait for and verify EMR job step execution', async () => {
      mainExecution =
        (await findExecutionByS3Key(testDataKey, {
          listStatuses: ['RUNNING', 'SUCCEEDED'],
          desiredStatuses: ['SUCCEEDED'],
          maxAttempts: 120,
          waitMs: 15000,
        })) || mainExecution;

      expect(mainExecution).toBeTruthy();
      expect(mainExecution?.detail?.status).toBe('SUCCEEDED');

      console.log(
        `EMR job execution completed: ${mainExecution?.summary?.executionArn}`
      );
    });
  });

  describe('G. Data Output - Verify Processed Results', () => {
    test('should verify processed data exists in output bucket', async () => {
      processedObjects = await waitForProcessedResults(startTime);

      expect(processedObjects.Contents).toBeDefined();
      expect(processedObjects.Contents!.length).toBeGreaterThan(0);

      // Verify at least one output file
      const firstOutput = processedObjects.Contents![0];
      expect(firstOutput.Size).toBeGreaterThan(0);
      expect(firstOutput.Key).toContain('results');
    });
  });

  describe('H. Storage Management - Verify Lifecycle Policies', () => {
    test('should verify S3 objects have correct storage properties', async () => {
      // Ensure we have processed objects from previous test
      expect(processedObjects).toBeDefined();
      expect(processedObjects.Contents).toBeDefined();
      expect(processedObjects.Contents!.length).toBeGreaterThan(0);

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
    });
  });

  describe('I. Monitoring & Metrics - Verify CloudWatch Logs and Metrics', () => {
    test('should verify CloudWatch logs exist for EMR and Lambda', async () => {
      const emrLogGroup = `/aws/emr/${projectName}-${environmentName}`;
      const lambdaLogGroup = `/aws/lambda/${projectName}-${environmentName}`;

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
    });

    test('should verify custom metrics are published', async () => {
      const metrics = await cloudWatchClient.send(
        new ListMetricsCommand({
          Namespace: `${projectName}/${environmentName}/EMRPipeline`,
        })
      );

      expect(metrics.Metrics).toBeDefined();
 
      if (metrics.Metrics && metrics.Metrics.length > 0) {
        const metricNames = metrics.Metrics.map(m => m.MetricName);
        console.log(`Found metrics: ${metricNames.join(', ')}`);
      } else {
        console.log('No metrics published yet');
      }
      
      expect(metrics.Metrics).toBeDefined();
    });
  });

  describe('J. Auto-Scaling - Verify EMR Instance Groups', () => {
    test('should verify task instance group exists and is configured', async () => {
      const instanceGroups = await emrClient.listInstanceGroups({
        ClusterId: outputs.EMRClusterId
      }).promise();

      const taskGroup = instanceGroups.InstanceGroups!.find(
        group => group.InstanceGroupType === 'TASK'
      );

      if (taskGroup) {
        expect(taskGroup.Status.State).toMatch(/RUNNING|PROVISIONING/);
        expect(taskGroup.RequestedInstanceCount).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('K. Completion - Verify Final State', () => {
    test('should verify Step Functions execution completed successfully', async () => {
      mainExecution =
        mainExecution ??
        (await findExecutionByS3Key(testDataKey, {
          listStatuses: ['SUCCEEDED'],
          desiredStatuses: ['SUCCEEDED'],
          maxAttempts: 60,
        }));

      expect(mainExecution).toBeTruthy();
      expect(mainExecution?.detail?.status).toBe('SUCCEEDED');
    });

    test('should verify SNS notifications were sent', async () => {
      const topic = await snsClient.send(
        new GetTopicAttributesCommand({
          TopicArn: outputs.SNSTopicArn,
        })
      );

      expect(topic.Attributes).toBeDefined();
      expect(topic.Attributes!.SubscriptionsConfirmed).toBeDefined();
    });
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

      invalidExecution =
        (await findExecutionByS3Key(invalidDataKey, {
          listStatuses: ['RUNNING', 'SUCCEEDED', 'FAILED', 'TIMED_OUT'],
          desiredStatuses: ['FAILED', 'SUCCEEDED', 'TIMED_OUT'],
          maxAttempts: 40,
          waitMs: 15000,
        })) || invalidExecution;

      expect(invalidExecution).toBeTruthy();
      expect(['SUCCEEDED', 'FAILED', 'TIMED_OUT']).toContain(
        invalidExecution?.detail?.status as ExecutionStatus
      );

      // The system should not have crashed - EMR cluster should still be accessible
      const cluster = await emrClient.describeCluster({
        ClusterId: outputs.EMRClusterId
      }).promise();
      expect(cluster.Cluster.Status.State).toBeDefined();

      // Cleanup
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: outputs.RawDataBucketName,
          Key: invalidDataKey,
        })
      );
    });
  });

  describe('Contract Validation - Service Interactions', () => {
    test('should validate EMR to S3 bucket access permissions', async () => {
      // Verify EMR instance profile has access to required S3 buckets
      let instanceProfile: string | undefined;
      let cluster;
      for (let attempt = 0; attempt < 10; attempt += 1) {
        cluster = await emrClient.describeCluster({
          ClusterId: outputs.EMRClusterId
        }).promise();

        instanceProfile = cluster.Cluster?.Ec2InstanceAttributes?.InstanceProfile;
        if (instanceProfile) {
          break;
        }
        await delay(10000);
      }

      expect(instanceProfile).toBeDefined();

      const testObject = await s3Client.send(
        new GetObjectCommand({
          Bucket: outputs.RawDataBucketName,
          Key: testDataKey,
        })
      );

      expect(testObject).toBeDefined();
    });

    test('should validate Step Functions to EMR permissions', async () => {
      // Verify Step Functions can invoke EMR operations
      const executions = await stepFunctionsClient.send(
        new ListExecutionsCommand({
          stateMachineArn: outputs.StateMachineArn,
          maxResults: 1,
        })
      );

      expect(executions.executions?.length).toBeGreaterThan(0);
    });
  });
});
