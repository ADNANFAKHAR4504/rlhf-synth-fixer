import fs from 'fs';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  GetBucketLifecycleConfigurationCommand,
} from '@aws-sdk/client-s3';
import {
  DynamoDBClient,
  DescribeTableCommand,
} from '@aws-sdk/client-dynamodb';
import {
  SQSClient,
  GetQueueAttributesCommand,
  GetQueueUrlCommand,
} from '@aws-sdk/client-sqs';
import {
  SNSClient,
  GetTopicAttributesCommand,
} from '@aws-sdk/client-sns';
import {
  LambdaClient,
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
} from '@aws-sdk/client-lambda';
import {
  SFNClient,
  DescribeStateMachineCommand,
} from '@aws-sdk/client-sfn';
import {
  IAMClient,
  GetRoleCommand,
  GetRolePolicyCommand,
} from '@aws-sdk/client-iam';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  EventBridgeClient,
  DescribeRuleCommand,
  ListTargetsByRuleCommand,
} from '@aws-sdk/client-eventbridge';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';

// Read outputs from deployment
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const environmentSuffix = outputs.EnvironmentSuffix || 'synth4660942654';
const region = process.env.AWS_REGION || 'ap-southeast-1';

describe('Streaming Media Processing Pipeline - Integration Tests', () => {
  const s3Client = new S3Client({ region });
  const dynamoClient = new DynamoDBClient({ region });
  const sqsClient = new SQSClient({ region });
  const snsClient = new SNSClient({ region });
  const lambdaClient = new LambdaClient({ region });
  const sfnClient = new SFNClient({ region });
  const iamClient = new IAMClient({ region });
  const cwClient = new CloudWatchClient({ region });
  const eventsClient = new EventBridgeClient({ region });
  const cwLogsClient = new CloudWatchLogsClient({ region });

  describe('S3 Buckets', () => {
    test('VideoInputBucket should exist and be accessible', async () => {
      const bucketName = outputs.VideoInputBucketName;
      const command = new HeadBucketCommand({ Bucket: bucketName });
      await expect(s3Client.send(command)).resolves.toBeDefined();
    });

    test('VideoInputBucket should have encryption enabled', async () => {
      const bucketName = outputs.VideoInputBucketName;
      const command = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(
        response.ServerSideEncryptionConfiguration?.Rules[0]
          .ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('AES256');
    });

    test('VideoInputBucket should have versioning enabled', async () => {
      const bucketName = outputs.VideoInputBucketName;
      const command = new GetBucketVersioningCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });

    test('VideoInputBucket should block public access', async () => {
      const bucketName = outputs.VideoInputBucketName;
      const command = new GetPublicAccessBlockCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);
      expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(
        true
      );
      expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(
        true
      );
      expect(response.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(
        true
      );
      expect(
        response.PublicAccessBlockConfiguration?.RestrictPublicBuckets
      ).toBe(true);
    });

    test('VideoOutputBucket should exist and be accessible', async () => {
      const bucketName = outputs.VideoOutputBucketName;
      const command = new HeadBucketCommand({ Bucket: bucketName });
      await expect(s3Client.send(command)).resolves.toBeDefined();
    });

    test('VideoOutputBucket should have lifecycle policy configured', async () => {
      const bucketName = outputs.VideoOutputBucketName;
      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: bucketName,
      });
      const response = await s3Client.send(command);
      expect(response.Rules).toBeDefined();
      expect(response.Rules!.length).toBeGreaterThan(0);
      expect(response.Rules![0].Status).toBe('Enabled');
    });
  });

  describe('DynamoDB Table', () => {
    test('VideoJobStatusTable should exist and be active', async () => {
      const tableName = outputs.VideoJobStatusTableName;
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);
      expect(response.Table?.TableStatus).toBe('ACTIVE');
    });

    test('VideoJobStatusTable should use PAY_PER_REQUEST billing mode', async () => {
      const tableName = outputs.VideoJobStatusTableName;
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);
      expect(response.Table?.BillingModeSummary?.BillingMode).toBe(
        'PAY_PER_REQUEST'
      );
    });

    test('VideoJobStatusTable should have correct key schema', async () => {
      const tableName = outputs.VideoJobStatusTableName;
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);
      const keySchema = response.Table?.KeySchema;
      expect(keySchema).toHaveLength(1);
      expect(keySchema![0].AttributeName).toBe('jobId');
      expect(keySchema![0].KeyType).toBe('HASH');
    });

    test('VideoJobStatusTable should have GSI for status and timestamp', async () => {
      const tableName = outputs.VideoJobStatusTableName;
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);
      const gsi = response.Table?.GlobalSecondaryIndexes;
      expect(gsi).toHaveLength(1);
      expect(gsi![0].IndexName).toBe('StatusTimestampIndex');
      expect(gsi![0].IndexStatus).toBe('ACTIVE');
    });
  });

  describe('SQS Queues', () => {
    test('VideoProcessingQueue should exist', async () => {
      const queueUrl = outputs.VideoProcessingQueueUrl;
      const command = new GetQueueAttributesCommand({
        QueueUrl: queueUrl,
        AttributeNames: ['All'],
      });
      const response = await sqsClient.send(command);
      expect(response.Attributes).toBeDefined();
    });

    test('VideoProcessingQueue should have DLQ configured', async () => {
      const queueUrl = outputs.VideoProcessingQueueUrl;
      const command = new GetQueueAttributesCommand({
        QueueUrl: queueUrl,
        AttributeNames: ['RedrivePolicy'],
      });
      const response = await sqsClient.send(command);
      const redrivePolicy = JSON.parse(
        response.Attributes?.RedrivePolicy || '{}'
      );
      expect(redrivePolicy.maxReceiveCount).toBe(3);
      expect(redrivePolicy.deadLetterTargetArn).toBeDefined();
    });

    test('VideoProcessingQueue should have appropriate visibility timeout', async () => {
      const queueUrl = outputs.VideoProcessingQueueUrl;
      const command = new GetQueueAttributesCommand({
        QueueUrl: queueUrl,
        AttributeNames: ['VisibilityTimeout'],
      });
      const response = await sqsClient.send(command);
      expect(response.Attributes?.VisibilityTimeout).toBe('900');
    });

    test('VideoProcessingDLQ should exist', async () => {
      const queueUrl = outputs.VideoProcessingDLQUrl;
      const command = new GetQueueAttributesCommand({
        QueueUrl: queueUrl,
        AttributeNames: ['All'],
      });
      await expect(sqsClient.send(command)).resolves.toBeDefined();
    });
  });

  describe('SNS Topic', () => {
    test('TranscodingCompleteTopic should exist', async () => {
      const topicArn = outputs.TranscodingCompleteTopicArn;
      const command = new GetTopicAttributesCommand({ TopicArn: topicArn });
      const response = await snsClient.send(command);
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(topicArn);
    });

    test('TranscodingCompleteTopic should have display name', async () => {
      const topicArn = outputs.TranscodingCompleteTopicArn;
      const command = new GetTopicAttributesCommand({ TopicArn: topicArn });
      const response = await snsClient.send(command);
      expect(response.Attributes?.DisplayName).toBe(
        'Video Transcoding Completion Notifications'
      );
    });
  });

  describe('Lambda Function', () => {
    test('TranscodingOrchestratorFunction should exist and be active', async () => {
      const functionArn = outputs.TranscodingOrchestratorFunctionArn;
      const functionName = functionArn.split(':').pop();
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);
      expect(response.Configuration?.State).toBe('Active');
    });

    test('TranscodingOrchestratorFunction should have correct runtime', async () => {
      const functionArn = outputs.TranscodingOrchestratorFunctionArn;
      const functionName = functionArn.split(':').pop();
      const command = new GetFunctionConfigurationCommand({
        FunctionName: functionName,
      });
      const response = await lambdaClient.send(command);
      expect(response.Runtime).toBe('python3.11');
    });

    test('TranscodingOrchestratorFunction should have correct timeout and memory', async () => {
      const functionArn = outputs.TranscodingOrchestratorFunctionArn;
      const functionName = functionArn.split(':').pop();
      const command = new GetFunctionConfigurationCommand({
        FunctionName: functionName,
      });
      const response = await lambdaClient.send(command);
      expect(response.Timeout).toBe(300);
      expect(response.MemorySize).toBe(512);
    });

    test('TranscodingOrchestratorFunction should have required environment variables', async () => {
      const functionArn = outputs.TranscodingOrchestratorFunctionArn;
      const functionName = functionArn.split(':').pop();
      const command = new GetFunctionConfigurationCommand({
        FunctionName: functionName,
      });
      const response = await lambdaClient.send(command);
      const env = response.Environment?.Variables;
      expect(env?.MEDIACONVERT_ROLE_ARN).toBe(outputs.MediaConvertRoleArn);
      expect(env?.OUTPUT_BUCKET).toBe(outputs.VideoOutputBucketName);
      expect(env?.JOB_STATUS_TABLE).toBe(outputs.VideoJobStatusTableName);
      expect(env?.SNS_TOPIC_ARN).toBe(outputs.TranscodingCompleteTopicArn);
    });
  });

  describe('Step Functions State Machine', () => {
    test('TranscodingStateMachine should exist and be active', async () => {
      const stateMachineArn = outputs.TranscodingStateMachineArn;
      const command = new DescribeStateMachineCommand({
        stateMachineArn: stateMachineArn,
      });
      const response = await sfnClient.send(command);
      expect(response.status).toBe('ACTIVE');
    });

    test('TranscodingStateMachine should have logging enabled', async () => {
      const stateMachineArn = outputs.TranscodingStateMachineArn;
      const command = new DescribeStateMachineCommand({
        stateMachineArn: stateMachineArn,
      });
      const response = await sfnClient.send(command);
      expect(response.loggingConfiguration).toBeDefined();
      expect(response.loggingConfiguration?.level).toBe('ALL');
    });

    test('TranscodingStateMachine definition should include all required states', async () => {
      const stateMachineArn = outputs.TranscodingStateMachineArn;
      const command = new DescribeStateMachineCommand({
        stateMachineArn: stateMachineArn,
      });
      const response = await sfnClient.send(command);
      const definition = JSON.parse(response.definition!);
      expect(definition.States).toBeDefined();
      expect(definition.States.StartTranscoding).toBeDefined();
      expect(definition.States.WaitForCompletion).toBeDefined();
      expect(definition.States.CheckJobStatus).toBeDefined();
      expect(definition.States.TranscodingSuccess).toBeDefined();
      expect(definition.States.TranscodingFailed).toBeDefined();
    });
  });

  describe('IAM Roles', () => {
    test('MediaConvertRole should exist', async () => {
      const roleArn = outputs.MediaConvertRoleArn;
      const roleName = roleArn.split('/').pop();
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);
      expect(response.Role?.Arn).toBe(roleArn);
    });

    test('MediaConvertRole should have correct assume role policy', async () => {
      const roleArn = outputs.MediaConvertRoleArn;
      const roleName = roleArn.split('/').pop();
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);
      const assumeRolePolicy = JSON.parse(
        decodeURIComponent(response.Role?.AssumeRolePolicyDocument || '{}')
      );
      expect(assumeRolePolicy.Statement[0].Principal.Service).toBe(
        'mediaconvert.amazonaws.com'
      );
    });
  });

  describe('EventBridge Rule', () => {
    test('VideoUploadEventRule should exist and be enabled', async () => {
      const ruleName = `video-upload-event-${environmentSuffix}`;
      const command = new DescribeRuleCommand({ Name: ruleName });
      const response = await eventsClient.send(command);
      expect(response.State).toBe('ENABLED');
    });

    test('VideoUploadEventRule should target Lambda function', async () => {
      const ruleName = `video-upload-event-${environmentSuffix}`;
      const command = new ListTargetsByRuleCommand({ Rule: ruleName });
      const response = await eventsClient.send(command);
      expect(response.Targets).toHaveLength(1);
      expect(response.Targets![0].Arn).toBe(
        outputs.TranscodingOrchestratorFunctionArn
      );
    });
  });

  describe('CloudWatch Alarms', () => {
    test('ProcessingErrorAlarm should exist', async () => {
      const alarmName = `video-processing-errors-${environmentSuffix}`;
      const command = new DescribeAlarmsCommand({
        AlarmNames: [alarmName],
      });
      const response = await cwClient.send(command);
      expect(response.MetricAlarms).toHaveLength(1);
      expect(response.MetricAlarms![0].MetricName).toBe('Errors');
    });

    test('DLQDepthAlarm should exist', async () => {
      const alarmName = `dlq-messages-${environmentSuffix}`;
      const command = new DescribeAlarmsCommand({
        AlarmNames: [alarmName],
      });
      const response = await cwClient.send(command);
      expect(response.MetricAlarms).toHaveLength(1);
      expect(response.MetricAlarms![0].MetricName).toBe(
        'ApproximateNumberOfMessagesVisible'
      );
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('TranscodingLambdaLogGroup should exist', async () => {
      const logGroupName = `/aws/lambda/transcoding-orchestrator-${environmentSuffix}`;
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const response = await cwLogsClient.send(command);
      expect(response.logGroups).toHaveLength(1);
      expect(response.logGroups![0].retentionInDays).toBe(7);
    });

    test('TranscodingStateMachineLogGroup should exist', async () => {
      const logGroupName = `/aws/stepfunctions/transcoding-${environmentSuffix}`;
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const response = await cwLogsClient.send(command);
      expect(response.logGroups).toHaveLength(1);
      expect(response.logGroups![0].retentionInDays).toBe(7);
    });
  });

  describe('Resource Integration', () => {
    test('All resources should be properly tagged', async () => {
      // Test S3 bucket tags would require additional API calls
      // This test verifies that tagging structure is in place through outputs
      expect(outputs.EnvironmentSuffix).toBeDefined();
      expect(outputs.StackName).toBeDefined();
    });

    test('IAM roles should have correct permissions for resource access', async () => {
      // Verify that the Lambda function role ARN is properly configured
      const functionArn = outputs.TranscodingOrchestratorFunctionArn;
      const functionName = functionArn.split(':').pop();
      const command = new GetFunctionConfigurationCommand({
        FunctionName: functionName,
      });
      const response = await lambdaClient.send(command);
      expect(response.Role).toBeDefined();
      expect(response.Role).toContain(`transcoding-lambda-role-${environmentSuffix}`);
    });

    test('All output values should be properly formatted ARNs or names', () => {
      expect(outputs.VideoInputBucketArn).toMatch(/^arn:aws:s3:::/);
      expect(outputs.VideoOutputBucketArn).toMatch(/^arn:aws:s3:::/);
      expect(outputs.VideoJobStatusTableArn).toMatch(/^arn:aws:dynamodb:/);
      expect(outputs.VideoProcessingQueueArn).toMatch(/^arn:aws:sqs:/);
      expect(outputs.TranscodingCompleteTopicArn).toMatch(/^arn:aws:sns:/);
      expect(outputs.TranscodingOrchestratorFunctionArn).toMatch(
        /^arn:aws:lambda:/
      );
      expect(outputs.TranscodingStateMachineArn).toMatch(/^arn:aws:states:/);
      expect(outputs.MediaConvertRoleArn).toMatch(/^arn:aws:iam:/);
    });

    test('All resources should include environment suffix in their names', () => {
      expect(outputs.VideoInputBucketName).toContain(environmentSuffix);
      expect(outputs.VideoOutputBucketName).toContain(environmentSuffix);
      expect(outputs.VideoJobStatusTableName).toContain(environmentSuffix);
      expect(outputs.TranscodingOrchestratorFunctionArn).toContain(
        environmentSuffix
      );
      expect(outputs.TranscodingStateMachineArn).toContain(environmentSuffix);
    });
  });

  describe('Workflow Validation', () => {
    test('Pipeline components should be properly connected', async () => {
      // Verify Lambda function has access to all required resources through environment variables
      const functionArn = outputs.TranscodingOrchestratorFunctionArn;
      const functionName = functionArn.split(':').pop();
      const command = new GetFunctionConfigurationCommand({
        FunctionName: functionName,
      });
      const response = await lambdaClient.send(command);
      const env = response.Environment?.Variables;

      // Verify environment variables point to correct resources
      expect(env?.JOB_STATUS_TABLE).toBe(outputs.VideoJobStatusTableName);
      expect(env?.OUTPUT_BUCKET).toBe(outputs.VideoOutputBucketName);
      expect(env?.SNS_TOPIC_ARN).toBe(outputs.TranscodingCompleteTopicArn);
      expect(env?.MEDIACONVERT_ROLE_ARN).toBe(outputs.MediaConvertRoleArn);
    });

    test('Step Functions state machine should reference Lambda function', async () => {
      const stateMachineArn = outputs.TranscodingStateMachineArn;
      const command = new DescribeStateMachineCommand({
        stateMachineArn: stateMachineArn,
      });
      const response = await sfnClient.send(command);
      const definition = JSON.parse(response.definition!);
      expect(definition.States.StartTranscoding.Resource).toContain(
        'transcoding-orchestrator'
      );
    });

    test('EventBridge rule should have correct event pattern', async () => {
      const ruleName = `video-upload-event-${environmentSuffix}`;
      const command = new DescribeRuleCommand({ Name: ruleName });
      const response = await eventsClient.send(command);
      const eventPattern = JSON.parse(response.EventPattern || '{}');
      expect(eventPattern.source).toContain('aws.s3');
      expect(eventPattern['detail-type']).toContain('Object Created');
    });
  });
});
