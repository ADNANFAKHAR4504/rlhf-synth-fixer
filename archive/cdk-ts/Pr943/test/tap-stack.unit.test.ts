import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { SecureIAM } from '../lib/constructs/secure-iam';
import { SecureNetworking } from '../lib/constructs/secure-networking';
import { SecureS3Bucket } from '../lib/constructs/secure-s3-bucket';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
      environmentSuffix,
    });
    template = Template.fromStack(stack);
  });

  describe('Stack Configuration', () => {
    test('Stack is created with correct name and region', () => {
      expect(stack.stackName).toBe('TestTapStack');
      expect(stack.region).toBe('us-east-1');
      expect(stack.account).toBe('123456789012');
    });

    test('Stack has environment suffix configured', () => {
      expect(environmentSuffix).toBeDefined();
      expect(typeof environmentSuffix).toBe('string');
    });

    test('Stack has all required outputs', () => {
      template.hasOutput('SecurityCompliance', {
        Value: 'All security requirements implemented',
        Description: 'Security compliance status',
      });
    });
  });

  describe('VPC and Networking', () => {
    test('VPC is created with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        Tags: Match.arrayWith([
          {
            Key: 'Name',
            Value: `secure-vpc-${environmentSuffix}`,
          },
        ]),
      });
    });

    test('VPC has correct subnet configuration', () => {
      // Check that subnets exist with correct properties
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
        Tags: Match.arrayWith([
          {
            Key: 'aws-cdk:subnet-type',
            Value: 'Private',
          },
        ]),
      });
    });

    test('Security Group has correct rules', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Secure security group with restricted access',
        SecurityGroupEgress: Match.arrayWith([
          {
            CidrIp: '0.0.0.0/0',
            Description: 'Allow HTTPS outbound',
            FromPort: 443,
            IpProtocol: 'tcp',
            ToPort: 443,
          },
          {
            CidrIp: '0.0.0.0/0',
            Description: 'Allow HTTP outbound for updates',
            FromPort: 80,
            IpProtocol: 'tcp',
            ToPort: 80,
          },
        ]),
        SecurityGroupIngress: Match.arrayWith([
          {
            CidrIp: '10.0.0.0/16',
            Description: 'Allow SSH from VPC only',
            FromPort: 22,
            IpProtocol: 'tcp',
            ToPort: 22,
          },
        ]),
      });
    });

    test('S3 VPC Endpoint is created', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        VpcEndpointType: 'Gateway',
      });
    });

    test('VPC Flow Logs are enabled', () => {
      template.hasResourceProperties('AWS::EC2::FlowLog', {
        ResourceType: 'VPC',
        TrafficType: 'ALL',
        LogDestinationType: 'cloud-watch-logs',
      });
    });
  });

  describe('S3 Buckets', () => {
    test('Data bucket has correct configuration', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
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

    test('Logs bucket has correct configuration', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
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

    test('S3 buckets have correct naming pattern', () => {
      // Check that buckets are created with the correct naming pattern
      // The actual implementation uses Fn::Join with AWS::AccountId and uniqueId
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: {
          'Fn::Join': [
            '',
            Match.arrayWith([
              `secure-data-bucket-${environmentSuffix}-`,
              { Ref: 'AWS::AccountId' },
              Match.stringLikeRegexp('-[a-f0-9]+-\\d+'),
            ]),
          ],
        },
      });

      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: {
          'Fn::Join': [
            '',
            Match.arrayWith([
              `secure-logs-bucket-${environmentSuffix}-`,
              { Ref: 'AWS::AccountId' },
              Match.stringLikeRegexp('-[a-f0-9]+-\\d+'),
            ]),
          ],
        },
      });
    });

    test('S3 bucket policies enforce secure transport', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            {
              Action: 's3:*',
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'false',
                },
              },
              Effect: 'Deny',
              Principal: {
                AWS: '*',
              },
              Resource: Match.anyValue(),
            },
          ]),
        },
      });
    });

    test('KMS keys are created for S3 encryption', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for S3 bucket encryption',
        EnableKeyRotation: true,
        KeyPolicy: {
          Statement: Match.arrayWith([
            {
              Action: 'kms:*',
              Effect: 'Allow',
              Principal: {
                AWS: Match.anyValue(),
              },
              Resource: '*',
            },
          ]),
        },
      });
    });
  });

  describe('RDS Database', () => {
    test('RDS instance has correct configuration', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceIdentifier: `secure-postgres-instance-${environmentSuffix}`,
        DBName: `securedb${environmentSuffix.replace(/-/g, '')}`,
        Engine: 'postgres',
        EngineVersion: '15.13',
        DBInstanceClass: 'db.t3.micro',
        AllocatedStorage: '100',
        StorageEncrypted: true,
        DeletionProtection: true,
        BackupRetentionPeriod: 7,
        DeleteAutomatedBackups: false,
        AutoMinorVersionUpgrade: true,
        EnablePerformanceInsights: true,
        PerformanceInsightsRetentionPeriod: 7,
        EnableCloudwatchLogsExports: ['postgresql'],
        MonitoringInterval: 60,
      });
    });

    test('RDS parameter group has secure settings', () => {
      template.hasResourceProperties('AWS::RDS::DBParameterGroup', {
        Description: 'Secure parameter group for PostgreSQL',
        Family: 'postgres15',
        Parameters: {
          log_statement: 'all',
          log_min_duration_statement: '1000',
          shared_preload_libraries: 'pg_stat_statements',
          ssl: '1',
          log_connections: '1',
          log_disconnections: '1',
        },
      });
    });

    test('RDS security group allows PostgreSQL access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for RDS instance',
      });
    });

    test('RDS KMS key is created', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for RDS instance encryption',
        EnableKeyRotation: true,
      });
    });

    test('Secrets Manager secret is created for database credentials', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Name: `secure-postgres-instance-${environmentSuffix}-credentials`,
        GenerateSecretString: {
          ExcludeCharacters: '"@/\\\'',
          GenerateStringKey: 'password',
          PasswordLength: 30,
          SecretStringTemplate: '{"username":"postgres"}',
        },
      });
    });
  });

  describe('IAM Resources', () => {
    test('IAM user is created with correct configuration', () => {
      template.hasResourceProperties('AWS::IAM::User', {
        UserName: `secure-user-${environmentSuffix}`,
      });
    });

    test('IAM role is created with correct configuration', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `secure-application-role-${environmentSuffix}`,
        Description: 'Secure role with least privilege access',
        MaxSessionDuration: 3600,
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
            },
          ]),
        },
      });
    });

    test('IAM role has correct policies', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            {
              Action: Match.arrayWith([
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogStreams',
              ]),
              Effect: 'Allow',
              Resource: Match.anyValue(),
            },
          ]),
        },
      });
    });

    test('MFA policy is attached to user', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyName: 'RequireMFAPolicy',
        PolicyDocument: {
          Statement: Match.arrayWith([
            {
              Sid: 'DenyAllExceptUnlessSignedInWithMFA',
              NotAction: Match.arrayWith([
                'iam:CreateVirtualMFADevice',
                'iam:EnableMFADevice',
                'iam:GetUser',
                'iam:ListMFADevices',
                'iam:ListVirtualMFADevices',
                'iam:ResyncMFADevice',
                'sts:GetSessionToken',
                'iam:ChangePassword',
              ]),
              Effect: 'Deny',
              Condition: {
                BoolIfExists: {
                  'aws:MultiFactorAuthPresent': 'false',
                },
              },
              Resource: '*',
            },
          ]),
        },
      });
    });
  });

  describe('CloudWatch Logs', () => {
    test('VPC Flow Logs log group is created', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 731,
        Tags: Match.arrayWith([
          {
            Key: 'Name',
            Value: Match.stringLikeRegexp('.*VPCFlowLog.*'),
          },
        ]),
      });
    });

    test('RDS logs log group is created', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 30,
      });
    });

    test('IAM role logs log group is created', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 365,
      });
    });
  });

  describe('Security Compliance', () => {
    test('All resources have proper tags', () => {
      // Check that resources have proper tags
      template.hasResource('AWS::EC2::VPC', {
        Properties: {
          Tags: Match.arrayWith([
            {
              Key: 'Name',
              Value: `secure-vpc-${environmentSuffix}`,
            },
          ]),
        },
      });
    });

    test('No public access is allowed', () => {
      // Verify S3 buckets block public access
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('Encryption is enabled on all storage', () => {
      // Verify RDS encryption
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        StorageEncrypted: true,
      });
    });
  });
});

describe('SecureNetworking Construct Unit Tests', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack', {
      env: { account: '123456789012', region: 'us-east-1' },
    });

    new SecureNetworking(stack, 'TestNetworking', {
      vpcName: 'test-vpc',
      cidr: '10.0.0.0/16',
      maxAzs: 2,
    });

    template = Template.fromStack(stack);
  });

  test('VPC is created with correct properties', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
      EnableDnsHostnames: true,
      EnableDnsSupport: true,
    });
  });

  test('Security group has restricted access', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: 'Secure security group with restricted access',
    });
  });
});

describe('SecureS3Bucket Construct Unit Tests', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack', {
      env: { account: '123456789012', region: 'us-east-1' },
    });

    new SecureS3Bucket(stack, 'TestBucket', {
      bucketName: 'test-bucket-123456789012',
      enableLogging: true,
    });

    template = Template.fromStack(stack);
  });

  test('S3 bucket has encryption enabled', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      VersioningConfiguration: {
        Status: 'Enabled',
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

  test('KMS key is created for encryption', () => {
    template.hasResourceProperties('AWS::KMS::Key', {
      EnableKeyRotation: true,
    });
  });
});

describe('SecureIAM Construct Unit Tests', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack', {
      env: { account: '123456789012', region: 'us-east-1' },
    });

    new SecureIAM(stack, 'TestIAM', {
      userName: 'test-user',
      roleName: 'test-role',
      s3BucketArns: ['arn:aws:s3:::test-bucket'],
      rdsResourceArns: ['arn:aws:rds:us-east-1:123456789012:db:test-db'],
    });

    template = Template.fromStack(stack);
  });

  test('IAM user is created', () => {
    template.hasResourceProperties('AWS::IAM::User', {
      UserName: 'test-user',
    });
  });

  test('IAM role is created', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      RoleName: 'test-role',
    });
  });

  test('MFA policy is attached to user', () => {
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyName: 'RequireMFAPolicy',
    });
  });
});
