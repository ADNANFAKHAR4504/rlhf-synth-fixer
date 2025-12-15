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

  describe('IAM Roles and Policies', () => {
    test('should create EC2 role with correct configuration', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `${environmentSuffix}-ec2-role`,
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
      });
    });

    test('should create instance profile for EC2 role', () => {
      template.hasResourceProperties('AWS::IAM::InstanceProfile', {
        InstanceProfileName: `${environmentSuffix}-instance-profile`,
      });
    });

    test('should create IAM user with ReadOnly access', () => {
      template.hasResourceProperties('AWS::IAM::User', {
        UserName: `${environmentSuffix}-app-user`,
        ManagedPolicyArns: [
          {
            'Fn::Join': [
              '',
              [
                'arn:',
                { Ref: 'AWS::Partition' },
                ':iam::aws:policy/ReadOnlyAccess',
              ],
            ],
          },
        ],
      });
    });

    test('should create MFA policy with correct statements', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyName: `${environmentSuffix}-mfa-policy`,
      });
    });

    test('should create key rotation role for Lambda', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `${environmentSuffix}-key-rotation-role`,
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
      });
    });
  });

  describe('S3 Bucket Policies', () => {
    test('should have S3 bucket with lifecycle rules', () => {
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

    test('should have S3 bucket with public access blocked', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          IgnorePublicAcls: true,
        },
      });
    });

    test('should create S3 bucket policy to deny public PUT actions', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: [
            {
              Sid: 'DenyPublicPutActions',
              Effect: 'Deny',
              Principal: {
                AWS: '*',
              },
              Action: [
                's3:PutObject',
                's3:PutObjectAcl',
                's3:PutObjectVersionAcl',
              ],
            },
          ],
        },
      });
    });
  });

  describe('RDS Subnet Group', () => {
    test('should create RDS subnet group with correct configuration', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupName: `${environmentSuffix}-rds-subnet-group`,
        DBSubnetGroupDescription: 'Subnet group for RDS instances',
      });
    });
  });

  describe('WAF Web ACL Association', () => {
    test('should create WAF Web ACL association with ALB', () => {
      template.resourceCountIs('AWS::WAFv2::WebACLAssociation', 1);
    });
  });

  describe('SNS Topic Policies', () => {
    test('should have SNS topic policy with all service permissions', () => {
      template.hasResourceProperties('AWS::SNS::TopicPolicy', {
        PolicyDocument: {
          Statement: [
            {
              Sid: 'AllowCloudWatchPublish',
              Effect: 'Allow',
              Principal: {
                Service: 'cloudwatch.amazonaws.com',
              },
              Action: 'sns:Publish',
            },
            {
              Sid: 'AllowEventsPublish',
              Effect: 'Allow',
              Principal: {
                Service: 'events.amazonaws.com',
              },
              Action: 'sns:Publish',
            },
            {
              Sid: 'AllowLambdaPublish',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
              Action: 'sns:Publish',
            },
          ],
        },
      });
    });
  });

  describe('GuardDuty Configuration', () => {
    test('should create GuardDuty detector with correct data sources', () => {
      template.hasResourceProperties('AWS::GuardDuty::Detector', {
        Enable: true,
        FindingPublishingFrequency: 'FIFTEEN_MINUTES',
        DataSources: {
          S3Logs: { Enable: true },
          Kubernetes: {
            AuditLogs: { Enable: true },
          },
          MalwareProtection: {
            ScanEc2InstanceWithFindings: {
              EbsVolumes: true,
            },
          },
        },
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should create all required outputs', () => {
      template.hasOutput('VpcId', {
        Description: 'VPC ID',
      });

      template.hasOutput('KmsKeyId', {
        Description: 'KMS Key ID for encryption',
      });

      template.hasOutput('S3BucketName', {
        Description: 'Secure S3 Bucket Name',
      });

      template.hasOutput('RdsEndpoint', {
        Description: 'RDS Instance Endpoint',
      });

      template.hasOutput('LoadBalancerDns', {
        Description: 'Application Load Balancer DNS Name',
      });

      template.hasOutput('WebAclArn', {
        Description: 'WAF Web ACL ARN',
      });

      template.hasOutput('GuardDutyDetectorId', {
        Description: 'GuardDuty Detector ID',
      });

      template.hasOutput('SnsTopicArn', {
        Description: 'SNS Topic ARN for notifications',
      });
    });
  });

  describe('Environment-specific Configuration', () => {
    test('should configure production settings for prod environment', () => {
      const prodApp = new cdk.App();
      const prodStack = new TapStack(prodApp, 'TestTapStackProd', { environment: 'prod' });
      const prodTemplate = Template.fromStack(prodStack);

      // Production should have deletion protection enabled
      prodTemplate.hasResourceProperties('AWS::RDS::DBInstance', {
        DeletionProtection: true,
        MultiAZ: true,
      });
    });

    test('should configure development settings for dev environment', () => {
      const devApp = new cdk.App();
      const devStack = new TapStack(devApp, 'TestTapStackDev', { environment: 'dev' });
      const devTemplate = Template.fromStack(devStack);

      // Development should have deletion protection disabled
      devTemplate.hasResourceProperties('AWS::RDS::DBInstance', {
        DeletionProtection: false,
        MultiAZ: false,
      });
    });
  });

  describe('Security Group Rules', () => {
    test('should add SSH rules for allowed IPs', () => {
      const appWithSsh = new cdk.App();
      const stackWithSsh = new TapStack(appWithSsh, 'TestTapStackSSH', { 
        environment: environmentSuffix,
        allowedSshIps: ['10.0.0.1/32', '192.168.1.0/24']
      });
      const templateWithSsh = Template.fromStack(stackWithSsh);

      // Should create security group with SSH ingress rules
      templateWithSsh.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: `${environmentSuffix}-ec2-sg`,
        SecurityGroupIngress: [
          {
            IpProtocol: 'tcp',
            FromPort: 22,
            ToPort: 22,
            CidrIp: '10.0.0.1/32',
            Description: 'SSH access from allowed IP 1',
          },
          {
            IpProtocol: 'tcp',
            FromPort: 22,
            ToPort: 22,
            CidrIp: '192.168.1.0/24',
            Description: 'SSH access from allowed IP 2',
          },
        ],
      });
    });

    test('should create ALB security group with HTTP and HTTPS rules', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: `${environmentSuffix}-alb-sg`,
        SecurityGroupIngress: [
          {
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
            CidrIp: '0.0.0.0/0',
            Description: 'HTTP traffic',
          },
          {
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
            CidrIp: '0.0.0.0/0',
            Description: 'HTTPS traffic',
          },
        ],
      });
    });

    test('should create RDS security group with correct name', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: `${environmentSuffix}-rds-sg`,
        GroupDescription: 'Security group for RDS instances',
      });
    });

    test('should create security group ingress rule for RDS MySQL access', () => {
      template.resourceCountIs('AWS::EC2::SecurityGroupIngress', 1);
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 3306,
        ToPort: 3306,
        Description: 'MySQL access from EC2',
      });
    });
  });

  describe('VPC Configuration', () => {
    test('should create VPC with correct subnet configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create public and private subnets', () => {
      // Check for public subnets
      template.resourceCountIs('AWS::EC2::Subnet', 4); // 2 public + 2 private

      // Check for NAT Gateway
      template.resourceCountIs('AWS::EC2::NatGateway', 1);

      // Check for Internet Gateway
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
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
      template.resourceCountIs('AWS::IAM::Role', 2);
      template.resourceCountIs('AWS::IAM::User', 1);
      template.resourceCountIs('AWS::IAM::Policy', 3);
      template.resourceCountIs('AWS::IAM::InstanceProfile', 1);
    });
  });
});
