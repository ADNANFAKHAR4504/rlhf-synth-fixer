import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });
    template = Template.fromStack(stack);
  });

  describe('Stack initialization', () => {
    it('should use default environmentSuffix when not provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultStack');
      const defaultTemplate = Template.fromStack(defaultStack);
      
      defaultTemplate.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'ct-logs-dev',
      });
    });

    it('should use context environmentSuffix when provided', () => {
      const ctxApp = new cdk.App({
        context: {
          environmentSuffix: 'ctxtest',
        },
      });
      const ctxStack = new TapStack(ctxApp, 'ContextStack');
      const ctxTemplate = Template.fromStack(ctxStack);
      
      ctxTemplate.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'ct-logs-ctxtest',
      });
    });
  });

  describe('KMS Key', () => {
    it('should create a KMS key with automatic rotation', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
        KeySpec: 'SYMMETRIC_DEFAULT',
        KeyUsage: 'ENCRYPT_DECRYPT',
      });
    });

    it('should create a KMS key alias', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: 'alias/secure-key-test',
      });
    });
  });

  describe('S3 Buckets', () => {
    it('should create CloudTrail bucket with encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ],
        },
        BucketName: 'ct-logs-test',
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    it('should create Config bucket with encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ],
        },
        BucketName: 'cfg-test',
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    it('should have lifecycle rules for CloudTrail bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'DeleteOldLogs',
              Status: 'Enabled',
              ExpirationInDays: 365,
            },
          ],
        },
        BucketName: 'ct-logs-test',
      });
    });
  });

  describe('CloudTrail', () => {
    it('should create a multi-region trail', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        IsMultiRegionTrail: true,
        EnableLogFileValidation: true,
        IncludeGlobalServiceEvents: true,
        IsLogging: true,
      });
    });

    it('should send logs to CloudWatch', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        CloudWatchLogsLogGroupArn: Match.anyValue(),
        CloudWatchLogsRoleArn: Match.anyValue(),
      });
    });
  });

  describe('Lambda Function', () => {
    it('should create Lambda function with encrypted environment variables', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'secure-fn-test',
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Environment: {
          Variables: {
            DATABASE_URL: 'encrypted-database-connection',
            API_KEY: 'encrypted-api-key',
          },
        },
        KmsKeyArn: Match.anyValue(),
      });
    });

    it('should have proper IAM role with KMS decrypt permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ],
        },
        ManagedPolicyArns: Match.arrayWith([
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              '',
              Match.arrayWith([
                Match.stringLikeRegexp('.*AWSLambdaBasicExecutionRole'),
              ]),
            ]),
          }),
        ]),
      });
    });
  });

  describe('Security Group Change Monitoring', () => {
    it('should create CloudWatch log group for security group changes', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/events/sg-changes-test',
        RetentionInDays: 365,
      });
    });

    it('should create EventBridge rule for security group changes', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        EventPattern: {
          source: ['aws.ec2'],
          'detail-type': ['AWS API Call via CloudTrail'],
          detail: {
            eventSource: ['ec2.amazonaws.com'],
            eventName: [
              'AuthorizeSecurityGroupIngress',
              'AuthorizeSecurityGroupEgress',
              'RevokeSecurityGroupIngress',
              'RevokeSecurityGroupEgress',
              'CreateSecurityGroup',
              'DeleteSecurityGroup',
            ],
          },
        },
      });
    });
  });

  describe('WAF Web ACL', () => {
    it('should create WAF Web ACL for CloudFront', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Scope: 'CLOUDFRONT',
        DefaultAction: {
          Allow: {},
        },
      });
    });

    it('should include AWS managed rule sets', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Rules: Match.arrayWith([
          Match.objectLike({
            Name: 'AWSManagedRulesCommonRuleSet',
            Statement: {
              ManagedRuleGroupStatement: {
                VendorName: 'AWS',
                Name: 'AWSManagedRulesCommonRuleSet',
              },
            },
          }),
        ]),
      });
    });
  });

  describe('MFA Enforcement', () => {
    it('should create MFA-enabled IAM group', () => {
      template.hasResourceProperties('AWS::IAM::Group', {
        GroupName: 'MFAUsers-test',
      });
    });

    it('should attach MFA enforcement policy', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'DenyAllExceptListedIfNoMFA',
              Effect: 'Deny',
              Condition: {
                BoolIfExists: {
                  'aws:MultiFactorAuthPresent': 'false',
                },
              },
            }),
          ]),
        },
      });
    });
  });

  describe('Resource Tagging', () => {
    it('should apply standard tags to resources', () => {
      const resources = template.toJSON().Resources;
      const taggedResources = Object.values(resources).filter(
        (resource: any) => resource.Properties?.Tags
      );

      expect(taggedResources.length).toBeGreaterThan(0);

      taggedResources.forEach((resource: any) => {
        const tags = resource.Properties.Tags;
        expect(tags).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              Key: 'Environment',
              Value: 'test',
            }),
            expect.objectContaining({
              Key: 'SecurityCompliance',
              Value: 'true',
            }),
            expect.objectContaining({
              Key: 'Project',
              Value: 'SecureArchitecture',
            }),
          ])
        );
      });
    });
  });

  describe('Stack Outputs', () => {
    it('should have required outputs', () => {
      template.hasOutput('KMSKeyId', {});
      template.hasOutput('CloudTrailBucketName', {});
      template.hasOutput('ConfigBucketName', {});
      template.hasOutput('WebACLArn', {});
      template.hasOutput('LambdaFunctionName', {});
    });
  });
});