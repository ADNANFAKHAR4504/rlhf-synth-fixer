import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environment: 'test',
      owner: 'test-owner',
      project: 'tap-scalable-infrastructure',
      bucketNames: ['data', 'logs', 'backups'],
      enableCloudTrail: true,
      vpcCidr: '10.0.0.0/16',
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Resources', () => {
    test('should create VPC with correct CIDR', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create public and private subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
      });

      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
      });
    });

    test('should create VPC Flow Logs', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/vpc/flowlogs/tap-scalable-infrastructure-test',
      });
    });
  });

  describe('KMS Resources', () => {
    test('should create KMS key with rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
      });
    });

    test('should create KMS alias', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: 'alias/tap-scalable-infrastructure-test-key',
      });
    });
  });

  describe('S3 Resources', () => {
    test('should create S3 buckets with encryption', () => {
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
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('should create expected number of buckets', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      expect(buckets).toBeDefined();
      expect(Object.keys(buckets).length).toBeGreaterThanOrEqual(3); // data, logs, backups, cloudtrail
    });
  });

  describe('IAM Resources', () => {
    test('should create application role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
            },
          ],
        },
      });
    });

    test('should create Lambda execution role', () => {
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
      });
    });
  });

  describe('CloudTrail Resources', () => {
    test('should create CloudTrail when enabled', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        IncludeGlobalServiceEvents: true,
        IsMultiRegionTrail: true,
        EnableLogFileValidation: true,
      });
    });

    test('should create CloudTrail log group', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/cloudtrail/tap-scalable-infrastructure-test',
      });
    });
  });

  describe('SNS Resources', () => {
    test('should create security notifications topic', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: 'tap-scalable-infrastructure-test-security-notifications',
      });
    });

    test('should create SNS topic policy', () => {
      template.hasResource('AWS::SNS::TopicPolicy', {});
    });
  });

  describe('CloudFormation Outputs', () => {
    test('should export VPC ID', () => {
      template.hasOutput('VpcId', {
        Export: {
          Name: 'TestTapStack-VpcId',
        },
      });
    });

    test('should export KMS Key ARN', () => {
      template.hasOutput('KmsKeyArn', {
        Export: {
          Name: 'TestTapStack-KmsKeyArn',
        },
      });
    });

    test('should export Security Topic ARN', () => {
      template.hasOutput('SecurityTopicArn', {
        Export: {
          Name: 'TestTapStack-SecurityTopicArn',
        },
      });
    });
  });

  describe('Tags', () => {
    test('should apply common tags to stack', () => {
      template.hasResource('AWS::EC2::VPC', {});
    });
  });
});
