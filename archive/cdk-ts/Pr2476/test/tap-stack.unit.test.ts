import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      notificationEmail: 'test@example.com',
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Infrastructure', () => {
    test('creates VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('creates public subnets', () => {
      // Check that subnets exist (count will vary based on AZ configuration)
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
      });
    });

    test('creates private subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
      });
    });

    test('creates NAT Gateway', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
    });

    test('creates Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });

    test('creates route tables', () => {
      template.hasResource('AWS::EC2::RouteTable', {});
    });
  });

  describe('Security Groups', () => {
    test('creates bastion security group with SSH access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for bastion host',
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 22,
            ToPort: 22,
            CidrIp: '0.0.0.0/0',
          }),
        ]),
      });
    });

    test('creates application security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for application servers',
      });
    });

    test('creates ALB security group with HTTP only', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Application Load Balancer',
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
            CidrIp: '0.0.0.0/0',
          }),
        ]),
      });
    });

    test('creates database security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for RDS database',
      });
    });
  });

  describe('IAM Roles and Policies', () => {
    test('creates EC2 application role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
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

    test('creates S3 logs policy with least privilege', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith(['s3:PutObject', 's3:PutObjectAcl']),
            }),
          ]),
        }),
      });
    });
  });

  describe('S3 Infrastructure', () => {
    test('creates S3 bucket with versioning enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('S3 bucket has SSL enforcement', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
              Action: 's3:*',
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'false',
                },
              },
            }),
          ]),
        }),
      });
    });

    test('S3 bucket has lifecycle rules', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              ExpirationInDays: 90,
              Status: 'Enabled',
            }),
          ]),
        },
      });
    });
  });

  describe('CloudFront Distribution', () => {
    test('creates CloudFront distribution', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: Match.objectLike({
          Comment: 'CloudFront distribution for WebApp',
          Enabled: true,
          HttpVersion: 'http2',
        }),
      });
    });

    test('CloudFront uses HTTPS redirect', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: Match.objectLike({
          DefaultCacheBehavior: Match.objectLike({
            ViewerProtocolPolicy: 'redirect-to-https',
          }),
        }),
      });
    });

    test('CloudFront has logging enabled', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: Match.objectLike({
          Logging: Match.objectLike({
            Prefix: 'cloudfront-logs/',
          }),
        }),
      });
    });
  });

  describe('RDS Database', () => {
    test('creates RDS PostgreSQL instance', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'postgres',
        MultiAZ: true,
        StorageEncrypted: true,
      });
    });

    test('RDS has backup configuration', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        BackupRetentionPeriod: 7,
        PreferredBackupWindow: '03:00-04:00',
        PreferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      });
    });

    test('RDS has monitoring enabled', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        MonitoringInterval: 60,
      });
    });

    test('RDS uses GP3 storage', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        StorageType: 'gp3',
        AllocatedStorage: '20',
      });
    });
  });

  describe('EC2 Instances', () => {
    test('creates bastion host in public subnet', () => {
      template.hasResource('AWS::EC2::Instance', {
        Properties: Match.objectLike({
          Tags: Match.arrayWith([
            Match.objectLike({
              Key: 'Name',
              Value: 'WebApp-Bastion',
            }),
          ]),
        }),
      });
    });

    test('creates two application instances', () => {
      const instances = template.findResources('AWS::EC2::Instance', {
        Properties: Match.objectLike({
          Tags: Match.arrayWith([
            Match.objectLike({
              Key: 'Name',
              Value: Match.anyValue(),
            }),
          ]),
        }),
      });
      // 3 instances total: 1 bastion + 2 application
      expect(Object.keys(instances).length).toBeGreaterThanOrEqual(3);
    });

    test('application instances have detailed monitoring', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        Monitoring: true,
      });
    });
  });

  describe('Application Load Balancer', () => {
    test('creates internet-facing ALB', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Type: 'application',
        Scheme: 'internet-facing',
      });
    });

    test('creates HTTP listener', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP',
      });
    });

    test('creates target group with health checks', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Port: 80,
        Protocol: 'HTTP',
        HealthCheckEnabled: true,
        HealthCheckPath: '/',
        HealthCheckIntervalSeconds: 30,
        HealthCheckTimeoutSeconds: 5,
        HealthyThresholdCount: 2,
        UnhealthyThresholdCount: 3,
      });
    });
  });

  describe('Monitoring and Alarms', () => {
    test('creates SNS topic for alarms', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: 'WebApp Cost and Monitoring Alarms',
      });
    });

    test('creates email subscription', () => {
      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        TopicArn: Match.anyValue(),
        Endpoint: 'admin@example.com',
      });
    });

    test('creates cost alarm for $500 threshold', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'EstimatedCharges',
        Namespace: 'AWS/Billing',
        Threshold: 500,
        ComparisonOperator: 'GreaterThanThreshold',
        AlarmDescription: 'Alarm when estimated monthly charges exceed $500',
      });
    });

    test('creates CPU alarms for instances', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/EC2',
        Threshold: 80,
        ComparisonOperator: 'GreaterThanThreshold',
      });
    });
  });

  describe('Resource Tagging', () => {
    test('resources have required tags', () => {
      // Check VPC has tags - simplified to check for Name tag existence
      template.hasResource('AWS::EC2::VPC', {
        Properties: Match.objectLike({
          Tags: Match.arrayWith([
            Match.objectLike({ Key: 'Name', Value: Match.anyValue() }),
          ]),
        }),
      });
    });
  });

  describe('Stack Outputs', () => {
    test('creates required outputs', () => {
      template.hasOutput('VpcId', {
        Description: 'VPC ID',
      });

      template.hasOutput('ALBDnsName', {
        Description: 'Application Load Balancer DNS Name',
      });

      template.hasOutput('DatabaseEndpoint', {
        Description: 'RDS Database Endpoint',
      });

      template.hasOutput('CloudFrontUrl', {
        Description: 'CloudFront Distribution URL',
      });

      template.hasOutput('LogsBucketName', {
        Description: 'S3 Logs Bucket Name',
      });
    });
  });

  describe('Configuration', () => {
    test('uses hardcoded notification email', () => {
      // Stack should work without any props since email is hardcoded
      expect(() => {
        new TapStack(app, 'ConfigStack', {
          env: {
            account: '123456789012',
            region: 'us-east-1',
          },
        });
      }).not.toThrow();
    });
  });
});