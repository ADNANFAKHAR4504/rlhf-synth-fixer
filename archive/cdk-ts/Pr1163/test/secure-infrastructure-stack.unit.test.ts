import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { SecureInfrastructureStack } from '../lib/secure-infrastructure-stack';

describe('SecureInfrastructureStack Unit Tests', () => {
  let app: cdk.App;
  let stack: SecureInfrastructureStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new SecureInfrastructureStack(
      app,
      'TestSecureInfrastructureStack',
      {
        environment: 'test',
      }
    );
    template = Template.fromStack(stack);
  });

  describe('VPC Infrastructure', () => {
    test('should create VPC with correct configuration', () => {
      template.hasResource('AWS::EC2::VPC', {
        Properties: {
          CidrBlock: '10.0.0.0/16',
          EnableDnsHostnames: true,
          EnableDnsSupport: true,
          Tags: Match.arrayWith([
            {
              Key: 'Name',
              Value: 'VPC-test',
            },
          ]),
        },
      });
    });

    test('should create public subnets', () => {
      template.hasResource('AWS::EC2::Subnet', {
        Properties: {
          CidrBlock: Match.stringLikeRegexp('10\\.0\\.[0-9]+\\.0/24'),
          MapPublicIpOnLaunch: true,
          Tags: Match.arrayWith([
            {
              Key: 'Name',
              Value: Match.stringLikeRegexp('.*PublicSubnet.*'),
            },
          ]),
        },
      });
    });

    test('should create private subnets', () => {
      template.hasResource('AWS::EC2::Subnet', {
        Properties: {
          CidrBlock: Match.stringLikeRegexp('10\\.0\\.[0-9]+\\.0/24'),
          MapPublicIpOnLaunch: false,
          Tags: Match.arrayWith([
            {
              Key: 'Name',
              Value: Match.stringLikeRegexp('.*PrivateSubnet.*'),
            },
          ]),
        },
      });
    });

    test('should create NAT Gateways', () => {
      template.hasResource('AWS::EC2::NatGateway', {});
    });

    test('should create Network ACLs', () => {
      template.hasResource('AWS::EC2::NetworkAcl', {});
    });
  });

  describe('Database Infrastructure', () => {
    test('should create RDS instance', () => {
      template.hasResource('AWS::RDS::DBInstance', {
        Properties: {
          Engine: 'mysql',
          DBInstanceClass: 'db.t3.micro',
          StorageEncrypted: true,
          BackupRetentionPeriod: 7,
          MultiAZ: false,
          AutoMinorVersionUpgrade: true,
          AllowMajorVersionUpgrade: false,
          DBName: 'appdb',
          Tags: Match.arrayWith([
            {
              Key: 'Name',
              Value: 'Database-test',
            },
          ]),
        },
      });
    });

    test('should create DB subnet group', () => {
      template.hasResource('AWS::RDS::DBSubnetGroup', {
        Properties: {
          DBSubnetGroupDescription: 'Subnet group for RDS database',
        },
      });
    });

    test('should create database secret', () => {
      template.hasResource('AWS::SecretsManager::Secret', {});
    });

    test('should create CloudWatch alarms for database', () => {
      template.hasResource('AWS::CloudWatch::Alarm', {
        Properties: {
          MetricName: Match.stringLikeRegexp('.*CPU.*'),
          Threshold: 80,
        },
      });

      template.hasResource('AWS::CloudWatch::Alarm', {
        Properties: {
          MetricName: Match.stringLikeRegexp('.*Connection.*'),
          Threshold: 80,
        },
      });
    });

    test('should create SSM parameter for database endpoint', () => {
      template.hasResource('AWS::SSM::Parameter', {
        Properties: {
          Name: '/app/test/database/endpoint',
          Type: 'String',
        },
      });
    });
  });

  describe('Security Infrastructure', () => {
    test('should create security groups', () => {
      template.hasResource('AWS::EC2::SecurityGroup', {
        Properties: {
          GroupDescription: Match.stringLikeRegexp('.*database.*'),
        },
      });
    });

    test('should create WAF Web ACL', () => {
      template.hasResource('AWS::WAFv2::WebACL', {
        Properties: {
          Scope: 'CLOUDFRONT',
          DefaultAction: {
            Allow: {},
          },
        },
      });
    });

    test('should create CloudWatch log groups', () => {
      template.hasResource('AWS::Logs::LogGroup', {
        Properties: {
          RetentionInDays: 365,
        },
      });
    });
  });

  describe('Storage Infrastructure', () => {
    test('should create S3 bucket', () => {
      template.hasResource('AWS::S3::Bucket', {
        Properties: {
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
        },
      });
    });

    test('should create S3 bucket lifecycle rules', () => {
      template.hasResource('AWS::S3::Bucket', {
        Properties: {
          LifecycleConfiguration: {
            Rules: Match.arrayWith([
              {
                Id: 'DeleteOldVersions',
                Status: 'Enabled',
                NoncurrentVersionExpiration: {
                  NoncurrentDays: 30,
                },
              },
            ]),
          },
        },
      });
    });
  });

  describe('Monitoring Infrastructure', () => {
    test('should create SNS topic', () => {
      template.hasResource('AWS::SNS::Topic', {
        Properties: {
          DisplayName: 'Security Alerts - test',
          TopicName: 'security-alerts-test',
        },
      });
    });

    test('should create CloudWatch alarms', () => {
      template.hasResource('AWS::CloudWatch::Alarm', {
        Properties: {
          AlarmDescription: Match.stringLikeRegexp('.*failed login.*'),
        },
      });
    });

    test('should create CloudTrail for non-PR environments', () => {
      // For PR environments, CloudTrail is not created to avoid trail limit
      const environment = 'test'; // This test uses 'test' environment
      if (!environment.startsWith('pr')) {
        template.hasResource('AWS::CloudTrail::Trail', {
          Properties: {
            TrailName: Match.stringLikeRegexp('.*CloudTrail.*'),
          },
        });
      } else {
        // For PR environments, CloudTrail should not be created
        template.resourceCountIs('AWS::CloudTrail::Trail', 0);
      }
    });
  });

  describe('IAM Infrastructure', () => {
    test('should create IAM policies', () => {
      template.hasResource('AWS::IAM::Policy', {});
    });
  });

  describe('Stack Outputs', () => {
    test('should export VPC ID', () => {
      template.hasOutput('VpcId', {
        Description: 'VPC ID',
      });
    });

    test('should export database endpoint', () => {
      template.hasOutput('DatabaseEndpoint', {
        Description: 'RDS Database Endpoint',
      });
    });

    test('should export WAF ACL ARN', () => {
      template.hasOutput('WafAclArn', {
        Description: 'WAF Web ACL ARN',
      });
    });
  });

  describe('Resource Tagging', () => {
    test('should tag all resources with environment', () => {
      const resources = template.findResources('*');
      Object.values(resources).forEach((resource: any) => {
        if (resource.Properties?.Tags) {
          const hasEnvironmentTag = resource.Properties.Tags.some(
            (tag: any) => tag.Key === 'Environment' && tag.Value === 'test'
          );
          expect(hasEnvironmentTag).toBe(true);
        }
      });
    });
  });
});
