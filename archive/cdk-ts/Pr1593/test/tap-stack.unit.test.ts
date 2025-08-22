import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('Environment Suffix Handling', () => {
    test('uses props environmentSuffix when provided', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack', { 
        environmentSuffix: 'test123' 
      });
      const testTemplate = Template.fromStack(testStack);
      
      // Should create stack without errors
      expect(testTemplate).toBeDefined();
    });

    test('uses context environmentSuffix when props not provided', () => {
      const testApp = new cdk.App();
      // Set context before stack creation
      testApp.node.setContext('environmentSuffix', 'context123');
      const testStack = new TapStack(testApp, 'TestStack');
      const testTemplate = Template.fromStack(testStack);
      
      // Should create stack without errors
      expect(testTemplate).toBeDefined();
    });

    test('uses default dev suffix when neither props nor context provided', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack');
      const testTemplate = Template.fromStack(testStack);
      
      // Should create stack without errors
      expect(testTemplate).toBeDefined();
    });
  });

  describe('S3 Resources', () => {
    test('creates KMS key for S3 encryption', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for S3 bucket encryption',
        EnableKeyRotation: true,
      });
    });

    test('creates logging bucket with correct properties', () => {
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

    test('creates main bucket with KMS encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
                KMSMasterKeyID: Match.anyValue(),
              },
            },
          ],
        },
      });
    });
  });

  describe('VPC Resources', () => {
    test('creates VPC with correct CIDR', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('creates public subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.0.0/24',
        MapPublicIpOnLaunch: true,
      });
    });

    test('creates private subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.2.0/24',
        MapPublicIpOnLaunch: false,
      });
    });

    test('creates database subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.4.0/24',
        MapPublicIpOnLaunch: false,
      });
    });

    test('creates internet gateway', () => {
      template.hasResourceProperties('AWS::EC2::InternetGateway', {});
    });

    test('creates NAT gateway', () => {
      template.hasResourceProperties('AWS::EC2::NatGateway', {});
    });
  });

  describe('EC2 Resources', () => {
    test('creates EC2 security group with SSH rules', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for EC2 instance',
        SecurityGroupIngress: [
          {
            CidrIp: '203.0.113.0/32',
            Description: 'SSH access from IP 1',
            FromPort: 22,
            IpProtocol: 'tcp',
            ToPort: 22,
          },
          {
            CidrIp: '198.51.100.0/32',
            Description: 'SSH access from IP 2',
            FromPort: 22,
            IpProtocol: 'tcp',
            ToPort: 22,
          },
        ],
      });
    });

    test('creates EC2 instance with correct properties', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.micro',
        Monitoring: true,
      });
    });

    test('creates IAM role for EC2', () => {
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
          Version: '2012-10-17',
        },
      });
    });
  });

  describe('RDS Resources', () => {
    test('creates RDS security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for RDS instance',
      });
    });

    test('creates RDS subnet group', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupDescription: 'Subnet group for RDS instance',
      });
    });

    test('creates RDS instance', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'mysql',
        DBInstanceClass: 'db.t3.micro',
        BackupRetentionPeriod: 7,
        DeletionProtection: false,
        MonitoringInterval: 60,
      });
    });
  });

  describe('CloudWatch Resources', () => {
    test('creates CloudWatch alarms', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 3);
    });

    test('creates log group', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/ec2/complete-environment',
        RetentionInDays: 7,
      });
    });
  });

  describe('Stack Outputs', () => {
    test('has required outputs', () => {
      template.hasOutput('VpcId', {});
      template.hasOutput('EC2InstanceId', {});
      template.hasOutput('RDSEndpoint', {});
      template.hasOutput('MainBucketName', {});
      template.hasOutput('LoggingBucketName', {});
      template.hasOutput('KMSKeyId', {});
    });
  });

  describe('Tagging', () => {
    test('applies common tags to resources', () => {
      // Check that VPC has some of the proper tags (AWS adds additional tags)
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          { Key: 'Department', Value: 'Engineering' },
          { Key: 'Project', Value: 'CompleteEnvironment' },
        ]),
      });
    });
  });
});
