// Configuration - These are coming from cfn-outputs after cdk deploy
import * as fs from 'fs';
import * as AWS from 'aws-sdk';

// Read deployment outputs
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'synthtrainr907';

// AWS SDK configuration
const awsConfig = {
  region: process.env.AWS_REGION || 'us-east-1',
  ...(process.env.AWS_ENDPOINT_URL && {
    endpoint: process.env.AWS_ENDPOINT_URL,
    s3ForcePathStyle: true,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test'
  })
};
AWS.config.update(awsConfig);

// AWS Service Clients
const s3 = new AWS.S3(awsConfig);
const lambda = new AWS.Lambda(awsConfig);
const sns = new AWS.SNS(awsConfig);
const cloudWatch = new AWS.CloudWatch(awsConfig);
const cloudWatchLogs = new AWS.CloudWatchLogs(awsConfig);
const ec2 = new AWS.EC2(awsConfig);

describe('Security Configuration Infrastructure Integration Tests', () => {
  const bucketName = outputs.BucketName;
  const lambdaFunctionArn = outputs.LambdaFunctionArn;
  const snsTopicArn = outputs.SNSTopicArn;
  const vpcFlowLogsId = outputs.VPCFlowLogsId;
  
  // Extract function name from ARN
  const lambdaFunctionName = lambdaFunctionArn ? lambdaFunctionArn.split(':').pop() : '';

  describe('S3 Bucket Tests', () => {
    test('S3 bucket should exist and be accessible', async () => {
      const response = await s3.headBucket({ Bucket: bucketName }).promise();
      expect(response).toBeDefined();
    });

    test('S3 bucket should have encryption enabled', async () => {
      const response = await s3.getBucketEncryption({ Bucket: bucketName }).promise();
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration!.Rules).toHaveLength(1);
      expect(response.ServerSideEncryptionConfiguration!.Rules[0].ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('AES256');
      expect(response.ServerSideEncryptionConfiguration!.Rules[0].BucketKeyEnabled).toBe(true);
    });

    test('S3 bucket should have versioning enabled', async () => {
      const response = await s3.getBucketVersioning({ Bucket: bucketName }).promise();
      expect(response.Status).toBe('Enabled');
    });

    test('S3 bucket should have public access blocked', async () => {
      const response = await s3.getPublicAccessBlock({ Bucket: bucketName }).promise();
      expect(response.PublicAccessBlockConfiguration).toBeDefined();
      expect(response.PublicAccessBlockConfiguration!.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration!.BlockPublicPolicy).toBe(true);
      expect(response.PublicAccessBlockConfiguration!.IgnorePublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration!.RestrictPublicBuckets).toBe(true);
    });

    test('S3 bucket should be taggable and have proper tags', async () => {
      const response = await s3.getBucketTagging({ Bucket: bucketName }).promise();
      expect(response.TagSet).toBeDefined();
      const envTag = response.TagSet.find(tag => tag.Key === 'Environment');
      expect(envTag).toBeDefined();
      expect(envTag?.Value).toBe('Production');
    });

    test('Should be able to write and read objects from S3 bucket', async () => {
      const testKey = `test-object-${Date.now()}.txt`;
      const testContent = 'Test content for integration testing';
      
      // Write object
      await s3.putObject({
        Bucket: bucketName,
        Key: testKey,
        Body: testContent,
        ContentType: 'text/plain'
      }).promise();

      // Read object
      const getResponse = await s3.getObject({
        Bucket: bucketName,
        Key: testKey
      }).promise();
      
      expect(getResponse.Body?.toString()).toBe(testContent);

      // Clean up
      await s3.deleteObject({
        Bucket: bucketName,
        Key: testKey
      }).promise();
    });
  });

  describe('Lambda Function Tests', () => {
    test('Lambda function should exist and be configured correctly', async () => {
      const response = await lambda.getFunctionConfiguration({
        FunctionName: lambdaFunctionName
      }).promise();
      
      expect(response.FunctionName).toBe(lambdaFunctionName);
      expect(response.Runtime).toBe('python3.11');
      expect(response.Timeout).toBe(30);
      expect(response.MemorySize).toBe(256);
      expect(response.Handler).toBe('index.lambda_handler');
      
      // Check concurrency separately
      const concurrencyResponse = await lambda.getFunctionConcurrency({
        FunctionName: lambdaFunctionName
      }).promise();
      expect(concurrencyResponse.ReservedConcurrentExecutions).toBe(100);
    });

    test('Lambda function should have environment variables', async () => {
      const response = await lambda.getFunctionConfiguration({
        FunctionName: lambdaFunctionName
      }).promise();
      
      expect(response.Environment?.Variables).toBeDefined();
      expect(response.Environment?.Variables?.BUCKET_NAME).toBe(bucketName);
      expect(response.Environment?.Variables?.ENVIRONMENT).toBe('Production');
    });

    test('Lambda function should be invokable', async () => {
      const response = await lambda.invoke({
        FunctionName: lambdaFunctionName,
        InvocationType: 'RequestResponse',
        LogType: 'Tail',
        Payload: JSON.stringify({ test: true })
      }).promise();
      
      expect(response.StatusCode).toBe(200);
      expect(response.Payload).toBeDefined();
      
      const payload = JSON.parse(response.Payload as string);
      expect(payload.statusCode).toBe(200);
    });

    test('Lambda function should have proper IAM role attached', async () => {
      const response = await lambda.getFunctionConfiguration({
        FunctionName: lambdaFunctionName
      }).promise();
      
      expect(response.Role).toBeDefined();
      expect(response.Role).toContain(`prod-lambda-s3-role-${environmentSuffix}`);
    });

    test('Lambda function should have CloudWatch Logs configured', async () => {
      const logGroupName = `/aws/lambda/${lambdaFunctionName}`;
      const response = await cloudWatchLogs.describeLogGroups({
        logGroupNamePrefix: logGroupName
      }).promise();
      
      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);
      const logGroup = response.logGroups?.find(lg => lg.logGroupName === logGroupName);
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(30);
    });
  });

  describe('SNS Topic Tests', () => {
    test('SNS topic should exist and be accessible', async () => {
      const response = await sns.getTopicAttributes({
        TopicArn: snsTopicArn
      }).promise();
      
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.DisplayName).toBe('Production Alerts');
    });

    test('SNS topic should have KMS encryption enabled', async () => {
      const response = await sns.getTopicAttributes({
        TopicArn: snsTopicArn
      }).promise();
      
      expect(response.Attributes!.KmsMasterKeyId).toBeDefined();
      expect(response.Attributes!.KmsMasterKeyId).toContain('alias/aws/sns');
    });

    test('SNS topic should be able to receive messages', async () => {
      // This test publishes a test message to the SNS topic
      const response = await sns.publish({
        TopicArn: snsTopicArn,
        Subject: 'Integration Test Message',
        Message: 'This is a test message from integration tests'
      }).promise();
      
      expect(response.MessageId).toBeDefined();
    });
  });

  describe('CloudWatch Alarms Tests', () => {
    test('Lambda error alarm should exist', async () => {
      const response = await cloudWatch.describeAlarms({
        AlarmNames: [`prod-lambda-errors-${environmentSuffix}`]
      }).promise();
      
      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms?.length).toBe(1);
      
      const alarm = response.MetricAlarms?.[0];
      expect(alarm?.MetricName).toBe('Errors');
      expect(alarm?.Namespace).toBe('AWS/Lambda');
      expect(alarm?.Statistic).toBe('Sum');
      expect(alarm?.Threshold).toBe(1);
    });

    test('Lambda duration alarm should exist', async () => {
      const response = await cloudWatch.describeAlarms({
        AlarmNames: [`prod-lambda-duration-${environmentSuffix}`]
      }).promise();
      
      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms?.length).toBe(1);
      
      const alarm = response.MetricAlarms?.[0];
      expect(alarm?.MetricName).toBe('Duration');
      expect(alarm?.Namespace).toBe('AWS/Lambda');
      expect(alarm?.Statistic).toBe('Average');
      expect(alarm?.Threshold).toBe(25000);
    });

    test('CloudWatch alarms should have SNS topic configured for notifications', async () => {
      const errorAlarmResponse = await cloudWatch.describeAlarms({
        AlarmNames: [`prod-lambda-errors-${environmentSuffix}`]
      }).promise();
      
      const durationAlarmResponse = await cloudWatch.describeAlarms({
        AlarmNames: [`prod-lambda-duration-${environmentSuffix}`]
      }).promise();
      
      const errorAlarm = errorAlarmResponse.MetricAlarms?.[0];
      const durationAlarm = durationAlarmResponse.MetricAlarms?.[0];
      
      expect(errorAlarm?.AlarmActions).toContain(snsTopicArn);
      expect(durationAlarm?.AlarmActions).toContain(snsTopicArn);
    });
  });

  describe('VPC Flow Logs Tests', () => {
    test('VPC Flow Logs should be configured', async () => {
      const response = await ec2.describeFlowLogs({
        FlowLogIds: [vpcFlowLogsId]
      }).promise();
      
      expect(response.FlowLogs).toBeDefined();
      expect(response.FlowLogs?.length).toBe(1);
      
      const flowLog = response.FlowLogs?.[0];
      expect(flowLog?.FlowLogStatus).toBe('ACTIVE');
      expect(flowLog?.TrafficType).toBe('ALL');
      expect(flowLog?.LogDestinationType).toBe('cloud-watch-logs');
    });

    test('VPC Flow Logs should have proper log format', async () => {
      const response = await ec2.describeFlowLogs({
        FlowLogIds: [vpcFlowLogsId]
      }).promise();
      
      const flowLog = response.FlowLogs?.[0];
      expect(flowLog?.LogFormat).toBeDefined();
      expect(flowLog?.LogFormat).toContain('${srcaddr}');
      expect(flowLog?.LogFormat).toContain('${dstaddr}');
      expect(flowLog?.LogFormat).toContain('${action}');
      expect(flowLog?.LogFormat).not.toContain('windowstart');
      expect(flowLog?.LogFormat).not.toContain('windowend');
    });

    test('VPC Flow Logs CloudWatch Log Group should exist', async () => {
      const logGroupName = `/aws/vpc/flowlogs-${environmentSuffix}`;
      const response = await cloudWatchLogs.describeLogGroups({
        logGroupNamePrefix: logGroupName
      }).promise();
      
      expect(response.logGroups).toBeDefined();
      const logGroup = response.logGroups?.find(lg => lg.logGroupName === logGroupName);
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(14);
    });
  });

  describe('End-to-End Workflow Tests', () => {
    test('Lambda function should be able to access S3 bucket', async () => {
      // Create a test object in S3
      const testKey = `lambda-test-${Date.now()}.txt`;
      await s3.putObject({
        Bucket: bucketName,
        Key: testKey,
        Body: 'Lambda test content'
      }).promise();

      // Invoke Lambda with test event
      const response = await lambda.invoke({
        FunctionName: lambdaFunctionName,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify({ 
          action: 'list',
          bucket: bucketName 
        })
      }).promise();
      
      expect(response.StatusCode).toBe(200);
      const payload = JSON.parse(response.Payload as string);
      expect(payload.statusCode).toBe(200);
      
      // Clean up
      await s3.deleteObject({
        Bucket: bucketName,
        Key: testKey
      }).promise();
    });

    test('CloudWatch alarm should trigger when Lambda errors occur', async () => {
      // Get current alarm state
      const alarmResponse = await cloudWatch.describeAlarms({
        AlarmNames: [`prod-lambda-errors-${environmentSuffix}`]
      }).promise();
      
      const alarm = alarmResponse.MetricAlarms?.[0];
      expect(alarm).toBeDefined();
      
      // Verify alarm is configured to monitor the Lambda function
      const dimensions = alarm?.Dimensions;
      const functionDimension = dimensions?.find(d => d.Name === 'FunctionName');
      expect(functionDimension?.Value).toBe(lambdaFunctionName);
    });

    test('All resources should be properly tagged', async () => {
      // Check S3 bucket tags
      const s3Tags = await s3.getBucketTagging({ Bucket: bucketName }).promise();
      expect(s3Tags.TagSet.find(t => t.Key === 'Environment')?.Value).toBe('Production');
      
      // Check Lambda function tags
      const lambdaTags = await lambda.listTags({
        Resource: lambdaFunctionArn
      }).promise();
      expect(lambdaTags.Tags?.Environment).toBe('Production');
      
      // Check SNS topic tags (using list tags from ARN)
      const snsTags = await sns.listTagsForResource({
        ResourceArn: snsTopicArn
      }).promise();
      const snsEnvTag = snsTags.Tags?.find(t => t.Key === 'Environment');
      expect(snsEnvTag?.Value).toBe('Production');
    });
  });

  describe('Security Compliance Tests', () => {
    test('S3 bucket should not have any public policies', async () => {
      try {
        await s3.getBucketPolicy({ Bucket: bucketName }).promise();
        // If we get here, there is a policy - check it's not public
        fail('Bucket policy exists - manual review needed');
      } catch (error: any) {
        // NoSuchBucketPolicy is expected and good
        expect(error.code).toBe('NoSuchBucketPolicy');
      }
    });

    test('Lambda function should have limited concurrent executions', async () => {
      // Use getFunctionConcurrency for more reliable results
      const response = await lambda.getFunctionConcurrency({
        FunctionName: lambdaFunctionName
      }).promise();
      
      expect(response.ReservedConcurrentExecutions).toBeDefined();
      expect(response.ReservedConcurrentExecutions).toBeLessThanOrEqual(100);
    });

    test('SNS topic should be encrypted', async () => {
      const response = await sns.getTopicAttributes({
        TopicArn: snsTopicArn
      }).promise();
      
      expect(response.Attributes!.KmsMasterKeyId).toBeDefined();
      expect(response.Attributes!.KmsMasterKeyId).not.toBe('');
    });
  });
});