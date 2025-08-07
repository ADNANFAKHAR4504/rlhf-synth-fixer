import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { SecureNetworkStack } from '../lib/secure-network-stack';

describe('SecureNetworkStack Unit Tests', () => {
  let app: cdk.App;
  let stack: SecureNetworkStack;
  let template: Template;

  beforeEach(() => {
    // Create a new app and stack for each test
    app = new cdk.App();
    stack = new SecureNetworkStack(app, 'TestStack', {
      environmentName: 'test-env',
      costCenter: 'CC-001-Test',
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('should create VPC with correct CIDR block', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create three subnet types', () => {
      // Public subnets
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
      });

      // Private subnets (with NAT)
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
      });
    });

    test('should create NAT gateways', () => {
      template.hasResourceProperties('AWS::EC2::NatGateway', {});
    });
  });

  describe('Security Configuration', () => {
    test('should create KMS key with rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
      });
    });

    test('should create S3 buckets with encryption', () => {
      // Flow Logs Bucket
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
      });
    });

    test('should create security group with restricted access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupIngress: [
          {
            CidrIp: '10.0.0.0/8',
            FromPort: 80,
            ToPort: 80,
            IpProtocol: 'tcp',
          },
          {
            CidrIp: '10.0.0.0/8',
            FromPort: 22,
            ToPort: 22,
            IpProtocol: 'tcp',
          },
        ],
      });
    });
  });

  describe('Monitoring and Compliance', () => {
    test('should create VPC Flow Logs', () => {
      template.hasResourceProperties('AWS::EC2::FlowLog', {
        ResourceType: 'VPC',
        TrafficType: 'ALL',
      });
    });

    test('should create CloudWatch Log Group for Flow Logs', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 90,
      });
    });

    test('should create CloudWatch alarm for SSH monitoring', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        ComparisonOperator: 'GreaterThanThreshold',
        EvaluationPeriods: 2,
        Threshold: 10,
      });
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should create IAM role for VPC Flow Logs', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'vpc-flow-logs.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        },
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should output VPC ID', () => {
      template.hasOutput('VpcId', {
        Description: 'VPC ID',
      });
    });

    test('should output Flow Logs bucket name', () => {
      template.hasOutput('FlowLogsBucketName', {
        Description: 'S3 bucket for VPC Flow Logs',
      });
    });
  });

  describe('Tagging', () => {
    test('should apply comprehensive tags to resources', () => {
      // Use the existing stack from beforeEach to avoid multiple synthesis
      // Check that tags are present (CDK applies tags at synthesis)
      expect(stack.tags.tagValues()).toMatchObject({
        Environment: 'test-env',
        CostCenter: 'CC-001-Test',
        Project: 'SecureNetworkInfrastructure',
        Owner: 'CloudOpsTeam',
        Compliance: 'Required',
      });
    });
  });
});
