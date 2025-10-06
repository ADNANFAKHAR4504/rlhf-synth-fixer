import {
  LambdaClient,
  InvokeCommand
} from '@aws-sdk/client-lambda';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand
} from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

// Check if the CloudFormation outputs file exists. This allows the test to be skipped
// when run locally, preventing crashes, but run in the CI/CD pipeline after deployment.
const outputsFilePath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
const cfnOutputsExist = fs.existsSync(outputsFilePath);

const describeIf = (condition: boolean) => condition ? describe : describe.skip;

describeIf(cfnOutputsExist)('Serverless Email Notification System - Integration Tests', () => {

  // Parse the outputs file to get the names of the deployed resources
  const outputs = JSON.parse(
    fs.readFileSync(outputsFilePath, 'utf8')
  );

  const { S3Bucket, LambdaFunctionARN } = outputs;

  // Initialize AWS SDK clients
  const lambdaClient = new LambdaClient({});
  const s3Client = new S3Client({});

  const TEMPLATE_KEY = 'notification-template.html';

  // Set a longer timeout for AWS operations
  jest.setTimeout(30000); // 30 seconds

  // Before the test runs, upload a dummy template file to the S3 bucket.
  // This is the minimum setup required to prevent the Lambda from failing.
  beforeAll(async () => {
    await s3Client.send(new PutObjectCommand({
      Bucket: S3Bucket,
      Key: TEMPLATE_KEY,
      Body: '<html><body>Test Template</body></html>'
    }));
  });

  // After the test runs, clean up by deleting the dummy template file.
  afterAll(async () => {
    await s3Client.send(new DeleteObjectCommand({
      Bucket: S3Bucket,
      Key: TEMPLATE_KEY
    }));
  });

  /**
   * This test invokes the deployed Lambda function and checks for a successful response.
   * It verifies that the function's core execution path runs without throwing an unhandled error.
   */
  test('Lambda function should invoke successfully and return a 200 status', async () => {
    // Command to invoke the function
    const invokeCommand = new InvokeCommand({
      FunctionName: LambdaFunctionARN,
      InvocationType: 'RequestResponse' // Synchronous invocation
    });

    // Send the command
    const response = await lambdaClient.send(invokeCommand);

    // 1. Check for a successful HTTP status code from the Lambda invocation itself
    expect(response.StatusCode).toBe(200);

    // 2. Parse the payload returned by our function's code
    const payload = response.Payload ? JSON.parse(new TextDecoder().decode(response.Payload)) : {};

    // 3. Check that our function's code returned the expected success message
    expect(payload.body).toContain('Notifications sent successfully');
  });
});