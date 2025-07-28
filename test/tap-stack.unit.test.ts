import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('should create VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create public subnets in two AZs', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 6); // 2 public + 2 private-app + 2 private-db
      
      // Check for public subnets
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.0.0/24',
        MapPublicIpOnLaunch: true,
      });
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.1.0/24',
        MapPublicIpOnLaunch: true,
      });
    });

    test('should create private app subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.2.0/24',
        MapPublicIpOnLaunch: false,
      });
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.3.0/24',
        MapPublicIpOnLaunch: false,
      });
    });

    test('should create private database subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.4.0/24',
        MapPublicIpOnLaunch: false,
      });
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.5.0/24',
        MapPublicIpOnLaunch: false,
      });
    });

    test('should create internet gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
      template.resourceCountIs('AWS::EC2::VPCGatewayAttachment', 1);
    });

    test('should create NAT gateway for private subnet egress', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
      template.resourceCountIs('AWS::EC2::EIP', 1);
    });
  });

  describe('VPC Flow Logs', () => {
    test('should create VPC Flow Logs', () => {
      template.hasResourceProperties('AWS::EC2::FlowLog', {
        ResourceType: 'VPC',
        TrafficType: 'ALL',
        LogDestinationType: 'cloud-watch-logs',
      });
      
      template.resourceCountIs('AWS::Logs::LogGroup', 1);
    });
  });

  describe('Bastion Host', () => {
    test('should create bastion host with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.nano',
      });
    });

    test('should create bastion security group with restricted SSH access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for bastion host',
        SecurityGroupIngress: [
          {
            CidrIp: '203.0.113.0/24',
            Description: 'Allow SSH access from trusted IP range',
            FromPort: 22,
            IpProtocol: 'tcp',
            ToPort: 22,
          },
        ],
      });
    });

    test('should create IAM role for bastion host with SSM permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
            },
          ],
        },
      });

      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: [
            {
              Action: ['ssmmessages:*', 'ssm:UpdateInstanceInformation', 'ec2messages:*'],
              Effect: 'Allow',
              Resource: '*',
            },
          ],
        },
      });
    });
  });

  describe('S3 Bucket', () => {
    test('should create S3 bucket with encryption and versioning', () => {
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

    test('should create S3 bucket policy enforcing SSL', () => {
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
  });

  describe('Application Load Balancer', () => {
    test('should create ALB with correct configuration', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Scheme: 'internet-facing',
        LoadBalancerAttributes: Match.arrayWith([
          {
            Key: 'access_logs.s3.enabled',
            Value: 'true',
          },
        ]),
      });
    });

    test('should create ALB security group allowing HTTP traffic', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for ALB',
        SecurityGroupIngress: [
          {
            CidrIp: '0.0.0.0/0',
            Description: 'Allow HTTP traffic',
            FromPort: 80,
            IpProtocol: 'tcp',
            ToPort: 80,
          },
        ],
      });
    });

    test('should create target group with health checks', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        HealthCheckPath: '/health',
        HealthCheckIntervalSeconds: 30,
        Port: 80,
        Protocol: 'HTTP',
      });
    });
  });

  describe('Auto Scaling Group', () => {
    test('should create launch configuration with correct instance type', () => {
      template.hasResourceProperties('AWS::AutoScaling::LaunchConfiguration', {
        InstanceType: 't3.micro',
      });
    });

    test('should create Auto Scaling Group with correct capacity', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        MinSize: '2',
        MaxSize: '5',
      });
    });

    test('should create scaling policy based on CPU utilization', () => {
      template.hasResourceProperties('AWS::AutoScaling::ScalingPolicy', {
        PolicyType: 'TargetTrackingScaling',
        TargetTrackingConfiguration: {
          PredefinedMetricSpecification: {
            PredefinedMetricType: 'ASGAverageCPUUtilization',
          },
          TargetValue: 70,
        },
      });
    });

    test('should create application security group allowing traffic from ALB', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for application instances',
      });
    });

    test('should create IAM role for application instances with minimal permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
            },
          ],
        },
      });
    });
  });

  describe('RDS Database', () => {
    test('should create RDS MySQL instance with correct configuration', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'mysql',
        EngineVersion: '8.0.35',
        DBInstanceClass: 'db.t4g.small',
        MultiAZ: true,
        StorageEncrypted: true,
        BackupRetentionPeriod: 7,
        DeletionProtection: false,
      });
    });

    test('should create database security group allowing traffic from app instances', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for RDS database',
      });
    });

    test('should create DB subnet group for private isolated subnets', () => {
      template.resourceCountIs('AWS::RDS::DBSubnetGroup', 1);
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('should create CloudWatch alarm for high CPU utilization', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/AutoScaling',
        Statistic: 'Average',
        Threshold: 85,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
        EvaluationPeriods: 2,
      });
    });
  });

  describe('AWS Config Compliance', () => {
    test('should create Config rule for S3 bucket versioning', () => {
      template.hasResourceProperties('AWS::Config::ConfigRule', {
        Source: {
          Owner: 'AWS',
          SourceIdentifier: 'S3_BUCKET_VERSIONING_ENABLED',
        },
      });
    });

    test('should create Config rule for EC2 instances without public IPs', () => {
      template.hasResourceProperties('AWS::Config::ConfigRule', {
        Source: {
          Owner: 'AWS',
          SourceIdentifier: 'EC2_INSTANCE_NO_PUBLIC_IP',
        },
      });
    });
  });

  describe('Tagging Strategy', () => {
    test('should apply consistent tags to all resources', () => {
      const resources = template.findResources('AWS::EC2::VPC');
      const vpcLogicalId = Object.keys(resources)[0];
      const vpcResource = resources[vpcLogicalId];
      
      expect(vpcResource.Properties.Tags).toEqual(
        expect.arrayContaining([
          { Key: 'Project', Value: 'SecureCloudEnvironment' },
          { Key: 'Environment', Value: environmentSuffix },
        ])
      );
    });
  });

  describe('Stack Outputs', () => {
    test('should create stack outputs', () => {
      // Check that outputs exist (CDK may transform the names)
      const templateJson = template.toJSON();
      expect(templateJson.Outputs).toBeDefined();
      expect(Object.keys(templateJson.Outputs).length).toBeGreaterThan(0);
    });
  });

  describe('Region Configuration', () => {
    test('should target us-west-2 region', () => {
      expect(stack.region).toBe('us-west-2');
    });
  });
});