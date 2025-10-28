import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack.mjs';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

describe('TapStack Unit Tests', () => {
  let app;
  let stack;
  let template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('should create VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        Tags: Match.arrayWith([
          {
            Key: 'Environment',
            Value: environmentSuffix,
          },
          {
            Key: 'ManagedBy',
            Value: 'CDK',
          },
        ]),
      });
    });

    test('should create public subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
        Tags: Match.arrayWith([
          {
            Key: 'aws-cdk:subnet-type',
            Value: 'Public',
          },
        ]),
      });
    });

    test('should create internet gateway', () => {
      template.hasResource('AWS::EC2::InternetGateway', {});
    });

    test('should not create NAT gateway for cost optimization', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 0);
    });
  });

  describe('Security Groups', () => {
    test('should create security group with correct ingress rules', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for EC2 monitoring instances',
        SecurityGroupIngress: Match.arrayWith([
          {
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
            CidrIp: '0.0.0.0/0',
            Description: 'Allow HTTP access from specified CIDR',
          },
          {
            IpProtocol: 'tcp',
            FromPort: 22,
            ToPort: 22,
            CidrIp: '0.0.0.0/0',
            Description: 'Allow SSH access from specified CIDR',
          },
        ]),
        Tags: Match.arrayWith([
          {
            Key: 'Environment',
            Value: environmentSuffix,
          },
        ]),
      });
    });
  });

  describe('EC2 Instances', () => {
    test('should create correct number of EC2 instances', () => {
      template.resourceCountIs('AWS::EC2::Instance', 10);
    });

    test('should configure EC2 instances correctly', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.micro',
        BlockDeviceMappings: [
          {
            DeviceName: '/dev/xvda',
            Ebs: {
              VolumeType: 'gp3',
              VolumeSize: 20,
              Encrypted: true,
            },
          },
        ],
        Tags: Match.arrayWith([
          {
            Key: 'Environment',
            Value: environmentSuffix,
          },
          {
            Key: 'ManagedBy',
            Value: 'CDK',
          },
        ]),
      });
    });

    test('should create instances with proper user data', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        UserData: Match.anyValue(),
      });
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should create IAM role for EC2 instances', () => {
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
        ManagedPolicyArns: Match.arrayWith([
          {
            'Fn::Join': [
              '',
              [
                'arn:',
                { Ref: 'AWS::Partition' },
                ':iam::aws:policy/CloudWatchAgentServerPolicy',
              ],
            ],
          },
          {
            'Fn::Join': [
              '',
              [
                'arn:',
                { Ref: 'AWS::Partition' },
                ':iam::aws:policy/AmazonSSMManagedInstanceCore',
              ],
            ],
          },
        ]),
      });
    });

    test('should create inline policies for CloudWatch and S3 access', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            {
              Effect: 'Allow',
              Action: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogStreams',
              ],
              Resource: Match.anyValue(),
            },
            {
              Effect: 'Allow',
              Action: [
                's3:PutObject',
                's3:PutObjectAcl',
                's3:GetObject',
                's3:ListBucket',
              ],
              Resource: Match.anyValue(),
            },
            {
              Effect: 'Allow',
              Action: [
                'ec2:DescribeVolumes',
                'ec2:DescribeTags',
                'ec2:DescribeInstances',
              ],
              Resource: '*',
            },
          ]),
        },
      });
    });

    test('should create instance profile', () => {
      template.hasResource('AWS::IAM::InstanceProfile', {});
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('should create S3 bucket with correct configuration', () => {
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
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'TransitionToIA',
              Status: 'Enabled',
              Transitions: [
                {
                  StorageClass: 'STANDARD_IA',
                  TransitionInDays: 30,
                },
              ],
            },
            {
              Id: 'DeleteOldLogs',
              Status: 'Enabled',
              ExpirationInDays: 90,
            },
          ],
        },
        Tags: Match.arrayWith([
          {
            Key: 'Environment',
            Value: environmentSuffix,
          },
        ]),
      });
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('should create system and application log groups', () => {
      template.resourceCountIs('AWS::Logs::LogGroup', 2);

      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: Match.stringLikeRegexp(`/aws/ec2/monitoring-.*-${environmentSuffix}`),
        RetentionInDays: 30,
      });
    });

    test('should tag log groups correctly', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        Tags: Match.arrayWith([
          {
            Key: 'Environment',
            Value: environmentSuffix,
          },
          {
            Key: 'ManagedBy',
            Value: 'CDK',
          },
        ]),
      });
    });
  });

  describe('SNS Topic Configuration', () => {
    test('should create SNS topic for alerts', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: Match.stringLikeRegexp(`Monitoring Alerts for ${environmentSuffix} environment`),
        Tags: Match.arrayWith([
          {
            Key: 'Environment',
            Value: environmentSuffix,
          },
        ]),
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should create disk usage alarms for all instances', () => {
      const diskAlarms = template.findResources('AWS::CloudWatch::Alarm', {
        Properties: {
          MetricName: 'disk_used_percent',
          Namespace: 'CWAgent',
          Threshold: 80,
          ComparisonOperator: 'GreaterThanThreshold',
          EvaluationPeriods: 2,
          TreatMissingData: 'breaching',
        },
      });

      expect(Object.keys(diskAlarms)).toHaveLength(10);
    });

    test('should create CPU usage alarms for all instances', () => {
      const cpuAlarms = template.findResources('AWS::CloudWatch::Alarm', {
        Properties: {
          MetricName: 'CPUUtilization',
          Namespace: 'AWS/EC2',
          Threshold: 80,
          ComparisonOperator: 'GreaterThanThreshold',
          EvaluationPeriods: 2,
        },
      });

      expect(Object.keys(cpuAlarms)).toHaveLength(10);
    });

    test('should create memory usage alarms for all instances', () => {
      const memoryAlarms = template.findResources('AWS::CloudWatch::Alarm', {
        Properties: {
          MetricName: 'mem_used_percent',
          Namespace: 'CWAgent',
          Threshold: 80,
          ComparisonOperator: 'GreaterThanThreshold',
          EvaluationPeriods: 2,
          TreatMissingData: 'breaching',
        },
      });

      expect(Object.keys(memoryAlarms)).toHaveLength(10);
    });

    test('should configure alarms to send notifications to SNS topic', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmActions: [
          {
            Ref: Match.anyValue(),
          },
        ],
      });
    });
  });

  describe('CloudWatch Dashboard', () => {
    test('should create CloudWatch dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: Match.stringLikeRegexp(`ec2-monitoring-.*-${environmentSuffix}`),
        DashboardBody: Match.anyValue(),
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should create comprehensive outputs', () => {
      // VPC Output
      template.hasOutput('VpcId', {
        Description: 'VPC ID',
        Export: {
          Name: Match.anyValue(),
        },
      });

      // Security Group Output
      template.hasOutput('SecurityGroupId', {
        Description: 'EC2 Instance Security Group ID',
      });

      // IAM Role Output
      template.hasOutput('InstanceRoleArn', {
        Description: 'EC2 Instance Role ARN',
      });

      // S3 Bucket Outputs
      template.hasOutput('LogBucketName', {
        Description: 'S3 Bucket Name for Log Archives',
      });

      template.hasOutput('LogBucketArn', {
        Description: 'S3 Bucket ARN for Log Archives',
      });

      // Log Group Outputs
      template.hasOutput('SystemLogGroupName', {
        Description: 'CloudWatch Log Group Name for System Logs',
      });

      template.hasOutput('AppLogGroupName', {
        Description: 'CloudWatch Log Group Name for Application Logs',
      });

      // SNS Topic Output
      template.hasOutput('AlertTopicArn', {
        Description: 'SNS Topic ARN for Alerts',
      });

      // Dashboard Output
      template.hasOutput('DashboardUrl', {
        Description: 'CloudWatch Dashboard URL',
      });

      // Summary Output
      template.hasOutput('DeploymentSummary', {
        Description: 'Deployment Summary',
      });
    });

    test('should create instance-specific outputs', () => {
      for (let i = 0; i < 10; i++) {
        template.hasOutput(`InstanceId${i}`, {
          Description: `EC2 Instance ID ${i}`,
        });

        template.hasOutput(`InstancePublicIp${i}`, {
          Description: `EC2 Instance ${i} Public IP`,
        });
      }
    });
  });

  describe('Resource Tagging', () => {
    test('should apply consistent tagging across all resources', () => {
      const resourceTypes = [
        'AWS::EC2::VPC',
        'AWS::EC2::Instance',
        'AWS::EC2::SecurityGroup',
        'AWS::IAM::Role',
        'AWS::S3::Bucket',
        'AWS::Logs::LogGroup',
        'AWS::SNS::Topic',
        'AWS::CloudWatch::Alarm',
      ];

      resourceTypes.forEach(resourceType => {
        template.hasResourceProperties(resourceType, {
          Tags: Match.arrayWith([
            {
              Key: 'Environment',
              Value: environmentSuffix,
            },
          ]),
        });
      });
    });
  });

  describe('Stack Properties Validation', () => {
    test('should handle custom props correctly', () => {
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'CustomTapStack', {
        environmentSuffix: 'custom',
        instanceCount: 5,
        alertEmail: 'test@example.com',
        allowedHttpCidr: '10.0.0.0/8',
        allowedSshCidr: '192.168.1.0/24',
        logRetentionDays: 90,
        instanceType: 't3.small',
      });

      const customTemplate = Template.fromStack(customStack);

      // Check if custom instance count is respected
      customTemplate.resourceCountIs('AWS::EC2::Instance', 5);

      // Check if custom instance type is used
      customTemplate.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.small',
      });

      // Check if custom CIDR blocks are used
      customTemplate.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupIngress: Match.arrayWith([
          {
            CidrIp: '10.0.0.0/8',
            FromPort: 80,
            ToPort: 80,
          },
          {
            CidrIp: '192.168.1.0/24',
            FromPort: 22,
            ToPort: 22,
          },
        ]),
      });
    });
  });

  describe('Helper Methods', () => {
    test('should convert retention days correctly', () => {
      // Test the helper method with various retention day values
      const testCases = [
        { input: 1, expected: 'ONE_DAY' },
        { input: 7, expected: 'ONE_WEEK' },
        { input: 30, expected: 'ONE_MONTH' },
        { input: 90, expected: 'THREE_MONTHS' },
        { input: 365, expected: 'ONE_YEAR' },
        { input: 999, expected: 'ONE_MONTH' }, // Default case
      ];

      testCases.forEach(testCase => {
        const result = stack.getRetentionDays(testCase.input);
        expect(result.toString()).toContain(testCase.expected);
      });
    });
  });

  describe('Resource Count Validation', () => {
    test('should create expected number of resources', () => {
      // Verify total resource counts for comprehensive validation
      template.resourceCountIs('AWS::EC2::VPC', 1);
      template.resourceCountIs('AWS::EC2::SecurityGroup', 1);
      template.resourceCountIs('AWS::EC2::Instance', 10);
      template.resourceCountIs('AWS::IAM::Role', 1);
      template.resourceCountIs('AWS::IAM::Policy', 1);
      template.resourceCountIs('AWS::IAM::InstanceProfile', 1);
      template.resourceCountIs('AWS::S3::Bucket', 1);
      template.resourceCountIs('AWS::Logs::LogGroup', 2);
      template.resourceCountIs('AWS::SNS::Topic', 1);
      template.resourceCountIs('AWS::CloudWatch::Alarm', 30); // 10 instances * 3 alarms each
      template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
    });
  });
});