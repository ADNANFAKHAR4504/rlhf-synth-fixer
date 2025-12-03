import {
  LambdaClient,
  InvokeCommand,
  GetFunctionCommand,
} from '@aws-sdk/client-lambda';
import { S3Client, HeadBucketCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

describe('TAP Stack Integration Tests', () => {
  let outputs: any;
  let lambdaClient: LambdaClient;
  let s3Client: S3Client;

  beforeAll(() => {
    // Read deployment outputs
    const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        'flat-outputs.json not found. Please deploy the stack first.'
      );
    }
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));

    // Initialize AWS clients
    const region = process.env.AWS_REGION || 'us-east-1';
    lambdaClient = new LambdaClient({ region });
    s3Client = new S3Client({ region });
  });

  afterAll(async () => {
    // Cleanup clients
    lambdaClient.destroy();
    s3Client.destroy();
  });

  describe('Deployment Validation', () => {
    it('should have deployed outputs available', () => {
      expect(outputs).toBeDefined();
      expect(outputs.LambdaFunctionName).toBeDefined();
      expect(outputs.S3BucketName).toBeDefined();
    });

    it('should have Lambda function name in correct format', () => {
      expect(outputs.LambdaFunctionName).toMatch(
        /^compliance-scanner-[a-zA-Z0-9-]+$/
      );
    });

    it('should have S3 bucket name in correct format', () => {
      expect(outputs.S3BucketName).toMatch(/^compliance-reports-[a-zA-Z0-9-]+$/);
    });
  });

  describe('Lambda Function Integration', () => {
    it('should have Lambda function deployed and accessible', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.LambdaFunctionName,
      });

      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toBe(
        outputs.LambdaFunctionName
      );
      expect(response.Configuration?.Runtime).toContain('nodejs');
      expect(response.Configuration?.Handler).toBe('index.handler');
    });

    it('should have correct environment variables configured', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.LambdaFunctionName,
      });

      const response = await lambdaClient.send(command);
      const envVars = response.Configuration?.Environment?.Variables;

      expect(envVars).toBeDefined();
      expect(envVars?.REPORT_BUCKET).toBe(outputs.S3BucketName);
      expect(envVars?.ENVIRONMENT_SUFFIX).toBeDefined();
    });

    it('should have sufficient timeout for scanning operations', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.LambdaFunctionName,
      });

      const response = await lambdaClient.send(command);

      expect(response.Configuration?.Timeout).toBeGreaterThanOrEqual(60);
      expect(response.Configuration?.Timeout).toBeLessThanOrEqual(900);
    });

    it('should have adequate memory for resource scanning', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.LambdaFunctionName,
      });

      const response = await lambdaClient.send(command);

      expect(response.Configuration?.MemorySize).toBeGreaterThanOrEqual(256);
    });

    it('should successfully invoke Lambda function', async () => {
      const command = new InvokeCommand({
        FunctionName: outputs.LambdaFunctionName,
        InvocationType: 'RequestResponse',
      });

      const response = await lambdaClient.send(command);

      expect(response.StatusCode).toBe(200);
      expect(response.FunctionError).toBeUndefined();

      if (response.Payload) {
        const payload = JSON.parse(Buffer.from(response.Payload).toString());
        expect(payload.statusCode).toBe(200);

        const body = JSON.parse(payload.body);
        expect(body.timestamp).toBeDefined();
        expect(body.summary).toBeDefined();
        expect(body.details).toBeDefined();
      }
    }, 60000); // 60 second timeout for Lambda execution

    it('should return valid compliance report structure', async () => {
      const command = new InvokeCommand({
        FunctionName: outputs.LambdaFunctionName,
        InvocationType: 'RequestResponse',
      });

      const response = await lambdaClient.send(command);
      const payload = JSON.parse(Buffer.from(response.Payload!).toString());
      const report = JSON.parse(payload.body);

      // Validate report structure
      expect(report.timestamp).toBeDefined();
      expect(report.environmentSuffix).toBeDefined();
      expect(report.region).toBe('us-east-1');

      // Validate summary
      expect(report.summary).toBeDefined();
      expect(report.summary.ec2).toBeDefined();
      expect(report.summary.rds).toBeDefined();
      expect(report.summary.s3).toBeDefined();
      expect(report.summary.overall).toBeDefined();

      // Validate details structure
      expect(report.details).toBeDefined();
      expect(report.details.ec2).toBeDefined();
      expect(report.details.rds).toBeDefined();
      expect(report.details.s3).toBeDefined();

      // Validate recommendations
      expect(report.recommendations).toBeDefined();
      expect(Array.isArray(report.recommendations)).toBe(true);
    }, 60000);

    it('should scan for required tags in compliance check', async () => {
      const command = new InvokeCommand({
        FunctionName: outputs.LambdaFunctionName,
        InvocationType: 'RequestResponse',
      });

      const response = await lambdaClient.send(command);
      const payload = JSON.parse(Buffer.from(response.Payload!).toString());
      const report = JSON.parse(payload.body);

      // Check that the scanner looks for required tags
      const allResources = [
        ...report.details.ec2.compliant,
        ...report.details.ec2.nonCompliant,
        ...report.details.rds.compliant,
        ...report.details.rds.nonCompliant,
        ...report.details.s3.compliant,
        ...report.details.s3.nonCompliant,
      ];

      // If any resources exist, validate their structure
      if (allResources.length > 0) {
        const sampleResource = allResources[0];
        expect(sampleResource.resourceId).toBeDefined();
        expect(sampleResource.resourceType).toBeDefined();
        expect(sampleResource.tags).toBeDefined();
        expect(sampleResource.missingTags).toBeDefined();
      }
    }, 60000);
  });

  describe('S3 Bucket Integration', () => {
    it('should have S3 bucket deployed and accessible', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.S3BucketName,
      });

      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    it('should be able to list objects in S3 bucket', async () => {
      const command = new ListObjectsV2Command({
        Bucket: outputs.S3BucketName,
        MaxKeys: 10,
      });

      const response = await s3Client.send(command);

      expect(response.$metadata.httpStatusCode).toBe(200);
      // Bucket may be empty initially, so Contents could be undefined
      if (response.Contents) {
        expect(Array.isArray(response.Contents)).toBe(true);
      }
    });

    it('should store compliance reports after Lambda invocation', async () => {
      // First invoke Lambda to generate report
      const invokeCommand = new InvokeCommand({
        FunctionName: outputs.LambdaFunctionName,
        InvocationType: 'RequestResponse',
      });

      await lambdaClient.send(invokeCommand);

      // Wait a bit for S3 to register the object
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Check if report was saved to S3
      const listCommand = new ListObjectsV2Command({
        Bucket: outputs.S3BucketName,
        MaxKeys: 10,
      });

      const response = await s3Client.send(listCommand);

      expect(response.Contents).toBeDefined();
      expect(response.Contents!.length).toBeGreaterThan(0);

      // Verify report file naming convention
      const reportFiles = response.Contents!.filter((obj) =>
        obj.Key?.startsWith('compliance-report-')
      );
      expect(reportFiles.length).toBeGreaterThan(0);
    }, 65000);
  });

  describe('End-to-End Compliance Workflow', () => {
    it('should complete full compliance scan workflow', async () => {
      // 1. Invoke Lambda
      const invokeCommand = new InvokeCommand({
        FunctionName: outputs.LambdaFunctionName,
        InvocationType: 'RequestResponse',
      });

      const invokeResponse = await lambdaClient.send(invokeCommand);
      expect(invokeResponse.StatusCode).toBe(200);

      // 2. Parse report
      const payload = JSON.parse(
        Buffer.from(invokeResponse.Payload!).toString()
      );
      const report = JSON.parse(payload.body);

      // 3. Verify summary calculations
      expect(report.summary.overall.total).toBeGreaterThanOrEqual(0);
      expect(report.summary.overall.compliant).toBeGreaterThanOrEqual(0);
      expect(report.summary.overall.nonCompliant).toBeGreaterThanOrEqual(0);
      expect(report.summary.overall.compliancePercentage).toBeDefined();

      // 4. Verify report was saved to S3
      expect(report.reportLocation).toBeDefined();
      expect(report.reportLocation).toContain('s3://');
      expect(report.reportLocation).toContain(outputs.S3BucketName);
    }, 65000);

    it('should handle accounts with no resources gracefully', async () => {
      const command = new InvokeCommand({
        FunctionName: outputs.LambdaFunctionName,
        InvocationType: 'RequestResponse',
      });

      const response = await lambdaClient.send(command);
      expect(response.StatusCode).toBe(200);

      const payload = JSON.parse(Buffer.from(response.Payload!).toString());
      const report = JSON.parse(payload.body);

      // Should not error even if no resources found
      expect(report.summary).toBeDefined();
      expect(report.details).toBeDefined();
      expect(report.summary.overall.compliancePercentage).toBeDefined();
    }, 60000);
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const command = new InvokeCommand({
        FunctionName: outputs.LambdaFunctionName,
        InvocationType: 'RequestResponse',
      });

      const response = await lambdaClient.send(command);
      const payload = JSON.parse(Buffer.from(response.Payload!).toString());
      const report = JSON.parse(payload.body);

      // Even if there are errors, report should still be structured
      expect(report.summary).toBeDefined();
      expect(report.details).toBeDefined();

      // If errors occurred, they should be logged
      if (report.errors) {
        expect(Array.isArray(report.errors)).toBe(true);
        report.errors.forEach((error: any) => {
          expect(error.service).toBeDefined();
          expect(error.error).toBeDefined();
        });
      }
    }, 60000);
  });
});
