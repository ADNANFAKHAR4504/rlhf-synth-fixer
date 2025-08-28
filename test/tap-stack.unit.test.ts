import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix: 'test',
      env: { account: '123456789012', region: 'us-east-1' },
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('creates VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        Tags: Match.arrayWith([
          { Key: 'Environment', Value: 'production' },
          { Key: 'Project', Value: 'tap-secure-baseline' },
          { Key: 'Owner', Value: 'platform-team' },
        ]),
      });
    });

    test('creates public, private, and database subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 6); // 2 AZs * 3 subnet types
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
      });
    });

    test('creates NAT gateways for private subnet egress', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
    });

    test('creates internet gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });
  });

  describe('Security Groups', () => {
    test('creates EC2 security group with least privilege', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for EC2 instances',
        SecurityGroupEgress: [
          {
            CidrIp: '0.0.0.0/0',
            FromPort: 443,
            IpProtocol: 'tcp',
            ToPort: 443,
          },
          {
            CidrIp: '0.0.0.0/0',
            FromPort: 80,
            IpProtocol: 'tcp',
            ToPort: 80,
          },
        ],
      });
    });

    test('creates RDS security group with restricted access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for RDS database',
        SecurityGroupIngress: [
          {
            FromPort: 3306,
            IpProtocol: 'tcp',
            SourceSecurityGroupId: Match.anyValue(),
            ToPort: 3306,
          },
        ],
      });
    });
  });

  describe('KMS Encryption', () => {
    test('creates KMS key with rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'TAP encryption key',
        EnableKeyRotation: true,
        KeyPolicy: {
          Statement: Match.arrayWith([
            {
              Sid: 'Enable IAM User Permissions',
              Effect: 'Allow',
              Principal: { AWS: Match.anyValue() },
              Action: 'kms:*',
              Resource: '*',
            },
          ]),
        },
      });
    });
  });

  describe('S3 Buckets', () => {
    test('creates CloudTrail bucket with encryption and versioning', () => {
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

    test('creates Config bucket with encryption', () => {
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

    test('creates app bucket with S3 managed encryption', () => {
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

    test('enforces SSL for all buckets', () => {
      template.resourceCountIs('AWS::S3::BucketPolicy', 3);
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: [
            {
              Effect: 'Deny',
              Principal: { AWS: '*' },
              Action: 's3:*',
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'false',
                },
              },
            },
          ],
        },
      });
    });
  });

  describe('EC2 Instance', () => {
    test('creates EC2 instance in private subnet with encryption', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.micro',
        IamInstanceProfile: Match.anyValue(),
        SecurityGroupIds: [Match.anyValue()],
        BlockDeviceMappings: [
          {
            DeviceName: '/dev/xvda',
            Ebs: {
              Encrypted: true,
              VolumeSize: 20,
              VolumeType: 'gp3',
            },
          },
        ],
      });
    });

    test('creates IAM role with least privilege policies', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        },
        ManagedPolicyArns: [
          'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
          'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
        ],
      });
    });
  });

  describe('RDS Database', () => {
    test('creates MySQL database with encryption', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'mysql',
        EngineVersion: '8.0.35',
        DBInstanceClass: 'db.t3.micro',
        StorageEncrypted: true,
        KmsKeyId: Match.anyValue(),
        BackupRetentionPeriod: 7,
        DeletionProtection: true,
        MultiAZ: false,
      });
    });

    test('creates DB subnet group in isolated subnets', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupDescription: 'Subnet group for RDS database',
      });
    });
  });

  describe('CloudTrail', () => {
    test('creates CloudTrail with encryption and validation', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        IncludeGlobalServiceEvents: true,
        IsMultiRegionTrail: true,
        EnableLogFileValidation: true,
        KMSKeyId: Match.anyValue(),
      });
    });
  });

  describe('AWS Config', () => {
    test('creates configuration recorder', () => {
      template.hasResourceProperties('AWS::Config::ConfigurationRecorder', {
        Name: 'tap-config-recorder',
        RecordingGroup: {
          AllSupported: true,
          IncludeGlobalResourceTypes: true,
        },
      });
    });

    test('creates delivery channel', () => {
      template.hasResourceProperties('AWS::Config::DeliveryChannel', {
        Name: 'tap-config-delivery-channel',
        S3KeyPrefix: 'config',
      });
    });

    test('creates managed rules for compliance', () => {
      template.hasResourceProperties('AWS::Config::ConfigRule', {
        Source: {
          Owner: 'AWS',
          SourceIdentifier: 'MFA_ENABLED_FOR_IAM_CONSOLE_ACCESS',
        },
      });

      template.hasResourceProperties('AWS::Config::ConfigRule', {
        Source: {
          Owner: 'AWS',
          SourceIdentifier: 'S3_BUCKET_LEVEL_PUBLIC_ACCESS_PROHIBITED',
        },
      });

      template.hasResourceProperties('AWS::Config::ConfigRule', {
        Source: {
          Owner: 'AWS',
          SourceIdentifier: 'S3_BUCKET_SSL_REQUESTS_ONLY',
        },
      });

      template.hasResourceProperties('AWS::Config::ConfigRule', {
        Source: {
          Owner: 'AWS',
          SourceIdentifier: 'EBS_ENCRYPTED_VOLUMES',
        },
      });

      template.hasResourceProperties('AWS::Config::ConfigRule', {
        Source: {
          Owner: 'AWS',
          SourceIdentifier: 'RDS_STORAGE_ENCRYPTED',
        },
      });
    });
  });

  describe('IAM Groups and Policies', () => {
    test('creates admin group with administrator access', () => {
      template.hasResourceProperties('AWS::IAM::Group', {
        GroupName: 'TapAdministrators',
        ManagedPolicyArns: ['arn:aws:iam::aws:policy/AdministratorAccess'],
      });
    });

    test('creates developer group with limited permissions', () => {
      template.hasResourceProperties('AWS::IAM::Group', {
        GroupName: 'TapDevelopers',
      });

      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'ec2:Describe*',
                's3:GetObject',
                's3:PutObject',
                's3:ListBucket',
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLog*',
                'cloudwatch:GetMetricStatistics',
                'cloudwatch:ListMetrics',
                'cloudwatch:PutMetricData',
              ],
              Resource: '*',
            },
          ],
        },
      });
    });
  });

  describe('VPC Flow Logs', () => {
    test('creates VPC flow logs with encryption', () => {
      template.hasResourceProperties('AWS::EC2::FlowLog', {
        ResourceType: 'VPC',
        TrafficType: 'ALL',
        LogDestinationType: 'cloud-watch-logs',
      });

      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 365,
        KmsKeyId: Match.anyValue(),
      });
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('creates CPU alarm for EC2 instance', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/EC2',
        Threshold: 80,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
        EvaluationPeriods: 2,
      });
    });

    test('creates memory alarm for EC2 instance', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'mem_used_percent',
        Namespace: 'CWAgent',
        Threshold: 80,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
        EvaluationPeriods: 2,
      });
    });
  });

  describe('SSM Association', () => {
    test('creates CloudWatch agent association', () => {
      template.hasResourceProperties('AWS::SSM::Association', {
        Name: 'AmazonCloudWatch-ManageAgent',
        Targets: [
          {
            Key: 'InstanceIds',
            Values: [Match.anyValue()],
          },
        ],
        Parameters: {
          action: ['configure'],
          mode: ['ec2'],
          optionalConfigurationSource: ['ssm'],
          optionalConfigurationLocation: ['AmazonCloudWatch-linux'],
          optionalRestart: ['yes'],
        },
      });
    });
  });

  describe('Stack Outputs', () => {
    test('creates required outputs', () => {
      template.hasOutput('VpcId-test', {
        Description: 'VPC ID',
      });

      template.hasOutput('DatabaseEndpoint-test', {
        Description: 'RDS Database Endpoint',
      });

      template.hasOutput('AppBucketName-test', {
        Description: 'Application S3 Bucket Name',
      });
    });
  });

  describe('Resource Tagging', () => {
    test('applies consistent tags to all resources', () => {
      // Tags are now applied at the app level, so resources inherit them
      // Check that resources have tags (exact values depend on environment)
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          { Key: 'Environment', Value: Match.anyValue() },
        ]),
      });

      template.hasResourceProperties('AWS::S3::Bucket', {
        Tags: Match.arrayWith([
          { Key: 'Environment', Value: Match.anyValue() },
        ]),
      });

      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Tags: Match.arrayWith([
          { Key: 'Environment', Value: Match.anyValue() },
        ]),
      });
    });
  });
});
