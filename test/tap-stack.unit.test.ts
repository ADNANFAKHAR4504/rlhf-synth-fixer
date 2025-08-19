import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

// No mocks needed for this test

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environment: environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('KMS Key', () => {
    test('should create KMS key with correct description and rotation', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: `KMS key for ${environmentSuffix} environment encryption`,
        EnableKeyRotation: true,
      });
    });

    test('should have correct KMS key policy statements', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        KeyPolicy: {
          Statement: [
            {
              Sid: 'Enable IAM User Permissions',
              Effect: 'Allow',
              Principal: {
                AWS: {
                  'Fn::Join': ['', ['arn:', { Ref: 'AWS::Partition' }, ':iam::', { Ref: 'AWS::AccountId' }, ':root']],
                },
              },
              Action: 'kms:*',
              Resource: '*',
            },
            {
              Sid: 'Allow CloudTrail to encrypt logs',
              Effect: 'Allow',
              Principal: {
                Service: 'cloudtrail.amazonaws.com',
              },
              Action: [
                'kms:GenerateDataKey*',
                'kms:DescribeKey',
                'kms:Encrypt',
                'kms:ReEncrypt*',
                'kms:Decrypt',
              ],
              Resource: '*',
            },
            {
              Sid: 'Allow CloudWatch Logs to encrypt logs',
              Effect: 'Allow',
              Principal: {
                Service: 'logs.amazonaws.com',
              },
              Action: [
                'kms:GenerateDataKey*',
                'kms:DescribeKey',
                'kms:Encrypt',
                'kms:ReEncrypt*',
                'kms:Decrypt',
              ],
              Resource: '*',
            },
            {
              Sid: 'Allow S3 to encrypt objects',
              Effect: 'Allow',
              Principal: {
                Service: 's3.amazonaws.com',
              },
              Action: [
                'kms:GenerateDataKey*',
                'kms:DescribeKey',
                'kms:Encrypt',
                'kms:ReEncrypt*',
                'kms:Decrypt',
              ],
              Resource: '*',
            },
            {
              Sid: 'Allow RDS to encrypt data',
              Effect: 'Allow',
              Principal: {
                Service: 'rds.amazonaws.com',
              },
              Action: [
                'kms:GenerateDataKey*',
                'kms:DescribeKey',
                'kms:Encrypt',
                'kms:ReEncrypt*',
                'kms:Decrypt',
              ],
              Resource: '*',
            },
            {
              Sid: 'Allow SNS to encrypt messages',
              Effect: 'Allow',
              Principal: {
                Service: 'sns.amazonaws.com',
              },
              Action: [
                'kms:GenerateDataKey*',
                'kms:DescribeKey',
                'kms:Encrypt',
                'kms:ReEncrypt*',
                'kms:Decrypt',
              ],
              Resource: '*',
            },
          ],
        },
      });
    });
  });

  describe('VPC', () => {
    test('should create VPC with correct name', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: [
          {
            Key: 'Name',
            Value: `${environmentSuffix}-vpc`,
          },
        ],
      });
    });

    test('should create VPC with correct CIDR block', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
      });
    });
  });

  describe('Security Groups', () => {
    test('should create EC2 security group with correct name', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: `${environmentSuffix}-ec2-sg`,
        GroupDescription: 'Security group for EC2 instances with restricted SSH access',
      });
    });

    test('should create ALB security group with correct name', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: `${environmentSuffix}-alb-sg`,
        GroupDescription: 'Security group for Application Load Balancer',
      });
    });

    test('should create RDS security group with correct name', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: `${environmentSuffix}-rds-sg`,
        GroupDescription: 'Security group for RDS instances',
      });
    });
  });

  describe('RDS Database', () => {
    test('should create RDS instance with correct identifier', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceIdentifier: `${environmentSuffix}-database`,
      });
    });

    test('should create RDS instance with MySQL 8.0 engine', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'mysql',
        EngineVersion: '8.0',
      });
    });

    test('should create RDS instance with encryption enabled', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        StorageEncrypted: true,
      });
    });

    test('should create RDS instance with auto minor version upgrade enabled', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        AutoMinorVersionUpgrade: true,
      });
    });
  });

  describe('Application Load Balancer', () => {
    test('should create ALB with correct name', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Name: `${environmentSuffix}-alb`,
        Scheme: 'internet-facing',
      });
    });
  });

  describe('WAF Web ACL', () => {
    test('should create WAF Web ACL with correct name', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Name: `${environmentSuffix}-web-acl`,
        Scope: 'REGIONAL',
      });
    });

    test('should have AWS managed rules', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Rules: [
          {
            Name: 'AWSManagedRulesCommonRuleSet',
            Priority: 1,
          },
          {
            Name: 'AWSManagedRulesKnownBadInputsRuleSet',
            Priority: 2,
          },
          {
            Name: 'AWSManagedRulesSQLiRuleSet',
            Priority: 3,
          },
        ],
      });
    });
  });

  describe('CloudTrail', () => {
    test('should create CloudTrail with correct name', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        TrailName: `${environmentSuffix}-cloudtrail`,
      });
    });

    test('should enable CloudTrail logging', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        EnableLogFileValidation: true,
        IncludeGlobalServiceEvents: true,
        IsLogging: true,
      });
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('should create CloudTrail log group', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/cloudtrail/${environmentSuffix}-logs`,
      });
    });
  });

  describe('S3 Buckets', () => {
    test('should create CloudTrail S3 bucket with correct name pattern', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: {
          'Fn::Join': ['', [
            `${environmentSuffix}-cloudtrail-`,
            { Ref: 'AWS::AccountId' },
            '-',
            { Ref: 'AWS::Region' },
          ]],
        },
      });
    });

    test('should create secure S3 bucket with correct name pattern', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: {
          'Fn::Join': ['', [
            `${environmentSuffix}-secure-bucket-`,
            { Ref: 'AWS::AccountId' },
            '-',
            { Ref: 'AWS::Region' },
          ]],
        },
      });
    });

    test('should enable S3 bucket encryption with KMS', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
              },
            },
          ],
        },
      });
    });
  });

  describe('SNS Topic', () => {
    test('should create SNS topic for notifications', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `${environmentSuffix}-notifications`,
      });
    });
  });

  describe('GuardDuty', () => {
    test('should enable GuardDuty', () => {
      template.hasResourceProperties('AWS::GuardDuty::Detector', {
        Enable: true,
      });
    });
  });

  describe('Stack Resources', () => {
    test('should create expected number of resources', () => {
      // Verify that the stack creates the expected resource types
      template.resourceCountIs('AWS::KMS::Key', 1);
      template.resourceCountIs('AWS::EC2::VPC', 1);
      template.resourceCountIs('AWS::EC2::SecurityGroup', 3);
      template.resourceCountIs('AWS::RDS::DBInstance', 1);
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
      template.resourceCountIs('AWS::WAFv2::WebACL', 1);
      template.resourceCountIs('AWS::CloudTrail::Trail', 1);
      template.resourceCountIs('AWS::Logs::LogGroup', 1);
      template.resourceCountIs('AWS::S3::Bucket', 2);
      template.resourceCountIs('AWS::SNS::Topic', 1);
      template.resourceCountIs('AWS::GuardDuty::Detector', 1);
    });
  });
});
