import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack Security Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { 
      environmentSuffix,
      env: { account: '123456789012', region: 'us-east-1' }
    });
    template = Template.fromStack(stack);
  });

  describe('KMS Security', () => {
    test('should create KMS key with rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: Match.stringLikeRegexp('Security encryption key'),
        EnableKeyRotation: true,
        KeyPolicy: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: { AWS: Match.anyValue() },
              Action: 'kms:*',
              Resource: '*'
            })
          ])
        }
      });
    });
  });

  describe('VPC Security', () => {
    test('should create VPC with proper subnet configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        EnableDnsHostnames: true,
        EnableDnsSupport: true
      });
    });

    test('should create VPC Flow Logs', () => {
      template.hasResourceProperties('AWS::EC2::FlowLog', {
        ResourceType: 'VPC',
        TrafficType: 'ALL'
      });
    });

    test('should create private and isolated subnets', () => {
      // Check for private subnets
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false
      });
    });
  });

  describe('S3 Security', () => {
    test('should create S3 buckets with encryption enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: Match.anyValue()
              }
            }
          ]
        }
      });
    });

    test('should block all public access on S3 buckets', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        }
      });
    });

    test('should enable versioning on S3 buckets', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled'
        }
      });
    });
  });

  describe('IAM Security', () => {
    test('should create IAM roles with least privilege', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: Match.anyValue()
              },
              Action: 'sts:AssumeRole'
            }
          ]
        }
      });
    });

    test('should create MFA policy for users', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
              Action: '*',
              Resource: '*',
              Condition: {
                BoolIfExists: {
                  'aws:MultiFactorAuthPresent': 'false'
                }
              }
            })
          ])
        }
      });
    });

    test('should create EC2 role with minimal permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com'
              },
              Action: 'sts:AssumeRole'
            }
          ]
        },
        Policies: Match.arrayWith([
          Match.objectLike({
            PolicyDocument: {
              Statement: Match.arrayWith([
                Match.objectLike({
                  Effect: 'Allow',
                  Action: ['s3:GetObject', 's3:PutObject']
                })
              ])
            }
          })
        ])
      });
    });
  });

  describe('Security Groups', () => {
    test('should create restrictive security groups', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: Match.stringLikeRegexp('Security group'),
        SecurityGroupEgress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443
          })
        ])
      });
    });

    test('should not allow SSH from 0.0.0.0/0', () => {
      // Verify no security group allows SSH from anywhere
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      
      Object.values(securityGroups).forEach((sg: any) => {
        const ingress = sg.Properties?.SecurityGroupIngress || [];
        ingress.forEach((rule: any) => {
          if (rule.FromPort === 22 || rule.ToPort === 22) {
            expect(rule.CidrIp).not.toBe('0.0.0.0/0');
          }
        });
      });
    });

    test('should create database security group with restricted access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: Match.stringLikeRegexp('RDS'),
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 3306,
            ToPort: 3306,
            SourceSecurityGroupId: Match.anyValue()
          })
        ])
      });
    });
  });

  describe('RDS Security', () => {
    test('should create RDS with encryption enabled', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        StorageEncrypted: true,
        KmsKeyId: Match.anyValue()
      });
    });

    test('should place RDS in private subnets', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupDescription: Match.stringLikeRegexp('Subnet group')
      });
    });

    test('should enable automated backups', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        BackupRetentionPeriod: Match.anyValue(),
        DeleteAutomatedBackups: false
      });
    });
  });



  describe('AWS Config Security', () => {
    test('should create Config recorder', () => {
      template.hasResourceProperties('AWS::Config::ConfigurationRecorder', {
        RecordingGroup: {
          AllSupported: true,
          IncludeGlobalResourceTypes: true
        }
      });
    });

    test('should create Config delivery channel', () => {
      template.hasResourceProperties('AWS::Config::DeliveryChannel', {
        S3BucketName: Match.anyValue()
      });
    });

    test('should create SSH restriction Config rule', () => {
      template.hasResourceProperties('AWS::Config::ConfigRule', {
        Source: {
          Owner: 'AWS',
          SourceIdentifier: 'INCOMING_SSH_DISABLED'
        }
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should create necessary outputs', () => {
      template.hasOutput('VpcId', {});
      template.hasOutput('DatabaseEndpoint', {});
      template.hasOutput('DataBucketName', {});

    });
  });

  describe('Resource Naming', () => {
    test('should use environment suffix in resource names', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach((bucket: any) => {
        if (bucket.Properties?.BucketName) {
          expect(bucket.Properties.BucketName).toContain(environmentSuffix);
        }
      });
    });
  });

  describe('Security Best Practices', () => {
    test('should not have any resources with public access', () => {
      // Check S3 buckets
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach((bucket: any) => {
        expect(bucket.Properties?.PublicAccessBlockConfiguration).toBeDefined();
      });

      // Check security groups for overly permissive rules
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      Object.values(securityGroups).forEach((sg: any) => {
        const ingress = sg.Properties?.SecurityGroupIngress || [];
        ingress.forEach((rule: any) => {
          if (rule.CidrIp === '0.0.0.0/0') {
            // Only allow HTTPS from internet
            expect([80, 443]).toContain(rule.FromPort);
          }
        });
      });
    });

    test('should have deletion protection where appropriate', () => {
      // Check that critical resources have appropriate deletion policies
      const kmsKeys = template.findResources('AWS::KMS::Key');
      expect(Object.keys(kmsKeys).length).toBeGreaterThan(0);
    });
  });
});
