// Configuration - These are coming from cfn-outputs after cdk deploy
import AWS from 'aws-sdk';
import fs from 'fs';
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Initialize AWS services
const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB.DocumentClient();
const batch = new AWS.Batch();
const sns = new AWS.SNS();

// Helper function to extract job definition name from ARN
const getJobDefinitionName = (arn: string): string => {
  // ARN format: arn:aws:batch:region:account:job-definition/name:revision
  const parts = arn.split('/');
  if (parts.length > 1) {
    // Remove revision number if present
    return parts[1].split(':')[0];
  }
  return arn;
};

// Helper to wait with exponential backoff
const waitForCondition = async (
  checkFn: () => Promise<boolean>,
  maxAttempts = 10,
  delayMs = 2000
): Promise<boolean> => {
  for (let i = 0; i < maxAttempts; i++) {
    if (await checkFn()) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs * (i + 1)));
  }
  return false;
};

describe('Batch Processing System Integration Tests', () => {
  let transactionDataBucket: string;
  let processedDataBucket: string;
  let jobStatusTable: string;
  let auditLogTable: string;
  let jobQueue: string;
  let jobDefinition: string;
  let snsTopicArn: string;

  beforeAll(async () => {
    // Extract outputs from deployment
    transactionDataBucket = outputs.TransactionDataBucketName;
    processedDataBucket = outputs.ProcessedDataBucketName;
    jobStatusTable = outputs.JobStatusTableName;
    auditLogTable = outputs.AuditLogTableName;
    jobQueue = outputs.BatchJobQueueArn;
    jobDefinition = outputs.BatchJobDefinitionArn;
    snsTopicArn = outputs.SNSTopicArn;

    console.log('Test Configuration:', {
      transactionDataBucket,
      processedDataBucket,
      jobStatusTable,
      auditLogTable,
      jobQueue,
      jobDefinition,
      snsTopicArn,
      environmentSuffix,
    });
  });

  describe('Infrastructure Verification', () => {
    test('should have all required S3 buckets accessible', async () => {
      const transactionBucketExists = await s3
        .headBucket({ Bucket: transactionDataBucket })
        .promise();
      const processedBucketExists = await s3
        .headBucket({ Bucket: processedDataBucket })
        .promise();

      expect(transactionBucketExists).toBeDefined();
      expect(processedBucketExists).toBeDefined();
    });

    test('should have DynamoDB tables accessible', async () => {
      const dynamodbClient = new AWS.DynamoDB();

      const jobStatusTableDesc = await dynamodbClient
        .describeTable({ TableName: jobStatusTable })
        .promise();
      const auditLogTableDesc = await dynamodbClient
        .describeTable({ TableName: auditLogTable })
        .promise();

      expect(jobStatusTableDesc.Table?.TableStatus).toBe('ACTIVE');
      expect(auditLogTableDesc.Table?.TableStatus).toBe('ACTIVE');
    });

    test('should have batch compute environment enabled', async () => {
      const computeEnvironments = await batch
        .describeComputeEnvironments()
        .promise();
      const targetEnv = computeEnvironments.computeEnvironments?.find((env) =>
        env.computeEnvironmentName?.includes(environmentSuffix)
      );

      expect(targetEnv).toBeDefined();
      expect(targetEnv?.state).toBe('ENABLED');
    });

    test('should have batch job queue enabled', async () => {
      const jobQueues = await batch.describeJobQueues().promise();
      const targetQueue = jobQueues.jobQueues?.find(
        (queue) => queue.jobQueueArn === jobQueue
      );

      expect(targetQueue).toBeDefined();
      expect(targetQueue?.state).toBe('ENABLED');
    });
  });

  describe('Complete Transaction Processing Flow', () => {
    const testFileName = `test-transactions-${Date.now()}.json`;
    const testTransactions = [
      {
        id: 'txn-001',
        amount: 1000.5,
        currency: 'USD',
        timestamp: new Date().toISOString(),
        type: 'deposit',
      },
      {
        id: 'txn-002',
        amount: 250.75,
        currency: 'USD',
        timestamp: new Date().toISOString(),
        type: 'withdrawal',
      },
    ];
    let testJobId: string;

    beforeAll(async () => {
      // Upload test transaction file to trigger processing
      const transactionData = JSON.stringify(testTransactions, null, 2);
      await s3
        .putObject({
          Bucket: transactionDataBucket,
          Key: `raw/${testFileName}`,
          Body: transactionData,
          ContentType: 'application/json',
        })
        .promise();

      console.log(`Uploaded test file: raw/${testFileName}`);
    });

    afterAll(async () => {
      // Cleanup test files
      try {
        await s3
          .deleteObject({
            Bucket: transactionDataBucket,
            Key: `raw/${testFileName}`,
          })
          .promise();
        console.log('Cleaned up test file');
      } catch (error) {
        console.warn('Failed to cleanup source file:', error);
      }
    });

    test('should automatically trigger batch job when file is uploaded', async () => {
      // Wait for S3 notification to trigger Lambda and create batch job
      const inputFile = `s3://${transactionDataBucket}/raw/${testFileName}`;

      const jobFound = await waitForCondition(async () => {
        const result = await dynamodb
          .scan({
            TableName: jobStatusTable,
            FilterExpression: 'inputFile = :inputFile',
            ExpressionAttributeValues: {
              ':inputFile': inputFile,
            },
          })
          .promise();
        return (result.Items?.length ?? 0) > 0;
      }, 15, 2000);

      expect(jobFound).toBe(true);

      // Now get the actual job
      const recentJobs = await dynamodb
        .scan({
          TableName: jobStatusTable,
          FilterExpression: 'inputFile = :inputFile',
          ExpressionAttributeValues: {
            ':inputFile': inputFile,
          },
        })
        .promise();

      expect(recentJobs.Items?.length).toBeGreaterThan(0);

      const job = recentJobs.Items?.[0];
      testJobId = job?.jobId; // Store for later tests

      expect(job?.jobId).toBeDefined();
      expect(job?.batchJobId).toBeDefined();
      expect(['SUBMITTED', 'PENDING', 'RUNNABLE', 'STARTING', 'RUNNING']).toContain(
        job?.status
      );
      expect(job?.inputFile).toBe(inputFile);
      expect(job?.environment).toBe(environmentSuffix);

      console.log(`Job created: ${job?.jobId}, Batch Job: ${job?.batchJobId}`);
    });

    test('should create audit log entry for job submission', async () => {
      // Wait to ensure audit log is created
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Query audit log table for recent job submission events
      const auditLogs = await dynamodb
        .scan({
          TableName: auditLogTable,
          FilterExpression:
            '#action = :action AND contains(details, :fileName)',
          ExpressionAttributeNames: {
            '#action': 'action',
          },
          ExpressionAttributeValues: {
            ':action': 'JOB_SUBMITTED',
            ':fileName': testFileName,
          },
        })
        .promise();

      expect(auditLogs.Items?.length).toBeGreaterThan(0);

      const auditEntry = auditLogs.Items?.[0];
      expect(auditEntry?.auditId).toBeDefined();
      expect(auditEntry?.jobId).toBeDefined();
      expect(auditEntry?.timestamp).toBeDefined();
      expect(auditEntry?.action).toBe('JOB_SUBMITTED');
      expect(auditEntry?.ttl).toBeDefined();
    });

    test('should have batch job in AWS Batch service', async () => {
      // Use the stored job ID from previous test
      expect(testJobId).toBeDefined();

      // Get job from DynamoDB
      const jobRecord = await dynamodb
        .get({
          TableName: jobStatusTable,
          Key: { jobId: testJobId },
        })
        .promise();

      expect(jobRecord.Item).toBeDefined();
      const job = jobRecord.Item;

      // Verify job exists in AWS Batch
      const batchJob = await batch
        .describeJobs({
          jobs: [job?.batchJobId],
        })
        .promise();

      expect(batchJob.jobs?.length).toBe(1);
      const batchJobDetails = batchJob.jobs?.[0];

      expect(batchJobDetails?.jobId).toBe(job?.batchJobId);
      expect(batchJobDetails?.jobQueue).toBe(jobQueue);

      const jobDefName = getJobDefinitionName(jobDefinition);
      expect(batchJobDetails?.jobDefinition).toContain(jobDefName);

      expect(
        [
          'SUBMITTED',
          'PENDING',
          'RUNNABLE',
          'STARTING',
          'RUNNING',
          'SUCCEEDED',
          'FAILED',
        ].includes(batchJobDetails?.status || '')
      ).toBe(true);

      console.log(`Batch job status: ${batchJobDetails?.status}`);
    });

    test('should have proper environment variables in job definition', async () => {
      const jobDefName = getJobDefinitionName(jobDefinition);

      console.log(`Looking up job definition: ${jobDefName}`);

      const jobDefDetails = await batch
        .describeJobDefinitions({
          jobDefinitionName: jobDefName,
          status: 'ACTIVE',
        })
        .promise();

      console.log(
        `Found ${jobDefDetails.jobDefinitions?.length} job definitions`
      );

      expect(jobDefDetails.jobDefinitions?.length).toBeGreaterThan(0);
      const jobDef = jobDefDetails.jobDefinitions?.[0];

      const envVars = jobDef?.containerProperties?.environment || [];
      const envNames = envVars.map((env) => env.name);

      expect(envNames).toContain('JOB_STATUS_TABLE');
      expect(envNames).toContain('AUDIT_LOG_TABLE');
      expect(envNames).toContain('SOURCE_BUCKET');
      expect(envNames).toContain('DEST_BUCKET');
      expect(envNames).toContain('SNS_TOPIC_ARN');
      expect(envNames).toContain('ENVIRONMENT');

      // Verify environment variable values
      const sourceEnv = envVars.find((env) => env.name === 'SOURCE_BUCKET');
      const destEnv = envVars.find((env) => env.name === 'DEST_BUCKET');
      const envSuffixEnv = envVars.find((env) => env.name === 'ENVIRONMENT');

      expect(sourceEnv?.value).toBe(transactionDataBucket);
      expect(destEnv?.value).toBe(processedDataBucket);
      expect(envSuffixEnv?.value).toBe(environmentSuffix);
    });

    test('should have SNS topic configured for notifications', async () => {
      const topicAttributes = await sns
        .getTopicAttributes({
          TopicArn: snsTopicArn,
        })
        .promise();

      expect(topicAttributes.Attributes).toBeDefined();
      expect(topicAttributes.Attributes?.DisplayName).toBe(
        'Batch Processing Alerts'
      );

      // Check if topic has subscriptions
      const subscriptions = await sns
        .listSubscriptionsByTopic({
          TopicArn: snsTopicArn,
        })
        .promise();

      expect(subscriptions.Subscriptions?.length).toBeGreaterThan(0);
      expect(subscriptions.Subscriptions?.[0].Protocol).toBe('email');
    });

    test('should handle job monitoring and status updates', async () => {
      // This test verifies that the job monitoring Lambda would work
      // by checking the infrastructure is in place

      // Query all jobs (not just submitted)
      const allJobs = await dynamodb
        .scan({
          TableName: jobStatusTable,
          Limit: 10,
        })
        .promise();

      console.log(`Found ${allJobs.Items?.length} total jobs in table`);

      // If we have jobs, verify the structure
      if (allJobs.Items && allJobs.Items.length > 0) {
        const firstJob = allJobs.Items[0];
        expect(firstJob?.status).toBeDefined();
        expect(firstJob?.submittedAt).toBeDefined();
        expect(typeof firstJob?.submittedAt).toBe('number');
      } else {
        // If no jobs exist yet, at least verify we can query the table
        expect(allJobs).toBeDefined();
        console.warn('No jobs found in table for structure verification');
      }
    });

    test('should support audit trail queries by job ID', async () => {
      // Use the stored job ID
      expect(testJobId).toBeDefined();

      // Query audit log by job ID using GSI
      const auditEntries = await dynamodb
        .query({
          TableName: auditLogTable,
          IndexName: 'JobIdIndex',
          KeyConditionExpression: 'jobId = :jobId',
          ExpressionAttributeValues: {
            ':jobId': testJobId,
          },
        })
        .promise();

      expect(auditEntries.Items?.length).toBeGreaterThan(0);

      const auditEntry = auditEntries.Items?.[0];
      expect(auditEntry?.jobId).toBe(testJobId);
      expect(auditEntry?.action).toBe('JOB_SUBMITTED');
      expect(auditEntry?.timestamp).toBeDefined();

      console.log(`Found ${auditEntries.Items?.length} audit entries for job`);
    });
  });

  describe('Error Handling and Resilience', () => {
    test('should handle invalid file uploads gracefully', async () => {
      const invalidFileName = `invalid-${Date.now()}.txt`;

      // Upload invalid file that should not trigger processing
      await s3
        .putObject({
          Bucket: transactionDataBucket,
          Key: `invalid/${invalidFileName}`, // Different prefix
          Body: 'invalid content',
          ContentType: 'text/plain',
        })
        .promise();

      // Wait to see if any jobs are created
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Query for jobs related to this file
      const invalidJobs = await dynamodb
        .scan({
          TableName: jobStatusTable,
          FilterExpression: 'contains(inputFile, :fileName)',
          ExpressionAttributeValues: {
            ':fileName': invalidFileName,
          },
        })
        .promise();

      // Should not create jobs for files outside the 'raw/' prefix
      expect(invalidJobs.Items?.length).toBe(0);

      // Cleanup
      await s3
        .deleteObject({
          Bucket: transactionDataBucket,
          Key: `invalid/${invalidFileName}`,
        })
        .promise();
    });

    test('should have retry configuration for batch jobs', async () => {
      const jobDefName = getJobDefinitionName(jobDefinition);

      console.log(`Checking retry config for: ${jobDefName}`);

      const jobDefDetails = await batch
        .describeJobDefinitions({
          jobDefinitionName: jobDefName,
          status: 'ACTIVE',
        })
        .promise();

      expect(jobDefDetails.jobDefinitions?.length).toBeGreaterThan(0);
      const jobDef = jobDefDetails.jobDefinitions?.[0];

      expect(jobDef?.retryStrategy).toBeDefined();
      expect(jobDef?.retryStrategy?.attempts).toBe(3);
      expect(jobDef?.timeout).toBeDefined();
      expect(jobDef?.timeout?.attemptDurationSeconds).toBeDefined();

      console.log(
        `Job definition has ${jobDef?.retryStrategy?.attempts} retry attempts`
      );
    });
  });
});