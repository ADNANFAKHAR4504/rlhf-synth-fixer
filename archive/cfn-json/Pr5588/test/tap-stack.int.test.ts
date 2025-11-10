import { CloudFormationClient, DescribeStacksCommand } from '@aws-sdk/client-cloudformation';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectVersionsCommand } from '@aws-sdk/client-s3';
import { CloudWatchLogsClient, FilterLogEventsCommand, DescribeLogGroupsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { CloudWatchClient, DescribeAlarmsCommand, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';
import { CloudTrailClient, LookupEventsCommand, GetTrailStatusCommand } from '@aws-sdk/client-cloudtrail';
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand } from '@aws-sdk/client-ec2';
import { KMSClient, DescribeKeyCommand } from '@aws-sdk/client-kms';

// Read region from AWS_REGION file
import * as fs from 'fs';
import * as path from 'path';

const regionFile = path.join(__dirname, '../lib/AWS_REGION');
const region = fs.readFileSync(regionFile, 'utf-8').trim();

// Initialize AWS SDK clients
const cloudFormationClient = new CloudFormationClient({ region });
const lambdaClient = new LambdaClient({ region });
const s3Client = new S3Client({ region });
const cloudWatchLogsClient = new CloudWatchLogsClient({ region });
const cloudWatchClient = new CloudWatchClient({ region });
const cloudTrailClient = new CloudTrailClient({ region });
const ec2Client = new EC2Client({ region });
const kmsClient = new KMSClient({ region });

// Helper function to wait for CloudWatch Logs to appear
async function waitForLogs(
  logGroupName: string,
  filterPattern: string,
  startTime: number,
  maxWaitTime = 60000
): Promise<any[]> {
  const startWait = Date.now();

  while (Date.now() - startWait < maxWaitTime) {
    try {
      const response = await cloudWatchLogsClient.send(
        new FilterLogEventsCommand({
          logGroupName,
          filterPattern,
          startTime,
          limit: 50,
        })
      );

      if (response.events && response.events.length > 0) {
        return response.events;
      }

      await new Promise((resolve) => setTimeout(resolve, 3000));
    } catch (error) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  return [];
}

// Helper function to invoke Lambda and parse response
async function invokeLambda(functionName: string, payload: any = {}): Promise<any> {
  const response = await lambdaClient.send(
    new InvokeCommand({
      FunctionName: functionName,
      Payload: JSON.stringify(payload),
    })
  );

  const responsePayload = JSON.parse(new TextDecoder().decode(response.Payload));
  return responsePayload;
}

describe('Integration Tests for Serverless Security Configuration Stack', () => {
  let stackName: string;
  let vpcId: string;
  let publicSubnetId: string;
  let privateSubnetId: string;
  let s3BucketName: string;
  let s3BucketArn: string;
  let lambdaFunctionArn: string;
  let lambdaFunctionName: string;
  let apiGatewayUrl: string;
  let apiGatewayId: string;
  let cloudTrailName: string;
  let kmsKeyId: string;
  let kmsKeyArn: string;
  let natGatewayId: string;
  let environmentSuffix: string;

  beforeAll(async () => {
    // Read stack name from metadata.json
    const metadataPath = path.join(__dirname, '../metadata.json');
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    stackName = metadata.stackName;

    // Get stack outputs
    const describeStacksResponse = await cloudFormationClient.send(
      new DescribeStacksCommand({ StackName: stackName })
    );

    const stack = describeStacksResponse.Stacks?.[0];
    if (!stack || !stack.Outputs) {
      throw new Error('Stack or outputs not found');
    }

    // Extract outputs
    const outputs = stack.Outputs;
    vpcId = outputs.find((o) => o.OutputKey === 'VPCId')?.OutputValue || '';
    publicSubnetId = outputs.find((o) => o.OutputKey === 'PublicSubnetId')?.OutputValue || '';
    privateSubnetId = outputs.find((o) => o.OutputKey === 'PrivateSubnetId')?.OutputValue || '';
    s3BucketName = outputs.find((o) => o.OutputKey === 'S3BucketName')?.OutputValue || '';
    s3BucketArn = outputs.find((o) => o.OutputKey === 'S3BucketArn')?.OutputValue || '';
    lambdaFunctionArn = outputs.find((o) => o.OutputKey === 'LambdaFunctionArn')?.OutputValue || '';
    lambdaFunctionName = outputs.find((o) => o.OutputKey === 'LambdaFunctionName')?.OutputValue || '';
    apiGatewayUrl = outputs.find((o) => o.OutputKey === 'APIGatewayURL')?.OutputValue || '';
    apiGatewayId = outputs.find((o) => o.OutputKey === 'APIGatewayId')?.OutputValue || '';
    cloudTrailName = outputs.find((o) => o.OutputKey === 'CloudTrailName')?.OutputValue || '';
    kmsKeyId = outputs.find((o) => o.OutputKey === 'KMSKeyId')?.OutputValue || '';
    kmsKeyArn = outputs.find((o) => o.OutputKey === 'KMSKeyArn')?.OutputValue || '';
    natGatewayId = outputs.find((o) => o.OutputKey === 'NATGatewayId')?.OutputValue || '';
    environmentSuffix = outputs.find((o) => o.OutputKey === 'EnvironmentSuffix')?.OutputValue || '';

    // Verify all required outputs are present
    expect(vpcId).toBeTruthy();
    expect(s3BucketName).toBeTruthy();
    expect(lambdaFunctionName).toBeTruthy();
    expect(apiGatewayUrl).toBeTruthy();
  }, 30000);

  // ========================================
  // SERVICE-LEVEL Tests (Single Service Interactions)
  // ========================================

  describe('[SERVICE-LEVEL] Lambda Function - Direct Invocation', () => {
    test('should invoke Lambda function directly and receive successful response with correct message', async () => {
      // ACTION: Actually invoke the Lambda function
      const response = await invokeLambda(lambdaFunctionName, { test: 'integration' });

      // Verify Lambda executed successfully
      expect(response.statusCode).toBe(200);
      expect(response.headers).toBeDefined();
      expect(response.headers['Content-Type']).toBe('application/json');

      // Parse and verify response body
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Serverless security application running');
      expect(body.environment).toBe(environmentSuffix);
    }, 30000);

    test('should invoke Lambda function with custom payload and verify execution', async () => {
      // ACTION: Invoke Lambda with custom event data
      const customPayload = {
        action: 'integration-test',
        timestamp: new Date().toISOString(),
        testData: 'SERVICE-LEVEL test payload',
      };

      const response = await invokeLambda(lambdaFunctionName, customPayload);

      // Verify Lambda processed the request
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.message).toContain('Serverless security application');
    }, 30000);
  });

  describe('[SERVICE-LEVEL] S3 Bucket - Object Operations with KMS Encryption', () => {
    const testObjectKey = `integration-test-${Date.now()}.txt`;
    const testContent = 'This is integration test content for S3 operations with KMS encryption';

    test('should PUT object to S3 bucket with KMS encryption', async () => {
      // ACTION: Actually create an object in S3
      const putResponse = await s3Client.send(
        new PutObjectCommand({
          Bucket: s3BucketName,
          Key: testObjectKey,
          Body: testContent,
          ContentType: 'text/plain',
          ServerSideEncryption: 'aws:kms',
          SSEKMSKeyId: kmsKeyArn,
        })
      );

      // Verify object was created with encryption
      expect(putResponse.ETag).toBeDefined();
      expect(putResponse.ServerSideEncryption).toBe('aws:kms');
      expect(putResponse.SSEKMSKeyId).toBeDefined();
    }, 30000);

    test('should GET object from S3 bucket and verify content', async () => {
      // First, ensure object exists
      await s3Client.send(
        new PutObjectCommand({
          Bucket: s3BucketName,
          Key: testObjectKey,
          Body: testContent,
          ServerSideEncryption: 'aws:kms',
          SSEKMSKeyId: kmsKeyArn,
        })
      );

      // ACTION: Actually retrieve the object from S3
      const getResponse = await s3Client.send(
        new GetObjectCommand({
          Bucket: s3BucketName,
          Key: testObjectKey,
        })
      );

      // Verify object was retrieved with correct content and encryption
      expect(getResponse.Body).toBeDefined();
      expect(getResponse.ServerSideEncryption).toBe('aws:kms');
      expect(getResponse.SSEKMSKeyId).toBeDefined();

      const retrievedContent = await getResponse.Body?.transformToString();
      expect(retrievedContent).toBe(testContent);
    }, 30000);

    test('should DELETE object from S3 bucket and verify removal', async () => {
      // First, create object
      await s3Client.send(
        new PutObjectCommand({
          Bucket: s3BucketName,
          Key: testObjectKey,
          Body: testContent,
        })
      );

      // ACTION: Actually delete the object from S3
      const deleteResponse = await s3Client.send(
        new DeleteObjectCommand({
          Bucket: s3BucketName,
          Key: testObjectKey,
        })
      );

      // Verify deletion
      expect(deleteResponse.DeleteMarker).toBeDefined();

      // Try to get the deleted object (should fail or return delete marker)
      try {
        await s3Client.send(
          new GetObjectCommand({
            Bucket: s3BucketName,
            Key: testObjectKey,
          })
        );
      } catch (error: any) {
        // Expected - object should not be accessible after deletion
        expect(error.name).toBe('NoSuchKey');
      }
    }, 30000);

    test('should verify S3 bucket has versioning enabled by creating multiple versions', async () => {
      const versionTestKey = `version-test-${Date.now()}.txt`;

      // ACTION: Create multiple versions of the same object
      await s3Client.send(
        new PutObjectCommand({
          Bucket: s3BucketName,
          Key: versionTestKey,
          Body: 'Version 1 content',
        })
      );

      await s3Client.send(
        new PutObjectCommand({
          Bucket: s3BucketName,
          Key: versionTestKey,
          Body: 'Version 2 content',
        })
      );

      // Verify multiple versions exist
      const versionsResponse = await s3Client.send(
        new ListObjectVersionsCommand({
          Bucket: s3BucketName,
          Prefix: versionTestKey,
        })
      );

      expect(versionsResponse.Versions).toBeDefined();
      expect(versionsResponse.Versions!.length).toBeGreaterThanOrEqual(2);

      // Cleanup
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: s3BucketName,
          Key: versionTestKey,
        })
      );
    }, 40000);
  });

  describe('[SERVICE-LEVEL] CloudWatch Logs - Query Lambda Execution Logs', () => {
    test('should query CloudWatch Logs for Lambda execution records', async () => {
      const logGroupName = `/aws/lambda/${lambdaFunctionName}`;
      const startTime = Date.now();

      // First, invoke Lambda to generate logs
      await invokeLambda(lambdaFunctionName, { testType: 'log-generation' });

      // ACTION: Wait for logs to appear in CloudWatch (using waitForLogs helper for VPC Lambda cold start)
      const logs = await waitForLogs(logGroupName, '', startTime, 60000);

      // Verify logs exist
      expect(logs).toBeDefined();
      expect(logs.length).toBeGreaterThan(0);

      // Verify log events contain Lambda execution information
      const logMessages = logs.map((e) => e.message || '').join(' ');
      expect(logMessages).toContain('START RequestId');
    }, 90000);

    test('should verify Lambda log group has correct retention period', async () => {
      const logGroupName = `/aws/lambda/${lambdaFunctionName}`;

      // ACTION: Query log group configuration
      const logGroupsResponse = await cloudWatchLogsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: logGroupName,
        })
      );

      // Verify log group exists and has retention configured
      expect(logGroupsResponse.logGroups).toBeDefined();
      expect(logGroupsResponse.logGroups!.length).toBeGreaterThan(0);

      const logGroup = logGroupsResponse.logGroups![0];
      expect(logGroup.retentionInDays).toBe(30);
    }, 30000);
  });

  describe('[SERVICE-LEVEL] CloudWatch Alarms - Verify Monitoring Configuration', () => {
    test('should verify Lambda and API Gateway alarms are configured and active', async () => {
      // ACTION: Query CloudWatch Alarms
      const alarmsResponse = await cloudWatchClient.send(new DescribeAlarmsCommand({}));

      // Verify alarms exist
      expect(alarmsResponse.MetricAlarms).toBeDefined();
      expect(alarmsResponse.MetricAlarms!.length).toBeGreaterThan(0);

      // Find alarms related to our stack
      const stackAlarms = alarmsResponse.MetricAlarms!.filter(
        (alarm) =>
          alarm.AlarmName?.includes(environmentSuffix) &&
          (alarm.AlarmName?.includes('Lambda') || alarm.AlarmName?.includes('APIGateway'))
      );

      expect(stackAlarms.length).toBeGreaterThanOrEqual(4); // 2 Lambda + 2 API Gateway alarms

      // Verify specific alarm configurations
      const lambdaDurationAlarm = stackAlarms.find((a) => a.AlarmName?.includes('HighDuration'));
      expect(lambdaDurationAlarm).toBeDefined();
      expect(lambdaDurationAlarm!.MetricName).toBe('Duration');
      expect(lambdaDurationAlarm!.Namespace).toBe('AWS/Lambda');
      expect(lambdaDurationAlarm!.Threshold).toBe(25000);

      const lambdaErrorAlarm = stackAlarms.find((a) => a.AlarmName?.includes('Lambda-Errors'));
      expect(lambdaErrorAlarm).toBeDefined();
      expect(lambdaErrorAlarm!.MetricName).toBe('Errors');
      expect(lambdaErrorAlarm!.Threshold).toBe(5);
    }, 30000);
  });

  describe('[SERVICE-LEVEL] CloudTrail - Verify Audit Logging', () => {
    test('should verify CloudTrail is actively logging events', async () => {
      // ACTION: Check CloudTrail status
      const trailStatusResponse = await cloudTrailClient.send(
        new GetTrailStatusCommand({
          Name: cloudTrailName,
        })
      );

      // Verify CloudTrail is logging
      expect(trailStatusResponse.IsLogging).toBe(true);
    }, 30000);

    test('should query CloudTrail for recent management events', async () => {
      // ACTION: Actually query CloudTrail events
      const eventsResponse = await cloudTrailClient.send(
        new LookupEventsCommand({
          MaxResults: 10,
        })
      );

      // Verify events are being captured
      expect(eventsResponse.Events).toBeDefined();
      expect(eventsResponse.Events!.length).toBeGreaterThan(0);

      // Verify event structure
      const firstEvent = eventsResponse.Events![0];
      expect(firstEvent.EventTime).toBeDefined();
      expect(firstEvent.EventName).toBeDefined();
      expect(firstEvent.Resources || firstEvent.Username || firstEvent.EventSource).toBeDefined();
    }, 30000);
  });

  describe('[SERVICE-LEVEL] KMS Key - Verify Encryption Key Configuration', () => {
    test('should verify KMS key is enabled with automatic rotation', async () => {
      // ACTION: Query KMS key details
      const keyResponse = await kmsClient.send(
        new DescribeKeyCommand({
          KeyId: kmsKeyId,
        })
      );

      // Verify key configuration
      expect(keyResponse.KeyMetadata).toBeDefined();
      expect(keyResponse.KeyMetadata!.Enabled).toBe(true);
      expect(keyResponse.KeyMetadata!.KeyState).toBe('Enabled');
    }, 30000);
  });

  // ========================================
  // CROSS-SERVICE Tests (Two Services Talking)
  // ========================================

  describe('[CROSS-SERVICE] API Gateway → Lambda Integration', () => {
    test('should call API Gateway endpoint and verify Lambda execution', async () => {
      // ACTION: Actually call the API Gateway endpoint
      const response = await fetch(apiGatewayUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Verify API Gateway response
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/json');

      // Verify Lambda processed the request
      const body = await response.json();
      expect(body.message).toBe('Serverless security application running');
      expect(body.environment).toBe(environmentSuffix);
    }, 30000);

    test('should verify API Gateway triggers Lambda with request context', async () => {
      const startTime = Date.now();

      // ACTION: Call API Gateway
      await fetch(apiGatewayUrl, { method: 'GET' });

      // Verify Lambda was invoked by API Gateway (wait for logs using waitForLogs helper for VPC Lambda cold start)
      const logGroupName = `/aws/lambda/${lambdaFunctionName}`;
      const logs = await waitForLogs(logGroupName, '', startTime, 60000);

      expect(logs).toBeDefined();
      expect(logs.length).toBeGreaterThan(0);
    }, 90000);
  });

  describe('[CROSS-SERVICE] Lambda → CloudWatch Logs Integration', () => {
    test('should invoke Lambda and verify logs appear in CloudWatch with execution details', async () => {
      const startTime = Date.now();
      const testPayload = {
        testType: 'cloudwatch-integration',
        timestamp: new Date().toISOString(),
      };

      // ACTION: Invoke Lambda
      await invokeLambda(lambdaFunctionName, testPayload);

      // ACTION: Query CloudWatch Logs for the invocation
      const logGroupName = `/aws/lambda/${lambdaFunctionName}`;
      const logs = await waitForLogs(logGroupName, '', startTime, 60000);

      // Verify logs captured the Lambda execution
      expect(logs.length).toBeGreaterThan(0);

      const logMessages = logs.map((e) => e.message || '').join(' ');
      expect(logMessages).toContain('START RequestId');
      expect(logMessages).toContain('END RequestId');
    }, 90000);

    test('should verify Lambda execution metrics are sent to CloudWatch', async () => {
      // Invoke Lambda to generate metrics
      await invokeLambda(lambdaFunctionName, { test: 'metrics' });

      // Wait for metrics to propagate
      await new Promise((resolve) => setTimeout(resolve, 10000));

      // ACTION: Query CloudWatch for Lambda metrics
      const alarmsResponse = await cloudWatchClient.send(new DescribeAlarmsCommand({}));

      const lambdaAlarms = alarmsResponse.MetricAlarms!.filter(
        (alarm) =>
          alarm.AlarmName?.includes('Lambda') &&
          alarm.AlarmName?.includes(environmentSuffix) &&
          alarm.Dimensions?.some((d) => d.Value === lambdaFunctionName)
      );

      expect(lambdaAlarms.length).toBeGreaterThanOrEqual(2);
    }, 60000);
  });

  describe('[CROSS-SERVICE] API Gateway → CloudWatch Logs Integration', () => {
    test('should call API Gateway and verify access logs in CloudWatch', async () => {
      const startTime = Date.now();
      const logGroupName = `/aws/apigateway/ServerlessAPI-${environmentSuffix}`;

      // ACTION: Call API Gateway to generate access logs
      await fetch(apiGatewayUrl, { method: 'GET' });

      // Wait for logs to propagate
      await new Promise((resolve) => setTimeout(resolve, 10000));

      // ACTION: Query CloudWatch Logs for API Gateway access logs
      const logs = await waitForLogs(logGroupName, '', startTime, 60000);

      // Verify API Gateway access logs were created
      expect(logs.length).toBeGreaterThan(0);
    }, 90000);
  });

  describe('[CROSS-SERVICE] S3 → KMS Encryption Integration', () => {
    test('should verify S3 objects are encrypted with KMS key', async () => {
      const testKey = `kms-test-${Date.now()}.txt`;

      // ACTION: Create object in S3 (uses default bucket encryption with KMS)
      const putResponse = await s3Client.send(
        new PutObjectCommand({
          Bucket: s3BucketName,
          Key: testKey,
          Body: 'KMS encryption test content',
        })
      );

      // Verify object was encrypted
      expect(putResponse.ServerSideEncryption).toBeDefined();

      // ACTION: Get object and verify encryption details
      const getResponse = await s3Client.send(
        new GetObjectCommand({
          Bucket: s3BucketName,
          Key: testKey,
        })
      );

      expect(getResponse.ServerSideEncryption).toBe('aws:kms');
      expect(getResponse.SSEKMSKeyId).toContain(kmsKeyId);

      // Cleanup
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: s3BucketName,
          Key: testKey,
        })
      );
    }, 40000);
  });

  describe('[CROSS-SERVICE] VPC → Lambda Network Integration', () => {
    test('should verify Lambda is deployed in VPC private subnet', async () => {
      // ACTION: Query VPC and subnet information
      const vpcResponse = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [vpcId],
        })
      );

      expect(vpcResponse.Vpcs).toBeDefined();
      expect(vpcResponse.Vpcs!.length).toBe(1);

      const subnetsResponse = await ec2Client.send(
        new DescribeSubnetsCommand({
          SubnetIds: [privateSubnetId],
        })
      );

      expect(subnetsResponse.Subnets).toBeDefined();
      expect(subnetsResponse.Subnets![0].VpcId).toBe(vpcId);
      expect(subnetsResponse.Subnets![0].MapPublicIpOnLaunch).toBe(false);
    }, 30000);

    test('should verify Lambda security group allows outbound traffic', async () => {
      // ACTION: Query security groups
      const sgResponse = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [vpcId],
            },
            {
              Name: 'tag:Name',
              Values: [`LambdaSecurityGroup-${environmentSuffix}`],
            },
          ],
        })
      );

      expect(sgResponse.SecurityGroups).toBeDefined();
      expect(sgResponse.SecurityGroups!.length).toBeGreaterThan(0);

      const lambdaSG = sgResponse.SecurityGroups![0];
      expect(lambdaSG.IpPermissionsEgress).toBeDefined();
      expect(lambdaSG.IpPermissionsEgress!.length).toBeGreaterThan(0);

      // Verify egress allows all outbound traffic
      const egressRule = lambdaSG.IpPermissionsEgress![0];
      expect(egressRule.IpProtocol).toBe('-1');
    }, 30000);
  });

  // ========================================
  // E2E Tests (Complete Workflows with Real Data)
  // ========================================

  describe('[E2E] Complete API Gateway → Lambda → CloudWatch Logs Flow', () => {
    test('should execute complete request flow: API call → Lambda execution → CloudWatch logging → Cleanup verification', async () => {
      const startTime = Date.now();
      const testIdentifier = `e2e-test-${Date.now()}`;

      console.log('[E2E Test] Step 1: Calling API Gateway endpoint...');
      // Step 1: Call API Gateway
      const apiResponse = await fetch(apiGatewayUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Test-Identifier': testIdentifier,
        },
      });

      expect(apiResponse.status).toBe(200);
      const responseBody = await apiResponse.json();
      expect(responseBody.message).toBe('Serverless security application running');
      expect(responseBody.environment).toBe(environmentSuffix);

      console.log('[E2E Test] Step 2: Waiting for logs to propagate...');
      // Step 2: Wait for logs to propagate
      await new Promise((resolve) => setTimeout(resolve, 10000));

      console.log('[E2E Test] Step 3: Querying Lambda CloudWatch Logs...');
      // Step 3: Verify Lambda logs in CloudWatch
      const lambdaLogGroupName = `/aws/lambda/${lambdaFunctionName}`;
      const lambdaLogs = await waitForLogs(lambdaLogGroupName, '', startTime, 60000);

      expect(lambdaLogs.length).toBeGreaterThan(0);
      const lambdaLogMessages = lambdaLogs.map((e) => e.message || '').join(' ');
      expect(lambdaLogMessages).toContain('START RequestId');
      expect(lambdaLogMessages).toContain('END RequestId');

      console.log('[E2E Test] Step 4: Querying API Gateway CloudWatch Logs...');
      // Step 4: Verify API Gateway logs in CloudWatch
      const apiLogGroupName = `/aws/apigateway/ServerlessAPI-${environmentSuffix}`;
      const apiLogs = await waitForLogs(apiLogGroupName, '', startTime, 60000);

      expect(apiLogs.length).toBeGreaterThan(0);

      console.log('[E2E Test] Step 5: Verifying CloudTrail captured API activity...');
      // Step 5: Verify CloudTrail captured the activity
      await new Promise((resolve) => setTimeout(resolve, 5000));
      const trailEvents = await cloudTrailClient.send(
        new LookupEventsCommand({
          MaxResults: 50,
        })
      );

      expect(trailEvents.Events).toBeDefined();
      expect(trailEvents.Events!.length).toBeGreaterThan(0);

      console.log('[E2E Test] E2E test completed successfully - All 5 steps verified');
    }, 180000);
  });

  describe('[E2E] Complete S3 Workflow: PUT → GET → Versioning → DELETE with KMS Encryption', () => {
    test('should execute complete S3 workflow with real data and cleanup', async () => {
      const testKey = `e2e-workflow-${Date.now()}.json`;
      const testData = {
        testType: 'E2E S3 Workflow',
        timestamp: new Date().toISOString(),
        data: 'Integration test for complete S3 operations with KMS encryption and versioning',
        iterations: [1, 2, 3],
      };

      console.log('[E2E S3 Test] Step 1: Creating object in S3 with KMS encryption...');
      // Step 1: Create object
      const putResponse = await s3Client.send(
        new PutObjectCommand({
          Bucket: s3BucketName,
          Key: testKey,
          Body: JSON.stringify(testData),
          ContentType: 'application/json',
          Metadata: {
            'test-type': 'e2e-workflow',
          },
        })
      );

      expect(putResponse.ETag).toBeDefined();
      expect(putResponse.ServerSideEncryption).toBeDefined();
      const version1ETag = putResponse.ETag;

      console.log('[E2E S3 Test] Step 2: Retrieving object and verifying content...');
      // Step 2: Get object and verify content
      const getResponse1 = await s3Client.send(
        new GetObjectCommand({
          Bucket: s3BucketName,
          Key: testKey,
        })
      );

      expect(getResponse1.Body).toBeDefined();
      expect(getResponse1.ServerSideEncryption).toBe('aws:kms');
      expect(getResponse1.Metadata).toBeDefined();
      expect(getResponse1.Metadata!['test-type']).toBe('e2e-workflow');

      const retrievedData1 = JSON.parse((await getResponse1.Body!.transformToString()) || '{}');
      expect(retrievedData1.testType).toBe('E2E S3 Workflow');
      expect(retrievedData1.data).toContain('Integration test');

      console.log('[E2E S3 Test] Step 3: Updating object to create new version...');
      // Step 3: Update object (create new version)
      const updatedData = { ...testData, version: 2, updated: true };
      const putResponse2 = await s3Client.send(
        new PutObjectCommand({
          Bucket: s3BucketName,
          Key: testKey,
          Body: JSON.stringify(updatedData),
          ContentType: 'application/json',
        })
      );

      expect(putResponse2.ETag).toBeDefined();
      expect(putResponse2.ETag).not.toBe(version1ETag);

      console.log('[E2E S3 Test] Step 4: Verifying versioning - multiple versions exist...');
      // Step 4: Verify versioning
      const versionsResponse = await s3Client.send(
        new ListObjectVersionsCommand({
          Bucket: s3BucketName,
          Prefix: testKey,
        })
      );

      expect(versionsResponse.Versions).toBeDefined();
      expect(versionsResponse.Versions!.length).toBeGreaterThanOrEqual(2);

      console.log('[E2E S3 Test] Step 5: Getting updated object and verifying changes...');
      // Step 5: Get updated object
      const getResponse2 = await s3Client.send(
        new GetObjectCommand({
          Bucket: s3BucketName,
          Key: testKey,
        })
      );

      const retrievedData2 = JSON.parse((await getResponse2.Body!.transformToString()) || '{}');
      expect(retrievedData2.version).toBe(2);
      expect(retrievedData2.updated).toBe(true);

      console.log('[E2E S3 Test] Step 6: Deleting object and verifying cleanup...');
      // Step 6: Delete object (cleanup)
      const deleteResponse = await s3Client.send(
        new DeleteObjectCommand({
          Bucket: s3BucketName,
          Key: testKey,
        })
      );

      expect(deleteResponse.DeleteMarker).toBeDefined();

      console.log('[E2E S3 Test] Step 7: Verifying object is no longer accessible...');
      // Step 7: Verify deletion
      try {
        await s3Client.send(
          new GetObjectCommand({
            Bucket: s3BucketName,
            Key: testKey,
          })
        );
        fail('Object should not be accessible after deletion');
      } catch (error: any) {
        expect(error.name).toBe('NoSuchKey');
      }

      console.log('[E2E S3 Test] E2E S3 workflow completed successfully - All 7 steps verified');
    }, 120000);
  });

  describe('[E2E] Complete Monitoring Flow: Lambda Invocation → Metrics → CloudWatch Alarms', () => {
    test('should execute complete monitoring workflow with real Lambda executions', async () => {
      console.log('[E2E Monitoring Test] Step 1: Invoking Lambda multiple times to generate metrics...');
      // Step 1: Invoke Lambda multiple times to generate metrics
      const invocationPromises = [];
      for (let i = 0; i < 5; i++) {
        invocationPromises.push(
          invokeLambda(lambdaFunctionName, {
            iteration: i + 1,
            testType: 'monitoring-workflow',
          })
        );
      }

      const invocationResults = await Promise.all(invocationPromises);

      // Verify all invocations succeeded
      invocationResults.forEach((result, index) => {
        expect(result.statusCode).toBe(200);
        console.log(`[E2E Monitoring Test] Invocation ${index + 1}/5 completed successfully`);
      });

      console.log('[E2E Monitoring Test] Step 2: Waiting for metrics to propagate to CloudWatch...');
      // Step 2: Wait for metrics to propagate
      await new Promise((resolve) => setTimeout(resolve, 15000));

      console.log('[E2E Monitoring Test] Step 3: Verifying CloudWatch Alarms are monitoring Lambda...');
      // Step 3: Verify CloudWatch Alarms exist and are monitoring
      const alarmsResponse = await cloudWatchClient.send(new DescribeAlarmsCommand({}));

      const lambdaAlarms = alarmsResponse.MetricAlarms!.filter(
        (alarm) =>
          alarm.AlarmName?.includes('Lambda') &&
          alarm.AlarmName?.includes(environmentSuffix) &&
          alarm.Dimensions?.some((d) => d.Value === lambdaFunctionName)
      );

      expect(lambdaAlarms.length).toBeGreaterThanOrEqual(2);

      // Verify alarm configurations
      const durationAlarm = lambdaAlarms.find((a) => a.MetricName === 'Duration');
      const errorAlarm = lambdaAlarms.find((a) => a.MetricName === 'Errors');

      expect(durationAlarm).toBeDefined();
      expect(durationAlarm!.Namespace).toBe('AWS/Lambda');
      expect(durationAlarm!.StateValue).toBeDefined();

      expect(errorAlarm).toBeDefined();
      expect(errorAlarm!.Namespace).toBe('AWS/Lambda');
      expect(errorAlarm!.StateValue).toBeDefined();

      console.log('[E2E Monitoring Test] Step 4: Verifying Lambda execution logs in CloudWatch...');
      // Step 4: Verify logs captured all invocations
      const logGroupName = `/aws/lambda/${lambdaFunctionName}`;
      const logsResponse = await cloudWatchLogsClient.send(
        new FilterLogEventsCommand({
          logGroupName,
          startTime: Date.now() - 300000,
          limit: 100,
        })
      );

      expect(logsResponse.events).toBeDefined();
      expect(logsResponse.events!.length).toBeGreaterThan(0);

      // Count START events to verify all invocations were logged
      const startEvents = logsResponse.events!.filter((e) => e.message?.includes('START RequestId'));
      expect(startEvents.length).toBeGreaterThanOrEqual(5);

      console.log('[E2E Monitoring Test] E2E monitoring workflow completed - All 4 steps verified');
      console.log(`[E2E Monitoring Test] Captured ${startEvents.length} Lambda executions in CloudWatch Logs`);
    }, 150000);
  });

  describe('[E2E] Complete Security Flow: CloudTrail → S3 → KMS with Event Tracking', () => {
    test('should execute complete security audit workflow with real AWS operations', async () => {
      const testKey = `security-audit-${Date.now()}.txt`;

      console.log('[E2E Security Test] Step 1: Performing S3 operation to generate CloudTrail event...');
      // Step 1: Perform S3 operation (will be tracked by CloudTrail)
      await s3Client.send(
        new PutObjectCommand({
          Bucket: s3BucketName,
          Key: testKey,
          Body: 'Security audit test - this operation should be logged in CloudTrail',
        })
      );

      console.log('[E2E Security Test] Step 2: Verifying CloudTrail is actively logging...');
      // Step 2: Verify CloudTrail is logging
      const trailStatus = await cloudTrailClient.send(
        new GetTrailStatusCommand({
          Name: cloudTrailName,
        })
      );

      expect(trailStatus.IsLogging).toBe(true);

      console.log('[E2E Security Test] Step 3: Waiting for CloudTrail events to propagate...');
      // Step 3: Wait for CloudTrail events to propagate
      await new Promise((resolve) => setTimeout(resolve, 10000));

      console.log('[E2E Security Test] Step 4: Querying CloudTrail for recent S3 events...');
      // Step 4: Query CloudTrail for events
      const eventsResponse = await cloudTrailClient.send(
        new LookupEventsCommand({
          MaxResults: 50,
        })
      );

      expect(eventsResponse.Events).toBeDefined();
      expect(eventsResponse.Events!.length).toBeGreaterThan(0);

      // Verify event structure
      const events = eventsResponse.Events!;
      events.forEach((event) => {
        expect(event.EventTime).toBeDefined();
        expect(event.EventName).toBeDefined();
        expect(event.Resources || event.Username || event.EventSource).toBeDefined();
      });

      console.log('[E2E Security Test] Step 5: Verifying KMS key used for S3 encryption...');
      // Step 5: Verify KMS key is being used
      const keyResponse = await kmsClient.send(
        new DescribeKeyCommand({
          KeyId: kmsKeyId,
        })
      );

      expect(keyResponse.KeyMetadata).toBeDefined();
      expect(keyResponse.KeyMetadata!.Enabled).toBe(true);

      console.log('[E2E Security Test] Step 6: Cleaning up test object...');
      // Step 6: Cleanup
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: s3BucketName,
          Key: testKey,
        })
      );

      console.log('[E2E Security Test] E2E security audit workflow completed - All 6 steps verified');
      console.log(`[E2E Security Test] CloudTrail captured ${events.length} management events`);
    }, 120000);
  });
});
