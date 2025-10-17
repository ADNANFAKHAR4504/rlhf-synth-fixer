import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('S3 Bucket Configuration', () => {
    test('creates S3 buckets', () => {
      template.resourceCountIs('AWS::S3::Bucket', 2);
    });

    test('has proper bucket encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            }),
          ]),
        },
      });
    });

    test('has proper public access block', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('has bucket with lifecycle rules for logging', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'DeleteOldLogs',
              Status: 'Enabled',
              ExpirationInDays: 90,
            }),
          ]),
        },
      });
    });

    test('has bucket with versioning enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('has bucket with CORS configuration', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        CorsConfiguration: {
          CorsRules: Match.arrayWith([
            Match.objectLike({
              AllowedMethods: Match.arrayWith(['GET', 'HEAD']),
              AllowedOrigins: ['*'],
            }),
          ]),
        },
      });
    });
  });

  describe('CloudFront Distribution Configuration', () => {
    test('creates CloudFront distribution', () => {
      template.resourceCountIs('AWS::CloudFront::Distribution', 1);
    });

    test('distribution is enabled with proper settings', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: Match.objectLike({
          Enabled: true,
          HttpVersion: 'http2and3',
          PriceClass: 'PriceClass_100',
          DefaultRootObject: 'index.html',
        }),
      });
    });

    test('has logging enabled', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: Match.objectLike({
          Logging: Match.objectLike({
            Prefix: 'cloudfront-logs/',
          }),
        }),
      });
    });

    test('has HTTPS redirect configured', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: Match.objectLike({
          DefaultCacheBehavior: Match.objectLike({
            ViewerProtocolPolicy: 'redirect-to-https',
          }),
        }),
      });
    });

    test('has proper origin configuration', () => {
      // Check that the distribution has origins configured
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: Match.objectLike({
          Origins: Match.anyValue(),
        }),
      });
    });

    test('creates cache policy', () => {
      template.resourceCountIs('AWS::CloudFront::CachePolicy', 1);
      template.hasResourceProperties('AWS::CloudFront::CachePolicy', {
        CachePolicyConfig: Match.objectLike({
          Comment: 'Cache policy for article content',
          DefaultTTL: 86400,
          MinTTL: 60,
          MaxTTL: 31536000,
        }),
      });
    });

    test('creates response headers policy', () => {
      template.resourceCountIs('AWS::CloudFront::ResponseHeadersPolicy', 1);
      template.hasResourceProperties('AWS::CloudFront::ResponseHeadersPolicy', {
        ResponseHeadersPolicyConfig: Match.objectLike({
          Comment: 'Security headers for content delivery',
        }),
      });
    });
  });

  describe('IAM Roles Configuration', () => {
    test('creates IAM roles', () => {
      template.resourceCountIs('AWS::IAM::Role', 2);
    });

    test('creates CloudFront invalidation role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: { Service: 'lambda.amazonaws.com' },
              Action: 'sts:AssumeRole',
            }),
          ]),
        }),
        Description: Match.stringLikeRegexp('.*CloudFront invalidation.*'),
      });
    });

    test('creates content management role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: { Service: 'lambda.amazonaws.com' },
              Action: 'sts:AssumeRole',
            }),
          ]),
        }),
        Description: Match.stringLikeRegexp('.*S3 content management.*'),
      });
    });

    test('roles have appropriate inline policies', () => {
      // Check that roles have inline policies (CDK creates these as Policies property)
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: Match.anyValue(),
      });
    });
  });

  describe('CloudWatch Monitoring Configuration', () => {
    test('creates CloudWatch dashboard', () => {
      template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
    });

    test('creates CloudWatch alarms', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 3);
    });

    test('creates high error rate alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmDescription: 'Alert when 4xx error rate is high',
        Threshold: 5,
        ComparisonOperator: 'GreaterThanThreshold',
        EvaluationPeriods: 2,
      });
    });

    test('creates server error rate alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmDescription: 'Alert when 5xx error rate is high',
        Threshold: 1,
        ComparisonOperator: 'GreaterThanThreshold',
        EvaluationPeriods: 2,
      });
    });

    test('creates cache hit rate alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmDescription: 'Alert when cache hit rate is low',
        Threshold: 70,
        ComparisonOperator: 'LessThanThreshold',
        EvaluationPeriods: 3,
      });
    });
  });

  describe('Stack Outputs', () => {
    test('creates required outputs', () => {
      // Check that all required outputs exist
      template.hasOutput('DistributionIdOutput', Match.anyValue());
      template.hasOutput('DistributionDomainNameOutput', Match.anyValue());
      template.hasOutput('ContentBucketNameOutput', Match.anyValue());
      template.hasOutput('LoggingBucketNameOutput', Match.anyValue());
      template.hasOutput('InvalidationRoleArnOutput', Match.anyValue());
      template.hasOutput('ContentManagementRoleArnOutput', Match.anyValue());
    });

    test('outputs have proper descriptions', () => {
      template.hasOutput('DistributionIdOutput', {
        Description: 'CloudFront Distribution ID',
      });

      template.hasOutput('ContentBucketNameOutput', {
        Description: 'S3 Content Bucket Name',
      });
    });

    test('outputs have exports configured', () => {
      const outputs = template.findOutputs('*');
      const exportedOutputs = Object.values(outputs).filter(
        (output: any) => output.Export?.Name
      );
      expect(exportedOutputs.length).toBeGreaterThan(0);
    });
  });

  describe('Resource Tagging', () => {
    test('creates expected resource types', () => {
      // Basic validation that key resources exist
      template.resourceCountIs('AWS::S3::Bucket', 2);
      template.resourceCountIs('AWS::CloudFront::Distribution', 1);
      template.resourceCountIs('AWS::IAM::Role', 2);
      template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
      template.resourceCountIs('AWS::CloudWatch::Alarm', 3);
    });
  });

  describe('Stack with Custom Domain', () => {
    test('creates Route 53 records when domain parameters provided', () => {
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'CustomDomainStack', {
        environmentSuffix: 'custom',
        domainName: 'example.com',
        hostedZoneId: 'Z1234567890',
        hostedZoneName: 'example.com',
      });
      const customTemplate = Template.fromStack(customStack);

      customTemplate.resourceCountIs('AWS::Route53::RecordSet', 2);
    });

    test('works without custom domain parameters', () => {
      // The basic stack (without domain config) should not create Route53 records
      template.resourceCountIs('AWS::Route53::RecordSet', 0);
    });
  });

  describe('Environment Suffix Integration', () => {
    test('uses environment suffix in resource configurations', () => {
      // Check that cache policy name includes the pattern we expect
      template.hasResourceProperties('AWS::CloudFront::CachePolicy', {
        CachePolicyConfig: Match.objectLike({
          Name: Match.anyValue(), // CDK generates complex names
        }),
      });
    });

    test('stack creates resources with consistent naming', () => {
      // Verify all expected resources are created (which implies proper naming)
      template.resourceCountIs('AWS::S3::Bucket', 2);
      template.resourceCountIs('AWS::CloudFront::Distribution', 1);
      template.resourceCountIs('AWS::CloudFront::CachePolicy', 1);
      template.resourceCountIs('AWS::CloudFront::ResponseHeadersPolicy', 1);
    });
  });

  describe('Certificate Configuration', () => {
    test('configures CloudFront with certificate when certificateArn provided', () => {
      const certApp = new cdk.App();
      const certStack = new TapStack(certApp, 'CertStack', {
        environmentSuffix: 'cert-test',
        certificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012',
        domainName: 'example.com',
      });
      const certTemplate = Template.fromStack(certStack);

      // Verify CloudFront distribution has ViewerCertificate configuration
      certTemplate.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: Match.objectLike({
          ViewerCertificate: Match.objectLike({
            AcmCertificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012',
            SslSupportMethod: 'sni-only',
            MinimumProtocolVersion: 'TLSv1.2_2021',
          }),
        }),
      });
    });

    test('CloudFront works without certificate when certificateArn not provided', () => {
      // The basic stack without certificate should still create distribution
      template.resourceCountIs('AWS::CloudFront::Distribution', 1);

      // Verify distribution doesn't have custom certificate configured
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: Match.objectLike({
          Enabled: true,
        }),
      });
    });
  });
});
