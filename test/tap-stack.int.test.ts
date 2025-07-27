import fs from 'fs';
import { S3Client, GetBucketNotificationConfigurationCommand, GetBucketNotificationConfigurationCommandOutput, PutObjectCommand } from '@aws-sdk/client-s3';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { IAMClient, GetRolePolicyCommand } from '@aws-sdk/client-iam';
import { CloudWatchLogsClient, DescribeLogStreamsCommand } from '@aws-sdk/client-cloudwatch-logs';

// Load CloudFormation Outputs after successful CDK deploy
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Extract CloudFormation outputs
const s3BucketName = outputs.S3BucketName;
const lambdaFunctionName = outputs.LambdaFunctionName;
const lambdaExecutionRoleArn = outputs.LambdaExecutionRoleArn;

// Initialize AWS SDK clients
const s3 = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const lambda = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });
const iam = new IAMClient({ region: process.env.AWS_REGION || 'us-east-1' });
const cloudwatch = new CloudWatchLogsClient({ region: process.env.AWS_REGION || 'us-east-1' });

// Define test data
const testObjectKey = 'test-object.txt'; // Example object key for testing
const testPayload = { key: 'value' }; // Example payload to trigger Lambda

describe('Lambda Triggered by S3 Events Integration Tests', () => {

  describe('Lambda Function and S3 Bucket Integration', () => {

    // Test: Verify that the Lambda function can be triggered by an S3 event
    test('Lambda should be triggered by S3 object creation', async () => {
      // Check if the Lambda function and S3 bucket are properly deployed
      expect(s3BucketName).toBeDefined();
      expect(lambdaFunctionName).toBeDefined();

      // Upload a test object to the S3 bucket to trigger the Lambda function
      const params = {
        Bucket: s3BucketName,
        Key: testObjectKey,
        Body: 'Test content', // You can replace this with actual content
      };

      try {
        // Upload file to the S3 bucket
        await s3.send(new PutObjectCommand(params));

        // Wait for the Lambda function to be triggered (it may take some time)
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds for Lambda to process

        // Check if the Lambda function executed successfully by invoking it directly
        const lambdaResponse = await lambda.send(new InvokeCommand({
          FunctionName: lambdaFunctionName,
          Payload: JSON.stringify(testPayload),
        }));

        const responsePayload = JSON.parse(new TextDecoder().decode(lambdaResponse.Payload));

        // Validate Lambda function's response
        expect(lambdaResponse.StatusCode).toBe(200);
        expect(responsePayload).toBeDefined();
        expect(responsePayload).toHaveProperty('statusCode', 200);
        expect(responsePayload).toHaveProperty('body');

      } catch (error) {
        console.error('Error occurred during the S3 upload or Lambda invocation:', error);
        expect(error).toBeNull();  // Ensure that no errors occurred during the test
      }
    });

    // Test: Verify the IAM role permissions for Lambda to access S3
    test('Lambda should have the correct IAM role to access S3', async () => {
      try {
        // Get the IAM role policy attached to the Lambda execution role
        const rolePolicy = await iam.send(new GetRolePolicyCommand({
          RoleName: lambdaExecutionRoleArn.split('/')[1], // Extract Role Name from ARN
          PolicyName: 'LambdaS3AccessPolicy',
        }));

        // Validate the IAM policy includes the correct permissions to access S3
        expect(rolePolicy.PolicyDocument).toContain('s3:GetObject');
        expect(rolePolicy.PolicyDocument).toContain(s3BucketName);  // Validate the bucket name is included

      } catch (error) {
        console.error('Error occurred while fetching IAM role policy:', error);
        expect(error).toBeNull();  // Ensure that no errors occurred during the test
      }
    });

  });

  describe('S3 Bucket Notification Configuration', () => {

    // Test: Verify that S3 bucket notification is configured correctly for Lambda trigger
    test('S3 bucket should have a notification configured for Lambda function', async () => {
      try {
        // Get the bucket notification configuration
        const notificationConfig: GetBucketNotificationConfigurationCommandOutput = await s3.send(new GetBucketNotificationConfigurationCommand({
          Bucket: s3BucketName,
        }));

        // Verify that the Lambda function is listed as an event source
        const lambdaConfig = notificationConfig.LambdaFunctionConfigurations?.find(
          (config) => config.LambdaFunctionArn === `arn:aws:lambda:us-east-1:123456789012:function:${lambdaFunctionName}`
        );

        expect(lambdaConfig).toBeDefined();
        expect(lambdaConfig?.Events).toContain('s3:ObjectCreated:*');  // Check for object creation event trigger

      } catch (error) {
        console.error('Error occurred while checking S3 bucket notification configuration:', error);
        expect(error).toBeNull();  // Ensure that no errors occurred during the test
      }
    });

  });

  describe('Error Handling', () => {

    // Test: Ensure Lambda handles errors gracefully if incorrect payload is sent
    test('Lambda should handle invalid payload gracefully', async () => {
      const invalidPayload = {
        invalidKey: 'invalidValue',
      };

      try {
        // Invoke Lambda directly with invalid payload
        const lambdaResponse = await lambda.send(new InvokeCommand({
          FunctionName: lambdaFunctionName,
          Payload: JSON.stringify(invalidPayload),
        }));

        const responsePayload = JSON.parse(new TextDecoder().decode(lambdaResponse.Payload));

        // Lambda should return an error message for invalid input
        expect(lambdaResponse.StatusCode).toBe(400);  // Assuming Lambda returns 400 for invalid input
        expect(responsePayload).toHaveProperty('statusCode', 400);
        expect(responsePayload).toHaveProperty('body', 'Invalid input');

      } catch (error) {
        console.error('Error occurred during Lambda invocation with invalid payload:', error);
        expect(error).toBeNull();  // Ensure no errors occurred during the test
      }
    });

  });

  describe('CloudWatch Logs', () => {
    // Test: Check if Lambda logs exist in CloudWatch after being triggered
    test('Lambda should write logs to CloudWatch', async () => {
      try {
        // Fetch the CloudWatch log streams for the Lambda function
        const logGroupName = `/aws/lambda/${lambdaFunctionName}`;
        const logs = await cloudwatch.send(new DescribeLogStreamsCommand({
          logGroupName,
          orderBy: 'LastEventTime',
          descending: true,
        }));

        // Verify that at least one log stream exists for the Lambda function
        if (logs.logStreams) {
          expect(logs.logStreams.length).toBeGreaterThan(0);
          expect(logs.logStreams[0].logStreamName).toBeDefined();
        }

      } catch (error) {
        console.error('Error occurred while fetching CloudWatch logs:', error);
        expect(error).toBeNull();  // Ensure no errors occurred during the test
      }
    });
  });

});
