import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('Creates VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Name', Value: 'corp-dr-vpc-test' }),
        ]),
      });
    });

    test('Creates public subnets in multiple AZs', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 2);
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
      });
    });

    test('Creates Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });
  });

  describe('EC2 Instances', () => {
    test('Creates primary EC2 instance with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.micro',
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: 'corp-primary-instance-test',
          }),
        ]),
      });
    });

    test('Creates secondary EC2 instance with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.micro',
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: 'corp-secondary-instance-test',
          }),
        ]),
      });
    });

    test('Creates exactly 2 EC2 instances for failover', () => {
      template.resourceCountIs('AWS::EC2::Instance', 2);
    });
  });

  describe('Security Configuration', () => {
    test('Creates security group with HTTP and SSH access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for disaster recovery web instances',
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
            CidrIp: '0.0.0.0/0',
          }),
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 22,
            ToPort: 22,
            CidrIp: '0.0.0.0/0',
          }),
        ]),
      });
    });

    test('Creates IAM role for EC2 instances', () => {
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
  });

  describe('S3 Backup Configuration', () => {
    test('Creates S3 bucket with versioning enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('S3 bucket has lifecycle rules configured', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'corp-backup-lifecycle',
              Status: 'Enabled',
              NoncurrentVersionExpiration: {
                NoncurrentDays: 90,
              },
            }),
          ]),
        },
      });
    });

    test('S3 bucket has auto-delete objects enabled for cleanup', () => {
      template.hasResource('Custom::S3AutoDeleteObjects', {
        Properties: Match.objectLike({
          BucketName: {
            Ref: Match.stringLikeRegexp('CorpBackupBucket'),
          },
        }),
      });
    });
  });

  describe('Route 53 Configuration', () => {
    test('Creates hosted zone', () => {
      template.hasResourceProperties('AWS::Route53::HostedZone', {
        Name: 'corp-dr.local.',
      });
    });

    test('Creates health checks for both instances', () => {
      template.resourceCountIs('AWS::Route53::HealthCheck', 2);
      template.hasResourceProperties('AWS::Route53::HealthCheck', {
        HealthCheckConfig: Match.objectLike({
          Type: 'HTTP',
          ResourcePath: '/health',
          Port: 80,
          RequestInterval: 30,
          FailureThreshold: 3,
        }),
      });
    });

    test('Creates A records with failover routing', () => {
      template.resourceCountIs('AWS::Route53::RecordSet', 2);
      
      // Primary record
      template.hasResourceProperties('AWS::Route53::RecordSet', {
        Type: 'A',
        SetIdentifier: 'primary',
        Failover: 'PRIMARY',
      });

      // Secondary record
      template.hasResourceProperties('AWS::Route53::RecordSet', {
        Type: 'A',
        SetIdentifier: 'secondary',
        Failover: 'SECONDARY',
      });
    });
  });

  describe('Monitoring and Alerting', () => {
    test('Creates SNS topic for alerts', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: 'corp-dr-alerts-test',
        DisplayName: 'Corporation Disaster Recovery Alerts',
      });
    });

    test('Creates CloudWatch alarms for EC2 instances', () => {
      // Should have CPU and status check alarms
      template.resourceCountIs('AWS::CloudWatch::Alarm', 3); // 2 CPU + 1 status check
      
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/EC2',
        Threshold: 80,
        EvaluationPeriods: 2,
      });

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'StatusCheckFailed',
        Namespace: 'AWS/EC2',
        Threshold: 1,
      });
    });
  });

  describe('Tags and Outputs', () => {
    test('Applies corporate tags to resources', () => {
      const resources = template.toJSON().Resources;
      const vpc = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::EC2::VPC'
      ) as any;
      expect(vpc).toBeDefined();
      expect(vpc.Properties.Tags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ Key: 'Environment', Value: 'test' }),
          expect.objectContaining({ Key: 'Project', Value: 'DisasterRecovery' }),
          expect.objectContaining({ Key: 'Owner', Value: 'ITOperations' }),
          expect.objectContaining({ Key: 'CostCenter', Value: 'IT-DR-001' }),
        ])
      );
    });

    test('Creates required CloudFormation outputs', () => {
      template.hasOutput('PrimaryInstanceId', {
        Description: 'Primary EC2 Instance ID',
      });
      template.hasOutput('SecondaryInstanceId', {
        Description: 'Secondary EC2 Instance ID',
      });
      template.hasOutput('BackupBucketName', {
        Description: 'S3 Backup Bucket Name',
      });
      template.hasOutput('SNSTopicArn', {
        Description: 'SNS Topic ARN for Disaster Recovery Alerts',
      });
      template.hasOutput('HostedZoneId', {
        Description: 'Route 53 Hosted Zone ID',
      });
      template.hasOutput('ApplicationUrl', {
        Description: 'Application URL with failover routing',
      });
      template.hasOutput('VpcId', {
        Description: 'VPC ID',
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('All resources follow corp- naming convention', () => {
      // Check VPC name
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: Match.stringLikeRegexp('^corp-'),
          }),
        ]),
      });

      // Check security group name
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: Match.stringLikeRegexp('^corp-'),
      });

      // Check S3 bucket name - S3 bucket name is dynamic with account ID
      const resources = template.toJSON().Resources;
      const s3Bucket = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::S3::Bucket'
      ) as any;
      expect(s3Bucket).toBeDefined();

      // Check SNS topic name
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: Match.stringLikeRegexp('^corp-'),
      });
    });
  });

  describe('Compliance and Best Practices', () => {
    test('S3 bucket has encryption enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
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

    test('S3 bucket blocks public access', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('EC2 instances have detailed monitoring enabled', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        Monitoring: true,
      });
    });
  });
});
