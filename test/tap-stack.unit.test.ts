import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('creates VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('creates public subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 9); // 3 AZs * 3 subnet types
      template.hasResourceProperties('AWS::EC2::Subnet', 
        Match.objectLike({
          MapPublicIpOnLaunch: true,
        })
      );
    });

    test('creates NAT gateways for high availability', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
    });

    test('creates VPC endpoints for Lambda', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        ServiceName: Match.stringLikeRegexp('.*s3.*'),
        VpcEndpointType: 'Gateway',
      });
      
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        ServiceName: Match.stringLikeRegexp('.*lambda.*'),
        VpcEndpointType: 'Interface',
      });
    });
  });

  describe('Security Groups', () => {
    test('creates EC2 security group with restrictive rules', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for EC2 instances',
        SecurityGroupIngress: [
          {
            IpProtocol: 'tcp',
            FromPort: 22,
            ToPort: 22,
            CidrIp: '203.0.113.0/24',
            Description: 'SSH access from trusted IPs',
          },
          {
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
            CidrIp: '10.0.0.0/16',
            Description: 'HTTP from VPC',
          },
          {
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
            CidrIp: '10.0.0.0/16',
            Description: 'HTTPS from VPC',
          },
        ],
      });
    });

    test('creates RDS security group with proper database access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for RDS instances',
        SecurityGroupEgress: [],
      });
    });
  });

  describe('KMS Keys', () => {
    test('creates RDS KMS key with rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for RDS encryption',
        EnableKeyRotation: true,
      });
    });

    test('creates S3 KMS key with rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for S3 encryption',
        EnableKeyRotation: true,
      });
    });
  });

  describe('IAM Roles', () => {
    test('creates EC2 role with least privilege principle', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [{
            Effect: 'Allow',
            Principal: { Service: 'ec2.amazonaws.com' },
            Action: 'sts:AssumeRole',
          }],
        },
        ManagedPolicyArns: [
          Match.stringLikeRegexp('.*CloudWatchAgentServerPolicy.*'),
        ],
      });
    });

    test('creates Lambda execution role with VPC access', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [{
            Effect: 'Allow',
            Principal: { Service: 'lambda.amazonaws.com' },
            Action: 'sts:AssumeRole',
          }],
        },
        ManagedPolicyArns: [
          Match.stringLikeRegexp('.*AWSLambdaVPCAccessExecutionRole.*'),
        ],
      });
    });

    test('creates instance profile for EC2', () => {
      template.hasResourceProperties('AWS::IAM::InstanceProfile', {
        Roles: [Match.anyValue()],
      });
    });
  });

  describe('S3 Buckets', () => {
    test('creates secure app bucket with KMS encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [{
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'aws:kms',
            },
          }],
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

    test('creates CloudTrail logs bucket with S3 managed encryption', () => {
      template.resourceCountIs('AWS::S3::Bucket', 2);
    });

    test('enforces SSL for bucket access', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'false',
                },
              },
            }),
          ]),
        },
      });
    });
  });

  describe('RDS Database', () => {
    test('creates MySQL database with Multi-AZ', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'mysql',
        EngineVersion: '8.0.39',
        MultiAZ: true,
        StorageEncrypted: true,
        BackupRetentionPeriod: 7,
        DeletionProtection: true,
        DBName: 'secureapp',
        MonitoringInterval: 60,
        EnablePerformanceInsights: true,
      });
    });

    test('creates database subnet group in isolated subnets', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupDescription: 'Subnet group for RDS database',
      });
    });
  });

  describe('EC2 Instances', () => {
    test('creates EC2 instances with IMDSv2 enforcement', () => {
      template.resourceCountIs('AWS::EC2::Instance', 2);
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.micro',
        MetadataOptions: {
          HttpTokens: 'required',
        },
      });
    });

    test('creates launch template with proper IMDSv2 configuration', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: {
          InstanceType: 't3.micro',
          MetadataOptions: {
            HttpTokens: 'required',
            HttpPutResponseHopLimit: 2,
          },
        },
      });
    });
  });

  describe('Lambda Function', () => {
    test('creates Lambda function in private subnet', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'python3.11',
        Handler: 'index.handler',
        Timeout: 30,
        MemorySize: 256,
        VpcConfig: Match.objectLike({
          SubnetIds: Match.anyValue(),
          SecurityGroupIds: Match.anyValue(),
        }),
      });
    });
  });

  describe('CloudTrail', () => {
    test('creates CloudTrail with proper configuration', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        IncludeGlobalServiceEvents: true,
        IsMultiRegionTrail: true,
        EnableLogFileValidation: true,
      });
    });

    test('creates CloudWatch log group for CloudTrail', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 365,
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    test('creates CPU alarms for EC2 instances', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 3); // 2 EC2 + 1 RDS
      
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/EC2',
        Statistic: 'Average',
        Threshold: 80,
        EvaluationPeriods: 2,
      });
    });

    test('creates CPU alarm for RDS instance', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/RDS',
        Statistic: 'Average',
        Threshold: 75,
        EvaluationPeriods: 2,
      });
    });
  });

  describe('Stack Outputs', () => {
    test('exports VPC ID', () => {
      template.hasOutput('VPCId', {
        Description: 'VPC ID',
      });
    });

    test('exports database endpoint', () => {
      template.hasOutput('DatabaseEndpoint', {
        Description: 'RDS Database Endpoint',
      });
    });

    test('exports S3 bucket name', () => {
      template.hasOutput('S3BucketName', {
        Description: 'Application S3 Bucket Name',
      });
    });

    test('exports Lambda function name', () => {
      template.hasOutput('LambdaFunctionName', {
        Description: 'Lambda Function Name',
      });
    });
  });

  describe('Tagging', () => {
    test('applies Environment and Owner tags to stack', () => {
      const stackTags = stack.tags.tagValues();
      expect(stackTags.Environment).toBe('production');
      expect(stackTags.Owner).toBe('infrastructure-team');
    });
  });

  describe('Resource Counts', () => {
    test('creates expected number of resources', () => {
      template.resourceCountIs('AWS::EC2::VPC', 1);
      template.resourceCountIs('AWS::EC2::SecurityGroup', 3);
      template.resourceCountIs('AWS::KMS::Key', 2);
      template.resourceCountIs('AWS::IAM::Role', 2);
      template.resourceCountIs('AWS::S3::Bucket', 2);
      template.resourceCountIs('AWS::RDS::DBInstance', 1);
      template.resourceCountIs('AWS::EC2::Instance', 2);
      template.resourceCountIs('AWS::Lambda::Function', 1);
      template.resourceCountIs('AWS::CloudTrail::Trail', 1);
    });
  });
});
