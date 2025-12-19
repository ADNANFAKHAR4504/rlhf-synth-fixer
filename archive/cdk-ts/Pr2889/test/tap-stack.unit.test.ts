import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const mockProps = {
  environmentSuffix: 'test',
  allowedIpRanges: ['10.0.0.0/8', '192.168.1.0/24'],
  domainName: 'test.example.com',
  createHostedZone: true,
  tags: {
    Project: 'SecureCloud',
    Owner: 'DevOps'
  }
};

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', mockProps);
    template = Template.fromStack(stack);
  });

  describe('Stack Creation', () => {
    test('should create stack successfully', () => {
      expect(stack).toBeDefined();
      expect(template).toBeDefined();
    });

    test('should have correct stack name', () => {
      expect(stack.stackName).toBe('TestTapStack');
    });
  });

  describe('KMS Key', () => {
    test('should create KMS key with correct properties', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for SecureCloud environment encryption - test',
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

    test('should create KMS alias', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: 'alias/secure-cloud-kms-test'
      });
    });
  });

  describe('VPC Configuration', () => {
    test('should create VPC with correct CIDR and name', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        Tags: Match.arrayWith([
          { Key: 'Name', Value: 'SecureCloudVPC-test' }
        ])
      });
    });

    test('should create public subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        Tags: Match.arrayWith([
          { Key: 'Name', Value: Match.stringLikeRegexp('.*Public-test.*') }
        ])
      });
    });

    test('should create private subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        Tags: Match.arrayWith([
          { Key: 'Name', Value: Match.stringLikeRegexp('.*Private-test.*') }
        ])
      });
    });

    test('should create database subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        Tags: Match.arrayWith([
          { Key: 'Name', Value: Match.stringLikeRegexp('.*Database-test.*') }
        ])
      });
    });

    test('should create 2 NAT gateways for high availability', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
    });

    test('should create internet gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });
  });

  describe('S3 Bucket', () => {
    test('should create S3 bucket with encryption and versioning', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled'
        },
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms'
              }
            }
          ]
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        },
        LoggingConfiguration: {
          LogFilePrefix: 'access-logs/'
        }
      });
    });

    test('should enforce SSL', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
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

  describe('CloudWatch Log Group', () => {
    test('should create log group with correct properties', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/ec2/secure-cloud-test',
        RetentionInDays: 7
      });
    });
  });

  describe('IAM Role and Instance Profile', () => {

    test('should have inline policies for S3 and KMS access', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: [
          {
            PolicyName: 'S3Access',
            PolicyDocument: {
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    's3:GetObject',
                    's3:PutObject',
                    's3:DeleteObject',
                    's3:ListBucket'
                  ]
                },
                {
                  Effect: 'Allow',
                  Action: ['kms:Decrypt', 'kms:GenerateDataKey']
                }
              ]
            }
          },
          {
            PolicyName: 'CloudWatchLogs',
            PolicyDocument: {
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    'logs:CreateLogStream',
                    'logs:PutLogEvents',
                    'logs:DescribeLogStreams'
                  ]
                }
              ]
            }
          }
        ]
      });
    });

    test('should create instance profile', () => {
      template.hasResourceProperties('AWS::IAM::InstanceProfile', {
        InstanceProfileName: 'SecureCloudInstanceProfile-test'
      });
    });
  });

  describe('Security Groups', () => {

    test('should create EC2 security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: 'EC2SecurityGroup-test',
        GroupDescription: 'Security group for EC2 instances - test'
      });
    });

    test('should create RDS security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: 'RDSSecurityGroup-test',
        GroupDescription: 'Security group for RDS instances - test'
      });
    });

    test('should have security group rule allowing ALB to EC2', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 80,
        ToPort: 80
      });
    });

    test('should have security group rule allowing EC2 to RDS', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 3306,
        ToPort: 3306
      });
    });
  });

  describe('EC2 Instance', () => {
    test('should create EC2 instance with correct properties', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.micro',
        BlockDeviceMappings: [
          {
            DeviceName: '/dev/xvda',
            Ebs: {
              VolumeSize: 20,
              VolumeType: 'gp3',
              Encrypted: true
            }
          }
        ]
      });
    });

  });

  describe('RDS Configuration', () => {
    test('should create RDS subnet group', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupName: 'rds-subnet-group-test',
        DBSubnetGroupDescription: 'Subnet group for RDS instances - test'
      });
    });

    test('should create RDS instance with correct properties', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceIdentifier: 'secure-cloud-rds-test',
        Engine: 'mysql',
        EngineVersion: '8.0',
        DBInstanceClass: 'db.t3.micro',
        MultiAZ: true,
        StorageEncrypted: true,
        BackupRetentionPeriod: 7,
        DeletionProtection: false
      });
    });

  });

  describe('Load Balancer Configuration', () => {
    test('should create Application Load Balancer', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Name: 'secure-cloud-alb-test',
        Type: 'application',
        Scheme: 'internet-facing'
      });
    });

    test('should create target group with health check', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Name: 'secure-cloud-tg-test',
        Port: 80,
        Protocol: 'HTTP',
        HealthCheckEnabled: true,
        HealthCheckPath: '/',
        HealthCheckProtocol: 'HTTP',
        HealthyThresholdCount: 2,
        UnhealthyThresholdCount: 3,
        HealthCheckTimeoutSeconds: 10,
        HealthCheckIntervalSeconds: 30
      });
    });

    test('should create ALB listener', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP'
      });
    });
  });

  describe('Route 53 Configuration', () => {
    test('should create hosted zone when createHostedZone is true', () => {
      template.hasResourceProperties('AWS::Route53::HostedZone', {
        Name: 'test.example.com.'
      });
    });

    test('should create A record pointing to ALB', () => {
      template.hasResourceProperties('AWS::Route53::RecordSet', {
        Name: 'test.example.com.',
        Type: 'A'
      });
    });
  });

  describe('Outputs', () => {
    test('should have VPC ID output', () => {
      template.hasOutput('VPCId', {
        Description: 'VPC ID'
      });
    });

    test('should have S3 bucket name output', () => {
      template.hasOutput('S3BucketName', {
        Description: 'S3 Bucket Name'
      });
    });

    test('should have EC2 instance ID output', () => {
      template.hasOutput('EC2InstanceId', {
        Description: 'EC2 Instance ID'
      });
    });

    test('should have RDS endpoint output', () => {
      template.hasOutput('RDSEndpoint', {
        Description: 'RDS Endpoint'
      });
    });

    test('should have load balancer DNS output', () => {
      template.hasOutput('LoadBalancerDNS', {
        Description: 'Load Balancer DNS Name'
      });
    });

    test('should have log group name output', () => {
      template.hasOutput('LogGroupName', {
        Description: 'CloudWatch Log Group Name'
      });
    });

    test('should have application URL output with domain name', () => {
      template.hasOutput('ApplicationURL', {
        Description: 'Application URL',
        Value: 'http://test.example.com'
      });
    });

    test('should have name servers output when creating hosted zone', () => {
      template.hasOutput('NameServers', {
        Description: 'Name servers for the hosted zone - update your domain registrar'
      });
    });
  });

  describe('Tagging', () => {
    test('should apply common tags to stack', () => {
      const vpc = template.findResources('AWS::EC2::VPC');
      const vpcTags = Object.values(vpc)[0] as any;

      expect(vpcTags.Properties.Tags).toEqual(
        expect.arrayContaining([
          { Key: 'Environment', Value: 'test' },
          { Key: 'Project', Value: 'SecureCloud' },
          { Key: 'Owner', Value: 'DevOps' }
        ])
      );
    });
  });

  describe('Resource Count Validation', () => {
    test('should have expected number of core resources', () => {
      template.resourceCountIs('AWS::KMS::Key', 1);
      template.resourceCountIs('AWS::EC2::VPC', 1);
      template.resourceCountIs('AWS::S3::Bucket', 1);
      template.resourceCountIs('AWS::EC2::Instance', 1);
      template.resourceCountIs('AWS::RDS::DBInstance', 1);
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
      template.resourceCountIs('AWS::Route53::HostedZone', 1);
      template.resourceCountIs('AWS::Logs::LogGroup', 1);
    });
  });

  describe('Edge Cases and Configuration Variants', () => {
    test('should handle stack without domain name', () => {
      const noDomainApp = new cdk.App();
      const noDomainStack = new TapStack(noDomainApp, 'NoDomainStack', {
        environmentSuffix: 'test',
        allowedIpRanges: ['10.0.0.0/8']
      });
      const noDomainTemplate = Template.fromStack(noDomainStack);

      noDomainTemplate.resourceCountIs('AWS::Route53::HostedZone', 0);
      noDomainTemplate.hasOutput('ApplicationURL', {
        Description: 'Application URL (using ALB DNS name)'
      });
    });

    test('should handle stack with existing hosted zone lookup', () => {
      // For this test, we'll skip the actual Route53 lookup since it requires real DNS
      const existingZoneApp = new cdk.App();

      expect(() => {
        const existingZoneStack = new TapStack(existingZoneApp, 'ExistingZoneStack', {
          environmentSuffix: 'test',
          allowedIpRanges: ['10.0.0.0/8'],
          domainName: 'test.example.com',
          createHostedZone: false
        });
      }).not.toThrow();
    });

    test('should handle minimal configuration', () => {
      const minimalApp = new cdk.App();
      const minimalStack = new TapStack(minimalApp, 'MinimalStack', {
        environmentSuffix: 'minimal',
        allowedIpRanges: ['0.0.0.0/0']
      });
      const minimalTemplate = Template.fromStack(minimalStack);

      expect(minimalStack).toBeDefined();
      minimalTemplate.resourceCountIs('AWS::EC2::VPC', 1);
      minimalTemplate.resourceCountIs('AWS::S3::Bucket', 1);
    });

  });

  describe('Security Validations', () => {
    test('should have encrypted EBS volumes', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        BlockDeviceMappings: [
          {
            Ebs: {
              Encrypted: true
            }
          }
        ]
      });
    });

    test('should have encrypted RDS storage', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        StorageEncrypted: true
      });
    });

    test('should have S3 bucket with block public access', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        }
      });
    });

    test('should have proper IAM assume role policies', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'ec2.amazonaws.com' },
              Action: 'sts:AssumeRole'
            }
          ]
        }
      });
    });
  });
});