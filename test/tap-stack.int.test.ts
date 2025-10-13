// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import AWS from 'aws-sdk';

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
  });

  describe('Infrastructure Verification', () => {
    test('should have all required S3 buckets accessible', async () => {
      const transactionBucketExists = await s3.headBucket({ Bucket: transactionDataBucket }).promise();
      const processedBucketExists = await s3.headBucket({ Bucket: processedDataBucket }).promise();
      
      expect(transactionBucketExists).toBeDefined();
      expect(processedBucketExists).toBeDefined();
    });

    test('should have DynamoDB tables accessible', async () => {
      const jobStatusTableDesc = await dynamodb.describe({ TableName: jobStatusTable }).promise();
      const auditLogTableDesc = await dynamodb.describe({ TableName: auditLogTable }).promise();
      
      expect(jobStatusTableDesc.Table.TableStatus).toBe('ACTIVE');
      expect(auditLogTableDesc.Table.TableStatus).toBe('ACTIVE');
    });

    test('should have batch compute environment enabled', async () => {
      const computeEnvironments = await batch.describeComputeEnvironments().promise();
      const targetEnv = computeEnvironments.computeEnvironments.find(
        env => env.computeEnvironmentName.includes(environmentSuffix)
      );
      
      expect(targetEnv).toBeDefined();
      expect(targetEnv.state).toBe('ENABLED');
    });

    test('should have batch job queue enabled', async () => {
      const jobQueues = await batch.describeJobQueues().promise();
      const targetQueue = jobQueues.jobQueues.find(
        queue => queue.jobQueueArn === jobQueue
      );
      
      expect(targetQueue).toBeDefined();
      expect(targetQueue.state).toBe('ENABLED');
    });
  });

  describe('Complete Transaction Processing Flow', () => {
    const testFileName = `test-transactions-${Date.now()}.json`;
    const testTransactions = [
      {
        id: 'txn-001',
        amount: 1000.50,
        currency: 'USD',
        timestamp: new Date().toISOString(),
        type: 'deposit'
      },
      {
        id: 'txn-002', 
        amount: 250.75,
        currency: 'USD',
        timestamp: new Date().toISOString(),
        type: 'withdrawal'
      }
    ];

    beforeAll(async () => {
      // Upload test transaction file to trigger processing
      const transactionData = JSON.stringify(testTransactions, null, 2);
      await s3.putObject({
        Bucket: transactionDataBucket,
        Key: `raw/${testFileName}`,
        Body: transactionData,
        ContentType: 'application/json'
      }).promise();
    });

    afterAll(async () => {
      // Cleanup test files
      try {
        await s3.deleteObject({
          Bucket: transactionDataBucket,
          Key: `raw/${testFileName}`
        }).promise();
      } catch (error) {
        console.warn('Failed to cleanup source file:', error);
      }
    });

    test('should automatically trigger batch job when file is uploaded', async () => {
      // Wait for S3 notification to trigger Lambda and create batch job
      await new Promise(resolve => setTimeout(resolve, 10000));

      // Query job status table for jobs created in the last few minutes
      const recentJobs = await dynamodb.query({
        TableName: jobStatusTable,
        IndexName: 'StatusIndex',
        KeyConditionExpression: '#status = :status',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':status': 'SUBMITTED'
        },
        FilterExpression: 'inputFile = :inputFile',
        ExpressionAttributeValues: {
          ':status': 'SUBMITTED',
          ':inputFile': `s3://${transactionDataBucket}/raw/${testFileName}`
        }
      }).promise();

      expect(recentJobs.Items.length).toBeGreaterThan(0);
      
      const job = recentJobs.Items[0];
      expect(job.jobId).toBeDefined();
      expect(job.batchJobId).toBeDefined();
      expect(job.status).toBe('SUBMITTED');
      expect(job.inputFile).toBe(`s3://${transactionDataBucket}/raw/${testFileName}`);
      expect(job.environment).toBe(environmentSuffix);
    });

    test('should create audit log entry for job submission', async () => {
      // Wait a bit more to ensure audit log is created
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Query audit log table for recent job submission events
      const auditLogs = await dynamodb.scan({
        TableName: auditLogTable,
        FilterExpression: '#action = :action AND contains(details, :fileName)',
        ExpressionAttributeNames: {
          '#action': 'action'
        },
        ExpressionAttributeValues: {
          ':action': 'JOB_SUBMITTED',
          ':fileName': testFileName
        }
      }).promise();

      expect(auditLogs.Items.length).toBeGreaterThan(0);
      
      const auditEntry = auditLogs.Items[0];
      expect(auditEntry.auditId).toBeDefined();
      expect(auditEntry.jobId).toBeDefined();
      expect(auditEntry.timestamp).toBeDefined();
      expect(auditEntry.action).toBe('JOB_SUBMITTED');
      expect(auditEntry.ttl).toBeDefined();
    });

    test('should have batch job in AWS Batch service', async () => {
      // Get job ID from DynamoDB
      const recentJobs = await dynamodb.query({
        TableName: jobStatusTable,
        IndexName: 'StatusIndex',
        KeyConditionExpression: '#status = :status',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':status': 'SUBMITTED'
        },
        FilterExpression: 'inputFile = :inputFile',
        ExpressionAttributeValues: {
          ':status': 'SUBMITTED',
          ':inputFile': `s3://${transactionDataBucket}/raw/${testFileName}`
        }
      }).promise();

      expect(recentJobs.Items.length).toBeGreaterThan(0);
      const job = recentJobs.Items[0];

      // Verify job exists in AWS Batch
      const batchJob = await batch.describeJobs({
        jobs: [job.batchJobId]
      }).promise();

      expect(batchJob.jobs.length).toBe(1);
      const batchJobDetails = batchJob.jobs[0];
      
      expect(batchJobDetails.jobId).toBe(job.batchJobId);
      expect(batchJobDetails.jobQueue).toBe(jobQueue);
      expect(batchJobDetails.jobDefinition).toBe(jobDefinition);
      expect(['SUBMITTED', 'PENDING', 'RUNNABLE', 'STARTING', 'RUNNING'].includes(batchJobDetails.status)).toBe(true);
    });

    test('should have proper environment variables in job definition', async () => {
      const jobDefDetails = await batch.describeJobDefinitions({
        jobDefinitionName: jobDefinition.split('/').pop(),
        status: 'ACTIVE'
      }).promise();

      expect(jobDefDetails.jobDefinitions.length).toBeGreaterThan(0);
      const jobDef = jobDefDetails.jobDefinitions[0];
      
      const envVars = jobDef.containerProperties.environment;
      const envNames = envVars.map(env => env.name);
      
      expect(envNames).toContain('JOB_STATUS_TABLE');
      expect(envNames).toContain('AUDIT_LOG_TABLE');
      expect(envNames).toContain('SOURCE_BUCKET');
      expect(envNames).toContain('DEST_BUCKET');
      expect(envNames).toContain('SNS_TOPIC_ARN');
      expect(envNames).toContain('ENVIRONMENT');

      // Verify environment variable values
      const sourceEnv = envVars.find(env => env.name === 'SOURCE_BUCKET');
      const destEnv = envVars.find(env => env.name === 'DEST_BUCKET');
      const envSuffixEnv = envVars.find(env => env.name === 'ENVIRONMENT');
      
      expect(sourceEnv.value).toBe(transactionDataBucket);
      expect(destEnv.value).toBe(processedDataBucket);
      expect(envSuffixEnv.value).toBe(environmentSuffix);
    });

    test('should have SNS topic configured for notifications', async () => {
      const topicAttributes = await sns.getTopicAttributes({
        TopicArn: snsTopicArn
      }).promise();

      expect(topicAttributes.Attributes).toBeDefined();
      expect(topicAttributes.Attributes.DisplayName).toBe('Batch Processing Alerts');

      // Check if topic has subscriptions
      const subscriptions = await sns.listSubscriptionsByTopic({
        TopicArn: snsTopicArn
      }).promise();

      expect(subscriptions.Subscriptions.length).toBeGreaterThan(0);
      expect(subscriptions.Subscriptions[0].Protocol).toBe('email');
    });

    test('should handle job monitoring and status updates', async () => {
      // This test verifies that the job monitoring Lambda would work
      // by checking the infrastructure is in place
      
      // Check that the job status can be queried by status
      const submittedJobs = await dynamodb.query({
        TableName: jobStatusTable,
        IndexName: 'StatusIndex',
        KeyConditionExpression: '#status = :status',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':status': 'SUBMITTED'
        }
      }).promise();

      expect(submittedJobs.Items.length).toBeGreaterThan(0);

      // Verify the GSI structure allows for efficient querying
      const firstJob = submittedJobs.Items[0];
      expect(firstJob.status).toBe('SUBMITTED');
      expect(firstJob.submittedAt).toBeDefined();
      expect(typeof firstJob.submittedAt).toBe('number');
    });

    test('should support audit trail queries by job ID', async () => {
      // Get a job ID from the job status table
      const recentJobs = await dynamodb.query({
        TableName: jobStatusTable,
        IndexName: 'StatusIndex',
        KeyConditionExpression: '#status = :status',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':status': 'SUBMITTED'
        },
        FilterExpression: 'inputFile = :inputFile',
        ExpressionAttributeValues: {
          ':status': 'SUBMITTED',
          ':inputFile': `s3://${transactionDataBucket}/raw/${testFileName}`
        }
      }).promise();

      expect(recentJobs.Items.length).toBeGreaterThan(0);
      const job = recentJobs.Items[0];

      // Query audit log by job ID using GSI
      const auditEntries = await dynamodb.query({
        TableName: auditLogTable,
        IndexName: 'JobIdIndex',
        KeyConditionExpression: 'jobId = :jobId',
        ExpressionAttributeValues: {
          ':jobId': job.jobId
        }
      }).promise();

      expect(auditEntries.Items.length).toBeGreaterThan(0);
      
      const auditEntry = auditEntries.Items[0];
      expect(auditEntry.jobId).toBe(job.jobId);
      expect(auditEntry.action).toBe('JOB_SUBMITTED');
      expect(auditEntry.timestamp).toBeDefined();
    });
  });

  describe('Error Handling and Resilience', () => {
    test('should handle invalid file uploads gracefully', async () => {
      const invalidFileName = `invalid-${Date.now()}.txt`;
      
      // Upload invalid file that should not trigger processing
      await s3.putObject({
        Bucket: transactionDataBucket,
        Key: `invalid/${invalidFileName}`,  // Different prefix
        Body: 'invalid content',
        ContentType: 'text/plain'
      }).promise();

      // Wait to see if any jobs are created
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Query for jobs related to this file
      const invalidJobs = await dynamodb.scan({
        TableName: jobStatusTable,
        FilterExpression: 'contains(inputFile, :fileName)',
        ExpressionAttributeValues: {
          ':fileName': invalidFileName
        }
      }).promise();

      // Should not create jobs for files outside the 'raw/' prefix
      expect(invalidJobs.Items.length).toBe(0);

      // Cleanup
      await s3.deleteObject({
        Bucket: transactionDataBucket,
        Key: `invalid/${invalidFileName}`
      }).promise();
    });

    test('should have retry configuration for batch jobs', async () => {
      const jobDefDetails = await batch.describeJobDefinitions({
        jobDefinitionName: jobDefinition.split('/').pop(),
        status: 'ACTIVE'
      }).promise();

      expect(jobDefDetails.jobDefinitions.length).toBeGreaterThan(0);
      const jobDef = jobDefDetails.jobDefinitions[0];
      
      expect(jobDef.retryStrategy).toBeDefined();
      expect(jobDef.retryStrategy.attempts).toBe(3);
      expect(jobDef.timeout).toBeDefined();
      expect(jobDef.timeout.attemptDurationSeconds).toBeDefined();
    });
  });
});
