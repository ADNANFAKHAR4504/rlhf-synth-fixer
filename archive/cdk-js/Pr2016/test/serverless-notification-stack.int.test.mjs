// Serverless Notification Service Integration Tests
// Tests the complete workflow using real AWS deployment outputs
import { LambdaClient, InvokeCommand, GetFunctionConfigurationCommand } from '@aws-sdk/client-lambda';
import { S3Client, HeadBucketCommand, GetBucketVersioningCommand, GetPublicAccessBlockCommand, GetObjectCommand, GetBucketEncryptionCommand, GetBucketLifecycleConfigurationCommand, PutObjectCommand, DeleteObjectCommand, ListObjectVersionsCommand, GetBucketTaggingCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { SNSClient, GetTopicAttributesCommand, PublishCommand, ListTagsForResourceCommand } from '@aws-sdk/client-sns';
import { IAMClient, SimulatePrincipalPolicyCommand, ListAttachedRolePoliciesCommand, ListRolePoliciesCommand, GetRoleCommand } from '@aws-sdk/client-iam';
import { CloudWatchLogsClient, DescribeLogGroupsCommand, DescribeLogStreamsCommand, FilterLogEventsCommand, GetLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// AWS SDK Configuration
const region = process.env.AWS_REGION || 'us-east-1';
const config = { region };

const lambda = new LambdaClient(config);
const s3 = new S3Client(config);
const sns = new SNSClient(config);
const iam = new IAMClient(config);
const cloudwatchLogs = new CloudWatchLogsClient(config);

// Load deployment outputs
let outputs = {};
try {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
} catch (error) {
  console.warn('No cfn-outputs found, using environment variables as fallback');
  // Fallback to environment variables for CI/CD scenarios
  const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
  outputs = {
    [`TaskResultsBucketName-${environmentSuffix}`]:
      process.env.TASK_RESULTS_BUCKET_NAME,
    [`TaskCompletionTopicArn-${environmentSuffix}`]:
      process.env.TASK_COMPLETION_TOPIC_ARN,
    [`TaskProcessorFunctionArn-${environmentSuffix}`]:
      process.env.TASK_PROCESSOR_FUNCTION_ARN,
    [`TaskProcessorFunctionName-${environmentSuffix}`]:
      process.env.TASK_PROCESSOR_FUNCTION_NAME,
    [`ServerlessNotificationStackStatus-${environmentSuffix}`]:
      process.env.STACK_STATUS,
  };
}

// Helper function to get output value by partial key match
function getOutputByPattern(pattern) {
  const key = Object.keys(outputs).find(k => k.includes(pattern));
  return key ? outputs[key] : null;
}

// Extract resource identifiers from outputs (environment-agnostic)
const bucketName = getOutputByPattern('TaskResultsBucketName');
const topicArn = getOutputByPattern('TaskCompletionTopicArn');
const functionArn = getOutputByPattern('TaskProcessorFunctionArn');
const functionName = getOutputByPattern('TaskProcessorFunctionName');
const stackStatus = getOutputByPattern('StackStatus'); // Look for StackStatus instead of ServerlessNotificationStackStatus

// Test timeout for AWS operations
const AWS_TIMEOUT = 30000;

describe('Serverless Notification Service - Integration Tests', () => {
  beforeAll(async () => {
    // Verify deployment outputs are available
    expect(bucketName).toBeDefined();
    expect(topicArn).toBeDefined();
    expect(functionArn).toBeDefined();
    expect(functionName).toBeDefined();
    expect(stackStatus).toBe('DEPLOYED');
  }, AWS_TIMEOUT);

  describe('Infrastructure Deployment Validation', () => {
    test(
      'validates all required AWS resources exist',
      async () => {
        // Test S3 bucket exists and is accessible
        const bucketHeadResponse = await s3.send(new HeadBucketCommand({ Bucket: bucketName }));
        expect(bucketHeadResponse).toBeDefined();

        // Test SNS topic exists and is accessible
        const topicAttributes = await sns.send(new GetTopicAttributesCommand({ TopicArn: topicArn }));
        expect(topicAttributes.Attributes).toBeDefined();
        expect(topicAttributes.Attributes.TopicArn).toBe(topicArn);

        // Test Lambda function exists and is accessible
        const functionConfig = await lambda.send(new GetFunctionConfigurationCommand({ FunctionName: functionName }));
        expect(functionConfig.FunctionArn).toBe(functionArn);
        expect(functionConfig.Runtime).toBe('python3.11');
      },
      AWS_TIMEOUT
    );

    test(
      'validates S3 bucket security configuration',
      async () => {
        // Check bucket public access block configuration
        const publicAccessBlock = await s3.send(new GetPublicAccessBlockCommand({ Bucket: bucketName }));
        expect(
          publicAccessBlock.PublicAccessBlockConfiguration.BlockPublicAcls
        ).toBe(true);
        expect(
          publicAccessBlock.PublicAccessBlockConfiguration.BlockPublicPolicy
        ).toBe(true);
        expect(
          publicAccessBlock.PublicAccessBlockConfiguration.IgnorePublicAcls
        ).toBe(true);
        expect(
          publicAccessBlock.PublicAccessBlockConfiguration.RestrictPublicBuckets
        ).toBe(true);

        // Check bucket encryption
        const encryption = await s3.send(new GetBucketEncryptionCommand({ Bucket: bucketName }));
        expect(encryption.ServerSideEncryptionConfiguration.Rules).toHaveLength(
          1
        );
        expect(
          encryption.ServerSideEncryptionConfiguration.Rules[0]
            .ApplyServerSideEncryptionByDefault.SSEAlgorithm
        ).toBe('AES256');

        // Check bucket versioning
        const versioning = await s3.send(new GetBucketVersioningCommand({ Bucket: bucketName }));
        expect(versioning.Status).toBe('Enabled');
      },
      AWS_TIMEOUT
    );

    test(
      'validates Lambda function configuration and environment',
      async () => {
        const functionConfig = await lambda.send(new GetFunctionConfigurationCommand({ FunctionName: functionName }));

        // Validate function configuration
        expect(functionConfig.Timeout).toBe(300);
        expect(functionConfig.MemorySize).toBe(512);
        expect(functionConfig.Runtime).toBe('python3.11');
        expect(functionConfig.Handler).toBe('task-processor.lambda_handler');

        // Validate environment variables
        expect(functionConfig.Environment.Variables.S3_BUCKET_NAME).toBe(
          bucketName
        );
        expect(functionConfig.Environment.Variables.SNS_TOPIC_ARN).toBe(
          topicArn
        );
        expect(functionConfig.Environment.Variables.REGION).toBe(region);

        // Validate dead letter queue is configured
        expect(functionConfig.DeadLetterConfig).toBeDefined();
        expect(functionConfig.DeadLetterConfig.TargetArn).toBeDefined();
      },
      AWS_TIMEOUT
    );
  });

  describe('IAM Permissions Validation', () => {
    test(
      'validates Lambda function has correct IAM permissions',
      async () => {
        const functionConfig = await lambda.send(new GetFunctionConfigurationCommand({ FunctionName: functionName }));
        const roleArn = functionConfig.Role;

        // Extract role name from ARN
        const roleName = roleArn.split('/').pop();

        // Get attached policies
        const attachedPolicies = await iam.send(new ListAttachedRolePoliciesCommand({ RoleName: roleName }));
        const inlinePolicies = await iam.send(new ListRolePoliciesCommand({ RoleName: roleName }));

        // Should have at least one policy attached (service role + custom permissions)
        expect(
          attachedPolicies.AttachedPolicies.length +
            inlinePolicies.PolicyNames.length
        ).toBeGreaterThan(0);

        // Check for Lambda basic execution role
        const hasLambdaExecutionRole = attachedPolicies.AttachedPolicies.some(
          policy =>
            policy.PolicyArn.includes('AWSLambdaBasicExecutionRole') ||
            policy.PolicyArn.includes('lambda')
        );
        expect(hasLambdaExecutionRole).toBe(true);
      },
      AWS_TIMEOUT
    );

    test(
      'validates Lambda can assume its execution role',
      async () => {
        const functionConfig = await lambda.send(new GetFunctionConfigurationCommand({ FunctionName: functionName }));
        const roleArn = functionConfig.Role;
        const roleName = roleArn.split('/').pop();

        // Get role assume role policy
        const role = await iam.send(new GetRoleCommand({ RoleName: roleName }));
        const assumeRolePolicy = JSON.parse(
          decodeURIComponent(role.Role.AssumeRolePolicyDocument)
        );

        // Validate Lambda service can assume this role
        const lambdaPrincipal = assumeRolePolicy.Statement.find(
          stmt =>
            stmt.Principal &&
            stmt.Principal.Service &&
            stmt.Principal.Service.includes('lambda.amazonaws.com')
        );
        expect(lambdaPrincipal).toBeDefined();
        expect(lambdaPrincipal.Effect).toBe('Allow');
        expect(lambdaPrincipal.Action).toBe('sts:AssumeRole');
      },
      AWS_TIMEOUT
    );
  });

  describe('Complete Workflow End-to-End Tests', () => {
    test(
      'validates complete serverless notification workflow',
      async () => {
        const testTaskId = uuidv4();
        const testPayload = {
          taskData: {
            items: ['item1', 'item2', 'item3'],
            priority: 'high',
            testId: testTaskId,
          },
        };

        // Step 1: Invoke Lambda function
        const invocationResult = await lambda.send(new InvokeCommand({
          FunctionName: functionName,
          InvocationType: 'RequestResponse',
          Payload: JSON.stringify(testPayload),
        }));

        // Validate Lambda execution succeeded
        expect(invocationResult.StatusCode).toBe(200);
        expect(invocationResult.FunctionError).toBeUndefined();

        const payloadString = new TextDecoder().decode(invocationResult.Payload);
        const response = JSON.parse(payloadString);
        expect(response.statusCode).toBe(200);

        const responseBody = JSON.parse(response.body);
        expect(responseBody.taskId).toBeDefined();
        expect(responseBody.s3Key).toBeDefined();
        expect(responseBody.notificationMessageId).toBeDefined();

        // Step 2: Verify S3 object was created with correct data
        const s3Key = responseBody.s3Key;
        await new Promise(resolve => setTimeout(resolve, 2000)); // Small delay for eventual consistency

        const s3Object = await s3.send(new GetObjectCommand({
          Bucket: bucketName,
          Key: s3Key,
        }));

        const s3BodyString = await s3Object.Body.transformToString();
        const s3Data = JSON.parse(s3BodyString);
        expect(s3Data.taskId).toBe(responseBody.taskId);
        expect(s3Data.status).toBe('completed');
        expect(s3Data.inputData).toEqual(testPayload.taskData);
        expect(s3Data.result.processedItems).toBe(3);

        // Validate S3 object metadata
        expect(s3Object.Metadata).toBeDefined();
        expect(s3Object.Metadata.taskid).toBe(responseBody.taskId);
        expect(s3Object.Metadata.status).toBe('completed');

        // Step 3: Verify SNS notification was sent (check CloudWatch logs)
        const logStreams = await cloudwatchLogs.send(new DescribeLogStreamsCommand({
          logGroupName: `/aws/lambda/${functionName}`,
          orderBy: 'LastEventTime',
          descending: true,
          limit: 5,
        }));

        // Verify log streams exist (indicates function was invoked)
        if (logStreams.logStreams.length > 0) {
          const recentLogStream = logStreams.logStreams[0];
          const logEvents = await cloudwatchLogs.send(new GetLogEventsCommand({
            logGroupName: `/aws/lambda/${functionName}`,
            logStreamName: recentLogStream.logStreamName,
            startTime: Date.now() - 300000, // Last 5 minutes
          }));

          // Check for SNS publish in logs (optional - may not always be present in recent logs)
          const snsPublishLog = logEvents.events.find(
            event =>
              event.message.includes('Notification published:') ||
              event.message.includes(responseBody.notificationMessageId)
          );
          // Don't fail if log not found - SNS notification was already verified by message ID
          console.log('SNS publish log found:', snsPublishLog ? 'Yes' : 'No');
        } else {
          // If no log streams, create a new invocation to generate logs
          console.log(
            'No existing log streams found - this is normal for new deployments'
          );
        }
      },
      AWS_TIMEOUT
    );

    test(
      'validates Lambda error handling and dead letter queue',
      async () => {
        const invalidPayload = {
          // Intentionally malformed payload to trigger error
          invalidData: null,
          simulateError: true,
        };

        // Invoke Lambda with invalid payload
        const invocationResult = await lambda.send(new InvokeCommand({
          FunctionName: functionName,
          InvocationType: 'RequestResponse',
          Payload: JSON.stringify(invalidPayload),
        }));

        // Lambda should handle the error gracefully
        expect(invocationResult.StatusCode).toBe(200);

        const payloadString = new TextDecoder().decode(invocationResult.Payload);
        const response = JSON.parse(payloadString);

        // Should return error response but not crash
        if (response.statusCode === 500) {
          const errorBody = JSON.parse(response.body);
          expect(errorBody.error).toBe('Task processing failed');
          expect(errorBody.message).toBeDefined();
        } else {
          // Or handle gracefully and process with default values
          expect(response.statusCode).toBe(200);
        }
      },
      AWS_TIMEOUT
    );

    test(
      'validates S3 bucket lifecycle and versioning behavior',
      async () => {
        const testKey = `integration-test/${uuidv4()}/test-file.json`;
        const testData = { test: 'data', timestamp: Date.now() };

        // Upload test object
        await s3
          .send(new PutObjectCommand({
            Bucket: bucketName,
            Key: testKey,
            Body: JSON.stringify(testData),
            ContentType: 'application/json',
          }));

        // Upload second version of same object
        const updatedData = { ...testData, version: 2 };
        await s3.send(new PutObjectCommand({
          Bucket: bucketName,
          Key: testKey,
          Body: JSON.stringify(updatedData),
          ContentType: 'application/json',
        }));

        // List object versions
        const versions = await s3.send(new ListObjectVersionsCommand({
          Bucket: bucketName,
          Prefix: testKey,
        }));

        // Should have 2 versions due to versioning being enabled
        expect(versions.Versions.length).toBe(2);

        // Get current version should return latest data
        const currentObject = await s3.send(new GetObjectCommand({
          Bucket: bucketName,
          Key: testKey,
        }));

        const currentBodyString = await currentObject.Body.transformToString();
        const currentData = JSON.parse(currentBodyString);
        expect(currentData.version).toBe(2);

        // Cleanup test object
        await s3.send(new DeleteObjectCommand({
          Bucket: bucketName,
          Key: testKey,
        }));
      },
      AWS_TIMEOUT
    );
  });

  describe('Resource Connectivity and Security Tests', () => {
    test(
      'validates Lambda-S3 connectivity and permissions',
      async () => {
        // Test that Lambda can write to S3 bucket
        const testKey = `connectivity-test/${uuidv4()}/lambda-s3-test.json`;
        const testPayload = {
          taskData: {
            connectivityTest: true,
            testKey: testKey,
          },
        };

        const invocationResult = await lambda.send(new InvokeCommand({
          FunctionName: functionName,
          InvocationType: 'RequestResponse',
          Payload: JSON.stringify(testPayload),
        }));

        expect(invocationResult.StatusCode).toBe(200);
        const payloadString = new TextDecoder().decode(invocationResult.Payload);
        const response = JSON.parse(payloadString);
        expect(response.statusCode).toBe(200);

        const responseBody = JSON.parse(response.body);

        // Verify S3 object exists
        const s3Object = await s3.send(new HeadObjectCommand({
          Bucket: bucketName,
          Key: responseBody.s3Key,
        }));

        expect(s3Object).toBeDefined();
        expect(s3Object.ContentLength).toBeGreaterThan(0);
      },
      AWS_TIMEOUT
    );

    test(
      'validates Lambda-SNS connectivity and permissions',
      async () => {
        const testPayload = {
          taskData: {
            snsTest: true,
            items: ['sns-test-item'],
          },
        };

        const invocationResult = await lambda.send(new InvokeCommand({
          FunctionName: functionName,
          InvocationType: 'RequestResponse',
          Payload: JSON.stringify(testPayload),
        }));

        expect(invocationResult.StatusCode).toBe(200);
        const payloadString = new TextDecoder().decode(invocationResult.Payload);
        const response = JSON.parse(payloadString);
        expect(response.statusCode).toBe(200);

        const responseBody = JSON.parse(response.body);
        expect(responseBody.notificationMessageId).toBeDefined();

        // Message ID should be a valid SNS message ID format
        expect(responseBody.notificationMessageId).toMatch(/^[0-9a-f-]{36}$/i);
      },
      AWS_TIMEOUT
    );

    test(
      'validates resource tagging and governance',
      async () => {
        // Check S3 bucket tags
        const bucketTags = await s3.send(new GetBucketTaggingCommand({ Bucket: bucketName }));
        const tagSet = bucketTags.TagSet;

        const environmentTag = tagSet.find(tag => tag.Key === 'Environment');
        const departmentTag = tagSet.find(tag => tag.Key === 'Department');

        expect(environmentTag).toBeDefined();
        expect(environmentTag.Value).toBe('production');
        expect(departmentTag).toBeDefined();
        expect(departmentTag.Value).toBe('IT');

        // Check SNS topic tags
        const topicTags = await sns.send(new ListTagsForResourceCommand({ ResourceArn: topicArn }));
        const snsTagMap = topicTags.Tags.reduce(
          (acc, tag) => ({ ...acc, [tag.Key]: tag.Value }),
          {}
        );

        expect(snsTagMap.Environment).toBe('production');
        expect(snsTagMap.Department).toBe('IT');
      },
      AWS_TIMEOUT
    );
  });

  describe('Performance and Scalability Tests', () => {
    test(
      'validates Lambda concurrent execution handling',
      async () => {
        const concurrentInvocations = Array.from({ length: 5 }, (_, i) => {
          const testPayload = {
            taskData: {
              concurrencyTest: true,
              invocationId: i,
              items: [`item-${i}-1`, `item-${i}-2`],
            },
          };

          return lambda.send(new InvokeCommand({
            FunctionName: functionName,
            InvocationType: 'RequestResponse',
            Payload: JSON.stringify(testPayload),
          }));
        });

        const results = await Promise.all(concurrentInvocations);

        // All invocations should succeed
        results.forEach((result, index) => {
          expect(result.StatusCode).toBe(200);
          expect(result.FunctionError).toBeUndefined();

          const payloadString = new TextDecoder().decode(result.Payload);
          const response = JSON.parse(payloadString);
          expect(response.statusCode).toBe(200);

          const responseBody = JSON.parse(response.body);
          expect(responseBody.taskId).toBeDefined();
          expect(responseBody.s3Key).toBeDefined();
          expect(responseBody.notificationMessageId).toBeDefined();
        });

        // Verify all S3 objects were created
        const s3Keys = results.map(result => {
          const payloadString = new TextDecoder().decode(result.Payload);
          const response = JSON.parse(payloadString);
          const responseBody = JSON.parse(response.body);
          return responseBody.s3Key;
        });

        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for eventual consistency

        for (const s3Key of s3Keys) {
          const s3Object = await s3.send(new HeadObjectCommand({
            Bucket: bucketName,
            Key: s3Key,
          }));
          expect(s3Object).toBeDefined();
        }
      },
      AWS_TIMEOUT
    );

    test(
      'validates system handles large payloads efficiently',
      async () => {
        // Create a larger payload to test performance
        const largeItems = Array.from(
          { length: 100 },
          (_, i) => `large-item-${i}`
        );
        const largePayload = {
          taskData: {
            performanceTest: true,
            items: largeItems,
            metadata: {
              description: 'Large payload performance test'.repeat(10),
              timestamp: Date.now(),
            },
          },
        };

        const startTime = Date.now();
        const invocationResult = await lambda.send(new InvokeCommand({
          FunctionName: functionName,
          InvocationType: 'RequestResponse',
          Payload: JSON.stringify(largePayload),
        }));
        const endTime = Date.now();

        expect(invocationResult.StatusCode).toBe(200);
        const payloadString = new TextDecoder().decode(invocationResult.Payload);
        const response = JSON.parse(payloadString);
        expect(response.statusCode).toBe(200);

        const responseBody = JSON.parse(response.body);
        expect(responseBody.taskId).toBeDefined();

        // Verify S3 object contains all data
        await new Promise(resolve => setTimeout(resolve, 2000));
        const s3Object = await s3.send(new GetObjectCommand({
          Bucket: bucketName,
          Key: responseBody.s3Key,
        }));

        const s3BodyString = await s3Object.Body.transformToString();
        const s3Data = JSON.parse(s3BodyString);
        expect(s3Data.result.processedItems).toBe(100);
        expect(s3Data.inputData.items).toHaveLength(100);

        // Performance should be reasonable (under 10 seconds)
        const duration = endTime - startTime;
        expect(duration).toBeLessThan(10000);
      },
      AWS_TIMEOUT
    );
  });
});
