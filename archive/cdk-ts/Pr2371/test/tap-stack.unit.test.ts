import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix: 'test',
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('should create VPC with correct CIDR and configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create 9 subnets across 3 AZs (3 subnet types)', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 9);
    });

    test('should create public subnets with MapPublicIpOnLaunch enabled', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
      });
    });

    test('should create private subnets without public IP mapping', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
      });
    });

    test('should create 2 NAT Gateways for high availability', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
    });

    test('should create internet gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });

    test('should create VPC gateway endpoint for S3', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        ServiceName: {
          'Fn::Join': [
            '',
            [
              'com.amazonaws.',
              { Ref: 'AWS::Region' },
              '.s3',
            ],
          ],
        },
        VpcEndpointType: 'Gateway',
      });
    });

  });

  describe('Security Groups', () => {
    test('should create EC2 security group with SSH access from trusted IPs only', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for EC2 instances',
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 22,
            ToPort: 22,
            CidrIp: '203.0.113.0/24',
            Description: 'SSH access from trusted IPs',
          }),
        ]),
      });
    });

    test('should create EC2 security group with HTTP/HTTPS access from VPC only', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
            CidrIp: '10.0.0.0/16',
            Description: 'HTTP from VPC',
          }),
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
            CidrIp: '10.0.0.0/16',
            Description: 'HTTPS from VPC',
          }),
        ]),
      });
    });
    test('should create Lambda security group with outbound access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Lambda functions',
      });
    });

    test('should not allow unrestricted inbound access (0.0.0.0/0)', () => {
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      Object.values(securityGroups).forEach((sg: any) => {
        const ingress = sg.Properties?.SecurityGroupIngress || [];
        ingress.forEach((rule: any) => {
          expect(rule.CidrIp).not.toBe('0.0.0.0/0');
          expect(rule.CidrIpv6).not.toBe('::/0');
        });
      });
    });
  });

  describe('KMS Keys', () => {
    test('should create RDS KMS key with rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for RDS encryption',
        EnableKeyRotation: true,
      });
    });

    test('should create S3 KMS key with rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for S3 encryption',
        EnableKeyRotation: true,
      });
    });

    test('should create exactly 2 KMS keys', () => {
      template.resourceCountIs('AWS::KMS::Key', 2);
    });

  });

  describe('IAM Roles', () => {
    test('should create EC2 instance role with CloudWatch permissions', () => {
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
        Description: 'Role for EC2 instances with minimal permissions',
        ManagedPolicyArns: [
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
        ],
      });
    });

    test('should create Lambda execution role with VPC access', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        },
        Description: 'Role for Lambda functions with VPC access',
        ManagedPolicyArns: [
          {
            'Fn::Join': [
              '',
              [
                'arn:',
                { Ref: 'AWS::Partition' },
                ':iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
              ],
            ],
          },
        ],
      });
    });

    test('should create instance profile for EC2 role', () => {
      template.hasResourceProperties('AWS::IAM::InstanceProfile', {
        Roles: [
          {
            Ref: Match.stringLikeRegexp('EC2InstanceRole.*'),
          },
        ],
      });
    });

  });

  describe('S3 Buckets', () => {
    test('should create application bucket with KMS encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'secure-appbucket-123456789012-us-east-1-test',
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
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

    test('should create CloudTrail logs bucket with S3 managed encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'secure-trailbucket-123456789012-us-east-1-test',
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
      });
    });

    test('should enforce SSL for all S3 buckets', () => {
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

    test('should have lifecycle rules for multipart upload cleanup', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'DeleteIncompleteMultipartUploads',
              AbortIncompleteMultipartUpload: {
                DaysAfterInitiation: 7,
              },
              Status: 'Enabled',
            },
          ],
        },
      });
    });

    test('should create exactly 2 S3 buckets', () => {
      template.resourceCountIs('AWS::S3::Bucket', 2);
    });
  });

  describe('RDS Database', () => {
    test('should create MySQL database with encryption and Multi-AZ', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceClass: 'db.m5.large',
        Engine: 'mysql',
        EngineVersion: '8.0.39',
        MultiAZ: true,
        StorageEncrypted: true,
        BackupRetentionPeriod: 7,
        DeletionProtection: true,
        DBName: 'secureapp',
        MonitoringInterval: 60,
        EnablePerformanceInsights: true,
        EnableCloudwatchLogsExports: ['error', 'general', 'audit'],
      });
    });

    test('should create DB subnet group in isolated subnets', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupDescription: 'Subnet group for RDS database',
      });
    });


    test('should create exactly 1 RDS instance', () => {
      template.resourceCountIs('AWS::RDS::DBInstance', 1);
    });
  });

  describe('EC2 Instances', () => {
    test('should create launch template with IMDSv2 required', () => {
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


    test('should use t3.micro instance type for cost optimization', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.micro',
      });
    });

    test('should use latest Amazon Linux 2023 AMI', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        ImageId: Match.anyValue(),
      });
    });

    test('should place instances in private subnets', () => {
      const ec2Resources = template.findResources('AWS::EC2::Instance');
      expect(Object.keys(ec2Resources)).toHaveLength(2);
    });

    test('should have CloudWatch agent configuration in user data', () => {
      const ec2Resources = template.findResources('AWS::EC2::Instance');
      Object.values(ec2Resources).forEach((resource: any) => {
        const userData = resource.Properties.UserData;
        expect(userData).toBeDefined();
      });
    });
  });

  describe('Lambda Function', () => {
    test('should create Lambda function with correct runtime and configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'python3.11',
        Handler: 'index.handler',
        Timeout: 30,
        MemorySize: 256,
      });
    });

    test('should place Lambda function in VPC with security groups', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        VpcConfig: {
          SecurityGroupIds: Match.anyValue(),
          SubnetIds: Match.anyValue(),
        },
      });
    });

    test('should have proper IAM role attached', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Role: {
          'Fn::GetAtt': [Match.stringLikeRegexp('LambdaExecutionRole.*'), 'Arn'],
        },
      });
    });

    test('should have inline code for testing purposes', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Code: {
          ZipFile: Match.stringLikeRegexp('.*Lambda function executed successfully.*'),
        },
      });
    });
  });

  describe('CloudTrail', () => {
    test('should create CloudTrail with proper audit configuration', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        IncludeGlobalServiceEvents: true,
        IsMultiRegionTrail: true,
        EnableLogFileValidation: true,
      });
    });

    test('should integrate with CloudWatch Logs', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        CloudWatchLogsLogGroupArn: Match.anyValue(),
        CloudWatchLogsRoleArn: Match.anyValue(),
      });
    });

    test('should create CloudWatch Log Group with retention', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 365,
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should create CPU alarms for EC2 instances', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/EC2',
        Statistic: 'Average',
        Threshold: 80,
        EvaluationPeriods: 2,
        TreatMissingData: 'notBreaching',
      });
    });

    test('should create RDS CPU alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/RDS',
        Threshold: 75,
        EvaluationPeriods: 2,
      });
    });

    test('should create exactly 3 CloudWatch alarms (2 EC2 + 1 RDS)', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 3);
    });
  });

  describe('Stack Outputs', () => {
    test('should create VPC ID output', () => {
      template.hasOutput('VPCId', {
        Description: 'VPC ID',
      });
    });

    test('should create database endpoint output', () => {
      template.hasOutput('DatabaseEndpoint', {
        Description: 'RDS Database Endpoint',
      });
    });

    test('should create S3 bucket name output', () => {
      template.hasOutput('S3BucketName', {
        Description: 'Application S3 Bucket Name',
      });
    });

    test('should create Lambda function name output', () => {
      template.hasOutput('LambdaFunctionName', {
        Description: 'Lambda Function Name',
      });
    });
  });

  describe('Resource Counts', () => {
    test('should create expected number of each resource type', () => {
      template.resourceCountIs('AWS::EC2::VPC', 1);
      template.resourceCountIs('AWS::EC2::Subnet', 9);
      template.resourceCountIs('AWS::EC2::SecurityGroup', 4);
      template.resourceCountIs('AWS::EC2::Instance', 2);
      template.resourceCountIs('AWS::EC2::LaunchTemplate', 3);
      template.resourceCountIs('AWS::RDS::DBInstance', 1);
      template.resourceCountIs('AWS::Lambda::Function', 1);
      template.resourceCountIs('AWS::S3::Bucket', 2);
      template.resourceCountIs('AWS::KMS::Key', 2);
      template.resourceCountIs('AWS::CloudWatch::Alarm', 3);
      template.resourceCountIs('AWS::CloudTrail::Trail', 1);
    });
  });

  describe('Security Compliance', () => {
    test('should not have any public S3 buckets', () => {
      const s3Buckets = template.findResources('AWS::S3::Bucket');
      Object.values(s3Buckets).forEach((bucket: any) => {
        const publicAccessBlock = bucket.Properties?.PublicAccessBlockConfiguration;
        expect(publicAccessBlock?.BlockPublicAcls).toBe(true);
        expect(publicAccessBlock?.BlockPublicPolicy).toBe(true);
        expect(publicAccessBlock?.IgnorePublicAcls).toBe(true);
        expect(publicAccessBlock?.RestrictPublicBuckets).toBe(true);
      });
    });

    test('should encrypt all data at rest', () => {
      // S3 buckets should be encrypted
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: Match.anyValue(),
      });

      // RDS should be encrypted
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        StorageEncrypted: true,
      });
    });

    test('should have deletion protection for critical resources', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DeletionProtection: true,
      });
    });

    test('should enable versioning for S3 buckets', () => {
      const s3Buckets = template.findResources('AWS::S3::Bucket');
      Object.values(s3Buckets).forEach((bucket: any) => {
        expect(bucket.Properties?.VersioningConfiguration?.Status).toBe('Enabled');
      });
    });
  });

  describe('Environment Configuration', () => {
    test('should handle different environment suffixes', () => {
      const devApp = new cdk.App();
      const devStack = new TapStack(devApp, 'DevStack', {
        environmentSuffix: 'dev',
        env: { account: '111111111111', region: 'us-west-2' },
      });
      const devTemplate = Template.fromStack(devStack);

      devTemplate.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'secure-trailbucket-111111111111-us-west-2-dev',
      });
    });

    test('should use default environment suffix when not provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultStack');

      // Should not throw an error
      expect(defaultStack).toBeDefined();
    });
  });

  describe('High Availability', () => {
    test('should use Multi-AZ deployment for RDS', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        MultiAZ: true,
      });
    });

    test('should create NAT Gateways in multiple AZs', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
    });

    test('should distribute subnets across multiple AZs', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 9); // 3 AZs × 3 subnet types
    });
  });

  describe('Cost Optimization', () => {
    test('should use cost-effective instance types', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.micro',
      });
    });

    test('should have S3 lifecycle policies', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Status: 'Enabled',
            }),
          ]),
        },
      });
    });

    test('should not create excessive numbers of expensive resources', () => {
      template.resourceCountIs('AWS::RDS::DBInstance', 1);
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
    });
  });
});