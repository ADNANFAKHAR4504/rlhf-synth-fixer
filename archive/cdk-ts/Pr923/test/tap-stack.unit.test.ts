import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';
import { SecurityStack } from '../lib/security-stack';

describe('TapStack', () => {
  describe('Stack Creation', () => {
    test('creates TapStack with provided environment suffix', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestTapStack', { 
        environmentSuffix: 'test' 
      });
      const template = Template.fromStack(stack);
      
      expect(stack).toBeDefined();
      expect(stack.stackName).toContain('TestTapStack');
    });

    test('creates TapStack without environment suffix (uses default)', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestTapStack');
      
      expect(stack).toBeDefined();
      expect(stack.stackName).toContain('TestTapStack');
    });

    test('creates TapStack with context environment suffix', () => {
      const app = new cdk.App({
        context: {
          environmentSuffix: 'context-test'
        }
      });
      const stack = new TapStack(app, 'TestTapStack');
      
      expect(stack).toBeDefined();
      const nestedStacks = stack.node.children.filter(
        child => child instanceof SecurityStack
      );
      expect(nestedStacks).toHaveLength(1);
    });

    test('passes environment suffix to nested stack', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestTapStack', { 
        environmentSuffix: 'test' 
      });
      
      const nestedStacks = stack.node.children.filter(
        child => child instanceof SecurityStack
      );
      expect(nestedStacks).toHaveLength(1);
    });
  });
});

describe('SecurityStack', () => {
  let app: cdk.App;
  let stack: SecurityStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new SecurityStack(app, 'TestSecurityStack', {
      environmentSuffix: 'test'
    });
    template = Template.fromStack(stack);
  });

  describe('Environment Suffix Handling', () => {
    test('uses provided environment suffix', () => {
      const customApp = new cdk.App();
      const customStack = new SecurityStack(customApp, 'CustomSecurityStack', {
        environmentSuffix: 'custom'
      });
      const customTemplate = Template.fromStack(customStack);
      
      customTemplate.hasResource('AWS::Logs::LogGroup', {
        Properties: {
          LogGroupName: '/aws/vpc/flowlogs/custom'
        }
      });
    });

    test('uses default environment suffix when not provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new SecurityStack(defaultApp, 'DefaultSecurityStack');
      const defaultTemplate = Template.fromStack(defaultStack);
      
      defaultTemplate.hasResource('AWS::Logs::LogGroup', {
        Properties: {
          LogGroupName: '/aws/vpc/flowlogs/dev'
        }
      });
    });
  });

  describe('VPC Configuration', () => {
    test('creates VPC with correct configuration', () => {
      template.hasResource('AWS::EC2::VPC', {
        Properties: {
          CidrBlock: '10.0.0.0/16',
          EnableDnsHostnames: true,
          EnableDnsSupport: true,
          Tags: Match.arrayWith([
            { Key: 'Name', Value: Match.stringLikeRegexp('secure-vpc-test') }
          ])
        }
      });
    });

    test('creates public, private and isolated subnets', () => {
      // Check for public subnets
      template.hasResource('AWS::EC2::Subnet', {
        Properties: {
          MapPublicIpOnLaunch: true,
          Tags: Match.arrayWith([
            { Key: 'aws-cdk:subnet-type', Value: 'Public' }
          ])
        }
      });

      // Check for private subnets
      template.hasResource('AWS::EC2::Subnet', {
        Properties: {
          MapPublicIpOnLaunch: false,
          Tags: Match.arrayWith([
            { Key: 'aws-cdk:subnet-type', Value: 'Private' }
          ])
        }
      });

      // Check for isolated subnets
      template.hasResource('AWS::EC2::Subnet', {
        Properties: {
          MapPublicIpOnLaunch: false,
          Tags: Match.arrayWith([
            { Key: 'aws-cdk:subnet-type', Value: 'Isolated' }
          ])
        }
      });
    });

    test('creates VPC Flow Logs', () => {
      template.hasResource('AWS::EC2::FlowLog', {
        Properties: {
          ResourceType: 'VPC',
          TrafficType: 'ALL',
          LogDestinationType: 'cloud-watch-logs'
        }
      });
    });

    test('creates CloudWatch Log Group for VPC Flow Logs', () => {
      template.hasResource('AWS::Logs::LogGroup', {
        Properties: {
          LogGroupName: '/aws/vpc/flowlogs/test',
          RetentionInDays: 30
        }
      });
    });
  });

  describe('Network ACLs', () => {
    test('creates private Network ACL', () => {
      template.hasResource('AWS::EC2::NetworkAcl', {
        Properties: {
          Tags: Match.arrayWith([
            { Key: 'Name', Value: 'private-nacl-test' }
          ])
        }
      });
    });

    test('creates NACL entry for inbound HTTPS from public subnets', () => {
      template.hasResource('AWS::EC2::NetworkAclEntry', {
        Properties: {
          RuleNumber: 100,
          Protocol: 6,
          RuleAction: 'allow',
          CidrBlock: '10.0.0.0/23',
          PortRange: {
            From: 443,
            To: 443
          },
          Egress: false
        }
      });
    });

    test('creates NACL entry for outbound HTTPS', () => {
      template.hasResource('AWS::EC2::NetworkAclEntry', {
        Properties: {
          RuleNumber: 100,
          Protocol: 6,
          RuleAction: 'allow',
          CidrBlock: '0.0.0.0/0',
          PortRange: {
            From: 443,
            To: 443
          },
          Egress: true
        }
      });
    });
  });

  describe('Security Groups', () => {
    test('creates web security group with restricted access', () => {
      template.hasResource('AWS::EC2::SecurityGroup', {
        Properties: {
          GroupDescription: 'Security group for web tier',
          GroupName: 'web-sg-test',
          SecurityGroupEgress: Match.arrayWith([
            {
              IpProtocol: 'tcp',
              FromPort: 443,
              ToPort: 443,
              CidrIp: '0.0.0.0/0',
              Description: 'Allow HTTPS to internet'
            }
          ]),
          SecurityGroupIngress: Match.arrayWith([
            {
              IpProtocol: 'tcp',
              FromPort: 443,
              ToPort: 443,
              CidrIp: '0.0.0.0/0',
              Description: 'Allow HTTPS from internet'
            }
          ])
        }
      });
    });

    test('creates app security group with web tier access only', () => {
      template.hasResource('AWS::EC2::SecurityGroup', {
        Properties: {
          GroupDescription: 'Security group for application tier',
          GroupName: 'app-sg-test'
        }
      });
    });
  });

  describe('KMS Configuration', () => {
    test('creates KMS key with proper configuration', () => {
      template.hasResource('AWS::KMS::Key', {
        Properties: {
          Description: 'KMS key for security infrastructure - test',
          EnableKeyRotation: true,
          KeySpec: 'SYMMETRIC_DEFAULT',
          KeyUsage: 'ENCRYPT_DECRYPT'
        },
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete'
      });
    });

    test('creates KMS key alias', () => {
      template.hasResource('AWS::KMS::Alias', {
        Properties: {
          AliasName: 'alias/security-key-test'
        }
      });
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('creates S3 bucket with encryption and versioning', () => {
      template.hasResource('AWS::S3::Bucket', {
        Properties: {
          VersioningConfiguration: {
            Status: 'Enabled'
          },
          BucketEncryption: {
            ServerSideEncryptionConfiguration: [{
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
                KMSMasterKeyID: Match.anyValue()
              }
            }]
          },
          PublicAccessBlockConfiguration: {
            BlockPublicAcls: true,
            BlockPublicPolicy: true,
            IgnorePublicAcls: true,
            RestrictPublicBuckets: true
          },
          LifecycleConfiguration: {
            Rules: [{
              Id: 'delete-old-versions',
              NoncurrentVersionExpiration: {
                NoncurrentDays: 30
              },
              Status: 'Enabled'
            }]
          }
        },
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete'
      });
    });

    test('creates S3 bucket policy to enforce SSL', () => {
      template.hasResource('AWS::S3::BucketPolicy', {
        Properties: {
          PolicyDocument: {
            Statement: Match.arrayWith([
              {
                Action: 's3:*',
                Effect: 'Deny',
                Principal: { AWS: '*' },
                Resource: Match.anyValue(),
                Condition: {
                  Bool: {
                    'aws:SecureTransport': 'false'
                  }
                }
              }
            ])
          }
        }
      });
    });
  });

  describe('IAM Configuration', () => {
    test('creates IAM role with least privilege', () => {
      template.hasResource('AWS::IAM::Role', {
        Properties: {
          RoleName: 'secure-access-role-test',
          AssumeRolePolicyDocument: {
            Statement: Match.arrayWith([
              {
                Effect: 'Allow',
                Principal: {
                  Service: 'ec2.amazonaws.com'
                },
                Action: 'sts:AssumeRole'
              }
            ])
          },
          Description: 'Role for secure access to resources'
        }
      });
    });

    test('creates IAM policies with specific S3 permissions', () => {
      template.hasResource('AWS::IAM::Policy', {
        Properties: {
          PolicyDocument: {
            Statement: Match.arrayWith([
              {
                Effect: 'Allow',
                Action: Match.arrayWith([
                  's3:GetObject',
                  's3:PutObject',
                  's3:DeleteObject'
                ]),
                Resource: Match.anyValue()
              }
            ])
          }
        }
      });
    });

    test('creates IAM policies with KMS permissions', () => {
      template.hasResource('AWS::IAM::Policy', {
        Properties: {
          PolicyDocument: {
            Statement: Match.arrayWith([
              {
                Effect: 'Allow',
                Action: Match.arrayWith([
                  'kms:Decrypt',
                  'kms:DescribeKey'
                ]),
                Resource: Match.anyValue()
              }
            ])
          }
        }
      });
    });
  });

  describe('GuardDuty Configuration', () => {
    test.skip('GuardDuty detector creation skipped - handled externally', () => {
      // GuardDuty is often already enabled in AWS accounts
      // This test is skipped as the creation is commented out to avoid conflicts
      template.hasResource('AWS::GuardDuty::Detector', {
        Properties: {
          Enable: true,
          DataSources: {
            S3Logs: {
              Enable: true
            },
            Kubernetes: {
              AuditLogs: {
                Enable: true
              }
            },
            MalwareProtection: {
              ScanEc2InstanceWithFindings: {
                EbsVolumes: true
              }
            }
          }
        }
      });
    });
  });

  describe('CloudFormation Outputs', () => {
    test('exports VPC ID', () => {
      template.hasOutput('VpcId', {
        Value: Match.anyValue(),
        Description: 'VPC ID'
      });
    });

    test('exports KMS Key ID', () => {
      template.hasOutput('KmsKeyId', {
        Value: Match.anyValue(),
        Description: 'KMS Key ID'
      });
    });

    test('exports S3 bucket name', () => {
      template.hasOutput('SecureStorageBucketName', {
        Value: Match.anyValue(),
        Description: 'Secure storage bucket name'
      });
    });

    test.skip('exports GuardDuty detector ID - skipped as GuardDuty is disabled', () => {
      template.hasOutput('GuardDutyDetectorId', {
        Value: Match.anyValue(),
        Description: 'GuardDuty detector ID'
      });
    });
  });

  describe('Resource Tagging', () => {
    test('applies environment tags to stack', () => {
      const stackTags = stack.tags.tagValues();
      expect(stackTags['Environment']).toBe('test');
      expect(stackTags['SecurityCompliance']).toBe('enabled');
      expect(stackTags['Project']).toBe('security-infrastructure');
    });
  });

  describe('Removal Policies', () => {
    test('sets DESTROY removal policy for development resources', () => {
      // KMS Key
      template.hasResource('AWS::KMS::Key', {
        DeletionPolicy: 'Delete'
      });

      // S3 Bucket
      template.hasResource('AWS::S3::Bucket', {
        DeletionPolicy: 'Delete'
      });

      // CloudWatch Log Group
      template.hasResource('AWS::Logs::LogGroup', {
        DeletionPolicy: 'Delete'
      });
    });
  });
});
