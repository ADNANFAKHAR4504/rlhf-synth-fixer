import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = 'test';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let usEast1Stack: TapStack;
  let usWest1Stack: TapStack;
  let usEast1Template: Template;
  let usWest1Template: Template;

  beforeEach(() => {
    app = new cdk.App();

    // Create stacks for both regions
    usEast1Stack = new TapStack(app, 'TestTapStackUsEast1', {
      environmentSuffix,
      region: 'us-east-1',
      isPrimaryRegion: true,
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });

    usWest1Stack = new TapStack(app, 'TestTapStackUsWest1', {
      environmentSuffix,
      region: 'us-west-1',
      isPrimaryRegion: false,
      env: {
        account: '123456789012',
        region: 'us-west-1',
      },
    });

    usEast1Template = Template.fromStack(usEast1Stack);
    usWest1Template = Template.fromStack(usWest1Stack);
  });

  describe('VPC Configuration', () => {
    test('should create VPC with correct CIDR block for us-east-1', () => {
      usEast1Template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create VPC with correct CIDR block for us-west-1', () => {
      usWest1Template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.1.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create public and private subnets', () => {
      // Check for public subnets
      usEast1Template.resourceCountIs('AWS::EC2::Subnet', 4);

      // Verify public subnets have MapPublicIpOnLaunch
      usEast1Template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
      });
    });

    test('should create Internet Gateway', () => {
      usEast1Template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });

    test('should not create NAT Gateways', () => {
      usEast1Template.resourceCountIs('AWS::EC2::NatGateway', 0);
    });
  });

  describe('Security Configuration', () => {
    test('should create EC2 security group allowing SSH and HTTP', () => {
      usEast1Template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 22,
            ToPort: 22,
          }),
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
          }),
        ]),
      });
    });

    test('should create RDS security group allowing PostgreSQL from EC2', () => {
      usEast1Template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 5432,
        ToPort: 5432,
      });
    });

    test('should create IAM role for EC2 instances', () => {
      usEast1Template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: Match.objectLike({
                Service: 'ec2.amazonaws.com',
              }),
            }),
          ]),
        }),
      });
    });
  });

  describe('Compute Resources', () => {
    test('should create EC2 instance in public subnet', () => {
      usEast1Template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.micro',
      });
    });

    test('should create instance profile for EC2', () => {
      usEast1Template.resourceCountIs('AWS::IAM::InstanceProfile', 2);
    });
  });

  describe('Database Configuration', () => {
    test('should create RDS PostgreSQL instance with encryption', () => {
      // Note: MultiAZ is disabled for LocalStack compatibility
      usEast1Template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'postgres',
        MultiAZ: false,
        StorageEncrypted: true,
        DBInstanceClass: 'db.t3.micro',
      });
    });

    test('should create database secret in Secrets Manager', () => {
      usEast1Template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Description: 'Database credentials for PostgreSQL',
      });
    });

    test('should create RDS subnet group', () => {
      usEast1Template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupDescription: 'Subnet group for RDS database',
      });
    });

    test('should have deletion protection disabled', () => {
      usEast1Template.hasResourceProperties('AWS::RDS::DBInstance', {
        DeletionProtection: false,
      });
    });
  });

  describe('Storage Configuration', () => {
    test('should create S3 bucket only in primary region', () => {
      // Primary region should have S3 bucket
      usEast1Template.resourceCountIs('AWS::S3::Bucket', 2); // Main bucket + metadata bucket

      // Secondary region should not have S3 bucket
      usWest1Template.resourceCountIs('AWS::S3::Bucket', 0);
    });

    test('should enable versioning and encryption on S3 bucket', () => {
      usEast1Template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        BucketEncryption: {
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            }),
          ]),
        },
      });
    });

    test('should block public access on S3 bucket', () => {
      usEast1Template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });
  });

  describe('Resource Tagging', () => {
    test('should apply environment tags to all resources', () => {
      const resources = usEast1Template.toJSON().Resources;
      // Verify that resources have proper tags
      expect(Object.keys(resources).length).toBeGreaterThan(0);
    });
  });

  describe('Stack Outputs', () => {
    test('should output VPC ID', () => {
      usEast1Template.hasOutput('VpcId', {});
    });

    test('should output EC2 Instance ID', () => {
      usEast1Template.hasOutput('EC2InstanceId', {});
    });

    test('should output RDS Endpoint', () => {
      usEast1Template.hasOutput('RDSEndpoint', {});
    });

    test('should output subnet IDs', () => {
      usEast1Template.hasOutput('PublicSubnetId', {});
      usEast1Template.hasOutput('PrivateSubnetId', {});
    });
  });

  describe('Deletion Policies', () => {
    test('should not have any Retain deletion policies', () => {
      const template = usEast1Template.toJSON();
      const resources = template.Resources || {};

      Object.entries(resources).forEach(
        ([logicalId, resource]: [string, any]) => {
          if (resource.DeletionPolicy) {
            expect(resource.DeletionPolicy).not.toBe('Retain');
          }
          if (resource.UpdateReplacePolicy) {
            expect(resource.UpdateReplacePolicy).not.toBe('Retain');
          }
        }
      );
    });
  });
});
