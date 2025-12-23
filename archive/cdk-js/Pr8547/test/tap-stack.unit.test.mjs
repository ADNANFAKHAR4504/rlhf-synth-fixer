import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack.mjs';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

describe('TapStack', () => {
  let app;
  let stack;
  let template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
      environmentSuffix,
      instanceCount: 2, // Reduced for testing
    });
    template = Template.fromStack(stack);
  });

  describe('VPC and Networking', () => {
    test('creates a VPC', () => {
      template.resourceCountIs('AWS::EC2::VPC', 1);
    });

    test('creates subnets for multi-AZ deployment', () => {
      const subnets = template.findResources('AWS::EC2::Subnet');
      expect(Object.keys(subnets).length).toBeGreaterThan(0);
    });

    test('creates security group for EC2 instances', () => {
      template.resourceCountIs('AWS::EC2::SecurityGroup', 1);
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for EC2 monitoring instances',
      });
    });
  });

  describe('EC2 Instances', () => {
    test('creates EC2 instances', () => {
      const instances = template.findResources('AWS::EC2::Instance');
      expect(Object.keys(instances).length).toBeGreaterThan(0);
    });

    test('instances have encrypted EBS volumes', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        BlockDeviceMappings: [
          {
            DeviceName: '/dev/xvda',
            Ebs: {
              Encrypted: true,
              VolumeType: 'gp3',
            },
          },
        ],
      });
    });
  });

  describe('S3 Bucket', () => {
    test('creates S3 bucket for log archives', () => {
      template.resourceCountIs('AWS::S3::Bucket', 1);
    });

    test('S3 bucket has encryption enabled', () => {
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
      });
    });

    test('S3 bucket blocks public access', () => {
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

  describe('CloudWatch Log Groups', () => {
    test('creates CloudWatch log groups', () => {
      const logGroups = template.findResources('AWS::Logs::LogGroup');
      expect(Object.keys(logGroups).length).toBeGreaterThanOrEqual(2);
    });

    test('log groups have retention configured', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 30,
      });
    });
  });

  describe('IAM Role', () => {
    test('creates IAM role for EC2 instances', () => {
      template.resourceCountIs('AWS::IAM::Role', 1);
    });

    test('IAM role has managed policy ARNs', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        ManagedPolicyArns: Match.anyValue(),
      });
    });
  });

  describe('SNS Topic', () => {
    test('creates SNS topic for alerts', () => {
      template.resourceCountIs('AWS::SNS::Topic', 1);
    });
  });

  describe('CloudWatch Alarms', () => {
    test('creates CloudWatch alarms for instances', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      expect(Object.keys(alarms).length).toBeGreaterThan(0);
    });

    test('creates CPU usage alarms', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/EC2',
        Threshold: 80,
      });
    });
  });

  describe('CloudWatch Dashboard', () => {
    test('creates CloudWatch dashboard', () => {
      template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
    });
  });

  describe('Stack Outputs', () => {
    test('exports VPC ID', () => {
      template.hasOutput('VpcId', {});
    });

    test('exports Security Group ID', () => {
      template.hasOutput('SecurityGroupId', {});
    });

    test('exports Log Bucket Name', () => {
      template.hasOutput('LogBucketName', {});
    });

    test('exports SNS Topic ARN', () => {
      template.hasOutput('AlertTopicArn', {});
    });

    test('exports Dashboard URL', () => {
      template.hasOutput('DashboardUrl', {});
    });
  });

  describe('TapStack Specific Tests', () => {
    test('creates stack with environment suffix from props', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack', {
        environmentSuffix: 'prod',
        instanceCount: 1,
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });

      expect(testStack).toBeDefined();
      const testTemplate = Template.fromStack(testStack);
      expect(testTemplate).toBeDefined();
    });

    test('creates stack with environment suffix from context', () => {
      const testApp = new cdk.App({
        context: {
          environmentSuffix: 'staging',
        },
      });
      const testStack = new TapStack(testApp, 'TestStack', {
        instanceCount: 1,
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });

      expect(testStack).toBeDefined();
    });

    test('creates stack with default environment suffix', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack', {
        instanceCount: 1,
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });

      expect(testStack).toBeDefined();
    });
  });
});

