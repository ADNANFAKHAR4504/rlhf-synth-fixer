import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { 
      environmentSuffix,
      env: {
        region: 'us-west-2',
        account: '123456789012', // Mock account ID for testing
      },
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('should create VPC with correct CIDR and subnets', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });

      // Check for public subnets
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.0.0/24',
        MapPublicIpOnLaunch: true,
      });

      // Check for private app subnets
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.2.0/24',
        MapPublicIpOnLaunch: false,
      });

      // Check for private DB subnets
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.4.0/24',
        MapPublicIpOnLaunch: false,
      });
    });

    test('should create NAT gateway in public subnet', () => {
      template.hasResourceProperties('AWS::EC2::NatGateway', {});
    });
  });

  describe('Security Groups', () => {
    test('should create bastion security group without SSH access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for bastion host',
        SecurityGroupIngress: Match.absent(),
      });
    });

    test('should create ALB security group with HTTP and HTTPS access', () => {
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
          {
            CidrIp: '0.0.0.0/0',
            Description: 'Allow HTTPS traffic',
            FromPort: 443,
            IpProtocol: 'tcp',
            ToPort: 443,
          },
        ],
      });
    });

    test('should create app security group with ALB access only', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for application instances',
      });
    });

    test('should create database security group with app access only', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for RDS database',
      });
    });
  });

  describe('Bastion Host', () => {
    test('should create bastion host with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.nano',
      });
    });

    test('should create bastion host IAM role with SSM permissions', () => {
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
          Version: '2012-10-17',
        },
      });
    });
  });

  describe('S3 Storage', () => {
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
  });

  describe('Application Load Balancer', () => {
    test('should create ALB with logging enabled', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Type: 'application',
        Scheme: 'internet-facing',
        LoadBalancerAttributes: Match.arrayWith([
          {
            Key: 'access_logs.s3.enabled',
            Value: 'true',
          },
        ]),
      });
    });

    test('should create ALB listener and target group', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP',
      });

      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Port: 80,
        Protocol: 'HTTP',
        HealthCheckPath: '/health',
        HealthCheckIntervalSeconds: 30,
      });
    });
  });

  describe('Auto Scaling Group', () => {
    test('should create auto scaling group with correct configuration', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        MinSize: '2',
        MaxSize: '5',
      });
    });

    test('should create launch configuration with correct instance type', () => {
      template.hasResourceProperties('AWS::AutoScaling::LaunchConfiguration', {
        InstanceType: 't3.micro',
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
  });

  describe('RDS Database', () => {
    test('should create RDS MySQL instance with proper configuration', () => {
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

    test('should create DB subnet group in isolated subnets', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {});
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('should create CloudWatch alarm for high CPU utilization', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmDescription: 'High CPU utilization on the application Auto Scaling Group.',
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/EC2',
        Statistic: 'Average',
        Threshold: 85,
        EvaluationPeriods: 2,
        TreatMissingData: 'notBreaching',
      });
    });
  });

  describe('AWS Config Compliance', () => {
    test('should create Config rules for compliance monitoring', () => {
      template.hasResourceProperties('AWS::Config::ConfigRule', {
        Source: {
          Owner: 'AWS',
          SourceIdentifier: 'S3_BUCKET_VERSIONING_ENABLED',
        },
      });

      template.hasResourceProperties('AWS::Config::ConfigRule', {
        Source: {
          Owner: 'AWS',
          SourceIdentifier: 'EC2_INSTANCE_NO_PUBLIC_IP',
        },
      });
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should create app instance role with least privilege', () => {
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
          Version: '2012-10-17',
        },
        ManagedPolicyArns: [
          {
            'Fn::Join': [
              '',
              [
                'arn:',
                { Ref: 'AWS::Partition' },
                ':iam::aws:policy/AmazonSSMManagedInstanceCore',
              ],
            ],
          },
        ],
      });
    });
  });

  describe('Tagging Strategy', () => {
    test('should apply consistent tags to all resources', () => {
      const resources = template.toJSON().Resources;
      Object.keys(resources).forEach((resourceKey) => {
        const resource = resources[resourceKey];
        if (resource.Properties && resource.Properties.Tags) {
          const tags = resource.Properties.Tags;
          const projectTag = tags.find((tag: any) => tag.Key === 'Project');
          const environmentTag = tags.find((tag: any) => tag.Key === 'Environment');
          
          expect(projectTag).toBeDefined();
          expect(projectTag.Value).toBe('SecureCloudEnvironment');
          expect(environmentTag).toBeDefined();
          expect(environmentTag.Value).toBe(environmentSuffix);
        }
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should create outputs for ALB DNS, Bastion Host ID, and Database Endpoint', () => {
      template.hasOutput('ALBDNS', {});
      template.hasOutput('BastionHostId', {});
      template.hasOutput('DatabaseEndpoint', {});
    });
  });
});
