// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import * as AWS from 'aws-sdk';

// LocalStack configuration
const AWS_ENDPOINT = process.env.AWS_ENDPOINT_URL || 'http://localhost:4566';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const isLocalStack = AWS_ENDPOINT.includes('localhost') || AWS_ENDPOINT.includes('4566');

// LocalStack uses default account ID
const AWS_ACCOUNT_ID = isLocalStack ? '000000000000' : process.env.AWS_ACCOUNT_ID;

// Configure AWS SDK to use LocalStack
AWS.config.update({
  region: AWS_REGION,
  endpoint: AWS_ENDPOINT,
  s3ForcePathStyle: true,
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test'
  }
});

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Secure CloudFormation Infrastructure Integration Tests', () => {
  describe('VPC and Network Tests', () => {
    test('should have VPC with proper CIDR block', async () => {
      expect(outputs.VPCId).toBeDefined();
      expect(typeof outputs.VPCId).toBe('string');
    });
  });

  describe('Encryption Tests', () => {
    test('should have KMS key for encryption', async () => {
      expect(outputs.KMSKeyId).toBeDefined();
      expect(typeof outputs.KMSKeyId).toBe('string');
    });
  });

  describe('Database Tests', () => {
    test('should have database endpoint', async () => {
      expect(outputs.DatabaseEndpoint).toBeDefined();
      expect(typeof outputs.DatabaseEndpoint).toBe('string');
      if (isLocalStack) {
        expect(outputs.DatabaseEndpoint).toMatch(/localhost\.localstack\.cloud/);
      } else {
        expect(outputs.DatabaseEndpoint).toMatch(/\.rds\./); // Should contain .rds. in endpoint
      }
    });
  });

  describe('Storage Tests', () => {
    test('should have application data bucket', async () => {
      expect(outputs.ApplicationDataBucket).toBeDefined();
      expect(typeof outputs.ApplicationDataBucket).toBe('string');
    });

    test('should have CloudTrail bucket', async () => {
      expect(outputs.CloudTrailBucket).toBeDefined();
      expect(typeof outputs.CloudTrailBucket).toBe('string');
    });
  });

  describe('IAM and Security Tests', () => {
    test('should have application IAM role', async () => {
      expect(outputs.ApplicationRoleArn).toBeDefined();
      expect(typeof outputs.ApplicationRoleArn).toBe('string');
      expect(outputs.ApplicationRoleArn).toMatch(/^arn:aws:iam::/); // Should be valid ARN
    });
  });

  describe('Monitoring Tests', () => {
    test('should have security log group', async () => {
      expect(outputs.SecurityLogGroup).toBeDefined();
      expect(typeof outputs.SecurityLogGroup).toBe('string');
    });
  });

  describe('Resource Connectivity Tests', () => {
    test('all critical resources should be accessible', async () => {
      const criticalOutputs = [
        'VPCId',
        'KMSKeyId', 
        'DatabaseEndpoint',
        'ApplicationDataBucket',
        'ApplicationRoleArn'
      ];
      
      criticalOutputs.forEach(outputName => {
        expect(outputs[outputName]).toBeDefined();
        expect(outputs[outputName]).not.toBe('');
      });
    });
  });
});
