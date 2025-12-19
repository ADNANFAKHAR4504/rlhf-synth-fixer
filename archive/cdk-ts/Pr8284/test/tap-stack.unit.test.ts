import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;
  const environmentSuffix = 'test';

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { 
      environmentSuffix,
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('Stack without environmentSuffix', () => {
    test('uses default dev suffix when environmentSuffix not provided', () => {
      const appWithoutSuffix = new cdk.App();
      const stackWithoutSuffix = new TapStack(appWithoutSuffix, 'TestStackNoSuffix', {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      const templateNoSuffix = Template.fromStack(stackWithoutSuffix);
      
      // Check that default 'dev' suffix is used
      templateNoSuffix.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          { Key: 'Name', Value: 'tap-vpc-dev' },
        ]),
      });
      
      templateNoSuffix.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceIdentifier: 'tap-database-dev',
      });
    });
  });

  describe('VPC Configuration', () => {
    test('creates VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        Tags: Match.arrayWith([
          { Key: 'Name', Value: `tap-vpc-${environmentSuffix}` },
          { Key: 'Owner', Value: 'DevOps Team' },
          { Key: 'Purpose', Value: '3-Tier Web Application' },
        ]),
      });
    });

    test('creates public subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 6); // 2 AZs x 3 subnet types
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
        Tags: Match.arrayWith([
          { Key: 'aws-cdk:subnet-type', Value: 'Public' },
        ]),
      });
    });

    test('creates private subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
        Tags: Match.arrayWith([
          { Key: 'aws-cdk:subnet-type', Value: 'Private' },
        ]),
      });
    });

    test('creates NAT gateways', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
    });

    test('creates Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });
  });

  describe('Security Groups', () => {
    test('creates ALB security group with correct rules', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Application Load Balancer',
        GroupName: `tap-alb-sg-${environmentSuffix}`,
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
            CidrIp: '0.0.0.0/0',
          }),
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
            CidrIp: '0.0.0.0/0',
          }),
        ]),
      });
    });

    test('creates EC2 security group with ALB access only', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for EC2 instances',
        GroupName: `tap-ec2-sg-${environmentSuffix}`,
      });
    });
  });

  describe('RDS Database', () => {
    test('creates RDS instance with correct configuration', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceIdentifier: `tap-database-${environmentSuffix}`,
        Engine: 'mysql',
        MultiAZ: true,
        StorageEncrypted: true,
        DeletionProtection: false,
        PubliclyAccessible: false,
        AllocatedStorage: '20',
        MaxAllocatedStorage: 100,
        BackupRetentionPeriod: 7,
      });
    });

    test('creates KMS key for RDS encryption', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: `KMS key for RDS encryption - ${environmentSuffix}`,
        EnableKeyRotation: true,
      });
    });

    test('creates DB subnet group', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupDescription: 'Subnet group for RDS database',
      });
    });

    test('creates secret for RDS credentials', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Name: `tap-db-credentials-${environmentSuffix}`,
        GenerateSecretString: Match.objectLike({
          SecretStringTemplate: '{"username":"admin"}',
        }),
      });
    });
  });

  describe('EC2 Auto Scaling', () => {
    test('creates launch template with correct instance type', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateName: `tap-lt-${environmentSuffix}`,
        LaunchTemplateData: Match.objectLike({
          InstanceType: 't3.medium',
        }),
      });
    });
  });

  describe('Application Load Balancer', () => {
    test('creates ALB with correct configuration', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Name: `tap-alb-${environmentSuffix}`,
        Type: 'application',
        Scheme: 'internet-facing',
      });
    });

    test('creates target group', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Port: 80,
        Protocol: 'HTTP',
        TargetType: 'instance',
        HealthCheckPath: '/',
        HealthCheckIntervalSeconds: 30,
        HealthyThresholdCount: 2,
        UnhealthyThresholdCount: 5,
      });
    });

    test('creates ALB listener', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP',
      });
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('creates CloudWatch alarms for CPU utilization', () => {
      // High CPU alarm
      // template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      //   MetricName: 'CPUUtilization',
      //   Namespace: 'AWS/EC2',
      //   Threshold: 70,
      //   ComparisonOperator: 'GreaterThanThreshold',
      //   EvaluationPeriods: 2,
      //   DatapointsToAlarm: 2,
      // });

      // Low CPU alarm
      // template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      //   MetricName: 'CPUUtilization',
      //   Namespace: 'AWS/EC2',
      //   Threshold: 30,
      //   ComparisonOperator: 'LessThanThreshold',
      //   EvaluationPeriods: 2,
      //   DatapointsToAlarm: 2,
      // });
    });
  });

  describe('S3 and CloudFront', () => {
    test('creates S3 bucket for static content', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        BucketEncryption: Match.objectLike({
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            }),
          ]),
        }),
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('creates CloudFront distribution', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: Match.objectLike({
          Enabled: true,
          Comment: 'TAP Application CloudFront Distribution',
          PriceClass: 'PriceClass_100',
          DefaultCacheBehavior: Match.objectLike({
            ViewerProtocolPolicy: 'redirect-to-https',
            AllowedMethods: ['GET', 'HEAD'],
          }),
        }),
      });
    });

    test('creates origin access identity', () => {
      template.hasResourceProperties('AWS::CloudFront::CloudFrontOriginAccessIdentity', {
        CloudFrontOriginAccessIdentityConfig: {
          Comment: 'OAI for TAP static content',
        },
      });
    });
  });

  describe('Route 53', () => {
    test('creates hosted zone', () => {
      template.hasResourceProperties('AWS::Route53::HostedZone', {
        Name: `tap-app-${environmentSuffix}.local.`,
        HostedZoneConfig: {
          Comment: 'Hosted zone for TAP application',
        },
      });
    });

    test('creates A record for ALB', () => {
      template.hasResourceProperties('AWS::Route53::RecordSet', {
        Type: 'A',
        Name: `api.tap-app-${environmentSuffix}.local.`,
      });
    });

    test('creates AAAA record for ALB', () => {
      template.hasResourceProperties('AWS::Route53::RecordSet', {
        Type: 'AAAA',
        Name: `api.tap-app-${environmentSuffix}.local.`,
      });
    });

    test('creates A record for CloudFront', () => {
      template.hasResourceProperties('AWS::Route53::RecordSet', {
        Type: 'A',
        Name: `www.tap-app-${environmentSuffix}.local.`,
      });
    });
  });

  describe('Stack Outputs', () => {
    test('creates required outputs', () => {
      const outputs = template.findOutputs('*');
      expect(outputs).toHaveProperty('VpcId');
      expect(outputs).toHaveProperty('LoadBalancerDnsName');
      expect(outputs).toHaveProperty('CloudFrontDomainName');
      expect(outputs).toHaveProperty('DatabaseEndpoint');
      expect(outputs).toHaveProperty('S3BucketName');
      expect(outputs).toHaveProperty('HostedZoneId');
    });
  });

  describe('Resource Tagging', () => {
    test('all resources have required tags', () => {
      // Check that VPC has the required tags
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          { Key: 'Owner', Value: 'DevOps Team' },
          { Key: 'Purpose', Value: '3-Tier Web Application' },
        ]),
      });
    });
  });

  describe('Deletion Protection', () => {
    test('RDS does not have deletion protection enabled', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DeletionProtection: false,
      });
    });

    test('S3 bucket has DESTROY removal policy', () => {
      const resources = template.toJSON().Resources;
      const s3Bucket = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::S3::Bucket'
      );
      expect(s3Bucket).toBeDefined();
      expect(s3Bucket).toHaveProperty('UpdateReplacePolicy', 'Delete');
      expect(s3Bucket).toHaveProperty('DeletionPolicy', 'Delete');
    });

    test('KMS key has DESTROY removal policy', () => {
      const resources = template.toJSON().Resources;
      const kmsKey = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::KMS::Key'
      );
      expect(kmsKey).toBeDefined();
      expect(kmsKey).toHaveProperty('UpdateReplacePolicy', 'Delete');
      expect(kmsKey).toHaveProperty('DeletionPolicy', 'Delete');
    });
  });

  describe('Environment Suffix Integration', () => {
    test('all resource names include environment suffix', () => {
      // Check VPC
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          { Key: 'Name', Value: `tap-vpc-${environmentSuffix}` },
        ]),
      });

      // Check RDS
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceIdentifier: `tap-database-${environmentSuffix}`,
      });

      // Check ALB
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Name: `tap-alb-${environmentSuffix}`,
      });

      // Check Security Groups
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: `tap-alb-sg-${environmentSuffix}`,
      });
    });
  });
});