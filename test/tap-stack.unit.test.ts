import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

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

    test('creates 2 public subnets across 2 AZs', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 4);
      
      // Check for public subnets
      const publicSubnets = template.findResources('AWS::EC2::Subnet', {
        Properties: {
          MapPublicIpOnLaunch: true,
        },
      });
      expect(Object.keys(publicSubnets).length).toBe(2);
    });

    test('creates 2 private subnets across 2 AZs', () => {
      // Check for private subnets
      const privateSubnets = template.findResources('AWS::EC2::Subnet', {
        Properties: {
          MapPublicIpOnLaunch: false,
        },
      });
      expect(Object.keys(privateSubnets).length).toBe(2);
    });

    test('creates Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });

    test('creates 2 NAT Gateways for high availability', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
    });

    test('creates 2 Elastic IPs for NAT Gateways', () => {
      template.resourceCountIs('AWS::EC2::EIP', 2);
    });
  });

  describe('Security Groups', () => {
    test('creates web security group with HTTP and HTTPS access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for web servers',
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
            CidrIp: '0.0.0.0/0',
          }),
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
            CidrIp: '0.0.0.0/0',
          }),
        ]),
      });
    });

    test('creates SSH security group with VPC-only access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for SSH access',
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 22,
            ToPort: 22,
            Description: 'Allow SSH from VPC',
          }),
        ]),
      });
    });

    test('creates RDS security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for RDS instances',
      });
    });
  });

  describe('Encryption and Security', () => {
    test('creates KMS key with rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for encrypting resources',
        EnableKeyRotation: true,
      });
    });

    test('creates KMS key alias', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: `alias/infrastructure-key-${environmentSuffix}`,
      });
    });
  });

  describe('S3 Bucket', () => {
    test('creates S3 bucket with encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: Match.objectLike({
                SSEAlgorithm: 'aws:kms',
              }),
            }),
          ]),
        },
      });
    });

    test('S3 bucket has versioning enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('S3 bucket has lifecycle rules', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'DeleteOldLogs',
              Status: 'Enabled',
              ExpirationInDays: 30,
            }),
          ]),
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

  describe('IAM Roles', () => {
    test('creates EC2 role with least privilege', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: Match.objectLike({
                Service: 'ec2.amazonaws.com',
              }),
              Action: 'sts:AssumeRole',
            }),
          ]),
        }),
        Description: 'IAM role for EC2 instances with least privilege',
      });
    });

    test('creates Lambda execution role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: Match.objectLike({
                Service: 'lambda.amazonaws.com',
              }),
              Action: 'sts:AssumeRole',
            }),
          ]),
        }),
        Description: 'IAM role for Lambda functions with least privilege',
      });
    });

    test('creates EC2 instance profile', () => {
      template.resourceCountIs('AWS::IAM::InstanceProfile', 2);
    });
  });

  describe('RDS Database', () => {
    test('creates RDS MySQL instance', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'mysql',
        StorageEncrypted: true,
        DeletionProtection: false,
        BackupRetentionPeriod: 7,
      });
    });

    test('creates RDS subnet group for private subnets', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupDescription: 'Subnet group for RDS instances in private subnets',
      });
    });

    test('creates Secrets Manager secret for RDS credentials', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        GenerateSecretString: Match.objectLike({
          SecretStringTemplate: '{"username":"admin"}',
          ExcludeCharacters: '"@/\\',
        }),
      });
    });
  });

  describe('EC2 Launch Template', () => {
    test('creates launch template with encrypted EBS volumes', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: Match.objectLike({
          BlockDeviceMappings: Match.arrayWith([
            Match.objectLike({
              DeviceName: '/dev/xvda',
              Ebs: Match.objectLike({
                Encrypted: true,
                VolumeSize: 20,
                VolumeType: 'gp3',
                DeleteOnTermination: true,
              }),
            }),
          ]),
          InstanceType: 't3.micro',
        }),
      });
    });
  });

  describe('Tags', () => {
    test('applies tags to resources', () => {
      // Check VPC has tags - using anyValue since order may vary
      const vpcResources = template.findResources('AWS::EC2::VPC');
      const vpcTags = Object.values(vpcResources)[0].Properties.Tags;
      
      const tagKeys = vpcTags.map((tag: any) => tag.Key);
      expect(tagKeys).toContain('Project');
      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('ManagedBy');
      expect(tagKeys).toContain('CostCenter');
    });
  });

  describe('CloudFormation Outputs', () => {
    test('exports VPC ID', () => {
      template.hasOutput('VPCId', {
        Export: {
          Name: `VPC-${environmentSuffix}`,
        },
      });
    });

    test('exports S3 bucket name', () => {
      template.hasOutput('LogsBucketName', {
        Export: {
          Name: `LogsBucket-${environmentSuffix}`,
        },
      });
    });

    test('exports database endpoint', () => {
      template.hasOutput('DatabaseEndpoint', {
        Export: {
          Name: `DatabaseEndpoint-${environmentSuffix}`,
        },
      });
    });

    test('exports KMS key ID', () => {
      template.hasOutput('KMSKeyId', {
        Export: {
          Name: `KMSKey-${environmentSuffix}`,
        },
      });
    });

    test('exports launch template ID', () => {
      template.hasOutput('LaunchTemplateId', {
        Export: {
          Name: `LaunchTemplate-${environmentSuffix}`,
        },
      });
    });

    test('exports instance profile ARN', () => {
      template.hasOutput('InstanceProfileArn', {
        Export: {
          Name: `InstanceProfile-${environmentSuffix}`,
        },
      });
    });

    test('exports Lambda role ARN', () => {
      template.hasOutput('LambdaRoleArn', {
        Export: {
          Name: `LambdaRole-${environmentSuffix}`,
        },
      });
    });
  });

  describe('Removal Policies', () => {
    test('resources have DESTROY removal policy for clean cleanup', () => {
      // KMS Key
      template.hasResource('AWS::KMS::Key', {
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      });

      // S3 Bucket
      template.hasResource('AWS::S3::Bucket', {
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      });
    });
  });
});
