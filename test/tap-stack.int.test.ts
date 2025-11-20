import fs from 'fs';
import {
  EMRClient,
  DescribeClusterCommand,
  ListStepsCommand,
  DescribeStepCommand,
} from '@aws-sdk/client-emr';
import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import {
  SFNClient,
  StartExecutionCommand,
  DescribeExecutionCommand,
  GetExecutionHistoryCommand,
  ListExecutionsCommand,
} from '@aws-sdk/client-sfn';
import {
  CloudWatchClient,
  GetMetricStatisticsCommand,
  ListMetricsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  CloudWatchLogsClient,
  DescribeLogStreamsCommand,
  GetLogEventsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import { v4 as uuidv4 } from 'uuid';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Initialize AWS SDK clients
const emrClient = new EMRClient({ region: process.env.AWS_REGION });
const s3Client = new S3Client({ region: process.env.AWS_REGION });
const sfnClient = new SFNClient({ region: process.env.AWS_REGION });
const cloudWatchClient = new CloudWatchClient({ region: process.env.AWS_REGION });
const cloudWatchLogsClient = new CloudWatchLogsClient({ region: process.env.AWS_REGION });

// Test configuration
const POLL_INTERVAL = 30000; // 30 seconds

// Helper function to wait for a condition
const waitFor = async (
  condition: () => Promise<boolean>,
  timeout: number,
  interval: number = POLL_INTERVAL
): Promise<void> => {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  throw new Error('Timeout waiting for condition');
};

// Helper function to create test transaction data
const createTestTransactionData = (): Buffer => {
  // Create CSV test data with transaction records
  const header = 'transaction_id,amount,timestamp,merchant_id,card_number,status\n';
  const rows: string[] = [];
  const testId = uuidv4();
  for (let i = 0; i < 1000; i++) {
    const amount = (Math.random() * 10000).toFixed(2);
    const timestamp = Date.now() - Math.random() * 86400000; // Last 24 hours
    rows.push(
      `${testId}-${i},${amount},${timestamp},MERCHANT_${i % 50},****${Math.floor(Math.random() * 10000)},${Math.random() > 0.9 ? 'FRAUD' : 'VALID'}\n`
    );
  }
  return Buffer.from(header + rows.join(''));
};

describe('EMR Data Processing Pipeline - End-to-End Data Flow Tests', () => {
  const emrClusterId = outputs.EMRClusterId;
  const rawDataBucket = outputs.RawDataBucketName;
  const processedDataBucket = outputs.ProcessedDataBucketName;
  const stateMachineArn = outputs.StateMachineArn;
  const projectName = outputs.ProjectName;
  const environment = outputs.Environment;
  const s3EventProcessorFunctionName = `${projectName}-${environment}-s3-event-processor`;

  let testDataKey: string;
  let testExecutionArn: string | null = null;
  let testStartTime: number;

  beforeAll(async () => {
    testStartTime = Date.now();
    testDataKey = `transactions/test-${uuidv4()}.parquet`;

    console.log('=== Starting End-to-End Data Flow Test ===');
    console.log(`Test Data Key: ${testDataKey}`);
    console.log(`EMR Cluster ID: ${emrClusterId}`);
    console.log(`Raw Data Bucket: ${rawDataBucket}`);
    console.log(`Processed Data Bucket: ${processedDataBucket}`);
    console.log(`State Machine ARN: ${stateMachineArn}`);
  });

  afterAll(async () => {
    // Cleanup test data from S3
    try {
      if (testDataKey) {
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: rawDataBucket,
            Key: testDataKey,
          })
        );
        console.log(`✓ Cleaned up test data: ${testDataKey}`);
      }
    } catch (error) {
      console.warn('Error cleaning up test data:', error);
    }
  });

  describe('Data Ingestion - Upload and Event Trigger', () => {
    test('should upload test transaction data to S3 raw bucket', async () => {
      // Create and upload test transaction data
      const testData = createTestTransactionData();
      const dataSize = testData.length;

      console.log(`Uploading ${dataSize} bytes of test data to S3...`);

      await s3Client.send(
        new PutObjectCommand({
          Bucket: rawDataBucket,
          Key: testDataKey,
          Body: testData,
          ContentType: 'application/octet-stream',
        })
      );

      console.log(`✓ Test data uploaded: s3://${rawDataBucket}/${testDataKey}`);

      // Verify file exists in S3
      const listResponse = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: rawDataBucket,
          Prefix: testDataKey,
        })
      );

      expect(listResponse.Contents).toBeDefined();
      expect(listResponse.Contents!.length).toBeGreaterThan(0);
      expect(listResponse.Contents![0].Key).toBe(testDataKey);
      expect(listResponse.Contents![0].Size).toBe(dataSize);
    });

    test('should trigger Lambda function via S3 object creation event', async () => {
      console.log('Waiting for S3 event to trigger Lambda...');

      const logGroupName = `/aws/lambda/${s3EventProcessorFunctionName}`;

      // Wait for Lambda execution logs to appear
      await waitFor(async () => {
        try {
          const logStreams = await cloudWatchLogsClient.send(
            new DescribeLogStreamsCommand({
              logGroupName,
              orderBy: 'LastEventTime',
              descending: true,
              limit: 5,
            })
          );

          if (logStreams.logStreams && logStreams.logStreams.length > 0) {
            const latestStream = logStreams.logStreams[0];
            if (latestStream.lastEventTimestamp) {
              const streamTime = latestStream.lastEventTimestamp;
              // Check if log stream was created after test start
              if (streamTime >= testStartTime) {
                console.log(`✓ Lambda execution detected in log stream: ${latestStream.logStreamName}`);
                return true;
              }
            }
          }
          return false;
        } catch (error) {
          // Log group might not exist yet, continue waiting
          return false;
        }
      }, 120000); // 2 minutes

      // Verify Lambda was invoked by checking logs
      const logStreams = await cloudWatchLogsClient.send(
        new DescribeLogStreamsCommand({
          logGroupName,
          orderBy: 'LastEventTime',
          descending: true,
          limit: 1,
        })
      );

      expect(logStreams.logStreams).toBeDefined();
      expect(logStreams.logStreams!.length).toBeGreaterThan(0);
    });

    test('should start Step Functions execution from Lambda trigger', async () => {
      console.log('Waiting for Step Functions execution to start...');

      // Wait for Step Functions execution to be created
      await waitFor(async () => {
        try {
          const listResponse = await sfnClient.send(
            new ListExecutionsCommand({
              stateMachineArn,
              maxResults: 10,
            })
          );

          if (listResponse.executions) {
            // Find execution that started after test began
            const recentExecution = listResponse.executions.find(
              (exec) =>
                exec.startDate &&
                exec.startDate.getTime() >= testStartTime
            );

            if (recentExecution) {
              testExecutionArn = recentExecution.executionArn || null;
              console.log(`✓ Step Functions execution started: ${testExecutionArn}`);
              return true;
            }
          }
          return false;
        } catch (error) {
          return false;
        }
      }, 180000); // 3 minutes

      expect(testExecutionArn).toBeDefined();
      expect(testExecutionArn).toContain('execution');
    });
  });

  describe('Pipeline Orchestration - Step Functions State Machine', () => {
    test('should check EMR cluster status before job submission', async () => {
      if (!testExecutionArn) {
        throw new Error('No execution ARN available from previous test');
      }

      console.log('Verifying Step Functions checked EMR cluster status...');

      // Wait for execution to progress
      await new Promise((resolve) => setTimeout(resolve, 10000));

      const historyResponse = await sfnClient.send(
        new GetExecutionHistoryCommand({
          executionArn: testExecutionArn,
          maxResults: 50,
        })
      );

      expect(historyResponse.events).toBeDefined();

      // Verify CheckClusterStatus state was executed
      const checkClusterEvents = historyResponse.events!.filter(
        (e) =>
          e.type === 'TaskStateEntered' &&
          e.stateEnteredEventDetails?.name === 'CheckClusterStatus'
      );

      expect(checkClusterEvents.length).toBeGreaterThan(0);
      console.log('✓ CheckClusterStatus state executed');

      // Verify cluster is in ready state
      const clusterResponse = await emrClient.send(
        new DescribeClusterCommand({ ClusterId: emrClusterId })
      );

      expect(clusterResponse.Cluster).toBeDefined();
      const clusterState = clusterResponse.Cluster!.Status?.State;
      expect(['WAITING', 'RUNNING']).toContain(clusterState);
      console.log(`✓ EMR cluster is in ${clusterState} state`);
    });

    test('should submit Spark job to EMR cluster', async () => {
      if (!testExecutionArn) {
        throw new Error('No execution ARN available from previous test');
      }

      console.log('Waiting for Spark job to be submitted to EMR...');

      // Wait for SubmitSparkJob state to execute
      await waitFor(async () => {
        const historyResponse = await sfnClient.send(
          new GetExecutionHistoryCommand({
            executionArn: testExecutionArn!,
            maxResults: 100,
          })
        );

        const submitJobEvents = historyResponse.events!.filter(
          (e) =>
            e.type === 'TaskStateEntered' &&
            e.stateEnteredEventDetails?.name === 'SubmitSparkJob'
        );

        return submitJobEvents.length > 0;
      }, 300000); // 5 minutes

      // Verify job was submitted
      const historyResponse = await sfnClient.send(
        new GetExecutionHistoryCommand({
          executionArn: testExecutionArn!,
          maxResults: 100,
        })
      );

      const submitJobEvents = historyResponse.events!.filter(
        (e) =>
          e.type === 'TaskStateEntered' &&
          e.stateEnteredEventDetails?.name === 'SubmitSparkJob'
      );

      expect(submitJobEvents.length).toBeGreaterThan(0);
      console.log('✓ Spark job submitted to EMR');

      // Verify EMR step was created
      await waitFor(async () => {
        const stepsResponse = await emrClient.send(
          new ListStepsCommand({
            ClusterId: emrClusterId,
            MaxResults: 10,
          })
        );

        if (stepsResponse.Steps && stepsResponse.Steps.length > 0) {
          // Find step created after test start
          const recentStep = stepsResponse.Steps.find(
            (step) =>
              step.Status?.Timeline?.CreationDateTime &&
              step.Status.Timeline.CreationDateTime.getTime() >= testStartTime
          );

          if (recentStep) {
            console.log(`✓ EMR step created: ${recentStep.Name} (${recentStep.Id})`);
            return true;
          }
        }
        return false;
      }, 300000); // 5 minutes
    });
  });

  describe('Data Processing - EMR Cluster and Spark Job Execution', () => {
    test('should process transaction data through EMR Spark job', async () => {
      console.log('Waiting for EMR to process the data...');

      // Wait for EMR step to complete
      await waitFor(async () => {
        const stepsResponse = await emrClient.send(
          new ListStepsCommand({
            ClusterId: emrClusterId,
            MaxResults: 10,
          })
        );

        if (stepsResponse.Steps) {
          const recentStep = stepsResponse.Steps.find(
            (step) =>
              step.Status?.Timeline?.CreationDateTime &&
              step.Status.Timeline.CreationDateTime.getTime() >= testStartTime
          );

          if (recentStep) {
            const stepDetail = await emrClient.send(
              new DescribeStepCommand({
                ClusterId: emrClusterId,
                StepId: recentStep.Id!,
              })
            );

            const stepState = stepDetail.Step?.Status?.State;
            console.log(`  Step state: ${stepState}`);

            return stepState === 'COMPLETED' || stepState === 'FAILED' || stepState === 'CANCELLED';
          }
        }
        return false;
      }, 600000); // 10 minutes

      // Verify step completed successfully
      const stepsResponse = await emrClient.send(
        new ListStepsCommand({
          ClusterId: emrClusterId,
          MaxResults: 10,
        })
      );

      const recentStep = stepsResponse.Steps!.find(
        (step) =>
          step.Status?.Timeline?.CreationDateTime &&
          step.Status.Timeline.CreationDateTime.getTime() >= testStartTime
      );

      expect(recentStep).toBeDefined();
      const stepState = recentStep!.Status?.State;
      expect(stepState).toBe('COMPLETED');
      console.log(`✓ EMR step completed successfully: ${recentStep!.Name}`);
    });
  });

  describe('Data Output - Processed Results Storage', () => {
    test('should write processed data to S3 output bucket', async () => {
      console.log('Checking for processed data in output bucket...');

      // Wait for processed data to appear
      await waitFor(async () => {
        const listResponse = await s3Client.send(
          new ListObjectsV2Command({
            Bucket: processedDataBucket,
            Prefix: 'results/',
            MaxKeys: 100,
          })
        );

        if (listResponse.Contents && listResponse.Contents.length > 0) {
          // Check if any files were created after test start
          const recentFiles = listResponse.Contents.filter(
            (obj) => obj.LastModified && obj.LastModified.getTime() >= testStartTime
          );

          if (recentFiles.length > 0) {
            console.log(`✓ Found ${recentFiles.length} processed file(s) in output bucket`);
            recentFiles.forEach((file) => {
              console.log(`  - ${file.Key} (${file.Size} bytes)`);
            });
            return true;
          }
        }
        return false;
      }, 300000); // 5 minutes

      // Verify processed data exists
      const listResponse = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: processedDataBucket,
          Prefix: 'results/',
          MaxKeys: 100,
        })
      );

      expect(listResponse.Contents).toBeDefined();
      expect(listResponse.Contents!.length).toBeGreaterThan(0);

      const recentFiles = listResponse.Contents!.filter(
        (obj) => obj.LastModified && obj.LastModified.getTime() >= testStartTime
      );

      expect(recentFiles.length).toBeGreaterThan(0);
      console.log(`✓ Verified ${recentFiles.length} processed file(s) in output bucket`);
    });
  });

  describe('Monitoring & Observability - Metrics and Execution Status', () => {
    test('should publish processing metrics to CloudWatch', async () => {
      console.log('Checking for CloudWatch metrics...');

      const namespace = `${projectName}/${environment}/EMRPipeline`;

      // Wait for metrics to be published
      await waitFor(async () => {
        try {
          const response = await cloudWatchClient.send(
            new ListMetricsCommand({
              Namespace: namespace,
            })
          );

          if (response.Metrics && response.Metrics.length > 0) {
            // Check for specific metrics
            const metricNames = response.Metrics.map((m) => m.MetricName).filter(
              (n): n is string => n !== undefined
            );

            const hasJobDuration = metricNames.includes('JobDuration');
            const hasDataVolume = metricNames.includes('DataVolumeProcessed');
            const hasThroughput = metricNames.includes('ProcessingThroughput');

            if (hasJobDuration || hasDataVolume || hasThroughput) {
              console.log(`✓ Found metrics: ${metricNames.join(', ')}`);
              return true;
            }
          }
          return false;
        } catch (error) {
          return false;
        }
      }, 180000); // 3 minutes

      // Verify metrics exist
      const response = await cloudWatchClient.send(
        new ListMetricsCommand({
          Namespace: namespace,
        })
      );

      expect(response.Metrics).toBeDefined();
      expect(response.Metrics!.length).toBeGreaterThan(0);

      const metricNames = response.Metrics!.map((m) => m.MetricName).filter(
        (n): n is string => n !== undefined
      );

      console.log(`✓ Verified metrics published: ${metricNames.join(', ')}`);
    });

    test('should complete Step Functions execution with all state transitions', async () => {
      if (!testExecutionArn) {
        throw new Error('No execution ARN available from previous test');
      }

      console.log('Waiting for Step Functions execution to complete...');

      // Wait for execution to reach terminal state
      await waitFor(async () => {
        const response = await sfnClient.send(
          new DescribeExecutionCommand({ executionArn: testExecutionArn! })
        );

        const status = response.status;
        console.log(`  Execution status: ${status}`);

        return status === 'SUCCEEDED' || status === 'FAILED' || status === 'TIMED_OUT' || status === 'ABORTED';
      }, 600000); // 10 minutes

      // Verify execution completed successfully
      const response = await sfnClient.send(
        new DescribeExecutionCommand({ executionArn: testExecutionArn! })
      );

      expect(response.status).toBe('SUCCEEDED');
      console.log('✓ Step Functions execution completed successfully');

      // Verify all key states were executed
      const historyResponse = await sfnClient.send(
        new GetExecutionHistoryCommand({
          executionArn: testExecutionArn!,
          maxResults: 200,
        })
      );

      const stateNames = historyResponse
        .events!.filter((e) => e.type === 'TaskStateEntered')
        .map((e) => e.stateEnteredEventDetails?.name)
        .filter((n): n is string => n !== undefined);

      expect(stateNames).toContain('CheckClusterStatus');
      expect(stateNames).toContain('SubmitSparkJob');
      expect(stateNames).toContain('MonitorJob');
      expect(stateNames).toContain('CollectMetrics');
      expect(stateNames).toContain('NotifySuccess');

      console.log(`✓ Verified state transitions: ${stateNames.join(' → ')}`);
    });
  });

  describe('End-to-End Verification - Complete Data Flow Validation', () => {
    test('should verify complete data flow from S3 upload to processed output and metrics', async () => {
      console.log('Completing End-to-End Data Flow Verification');

      // Verify: A) Data uploaded to S3
      const rawDataList = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: rawDataBucket,
          Prefix: testDataKey,
        })
      );
      expect(rawDataList.Contents).toBeDefined();
      expect(rawDataList.Contents!.length).toBeGreaterThan(0);
      console.log('✓ A) Test data uploaded to raw bucket');

      // Verify: B) Step Functions execution completed
      if (testExecutionArn) {
        const execResponse = await sfnClient.send(
          new DescribeExecutionCommand({ executionArn: testExecutionArn })
        );
        expect(execResponse.status).toBe('SUCCEEDED');
        console.log('✓ B) Step Functions execution succeeded');
      }

      // Verify: C) EMR processed the data
      const stepsResponse = await emrClient.send(
        new ListStepsCommand({
          ClusterId: emrClusterId,
          MaxResults: 10,
        })
      );
      const processedStep = stepsResponse.Steps!.find(
        (step) =>
          step.Status?.Timeline?.CreationDateTime &&
          step.Status.Timeline.CreationDateTime.getTime() >= testStartTime &&
          step.Status.State === 'COMPLETED'
      );
      expect(processedStep).toBeDefined();
      console.log('✓ C) EMR processed the data');

      // Verify: D) Processed data in output bucket
      const processedDataList = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: processedDataBucket,
          Prefix: 'results/',
          MaxKeys: 100,
        })
      );
      const recentProcessedFiles = processedDataList.Contents!.filter(
        (obj) => obj.LastModified && obj.LastModified.getTime() >= testStartTime
      );
      expect(recentProcessedFiles.length).toBeGreaterThan(0);
      console.log('✓ D) Processed data written to output bucket');

      // Verify: E) Metrics published
      const namespace = `${projectName}/${environment}/EMRPipeline`;
      const metricsResponse = await cloudWatchClient.send(
        new ListMetricsCommand({ Namespace: namespace })
      );
      expect(metricsResponse.Metrics!.length).toBeGreaterThan(0);
      console.log('✓ E) Metrics published to CloudWatch');

      console.log('=== End-to-End Data Flow Test: PASSED ===');
      console.log('Data successfully flowed: S3 Upload → Lambda → Step Functions → EMR → Processed Output → Metrics');
    });
  });
});
