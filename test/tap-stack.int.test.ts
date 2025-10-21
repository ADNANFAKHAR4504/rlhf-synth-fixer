import { SFNClient, StartExecutionCommand, DescribeExecutionCommand } from "@aws-sdk/client-sfn";
import { S3Client, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { TextDecoder } from 'util'; // For decoding S3 object content
import { readFileSync } from 'fs';
import path from 'path';

// Placeholder for CloudFormation outputs.
// In a real scenario, these would be dynamically loaded from a deployed stack's outputs.
// For local testing, you might manually populate these after a 'cdk deploy'.
const cfnOutputs = {
  StateMachineArn: process.env.STATE_MACHINE_ARN || "arn:aws:states:us-east-1:123456789012:stateMachine:TapStack-ReportingOrchestrator",
  ReportsBucketName: process.env.REPORTS_BUCKET_NAME || "tap-stack-reports-dev-123456789012",
  // Add other outputs as needed for testing (e.g., Lambda ARNs if direct invocation is desired)
};

const sfnClient = new SFNClient({ region: process.env.AWS_REGION || "us-east-1" });
const s3Client = new S3Client({ region: process.env.AWS_REGION || "us-east-1" });
const decoder = new TextDecoder('utf-8');

describe('TapStack End-to-End Integration Tests', () => {
  // Test case for successful report generation and delivery
  test('should successfully execute the reporting workflow with valid data', async () => {
    const input = {
      "testRunId": `test-${Date.now()}`,
      "reportType": "REG_FORM_49",
      "entityName": "TestEntity",
      "transactionCount": 100,
      "totalValue": 50000.00
    };

    const startExecutionCommand = new StartExecutionCommand({
      stateMachineArn: cfnOutputs.StateMachineArn,
      input: JSON.stringify(input),
      name: `SuccessfulReport-${input.testRunId}`
    });

    const { executionArn } = await sfnClient.send(startExecutionCommand);
    expect(executionArn).toBeDefined();

    let status = '';
    let output = {};
    // Poll for execution status
    for (let i = 0; i < 20; i++) { // Poll up to 20 times (e.g., 20 * 5s = 100s)
      const describeExecutionCommand = new DescribeExecutionCommand({ executionArn });
      const { status: currentStatus, output: currentOutput } = await sfnClient.send(describeExecutionCommand);
      status = currentStatus as string;
      if (status === 'SUCCEEDED' || status === 'FAILED' || status === 'ABORTED') {
        output = JSON.parse(currentOutput || '{}');
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
    }

    expect(status).toBe('SUCCEEDED');
    expect(output).toBeDefined();
    expect(output).toHaveProperty('validationResult.isValid', true);
    expect(output).toHaveProperty('s3Location');

    // Verify S3 object exists
    const s3Location = output.s3Location;
    const s3Key = s3Location.split(`${cfnOutputs.ReportsBucketName}/`)[1];
    expect(s3Key).toBeDefined();

    const getObjectCommand = new GetObjectCommand({
      Bucket: cfnOutputs.ReportsBucketName,
      Key: s3Key,
    });

    const s3Object = await s3Client.send(getObjectCommand);
    expect(s3Object.Body).toBeDefined();
    const s3Content = JSON.parse(decoder.decode(await s3Object.Body?.transformToByteArray()));
    expect(s3Content).toHaveProperty('content.entity_name', input.entityName);
    expect(s3Content).toHaveProperty('validationResult.isValid', true);

    // Clean up S3 object
    const deleteObjectCommand = new DeleteObjectCommand({
      Bucket: cfnOutputs.ReportsBucketName,
      Key: s3Key,
    });
    await s3Client.send(deleteObjectCommand);
  }, 120000); // Increase timeout for E2E test

  // Test case for failed validation
  test('should fail execution when report data is invalid', async () => {
    const input = {
      "testRunId": `test-invalid-${Date.now()}`,
      "reportType": "REG_FORM_49",
      "entityName": "", // Invalid: Missing entity_name
      "transactionCount": 5, // Invalid: Below minimum threshold
      "totalValue": 10000000.00 // Invalid: Exceeds maximum allowed value
    };

    const startExecutionCommand = new StartExecutionCommand({
      stateMachineArn: cfnOutputs.StateMachineArn,
      input: JSON.stringify(input),
      name: `FailedReport-${input.testRunId}`
    });

    const { executionArn } = await sfnClient.send(startExecutionCommand);
    expect(executionArn).toBeDefined();

    let status = '';
    let output = {};
    // Poll for execution status
    for (let i = 0; i < 20; i++) {
      const describeExecutionCommand = new DescribeExecutionCommand({ executionArn });
      const { status: currentStatus, output: currentOutput } = await sfnClient.send(describeExecutionCommand);
      status = currentStatus as string;
      if (status === 'SUCCEEDED' || status === 'FAILED' || status === 'ABORTED') {
        output = JSON.parse(currentOutput || '{}');
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    expect(status).toBe('FAILED');
    expect(output).toBeDefined();
    expect(output).toHaveProperty('validationResult.isValid', false);
    expect(output).toHaveProperty('validationResult.errors');
    expect(output.validationResult.errors).toContain('Missing required field: entity_name');
    expect(output.validationResult.errors[0]).toMatch(/Transaction count.*below minimum threshold/);
    expect(output.validationResult.errors[1]).toMatch(/Total value.*exceeds maximum allowed value/);
  }, 120000);

  // Test case for S3 unencrypted upload denial (if applicable and testable)
  // This test might be difficult to implement directly in an E2E fashion
  // as the S3 policy is enforced by AWS, not directly by the application logic.
  // It's usually covered by unit tests of the CloudFormation template.
  // However, if you have a way to simulate an unencrypted upload from a client
  // that assumes the role of the Lambda, you could test it here.
  // For now, we'll acknowledge it's a template-level enforcement.
});