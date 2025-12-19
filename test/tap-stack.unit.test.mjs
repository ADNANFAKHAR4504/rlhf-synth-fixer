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
    test('should create S3 bucket', () => {
      template.resourceCountIs('AWS::S3::Bucket', Match.anyValue());
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

  describe('CloudFront Distribution', () => {
    test('should create CloudFront distribution', () => {
      template.resourceCountIs('AWS::CloudFront::Distribution', 1);
    });

    test('should have SSL configured', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: Match.objectLike({
          ViewerCertificate: Match.objectLike({
            CloudFrontDefaultCertificate: true,
          }),
        }),
      });
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

  describe('IAM', () => {
    test('should create Origin Access Identity', () => {
      template.resourceCountIs('AWS::CloudFront::CloudFrontOriginAccessIdentity', 1);
    });
  });

  describe('Stack Outputs', () => {
    test('should have bucket name output', () => {
      template.hasOutput(Match.stringLikeRegexp('WebsiteBucketName'), {});
    });

    test('should have distribution ID output', () => {
      template.hasOutput(Match.stringLikeRegexp('DistributionId'), {});
    });

    test('should have distribution domain name output', () => {
      template.hasOutput(Match.stringLikeRegexp('DistributionDomainName'), {});
    });

    test('should have KMS key ID output', () => {
      template.hasOutput(Match.stringLikeRegexp('KMSKeyId'), {});
    });
  });
});

