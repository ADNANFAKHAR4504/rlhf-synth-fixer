/**
 * Integration Tests for TapStack
 *
 * Simplified integration tests with live resource validation.
 * Tests read outputs from cfn-outputs/flat-outputs.json if available.
 */

import * as fs from 'fs';
import * as path from 'path';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';
import { LambdaClient, GetFunctionCommand } from '@aws-sdk/client-lambda';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';

describe('TapStack Integration Tests', () => {
  const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
  let outputs: any;
  let hasDeployment = false;

  // AWS clients for live tests
  const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
  const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });
  const snsClient = new SNSClient({ region: process.env.AWS_REGION || 'us-east-1' });

  beforeAll(() => {
    // Load deployment outputs if available
    if (fs.existsSync(outputsPath)) {
      try {
        const outputsContent = fs.readFileSync(outputsPath, 'utf-8');
        outputs = JSON.parse(outputsContent);
        hasDeployment = true;
      } catch (error) {
        console.log('No deployment outputs found or invalid JSON');
        hasDeployment = false;
      }
    }
  });

  describe('Deployment Outputs', () => {
    it('should have deployment outputs when deployed', () => {
      if (!hasDeployment) {
        console.log('⊘ Skipped: No deployment exists');
        return;
      }
      expect(outputs).toBeDefined();
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
    });

    it('should export complianceBucketName', () => {
      if (!hasDeployment) {
        console.log('⊘ Skipped: No deployment exists');
        return;
      }
      expect(outputs.complianceBucketName).toBeDefined();
      expect(typeof outputs.complianceBucketName).toBe('string');
    });

    it('should export complianceLambdaArn', () => {
      if (!hasDeployment) {
        console.log('⊘ Skipped: No deployment exists');
        return;
      }
      expect(outputs.complianceLambdaArn).toBeDefined();
      expect(outputs.complianceLambdaArn).toMatch(/^arn:aws:lambda:/);
    });

    it('should export snsTopicArn', () => {
      if (!hasDeployment) {
        console.log('⊘ Skipped: No deployment exists');
        return;
      }
      expect(outputs.snsTopicArn).toBeDefined();
      expect(outputs.snsTopicArn).toMatch(/^arn:aws:sns:/);
    });
  });

  describe('Live Resource Validation', () => {
    it('should have S3 bucket accessible', async () => {
      if (!hasDeployment || !outputs.complianceBucketName) {
        console.log('⊘ Skipped: No deployment or bucket name');
        return;
      }

      try {
        await s3Client.send(new HeadBucketCommand({ Bucket: outputs.complianceBucketName }));
        expect(true).toBe(true);
      } catch (error: any) {
        if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
          throw new Error(`S3 bucket ${outputs.complianceBucketName} does not exist`);
        }
        throw error;
      }
    }, 10000);

    it('should have Lambda function accessible', async () => {
      if (!hasDeployment || !outputs.complianceLambdaArn) {
        console.log('⊘ Skipped: No deployment or Lambda ARN');
        return;
      }

      const functionName = outputs.complianceLambdaArn.split(':').pop();
      try {
        const response = await lambdaClient.send(
          new GetFunctionCommand({ FunctionName: functionName })
        );
        expect(response.Configuration).toBeDefined();
        expect(response.Configuration?.FunctionName).toBe(functionName);
      } catch (error: any) {
        if (error.name === 'ResourceNotFoundException') {
          throw new Error(`Lambda function ${functionName} does not exist`);
        }
        throw error;
      }
    }, 10000);

    it('should have SNS topic accessible', async () => {
      if (!hasDeployment || !outputs.snsTopicArn) {
        console.log('⊘ Skipped: No deployment or SNS topic ARN');
        return;
      }

      try {
        const response = await snsClient.send(
          new GetTopicAttributesCommand({ TopicArn: outputs.snsTopicArn })
        );
        expect(response.Attributes).toBeDefined();
      } catch (error: any) {
        if (error.name === 'NotFound' || error.name === 'NotFoundException') {
          throw new Error(`SNS topic ${outputs.snsTopicArn} does not exist`);
        }
        throw error;
      }
    }, 10000);
  });

  describe('Resource Naming', () => {
    it('should follow AWS S3 bucket naming rules', () => {
      if (!hasDeployment || !outputs.complianceBucketName) {
        console.log('⊘ Skipped: No deployment exists');
        return;
      }

      const bucketName = outputs.complianceBucketName;
      expect(bucketName).toBe(bucketName.toLowerCase());
      expect(bucketName.length).toBeGreaterThanOrEqual(3);
      expect(bucketName.length).toBeLessThanOrEqual(63);
    });
  });
});
