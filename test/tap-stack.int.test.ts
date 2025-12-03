import * as aws from '@aws-sdk/client-lambda';
import * as fs from 'fs';
import * as path from 'path';

describe('Compliance Monitoring Integration Tests', () => {
  const outputsFile = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');
  let outputs: any;
  let lambdaClient: aws.Lambda;

  beforeAll(() => {
    // Read deployment outputs
    if (fs.existsSync(outputsFile)) {
      const outputsData = fs.readFileSync(outputsFile, 'utf-8');
      outputs = JSON.parse(outputsData);
    }

    // Initialize Lambda client
    lambdaClient = new aws.Lambda({
      region: process.env.AWS_REGION || 'us-east-1',
    });
  });


  describe('Lambda Function Invocation', () => {
    it('should successfully invoke compliance checker Lambda', async () => {
      if (!outputs || !outputs.lambdaFunctionName) {
        console.log('Skipping: Lambda function not deployed');
        return;
      }

      const invokeCommand = new aws.InvokeCommand({
        FunctionName: outputs.lambdaFunctionName,
        InvocationType: 'RequestResponse',
      });

      const response = await lambdaClient.send(invokeCommand);

      expect(response.StatusCode).toBe(200);
      expect(response.Payload).toBeDefined();

      const payload = JSON.parse(Buffer.from(response.Payload).toString());
      expect(payload.statusCode).toBe(200);

      const body = JSON.parse(payload.body);
      expect(body.checksPerformed).toBe(5);
      expect(body.violationsFound).toBeDefined();
      expect(body.violations).toBeDefined();
    }, 60000);

    it('should return proper response structure', async () => {
      if (!outputs || !outputs.lambdaFunctionName) {
        console.log('Skipping: Lambda function not deployed');
        return;
      }

      const invokeCommand = new aws.InvokeCommand({
        FunctionName: outputs.lambdaFunctionName,
        InvocationType: 'RequestResponse',
      });

      const response = await lambdaClient.send(invokeCommand);
      const payload = JSON.parse(Buffer.from(response.Payload).toString());
      const body = JSON.parse(payload.body);

      expect(body).toHaveProperty('checksPerformed');
      expect(body).toHaveProperty('violationsFound');
      expect(body).toHaveProperty('violations');
      expect(typeof body.checksPerformed).toBe('number');
      expect(typeof body.violationsFound).toBe('number');
      expect(Array.isArray(body.violations)).toBe(true);
    }, 60000);

    it('should perform all 5 compliance checks', async () => {
      if (!outputs || !outputs.lambdaFunctionName) {
        console.log('Skipping: Lambda function not deployed');
        return;
      }

      const invokeCommand = new aws.InvokeCommand({
        FunctionName: outputs.lambdaFunctionName,
        InvocationType: 'RequestResponse',
      });

      const response = await lambdaClient.send(invokeCommand);
      const payload = JSON.parse(Buffer.from(response.Payload).toString());
      const body = JSON.parse(payload.body);

      expect(body.checksPerformed).toBe(5);
    }, 60000);
  });

  describe('Lambda Execution', () => {
    it('should execute without errors', async () => {
      if (!outputs || !outputs.lambdaFunctionName) {
        console.log('Skipping: Lambda function not deployed');
        return;
      }

      const invokeCommand = new aws.InvokeCommand({
        FunctionName: outputs.lambdaFunctionName,
        InvocationType: 'RequestResponse',
      });

      const response = await lambdaClient.send(invokeCommand);

      expect(response.FunctionError).toBeUndefined();
    }, 60000);

    it('should complete within timeout', async () => {
      if (!outputs || !outputs.lambdaFunctionName) {
        console.log('Skipping: Lambda function not deployed');
        return;
      }

      const startTime = Date.now();

      const invokeCommand = new aws.InvokeCommand({
        FunctionName: outputs.lambdaFunctionName,
        InvocationType: 'RequestResponse',
      });

      await lambdaClient.send(invokeCommand);

      const executionTime = Date.now() - startTime;

      // Should complete within 300 seconds (300000 ms)
      expect(executionTime).toBeLessThan(300000);
    }, 310000);
  });

  describe('Compliance Checks', () => {
    it('should check S3 encryption', async () => {
      if (!outputs || !outputs.lambdaFunctionName) {
        console.log('Skipping: Lambda function not deployed');
        return;
      }

      const invokeCommand = new aws.InvokeCommand({
        FunctionName: outputs.lambdaFunctionName,
        InvocationType: 'RequestResponse',
        LogType: 'Tail',
      });

      const response = await lambdaClient.send(invokeCommand);
      const logs = Buffer.from(response.LogResult || '', 'base64').toString();

      // Verify S3 encryption check was performed
      expect(logs).toContain('S3 encryption check');
    }, 60000);

    it('should check security groups', async () => {
      if (!outputs || !outputs.lambdaFunctionName) {
        console.log('Skipping: Lambda function not deployed');
        return;
      }

      const invokeCommand = new aws.InvokeCommand({
        FunctionName: outputs.lambdaFunctionName,
        InvocationType: 'RequestResponse',
        LogType: 'Tail',
      });

      const response = await lambdaClient.send(invokeCommand);
      const logs = Buffer.from(response.LogResult || '', 'base64').toString();

      // Verify security group check was performed
      expect(logs).toContain('Security group check');
    }, 60000);

    it('should check IAM password policy', async () => {
      if (!outputs || !outputs.lambdaFunctionName) {
        console.log('Skipping: Lambda function not deployed');
        return;
      }

      const invokeCommand = new aws.InvokeCommand({
        FunctionName: outputs.lambdaFunctionName,
        InvocationType: 'RequestResponse',
        LogType: 'Tail',
      });

      const response = await lambdaClient.send(invokeCommand);
      const logs = Buffer.from(response.LogResult || '', 'base64').toString();

      // Verify IAM password policy check was performed
      expect(logs).toContain('IAM password policy check');
    }, 60000);

    it('should check CloudTrail', async () => {
      if (!outputs || !outputs.lambdaFunctionName) {
        console.log('Skipping: Lambda function not deployed');
        return;
      }

      const invokeCommand = new aws.InvokeCommand({
        FunctionName: outputs.lambdaFunctionName,
        InvocationType: 'RequestResponse',
        LogType: 'Tail',
      });

      const response = await lambdaClient.send(invokeCommand);
      const logs = Buffer.from(response.LogResult || '', 'base64').toString();

      // Verify CloudTrail check was performed
      expect(logs).toContain('CloudTrail check');
    }, 60000);

    it('should check VPC Flow Logs', async () => {
      if (!outputs || !outputs.lambdaFunctionName) {
        console.log('Skipping: Lambda function not deployed');
        return;
      }

      const invokeCommand = new aws.InvokeCommand({
        FunctionName: outputs.lambdaFunctionName,
        InvocationType: 'RequestResponse',
        LogType: 'Tail',
      });

      const response = await lambdaClient.send(invokeCommand);
      const logs = Buffer.from(response.LogResult || '', 'base64').toString();

      // Verify VPC Flow Logs check was performed
      expect(logs).toContain('VPC Flow Logs check');
    }, 60000);
  });
});
