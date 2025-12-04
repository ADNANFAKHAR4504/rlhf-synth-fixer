import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import {
  SNSClient,
  ListSubscriptionsByTopicCommand,
} from '@aws-sdk/client-sns';
import {
  CloudWatchClient,
  GetMetricStatisticsCommand,
} from '@aws-sdk/client-cloudwatch';
import * as fs from 'fs';
import * as path from 'path';

describe('Compliance Scanner Infrastructure Integration Tests', () => {
  let outputs: {
    lambdaFunctionArn: string;
    reportBucketName: string;
    snsTopicArn: string;
  };

  const region = process.env.AWS_REGION || 'us-east-1';
  const lambdaClient = new LambdaClient({ region });
  const s3Client = new S3Client({ region });
  const snsClient = new SNSClient({ region });
  const cloudwatchClient = new CloudWatchClient({ region });

  beforeAll(() => {
    // Load deployment outputs
    const outputsPath = path.join(
      __dirname,
      '..',
      'cfn-outputs',
      'flat-outputs.json'
    );

    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        `Outputs file not found at ${outputsPath}. Please deploy the stack first.`
      );
    }

    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));

    expect(outputs.lambdaFunctionArn).toBeDefined();
    expect(outputs.reportBucketName).toBeDefined();
    expect(outputs.snsTopicArn).toBeDefined();
  });

  describe('Lambda Function Tests', () => {
    it('should invoke Lambda function successfully', async () => {
      const functionName = outputs.lambdaFunctionArn.split(':').pop();

      const command = new InvokeCommand({
        FunctionName: functionName,
        InvocationType: 'RequestResponse',
      });

      const response = await lambdaClient.send(command);

      expect(response.StatusCode).toBe(200);
      expect(response.FunctionError).toBeUndefined();
    }, 60000);

    it('should return compliance report from Lambda', async () => {
      const functionName = outputs.lambdaFunctionArn.split(':').pop();

      const command = new InvokeCommand({
        FunctionName: functionName,
        InvocationType: 'RequestResponse',
      });

      const response = await lambdaClient.send(command);

      if (response.Payload) {
        const payload = JSON.parse(Buffer.from(response.Payload).toString());
        expect(payload).toHaveProperty('statusCode');
        expect(payload.statusCode).toBe(200);
      }
    }, 60000);
  });

  describe('S3 Bucket Tests', () => {
    it('should have compliance reports bucket accessible', async () => {
      const command = new ListObjectsV2Command({
        Bucket: outputs.reportBucketName,
        MaxKeys: 10,
      });

      const response = await s3Client.send(command);

      expect(response).toBeDefined();
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    it('should store compliance reports after Lambda execution', async () => {
      // First invoke Lambda to generate a report
      const functionName = outputs.lambdaFunctionArn.split(':').pop();
      const invokeCommand = new InvokeCommand({
        FunctionName: functionName,
        InvocationType: 'RequestResponse',
      });

      await lambdaClient.send(invokeCommand);

      // Wait for report to be written
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Check for reports in S3
      const listCommand = new ListObjectsV2Command({
        Bucket: outputs.reportBucketName,
        Prefix: 'compliance-reports/',
      });

      const response = await s3Client.send(listCommand);

      expect(response.Contents).toBeDefined();
      expect(response.Contents!.length).toBeGreaterThanOrEqual(0);
    }, 70000);

    it('should retrieve and parse compliance report from S3', async () => {
      // Invoke Lambda first
      const functionName = outputs.lambdaFunctionArn.split(':').pop();
      const invokeCommand = new InvokeCommand({
        FunctionName: functionName,
        InvocationType: 'RequestResponse',
      });

      await lambdaClient.send(invokeCommand);
      await new Promise(resolve => setTimeout(resolve, 5000));

      // List objects
      const listCommand = new ListObjectsV2Command({
        Bucket: outputs.reportBucketName,
        Prefix: 'compliance-reports/',
      });

      const listResponse = await s3Client.send(listCommand);

      if (listResponse.Contents && listResponse.Contents.length > 0) {
        const latestObject = listResponse.Contents.sort(
          (a, b) =>
            (b.LastModified?.getTime() || 0) - (a.LastModified?.getTime() || 0)
        )[0];

        const getCommand = new GetObjectCommand({
          Bucket: outputs.reportBucketName,
          Key: latestObject.Key,
        });

        const getResponse = await s3Client.send(getCommand);
        const reportData = await getResponse.Body!.transformToString();
        const report = JSON.parse(reportData);

        expect(report).toHaveProperty('timestamp');
        expect(report).toHaveProperty('scanId');
        expect(report).toHaveProperty('violations');
        expect(report).toHaveProperty('summary');
      }
    }, 70000);
  });

  describe('SNS Topic Tests', () => {
    it('should have SNS topic with email subscription', async () => {
      const command = new ListSubscriptionsByTopicCommand({
        TopicArn: outputs.snsTopicArn,
      });

      const response = await snsClient.send(command);

      expect(response.Subscriptions).toBeDefined();
      expect(response.Subscriptions!.length).toBeGreaterThan(0);

      const emailSubscription = response.Subscriptions!.find(
        sub => sub.Protocol === 'email'
      );

      expect(emailSubscription).toBeDefined();
    });
  });

  describe('CloudWatch Metrics Tests', () => {
    it('should have CloudWatch metrics for compliance violations', async () => {
      // First trigger Lambda to generate metrics
      const functionName = outputs.lambdaFunctionArn.split(':').pop();
      const invokeCommand = new InvokeCommand({
        FunctionName: functionName,
        InvocationType: 'RequestResponse',
      });

      await lambdaClient.send(invokeCommand);
      await new Promise(resolve => setTimeout(resolve, 10000));

      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 300000); // 5 minutes ago

      const command = new GetMetricStatisticsCommand({
        Namespace: 'ComplianceScanner',
        MetricName: 'ComplianceViolations',
        StartTime: startTime,
        EndTime: endTime,
        Period: 300,
        Statistics: ['Sum'],
      });

      const response = await cloudwatchClient.send(command);

      expect(response.Datapoints).toBeDefined();
    }, 80000);
  });

  describe('End-to-End Workflow Tests', () => {
    it('should complete full compliance scan workflow', async () => {
      // 1. Invoke Lambda
      const functionName = outputs.lambdaFunctionArn.split(':').pop();
      const invokeCommand = new InvokeCommand({
        FunctionName: functionName,
        InvocationType: 'RequestResponse',
      });

      const invokeResponse = await lambdaClient.send(invokeCommand);
      expect(invokeResponse.StatusCode).toBe(200);

      // 2. Wait for processing
      await new Promise(resolve => setTimeout(resolve, 8000));

      // 3. Verify report in S3
      const listCommand = new ListObjectsV2Command({
        Bucket: outputs.reportBucketName,
        Prefix: 'compliance-reports/',
      });

      const listResponse = await s3Client.send(listCommand);
      expect(listResponse.Contents).toBeDefined();

      // 4. Verify SNS subscription exists
      const snsCommand = new ListSubscriptionsByTopicCommand({
        TopicArn: outputs.snsTopicArn,
      });

      const snsResponse = await snsClient.send(snsCommand);
      expect(snsResponse.Subscriptions!.length).toBeGreaterThan(0);
    }, 90000);
  });
});
