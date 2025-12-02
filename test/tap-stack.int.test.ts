import * as fs from 'fs';
import * as path from 'path';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
} from '@aws-sdk/client-s3';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';
import { LambdaClient, GetFunctionCommand } from '@aws-sdk/client-lambda';
import { IAMClient, GetRoleCommand } from '@aws-sdk/client-iam';

const region = process.env.AWS_REGION || 'us-east-1';
const s3Client = new S3Client({ region });
const snsClient = new SNSClient({ region });
const lambdaClient = new LambdaClient({ region });
const iamClient = new IAMClient({ region });

describe('AWS Config Compliance Monitoring - Integration Tests', () => {
  let outputs: Record<string, string>;

  beforeAll(() => {
    // Load outputs from deployment
    const outputsPath = path.join(
      __dirname,
      '..',
      'cfn-outputs',
      'flat-outputs.json'
    );
    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        `Outputs file not found at ${outputsPath}. Please run deployment first.`
      );
    }
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
  });

  describe('S3 Config Bucket', () => {
    it('should exist and be accessible', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.configBucketName,
      });

      await expect(s3Client.send(command)).resolves.toBeDefined();
    });

    it('should have encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.configBucketName,
      });

      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(
        response.ServerSideEncryptionConfiguration?.Rules
      ).toHaveLength(1);
      expect(
        response.ServerSideEncryptionConfiguration?.Rules?.[0]
          ?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('AES256');
    });

    it('should have correct name with environmentSuffix', () => {
      expect(outputs.configBucketName).toContain('config-bucket-');
      expect(outputs.configBucketName).toMatch(/synthk6j3p4g8$/);
    });
  });

  describe('SNS Compliance Topic', () => {
    it('should exist and be accessible', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.complianceTopicArn,
      });

      const response = await snsClient.send(command);
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(
        outputs.complianceTopicArn
      );
    });

    it('should have correct ARN with environmentSuffix', () => {
      expect(outputs.complianceTopicArn).toContain('compliance-topic-');
      expect(outputs.complianceTopicArn).toContain('synthk6j3p4g8');
    });

    it('should have KMS encryption configured', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.complianceTopicArn,
      });

      const response = await snsClient.send(command);
      expect(response.Attributes?.KmsMasterKeyId).toBeDefined();
    });
  });

  describe('Lambda Tag Checker Function', () => {
    it('should exist and be accessible', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.tagCheckerLambdaName,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionArn).toBe(
        outputs.tagCheckerLambdaArn
      );
    });

    it('should have correct name with environmentSuffix', () => {
      expect(outputs.tagCheckerLambdaName).toContain('tag-checker-lambda-');
      expect(outputs.tagCheckerLambdaName).toMatch(/synthk6j3p4g8$/);
    });

    it('should use Node.js 18.x runtime', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.tagCheckerLambdaName,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration?.Runtime).toBe('nodejs18.x');
    });

    it('should have timeout set to 60 seconds', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.tagCheckerLambdaName,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration?.Timeout).toBe(60);
    });

    it('should have correct handler', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.tagCheckerLambdaName,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration?.Handler).toBe('index.handler');
    });

    it('should have required tags', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.tagCheckerLambdaName,
      });

      const response = await lambdaClient.send(command);
      expect(response.Tags).toBeDefined();
      expect(response.Tags?.Department).toBe('Compliance');
      expect(response.Tags?.Purpose).toBe('Audit');
    });

    it('should have IAM role attached', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.tagCheckerLambdaName,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration?.Role).toBeDefined();
      expect(response.Configuration?.Role).toContain(
        'lambda-config-role-synthk6j3p4g8'
      );
    });
  });

  describe('IAM Roles', () => {
    it('should have Lambda IAM role with correct name', async () => {
      const roleName = 'lambda-config-role-synthk6j3p4g8';
      const command = new GetRoleCommand({ RoleName: roleName });

      const response = await iamClient.send(command);
      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toBe(roleName);
    });

    it('should have Config IAM role with correct name', async () => {
      const roleName = 'config-role-synthk6j3p4g8';
      const command = new GetRoleCommand({ RoleName: roleName });

      const response = await iamClient.send(command);
      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toBe(roleName);
    });

    it('should have Config role with correct trust policy', async () => {
      const roleName = 'config-role-synthk6j3p4g8';
      const command = new GetRoleCommand({ RoleName: roleName });

      const response = await iamClient.send(command);
      const trustPolicy = JSON.parse(
        decodeURIComponent(response.Role?.AssumeRolePolicyDocument || '{}')
      );

      expect(trustPolicy.Statement).toBeDefined();
      expect(trustPolicy.Statement).toHaveLength(1);
      expect(trustPolicy.Statement[0].Principal.Service).toBe(
        'config.amazonaws.com'
      );
    });

    it('should have Lambda role with correct trust policy', async () => {
      const roleName = 'lambda-config-role-synthk6j3p4g8';
      const command = new GetRoleCommand({ RoleName: roleName });

      const response = await iamClient.send(command);
      const trustPolicy = JSON.parse(
        decodeURIComponent(response.Role?.AssumeRolePolicyDocument || '{}')
      );

      expect(trustPolicy.Statement).toBeDefined();
      expect(trustPolicy.Statement).toHaveLength(1);
      expect(trustPolicy.Statement[0].Principal.Service).toBe(
        'lambda.amazonaws.com'
      );
    });
  });

  describe('Resource Tagging', () => {
    it('should have all resources tagged correctly', async () => {
      // Check Lambda tags
      const lambdaCommand = new GetFunctionCommand({
        FunctionName: outputs.tagCheckerLambdaName,
      });
      const lambdaResponse = await lambdaClient.send(lambdaCommand);
      expect(lambdaResponse.Tags?.Department).toBe('Compliance');
      expect(lambdaResponse.Tags?.Purpose).toBe('Audit');
    });
  });

  describe('Output Validation', () => {
    it('should have all required outputs', () => {
      expect(outputs.configRecorderName).toBeDefined();
      expect(outputs.configBucketArn).toBeDefined();
      expect(outputs.configBucketName).toBeDefined();
      expect(outputs.complianceTopicArn).toBeDefined();
      expect(outputs.tagCheckerLambdaArn).toBeDefined();
      expect(outputs.tagCheckerLambdaName).toBeDefined();
    });

    it('should have correctly formatted ARNs', () => {
      expect(outputs.configBucketArn).toMatch(/^arn:aws:s3:::/);
      expect(outputs.complianceTopicArn).toMatch(/^arn:aws:sns:/);
      expect(outputs.tagCheckerLambdaArn).toMatch(/^arn:aws:lambda:/);
    });

    it('should have config recorder name with environmentSuffix', () => {
      expect(outputs.configRecorderName).toContain('config-recorder-');
      expect(outputs.configRecorderName).toMatch(/synthk6j3p4g8$/);
    });
  });
});
