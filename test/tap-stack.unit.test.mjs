import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack.mjs';

describe('TapStack Unit Tests', () => {
  let app;
  let stack;
  let template;

  beforeAll(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('S3 Bucket', () => {
    const isLocalStack = process.env.AWS_ENDPOINT_URL !== undefined;
    
    test('should create S3 bucket', () => {
      // In non-LocalStack mode: 2 buckets (websiteBucket + logBucket for CloudFront logs)
      // In LocalStack mode: 1 bucket (only websiteBucket, no CloudFront)
      const expectedBucketCount = isLocalStack ? 1 : 2;
      template.resourceCountIs('AWS::S3::Bucket', expectedBucketCount);
    });

    test('should have bucket encryption configured', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: Match.objectLike({
          ServerSideEncryptionConfiguration: Match.anyValue(),
        }),
      });
    });

    test('should block public access', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: Match.objectLike({
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        }),
      });
    });
  });

  describe('CloudFront Distribution (conditional for LocalStack)', () => {
    const isLocalStack = process.env.AWS_ENDPOINT_URL !== undefined;
    
    test('should create CloudFront distribution when not in LocalStack', () => {
      if (!isLocalStack) {
        template.resourceCountIs('AWS::CloudFront::Distribution', 1);
      } else {
        template.resourceCountIs('AWS::CloudFront::Distribution', 0);
      }
    });

    test('should have SSL configured when not in LocalStack', () => {
      if (!isLocalStack) {
        // Verify distribution has HTTPS redirect configured in default behavior
        template.hasResourceProperties('AWS::CloudFront::Distribution', {
          DistributionConfig: Match.objectLike({
            DefaultCacheBehavior: Match.objectLike({
              ViewerProtocolPolicy: 'redirect-to-https',
            }),
          }),
        });
      } else {
        expect(true).toBe(true); // Skip in LocalStack
      }
    });
  });

  describe('KMS Key', () => {
    test('should create KMS key', () => {
      template.resourceCountIs('AWS::KMS::Key', 1);
    });

    test('should have key rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
      });
    });
  });

  describe('CloudWatch Dashboard', () => {
    test('should create CloudWatch dashboard', () => {
      template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
    });
  });

  describe('Origin Access Control (conditional for LocalStack)', () => {
    const isLocalStack = process.env.AWS_ENDPOINT_URL !== undefined;
    
    test('should create Origin Access Control when not in LocalStack', () => {
      if (!isLocalStack) {
        template.resourceCountIs('AWS::CloudFront::OriginAccessControl', 1);
      } else {
        template.resourceCountIs('AWS::CloudFront::OriginAccessControl', 0);
      }
    });
  });

  describe('Stack Outputs', () => {
    test('should have bucket name output', () => {
      const outputs = template.findOutputs('*');
      const bucketOutput = Object.keys(outputs).find(k => k.includes('WebsiteBucketName'));
      expect(bucketOutput).toBeDefined();
    });

    test('should have distribution ID output when not in LocalStack', () => {
      const isLocalStack = process.env.AWS_ENDPOINT_URL !== undefined;
      const outputs = template.findOutputs('*');
      const distOutput = Object.keys(outputs).find(k => k.includes('DistributionId'));
      if (!isLocalStack) {
        expect(distOutput).toBeDefined();
      } else {
        expect(true).toBe(true); // Skip in LocalStack
      }
    });

    test('should have distribution domain name output when not in LocalStack', () => {
      const isLocalStack = process.env.AWS_ENDPOINT_URL !== undefined;
      const outputs = template.findOutputs('*');
      const domainOutput = Object.keys(outputs).find(k => k.includes('DistributionDomainName'));
      if (!isLocalStack) {
        expect(domainOutput).toBeDefined();
      } else {
        expect(true).toBe(true); // Skip in LocalStack
      }
    });

    test('should have KMS key ID output', () => {
      const outputs = template.findOutputs('*');
      const kmsOutput = Object.keys(outputs).find(k => k.includes('KMSKeyId'));
      expect(kmsOutput).toBeDefined();
    });
  });
});

