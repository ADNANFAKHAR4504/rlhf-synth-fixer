import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack.mjs';

describe('TapStack Unit Tests', () => {
  let app;
  let stack;
  let template;
  const environmentSuffix = 'test';

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { 
      environmentSuffix,
      env: {
        account: '123456789012',
        region: 'us-east-1'
      }
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('should create VPC with correct CIDR', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true
      });
    });

    test('should create exactly 2 public subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 4); // 2 public + 2 private
      
      // Check public subnet configuration
      const subnets = template.findResources('AWS::EC2::Subnet');
      const publicSubnets = Object.entries(subnets).filter(([key, value]) => 
        value.Properties.MapPublicIpOnLaunch === true
      );
      expect(publicSubnets).toHaveLength(2);
    });

    test('should create exactly 2 private subnets', () => {
      const subnets = template.findResources('AWS::EC2::Subnet');
      const privateSubnets = Object.entries(subnets).filter(([key, value]) => 
        value.Properties.MapPublicIpOnLaunch === false
      );
      expect(privateSubnets).toHaveLength(2);
    });

    test('should create 2 NAT gateways for high availability', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
    });

    test('should create Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });

    test('should enable VPC Flow Logs', () => {
      template.hasResourceProperties('AWS::EC2::FlowLog', {
        ResourceType: 'VPC',
        TrafficType: 'ALL',
        LogDestinationType: 'cloud-watch-logs'
      });
    });

    test('should create CloudWatch Log Group for VPC Flow Logs', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/vpc/flowlogs-${environmentSuffix}`,
        RetentionInDays: 30
      });
    });
  });

  describe('Security Groups', () => {
    test('should create bastion security group with restricted access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for bastion host',
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            FromPort: 22,
            ToPort: 22,
            IpProtocol: 'tcp'
          })
        ]),
        SecurityGroupEgress: Match.arrayWith([
          Match.objectLike({
            FromPort: 443,
            ToPort: 443,
            IpProtocol: 'tcp'
          }),
          Match.objectLike({
            FromPort: 22,
            ToPort: 22,
            IpProtocol: 'tcp'
          })
        ])
      });
    });

    test('should create private security group allowing SSH only from bastion', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for private subnet resources',
        SecurityGroupEgress: Match.arrayWith([
          Match.objectLike({
            FromPort: 443,
            ToPort: 443,
            IpProtocol: 'tcp'
          })
        ])
      });

      // Check for ingress rule from bastion
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        FromPort: 22,
        ToPort: 22,
        IpProtocol: 'tcp',
        Description: 'SSH from bastion host'
      });
    });
  });

  describe('EC2 Instances', () => {
    test('should create bastion host with correct properties', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.micro',
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: `bastion-host-${environmentSuffix}`
          })
        ])
      });
    });

    test('should create private instance with correct properties', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.micro',
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: `private-instance-${environmentSuffix}`
          })
        ])
      });
    });

    test('should enforce IMDSv2 on all instances', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: {
          MetadataOptions: {
            HttpTokens: 'required'
          }
        }
      });
      
      // Should have 2 launch templates (one for each instance)
      template.resourceCountIs('AWS::EC2::LaunchTemplate', 2);
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should create bastion role with minimal permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com'
              },
              Action: 'sts:AssumeRole'
            })
          ])
        }),
        Description: 'IAM role for bastion host with minimal permissions'
      });
    });

    test('should create private instance role with required policies', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com'
              },
              Action: 'sts:AssumeRole'
            })
          ])
        }),
        Description: 'IAM role for private instances'
      });
    });

    test('should attach SSM managed policy to roles', () => {
      const roles = template.findResources('AWS::IAM::Role');
      const ec2Roles = Object.entries(roles).filter(([key, value]) => 
        value.Properties.Description && 
        (value.Properties.Description.includes('bastion') || 
         value.Properties.Description.includes('private'))
      );

      ec2Roles.forEach(([key, role]) => {
        expect(role.Properties.ManagedPolicyArns).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              'Fn::Join': expect.arrayContaining([
                '',
                expect.arrayContaining([
                  expect.stringContaining('arn:'),
                  expect.anything(),
                  expect.stringContaining(':iam::aws:policy/AmazonSSMManagedInstanceCore')
                ])
              ])
            })
          ])
        );
      });
    });
  });

  describe('S3 Bucket Security', () => {
    test('should create S3 bucket with KMS encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms'
              }
            })
          ])
        }
      });
    });

    test('should block all public access', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        }
      });
    });

    test('should enable versioning', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled'
        }
      });
    });

    test('should have lifecycle rules', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'DeleteIncompleteMultipartUploads',
              AbortIncompleteMultipartUpload: {
                DaysAfterInitiation: 1
              },
              Status: 'Enabled'
            }),
            Match.objectLike({
              Id: 'TransitionToIA',
              Transitions: Match.arrayWith([
                Match.objectLike({
                  StorageClass: 'STANDARD_IA',
                  TransitionInDays: 30
                })
              ]),
              Status: 'Enabled'
            })
          ])
        }
      });
    });

    test('should have bucket policy denying insecure connections', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'DenyInsecureConnections',
              Effect: 'Deny',
              Principal: { AWS: '*' },
              Action: 's3:*',
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'false'
                }
              }
            })
          ])
        }
      });
    });
  });

  describe('KMS Encryption', () => {
    test('should create KMS key with rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: `Security encryption key for ${environmentSuffix}`,
        EnableKeyRotation: true
      });
    });

    test('should grant CloudWatch Logs permissions to use KMS key', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        KeyPolicy: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'logs.amazonaws.com'
              },
              Action: Match.arrayWith([
                'kms:Encrypt',
                'kms:Decrypt',
                'kms:GenerateDataKey*'
              ])
            })
          ])
        }
      });
    });
  });

  describe('Monitoring and Alerting', () => {
    test('should create SNS topic for alerts', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `security-alerts-${environmentSuffix}`,
        DisplayName: 'Security and Monitoring Alerts'
      });
    });

    test('should create CloudWatch alarms for CPU utilization', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
        EvaluationPeriods: 2,
        Threshold: 80,
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/EC2'
      });

      // Should have 2 alarms (one for each instance)
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      const cpuAlarms = Object.entries(alarms).filter(([key, value]) => 
        value.Properties.MetricName === 'CPUUtilization'
      );
      expect(cpuAlarms).toHaveLength(2);
    });

    test('should create CloudWatch dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `security-monitoring-${environmentSuffix}`
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should export VPC ID', () => {
      template.hasOutput('VpcId', {
        Description: 'VPC ID',
        Export: {
          Name: `${environmentSuffix}-VpcId`
        }
      });
    });

    test('should export Bastion Host ID', () => {
      template.hasOutput('BastionHostId', {
        Description: 'Bastion Host Instance ID',
        Export: {
          Name: `${environmentSuffix}-BastionHostId`
        }
      });
    });

    test('should export Bastion Host Public IP', () => {
      template.hasOutput('BastionHostPublicIp', {
        Description: 'Bastion Host Public IP Address',
        Export: {
          Name: `${environmentSuffix}-BastionHostPublicIp`
        }
      });
    });

    test('should export Private Instance ID', () => {
      template.hasOutput('PrivateInstanceId', {
        Description: 'Private Instance ID',
        Export: {
          Name: `${environmentSuffix}-PrivateInstanceId`
        }
      });
    });

    test('should export S3 Bucket Name', () => {
      template.hasOutput('SecureStorageBucketName', {
        Description: 'Secure Storage S3 Bucket Name',
        Export: {
          Name: `${environmentSuffix}-SecureStorageBucket`
        }
      });
    });

    test('should export SNS Topic ARN', () => {
      template.hasOutput('AlertsTopicArn', {
        Description: 'SNS Topic ARN for Security Alerts',
        Export: {
          Name: `${environmentSuffix}-AlertsTopic`
        }
      });
    });

    test('should export Dashboard URL', () => {
      template.hasOutput('SecurityDashboardUrl', {
        Description: 'CloudWatch Security Dashboard URL'
      });
    });
  });

  describe('Resource Tagging', () => {
    test('should apply consistent tags to all resources', () => {
      // Check that tags are applied at stack level
      const vpc = template.findResources('AWS::EC2::VPC');
      Object.values(vpc).forEach(resource => {
        expect(resource.Properties.Tags).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ Key: 'Environment', Value: environmentSuffix }),
            expect.objectContaining({ Key: 'Project', Value: 'SecureMultiTier' }),
            expect.objectContaining({ Key: 'Compliance', Value: 'Required' }),
            expect.objectContaining({ Key: 'Security', Value: 'High' }),
            expect.objectContaining({ Key: 'Owner', Value: 'Infrastructure' })
          ])
        );
      });
    });
  });

  describe('Deletion Policy', () => {
    test('should have DESTROY deletion policy for stateful resources', () => {
      // KMS Key should be deletable
      const kmsKeys = template.findResources('AWS::KMS::Key');
      Object.values(kmsKeys).forEach(resource => {
        expect(resource.DeletionPolicy).toBe('Delete');
      });

      // S3 Bucket should have auto-delete enabled
      template.hasResource('Custom::S3AutoDeleteObjects', {});
    });
  });
});