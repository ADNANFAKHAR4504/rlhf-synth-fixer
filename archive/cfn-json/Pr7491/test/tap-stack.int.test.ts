// Integration tests for Multi-Region Disaster Recovery CloudFormation Stack
// NOTE: These tests validate deployment outputs without requiring AWS API calls

import fs from 'fs';

describe('Multi-Region Disaster Recovery Integration Tests', () => {
  let outputs: any;

  beforeAll(() => {
    outputs = JSON.parse(
      fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
    );
  });

  describe('Prerequisites', () => {
    test('should have deployment outputs available', () => {
      expect(outputs).toBeDefined();
      expect(typeof outputs).toBe('object');
    });
  });

  describe('DynamoDB Global Table', () => {
    test('should have DynamoDB table name in outputs', () => {
      expect(outputs.DynamoDBTableName).toBeDefined();
      expect(outputs.DynamoDBTableName).toMatch(/^transactions-/);
    });

    test('should have DynamoDB table ARN in outputs', () => {
      expect(outputs.DynamoDBTableArn).toBeDefined();
      expect(outputs.DynamoDBTableArn).toContain('arn:aws:dynamodb');
      expect(outputs.DynamoDBTableArn).toContain(outputs.DynamoDBTableName);
    });
  });

  describe('S3 Bucket', () => {
    test('should have S3 bucket name in outputs', () => {
      expect(outputs.S3BucketName).toBeDefined();
      expect(outputs.S3BucketName).toMatch(/^transaction-documents-/);
    });

    test('should have S3 bucket ARN in outputs', () => {
      expect(outputs.S3BucketArn).toBeDefined();
      expect(outputs.S3BucketArn).toContain('arn:aws:s3:::');
      expect(outputs.S3BucketArn).toContain(outputs.S3BucketName);
    });
  });

  describe('Lambda Function', () => {
    test('should have Lambda function name in outputs', () => {
      expect(outputs.LambdaFunctionName).toBeDefined();
      expect(outputs.LambdaFunctionName).toMatch(/^transaction-processor-/);
    });

    test('should have Lambda function ARN in outputs', () => {
      expect(outputs.LambdaFunctionArn).toBeDefined();
      expect(outputs.LambdaFunctionArn).toContain('arn:aws:lambda');
      expect(outputs.LambdaFunctionArn).toContain(outputs.LambdaFunctionName);
    });
  });

  describe('KMS Encryption', () => {
    test('should have KMS key ID in outputs', () => {
      expect(outputs.KMSKeyId).toBeDefined();
      expect(outputs.KMSKeyId).toMatch(/^[a-f0-9-]+$/);
    });

    test('should have KMS key ARN in outputs', () => {
      expect(outputs.KMSKeyArn).toBeDefined();
      expect(outputs.KMSKeyArn).toContain('arn:aws:kms');
      expect(outputs.KMSKeyArn).toContain(outputs.KMSKeyId);
    });
  });

  describe('SNS Topic', () => {
    test('should have SNS topic ARN in outputs', () => {
      expect(outputs.SNSTopicArn).toBeDefined();
      expect(outputs.SNSTopicArn).toContain('arn:aws:sns');
      expect(outputs.SNSTopicArn).toMatch(/transaction-alerts-/);
    });
  });

  describe('Regions and Endpoints', () => {
    test('should have primary region in outputs', () => {
      expect(outputs.PrimaryRegion).toBeDefined();
      expect(outputs.PrimaryRegion).toBe('us-east-1');
    });

    test('should have secondary region in outputs', () => {
      expect(outputs.SecondaryRegion).toBeDefined();
      expect(outputs.SecondaryRegion).toBe('us-west-2');
    });

    test('should have primary endpoint in outputs', () => {
      expect(outputs.PrimaryEndpoint).toBeDefined();
      expect(outputs.PrimaryEndpoint).toContain('lambda.');
      expect(outputs.PrimaryEndpoint).toContain(outputs.PrimaryRegion);
    });
  });

  describe('IAM Roles', () => {
    test('should have cross-region role ARN in outputs', () => {
      expect(outputs.CrossRegionRoleArn).toBeDefined();
      expect(outputs.CrossRegionRoleArn).toContain('arn:aws:iam::');
      expect(outputs.CrossRegionRoleArn).toContain('cross-region-assume-role');
    });
  });
});
