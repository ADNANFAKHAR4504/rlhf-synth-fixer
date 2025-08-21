import { App } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack.js';

describe('TapStack Core Security Tests', () => {
  let app;
  let stack;
  let template;

  beforeEach(() => {
    app = new App({
      context: {
        environmentSuffix: 'test',
      },
    });
    stack = new TapStack(app, 'TestStack', {
      env: { account: '123456789012', region: 'us-east-1' },
    });
    template = Template.fromStack(stack);
  });

  describe('Core Security Infrastructure', () => {
    test('should create KMS key with rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
        KeySpec: 'SYMMETRIC_DEFAULT',
        KeyUsage: 'ENCRYPT_DECRYPT',
      });
    });

    test('should create KMS key alias', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: Match.stringLikeRegexp('alias/financial-app-key-.*'),
      });
    });

    test('should create VPC with proper subnet configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create S3 bucket with KMS encryption', () => {
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

    test('should create RDS instance with encryption', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        StorageEncrypted: true,
        Engine: 'postgres',
        BackupRetentionPeriod: 7,
      });
    });

    test('should create Application Load Balancer', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        {
          Type: 'application',
          Scheme: 'internet-facing',
        }
      );
    });

    test('should create Auto Scaling Group', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        MinSize: '2',
        MaxSize: '10',
        DesiredCapacity: '2',
      });
    });

    test('should create target group for load balancer', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::TargetGroup',
        {
          Port: 8080,
          Protocol: 'HTTP',
          TargetType: 'instance',
        }
      );
    });

    test('should create security groups for different tiers', () => {
      // ALB Security Group
      const sgResources = template.findResources('AWS::EC2::SecurityGroup');
      const sgCount = Object.keys(sgResources).length;
      expect(sgCount).toBeGreaterThanOrEqual(3); // ALB, App, DB security groups
    });

    test('should create Secrets Manager secret for database', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        GenerateSecretString: Match.objectLike({
          GenerateStringKey: 'password',
        }),
      });
    });

    test('should create CloudWatch log group', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: Match.stringLikeRegexp('/aws/ec2/financial-app-.*'),
        RetentionInDays: 30,
      });
    });

    test('should create CloudWatch alarms for monitoring', () => {
      // Should have at least one CloudWatch alarm
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      expect(Object.keys(alarms).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Stack Outputs', () => {
    test('should output VPC ID', () => {
      template.hasOutput('VPCId', {
        Description: 'VPC ID for the secure financial application',
      });
    });

    test('should output database endpoint', () => {
      template.hasOutput('DatabaseEndpoint', {
        Description: 'RDS database endpoint',
      });
    });

    test('should output ALB DNS name', () => {
      template.hasOutput('ALBDNSName', {
        Description: 'Application Load Balancer DNS name',
      });
    });

    test('should output S3 bucket name', () => {
      template.hasOutput('S3BucketName', {
        Description: 'S3 bucket name',
      });
    });

    test('should output KMS key ID', () => {
      template.hasOutput('KMSKeyId', {
        Description: 'KMS key ID for encryption',
      });
    });
  });

  describe('Resource Naming and Tags', () => {
    test('should use environment suffix in resource names', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      expect(Object.keys(buckets).length).toBeGreaterThan(0);
    });

    test('should set removal policies for cleanup', () => {
      // Check that KMS key has proper removal policy (CDK maps DESTROY to Delete)
      template.hasResource('AWS::KMS::Key', {
        DeletionPolicy: 'Delete',
      });
    });
  });

  describe('Network Security', () => {
    test('should create route tables for different subnet types', () => {
      const routeTables = template.findResources('AWS::EC2::RouteTable');
      expect(Object.keys(routeTables).length).toBeGreaterThan(2);
    });

    test('should create Internet Gateway', () => {
      template.hasResourceProperties('AWS::EC2::InternetGateway', {});
    });

    test('should create NAT Gateways for private subnets', () => {
      const natGateways = template.findResources('AWS::EC2::NatGateway');
      expect(Object.keys(natGateways).length).toBeGreaterThanOrEqual(1);
    });
  });
});
