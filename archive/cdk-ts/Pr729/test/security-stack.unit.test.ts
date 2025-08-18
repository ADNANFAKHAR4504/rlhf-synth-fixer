import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { SecurityStack } from '../lib/security-stack';

describe('SecurityStack', () => {
  let app: cdk.App;
  let parentStack: cdk.Stack;
  let vpc: ec2.Vpc;
  let stack: SecurityStack;
  let template: Template;
  const environmentSuffix = 'testenv';

  beforeEach(() => {
    app = new cdk.App();
    parentStack = new cdk.Stack(app, 'ParentStack', {
      env: { account: '123456789012', region: 'us-east-1' },
    });
    
    vpc = new ec2.Vpc(parentStack, 'TestVpc', {
      maxAzs: 2,
    });

    stack = new SecurityStack(parentStack, 'TestSecurityStack', {
      environmentSuffix,
      vpc,
    });
    
    template = Template.fromStack(stack);
  });

  describe('KMS Key', () => {
    test('creates KMS key with correct properties', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
        PendingWindowInDays: 7,
      });
    });

    test('KMS key has proper CloudTrail access policy', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        KeyPolicy: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'Allow CloudTrail',
              Effect: 'Allow',
              Principal: Match.objectLike({
                Service: 'cloudtrail.amazonaws.com',
              }),
            }),
          ]),
        }),
      });
    });
  });

  describe('CloudTrail', () => {
    test('creates CloudTrail with encryption', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        TrailName: Match.stringLikeRegexp(`${environmentSuffix}-security-trail`),
        IsMultiRegionTrail: true,
        IncludeGlobalServiceEvents: true,
        EnableLogFileValidation: true,
      });
    });

    test('CloudTrail bucket has encryption enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp(`${environmentSuffix}-cloudtrail-logs`),
        BucketEncryption: Match.objectLike({
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: Match.objectLike({
                SSEAlgorithm: 'aws:kms',
              }),
            }),
          ]),
        }),
      });
    });

    test('CloudTrail bucket blocks public access', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });
  });

  describe('IAM Roles and Policies', () => {
    test('creates EC2 role with proper trust policy', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: Match.stringLikeRegexp(`${environmentSuffix}-ec2-role`),
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: Match.objectLike({
                Service: 'ec2.amazonaws.com',
              }),
            }),
          ]),
        }),
      });
    });

    test('EC2 role has read-only S3 permissions', () => {
      const roles = template.findResources('AWS::IAM::Role');
      const ec2Roles = Object.values(roles).filter(role => 
        role.Properties?.RoleName?.includes(`${environmentSuffix}-ec2-role`)
      );
      
      expect(ec2Roles.length).toBeGreaterThan(0);
      ec2Roles.forEach(role => {
        const managedPolicies = role.Properties?.ManagedPolicyArns || [];
        const hasS3ReadOnly = managedPolicies.some((policy: any) => 
          JSON.stringify(policy).includes('AmazonS3ReadOnlyAccess')
        );
        expect(hasS3ReadOnly).toBe(true);
      });
    });

    test('creates IAM group with MFA enforcement', () => {
      template.resourceCountIs('AWS::IAM::Group', 1);
    });

    test('IAM group has MFA deny policy', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'DenyAllExceptUnlessSignedInWithMFA',
              Effect: 'Deny',
              Condition: Match.objectLike({
                BoolIfExists: {
                  'aws:MultiFactorAuthPresent': 'false',
                },
              }),
            }),
          ]),
        }),
      });
    });
  });

  describe('GuardDuty', () => {
    test('creates GuardDuty detector', () => {
      template.hasResourceProperties('AWS::GuardDuty::Detector', {
        Enable: true,
        FindingPublishingFrequency: 'FIFTEEN_MINUTES',
      });
    });
  });

  describe('Security Hub', () => {
    test('creates Security Hub with default standards', () => {
      template.hasResourceProperties('AWS::SecurityHub::Hub', {
        EnableDefaultStandards: true,
      });
    });
  });

  describe('SNS Topic', () => {
    test('creates SNS topic for security alerts', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: Match.stringLikeRegexp(`${environmentSuffix}-security-alerts`),
      });
    });

    test('SNS topic allows authorized AWS services', () => {
      template.hasResourceProperties('AWS::SNS::TopicPolicy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'AllowAWSServices',
              Effect: 'Allow',
              Principal: Match.objectLike({
                Service: Match.arrayWith([
                  'guardduty.amazonaws.com',
                  'securityhub.amazonaws.com',
                  'cloudwatch.amazonaws.com',
                ]),
              }),
            }),
          ]),
        }),
      });
    });
  });

  describe('WAF Web ACL', () => {
    test('creates WAF Web ACL with managed rule sets', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Name: Match.stringLikeRegexp(`${environmentSuffix}-web-acl`),
        Scope: 'REGIONAL',
        DefaultAction: {
          Allow: {},
        },
      });
    });

    test('WAF includes SQL injection protection', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Rules: Match.arrayWith([
          Match.objectLike({
            Name: 'AWSManagedRulesSQLiRuleSet',
            Statement: Match.objectLike({
              ManagedRuleGroupStatement: Match.objectLike({
                Name: 'AWSManagedRulesSQLiRuleSet',
              }),
            }),
          }),
        ]),
      });
    });

    test('WAF includes XSS protection', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Rules: Match.arrayWith([
          Match.objectLike({
            Name: 'AWSManagedRulesCommonRuleSet',
            Statement: Match.objectLike({
              ManagedRuleGroupStatement: Match.objectLike({
                Name: 'AWSManagedRulesCommonRuleSet',
              }),
            }),
          }),
        ]),
      });
    });
  });
});