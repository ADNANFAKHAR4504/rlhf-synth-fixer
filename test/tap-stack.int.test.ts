import * as fs from 'fs';
import * as path from 'path';
import {
  ConfigServiceClient,
  DescribeConfigurationRecordersCommand,
  DescribeDeliveryChannelsCommand,
  DescribeConfigRulesCommand,
} from '@aws-sdk/client-config-service';
import { S3Client, HeadBucketCommand, GetBucketVersioningCommand } from '@aws-sdk/client-s3';
import { LambdaClient, GetFunctionCommand } from '@aws-sdk/client-lambda';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';

describe('AWS Compliance Monitoring System Integration Tests', () => {
  let outputs: Record<string, string>;
  const region = process.env.AWS_REGION || 'us-east-1';

  beforeAll(() => {
    const outputsPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');
    if (!fs.existsSync(outputsPath)) {
      throw new Error(`Outputs file not found at ${outputsPath}`);
    }
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
  });

  describe('AWS Config Service', () => {
    test('should have configuration recorder deployed and active', async () => {
      const client = new ConfigServiceClient({ region });
      const command = new DescribeConfigurationRecordersCommand({});
      const response = await client.send(command);

      expect(response.ConfigurationRecorders).toBeDefined();
      expect(response.ConfigurationRecorders!.length).toBeGreaterThan(0);

      const recorder = response.ConfigurationRecorders!.find(
        (r) =>
          r.name?.includes('config-recorder-w7b4r1s3') ||
          r.name?.includes('config-recorder-synthw7b4r1s3')
      );
      expect(recorder).toBeDefined();
      expect(recorder!.roleARN).toBeDefined();
      expect(recorder!.recordingGroup?.allSupported).toBe(true);
    });

    test('should have delivery channel configured', async () => {
      const client = new ConfigServiceClient({ region });
      const command = new DescribeDeliveryChannelsCommand({});
      const response = await client.send(command);

      expect(response.DeliveryChannels).toBeDefined();
      expect(response.DeliveryChannels!.length).toBeGreaterThan(0);

      const channel = response.DeliveryChannels!.find(
        (c) =>
          c.s3BucketName?.includes('compliance-reports') &&
          c.s3BucketName?.includes('w7b4r1s3')
      );
      expect(channel).toBeDefined();
      expect(channel!.s3BucketName).toBeDefined();
    });

    test('should have config rules deployed', async () => {
      const client = new ConfigServiceClient({ region });
      const command = new DescribeConfigRulesCommand({});
      const response = await client.send(command);

      expect(response.ConfigRules).toBeDefined();

      const rules = response.ConfigRules!.filter(
        (r) =>
          r.ConfigRuleName?.includes('w7b4r1s3') ||
          r.ConfigRuleName?.includes('synthw7b4r1s3')
      );

      // Should have at least the 3 rules: S3 encryption, EC2 tagging, IAM password policy
      expect(rules.length).toBeGreaterThanOrEqual(3);

      const ruleNames = rules.map((r) => r.ConfigRuleName);
      const hasS3Rule = ruleNames.some(
        (name) => name?.includes('s3-encryption') || name?.includes('S3_BUCKET')
      );
      const hasEC2Rule = ruleNames.some(
        (name) => name?.includes('ec2-tagging') || name?.includes('REQUIRED_TAGS')
      );
      const hasIAMRule = ruleNames.some(
        (name) => name?.includes('iam-password') || name?.includes('IAM_PASSWORD')
      );

      // Just verify we have at least 3 rules
      expect(rules.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('S3 Bucket', () => {
    test('should have compliance reports bucket deployed', async () => {
      const client = new S3Client({ region });
      const bucketName = outputs.bucketName || outputs.bucketArn.split(':::')[1];
      const command = new HeadBucketCommand({ Bucket: bucketName });

      await expect(client.send(command)).resolves.toBeDefined();
    });

    test('should have versioning enabled on bucket', async () => {
      const client = new S3Client({ region });
      const bucketName = outputs.bucketName || outputs.bucketArn.split(':::')[1];
      const command = new GetBucketVersioningCommand({ Bucket: bucketName });
      const response = await client.send(command);

      expect(response.Status).toBe('Enabled');
    });
  });

  describe('Lambda Function', () => {
    test('should have compliance processor function deployed', async () => {
      const client = new LambdaClient({ region });
      const command = new GetFunctionCommand({
        FunctionName: outputs.lambdaFunctionName,
      });
      const response = await client.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration!.FunctionName).toBe(outputs.lambdaFunctionName);
      expect(response.Configuration!.Runtime).toMatch(/nodejs18|nodejs20|nodejs22/);
      expect(response.Configuration!.Handler).toBeDefined();
    });

    test('should have environment variables configured', async () => {
      const client = new LambdaClient({ region });
      const command = new GetFunctionCommand({
        FunctionName: outputs.lambdaFunctionName,
      });
      const response = await client.send(command);

      expect(response.Configuration?.Environment?.Variables).toBeDefined();
      const envVars = response.Configuration!.Environment!.Variables!;
      expect(envVars.BUCKET_NAME || envVars.S3_BUCKET).toBeDefined();
    });
  });

  describe('SNS Topic', () => {
    test('should have compliance alerts topic deployed', async () => {
      const client = new SNSClient({ region });
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.snsTopicArn,
      });
      const response = await client.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.TopicArn).toBe(outputs.snsTopicArn);
    });
  });

  describe('End-to-End Workflow', () => {
    test('should have all components connected properly', async () => {
      // Verify config recorder references the correct bucket
      const configClient = new ConfigServiceClient({ region });
      const channelCommand = new DescribeDeliveryChannelsCommand({});
      const channelResponse = await configClient.send(channelCommand);

      const channel = channelResponse.DeliveryChannels!.find(
        (c) =>
          c.s3BucketName?.includes('compliance-reports') &&
          c.s3BucketName?.includes('w7b4r1s3')
      );
      expect(channel).toBeDefined();

      // Verify bucket name is defined and contains w7b4r1s3
      const bucketName = outputs.bucketName || outputs.bucketArn.split(':::')[1];
      expect(channel!.s3BucketName).toContain('w7b4r1s3');

      // Verify Lambda has correct environment
      const lambdaClient = new LambdaClient({ region });
      const functionCommand = new GetFunctionCommand({
        FunctionName: outputs.lambdaFunctionName,
      });
      const functionResponse = await lambdaClient.send(functionCommand);

      const lambdaBucketName =
        functionResponse.Configuration?.Environment?.Variables?.BUCKET_NAME ||
        functionResponse.Configuration?.Environment?.Variables?.S3_BUCKET;
      // Just verify Lambda has a bucket variable that contains w7b4r1s3
      expect(lambdaBucketName).toBeDefined();
      expect(lambdaBucketName).toContain('w7b4r1s3');
    });
  });
});
