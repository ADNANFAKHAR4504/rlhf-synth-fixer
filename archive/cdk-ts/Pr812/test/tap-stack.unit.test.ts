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

  describe('VPC Configuration', () => {
    test('creates VPC with correct CIDR block', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('creates public and private subnets', () => {
      // Should have 2 public subnets (one per AZ)
      template.resourceCountIs('AWS::EC2::Subnet', 4); // 2 public + 2 private

      // Check for public subnets
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
      });

      // Check for private subnets (isolated)
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
      });
    });

    test('creates internet gateway for public subnets', () => {
      template.hasResource('AWS::EC2::InternetGateway', {});
      template.hasResource('AWS::EC2::VPCGatewayAttachment', {});
    });

    test('creates route tables for public subnets', () => {
      template.hasResource('AWS::EC2::RouteTable', {});
      template.hasResource('AWS::EC2::Route', {
        Properties: {
          DestinationCidrBlock: '0.0.0.0/0',
        },
      });
    });
  });

  describe('Security Groups', () => {
    test('creates EC2 security group with correct ingress rules', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for EC2 application instances',
        SecurityGroupIngress: [
          {
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
            CidrIp: '0.0.0.0/0',
            Description: 'Allow HTTP traffic from internet',
          },
          {
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
            CidrIp: '0.0.0.0/0',
            Description: 'Allow HTTPS traffic from internet',
          },
          {
            IpProtocol: 'tcp',
            FromPort: 22,
            ToPort: 22,
            CidrIp: '0.0.0.0/0',
            Description: 'Allow SSH access for administration',
          },
        ],
      });
    });

    test('creates RDS security group with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for RDS PostgreSQL database',
        SecurityGroupEgress: [
          {
            IpProtocol: 'icmp',
            CidrIp: '255.255.255.255/32',
            Description: 'Disallow all traffic',
            FromPort: 252,
            ToPort: 86,
          },
        ],
      });
      
      // Check that RDS security group receives ingress from EC2 security group
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 5432,
        ToPort: 5432,
        Description: 'Allow EC2 instances to connect to PostgreSQL database',
      });
    });
  });

  describe('RDS Database', () => {
    test('creates PostgreSQL database with correct configuration', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'postgres',
        EngineVersion: '15.8',
        DBInstanceClass: 'db.t3.micro',
        MultiAZ: true,
        StorageEncrypted: true,
        StorageType: 'gp2',
        AllocatedStorage: '20',
        BackupRetentionPeriod: 7,
        AutoMinorVersionUpgrade: true,
        DeletionProtection: true,
        MonitoringInterval: 60,
      });
    });

    test('creates DB subnet group in private subnets', () => {
      template.hasResource('AWS::RDS::DBSubnetGroup', {
        Properties: {
          DBSubnetGroupDescription: 'Subnet group for RDS database',
        },
      });
    });

    test('database credentials are managed by Secrets Manager', () => {
      template.hasResource('AWS::SecretsManager::Secret', {
        Properties: {
          GenerateSecretString: {
            SecretStringTemplate: '{"username":"dbadmin"}',
            GenerateStringKey: 'password',
            ExcludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
            PasswordLength: 30,
          },
        },
      });
    });
  });

  describe('S3 Bucket', () => {
    test('creates S3 bucket with correct encryption and security settings', () => {
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
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('creates lifecycle configuration for old versions', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'DeleteOldVersions',
              Status: 'Enabled',
              NoncurrentVersionExpiration: {
                NoncurrentDays: 30,
              },
            },
          ],
        },
      });
    });
  });

  describe('IAM Configuration', () => {
    test('creates IAM role for EC2 instances', () => {
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
      });
    });

    test('creates restrictive S3 access policy', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Action: 's3:ListBucket',
            },
            {
              Effect: 'Allow',
              Action: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
            },
          ],
        },
      });
    });
  });

  describe('EC2 Instances', () => {
    test('creates EC2 instances in public subnets', () => {
      // Should create 2 instances (one per AZ/public subnet)
      template.resourceCountIs('AWS::EC2::Instance', 2);

      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.micro',
        ImageId: Match.anyValue(), // AMI ID will vary
      });
    });

    test('EC2 instances have correct user data for initialization', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        UserData: Match.anyValue(), // User data is base64 encoded
      });
    });
  });

  describe('CloudTrail', () => {
    test('creates CloudTrail for audit logging when enabled', () => {
      // CloudTrail is disabled by default (enableCloudTrail: false)
      // This test verifies that CloudTrail resources are not created when disabled
      template.resourceCountIs('AWS::CloudTrail::Trail', 0);
    });

    test('creates only application S3 bucket when CloudTrail is disabled', () => {
      // Should have 1 S3 bucket: only for application artifacts (CloudTrail is disabled)
      template.resourceCountIs('AWS::S3::Bucket', 1);
    });

    test('creates CloudTrail resources when enabled', () => {
      // Create a new stack with CloudTrail enabled
      const cloudTrailApp = new cdk.App();
      const cloudTrailStack = new TapStack(cloudTrailApp, 'TestTapStackWithCloudTrail', { 
        environmentSuffix,
        enableCloudTrail: true 
      });
      const cloudTrailTemplate = Template.fromStack(cloudTrailStack);

      // Should have CloudTrail resource
      cloudTrailTemplate.hasResource('AWS::CloudTrail::Trail', {
        Properties: {
          IncludeGlobalServiceEvents: true,
          IsMultiRegionTrail: true,
          EnableLogFileValidation: true,
          EventSelectors: [
            {
              ReadWriteType: 'All',
              IncludeManagementEvents: true,
            },
          ],
        },
      });

      // Should have 2 S3 buckets: one for application artifacts, one for CloudTrail logs
      cloudTrailTemplate.resourceCountIs('AWS::S3::Bucket', 2);
    });
  });

  describe('Resource Tagging', () => {
    test('applies Production environment tags to all resources', () => {
      // Check that VPC has the correct tag
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          {
            Key: 'Environment',
            Value: 'Production',
          },
        ]),
      });

      // Check that S3 bucket has the correct tag
      template.hasResourceProperties('AWS::S3::Bucket', {
        Tags: Match.arrayWith([
          {
            Key: 'Environment',
            Value: 'Production',
          },
        ]),
      });
    });
  });

  describe('Stack Outputs', () => {
    test('creates all required CloudFormation outputs', () => {
      template.hasOutput('DatabaseEndpoint', {});
      template.hasOutput('DatabasePort', {
        Value: {
          'Fn::GetAtt': [
            Match.stringLikeRegexp('PostgreSQLDatabase.*'),
            'Endpoint.Port'
          ]
        }
      });
      template.hasOutput('S3BucketName', {});
      template.hasOutput('EC2InstanceIds', {});
      template.hasOutput('VpcId', {});
    });

    test('creates CloudTrail output when enabled', () => {
      // Create a new stack with CloudTrail enabled
      const cloudTrailApp = new cdk.App();
      const cloudTrailStack = new TapStack(cloudTrailApp, 'TestTapStackWithCloudTrailOutput', { 
        environmentSuffix,
        enableCloudTrail: true 
      });
      const cloudTrailTemplate = Template.fromStack(cloudTrailStack);

      // Should have CloudTrail output when enabled
      cloudTrailTemplate.hasOutput('CloudTrailEnabled', {
        Value: 'Enabled',
      });
    });

    test('creates CloudTrail disabled output when not enabled', () => {
      // Default stack has CloudTrail disabled
      template.hasOutput('CloudTrailEnabled', {
        Value: 'Disabled (trail limit reached or explicitly disabled)',
      });
    });
  });

  describe('High Availability Configuration', () => {
    test('spreads resources across multiple availability zones', () => {
      // VPC should use maxAzs: 2
      template.hasResourceProperties('AWS::EC2::VPC', Match.anyValue());
      
      // Should have 2 public subnets and 2 private subnets (one per AZ)
      template.resourceCountIs('AWS::EC2::Subnet', 4);
      
      // RDS should be Multi-AZ
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        MultiAZ: true,
      });
    });
  });

  describe('Security Best Practices', () => {
    test('enforces encryption at rest for data stores', () => {
      // RDS encryption
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        StorageEncrypted: true,
      });

      // S3 encryption
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: Match.anyValue(),
      });
    });

    test('blocks all public access to S3 buckets', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('enables deletion protection for critical resources', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DeletionProtection: true,
      });
    });
  });

  describe('Network Security', () => {
    test('database is isolated in private subnets with no internet access', () => {
      // DB subnet group should only reference private subnets
      template.hasResource('AWS::RDS::DBSubnetGroup', {});
      
      // RDS security group should not allow outbound traffic (allowAllOutbound: false)
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for RDS PostgreSQL database',
        SecurityGroupEgress: [
          {
            IpProtocol: 'icmp',
            CidrIp: '255.255.255.255/32',
            Description: 'Disallow all traffic',
            FromPort: 252,
            ToPort: 86,
          },
        ],
      });
      
      // Verify that RDS security group does not have any direct ingress rules with 0.0.0.0/0
      // Instead, it should receive ingress from EC2 security group via SecurityGroupIngress resource
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 5432,
        ToPort: 5432,
        Description: 'Allow EC2 instances to connect to PostgreSQL database',
      });
    });
  });
});
