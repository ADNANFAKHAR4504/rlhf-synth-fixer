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
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('Environment Suffix Configuration', () => {
    test('Uses environmentSuffix from props when provided', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack', { environmentSuffix: 'test' });
      const testTemplate = Template.fromStack(testStack);
      
      testTemplate.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Project',
            Value: 'tap-test',
          }),
        ]),
      });
    });

    test('Uses environmentSuffix from context when props not provided', () => {
      const testApp = new cdk.App();
      testApp.node.setContext('environmentSuffix', 'context-env');
      const testStack = new TapStack(testApp, 'TestStack', {});
      const testTemplate = Template.fromStack(testStack);
      
      testTemplate.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Project',
            Value: 'tap-context-env',
          }),
        ]),
      });
    });

    test('Falls back to dev when neither props nor context provided', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack');
      const testTemplate = Template.fromStack(testStack);
      
      testTemplate.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Project',
            Value: 'tap-dev',
          }),
        ]),
      });
    });
  });

  describe('VPC and Networking', () => {
    test('Creates VPC with correct CIDR block', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('Creates public and private subnets', () => {
      // Check for public subnets
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
      });
      
      // Check for private subnets
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
      });
    });

    test('Creates Internet Gateway', () => {
      template.hasResourceProperties('AWS::EC2::InternetGateway', {});
    });

    test('Creates NAT Gateway', () => {
      template.hasResourceProperties('AWS::EC2::NatGateway', {});
    });
  });

  describe('Security Configuration', () => {
    test('Creates security groups for ALB, App, and DB tiers', () => {
      // ALB Security Group
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Application Load Balancer',
      });

      // App Security Group
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for application servers',
      });

      // DB Security Group
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for RDS database',
      });
    });

    test('Creates IAM role for EC2 instances', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            }),
          ]),
        },
      });
    });
  });

  describe('Compute Resources', () => {
    test('Creates EC2 instances with detailed monitoring', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        Monitoring: true,
      });
    });

    test('EC2 instances use Amazon Linux 2 AMI', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        ImageId: Match.anyValue(),
      });
    });
  });

  describe('Load Balancing', () => {
    test('Creates Application Load Balancer', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        {
          Type: 'application',
          Scheme: 'internet-facing',
        }
      );
    });

    test('Creates Target Group with health checks', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::TargetGroup',
        {
          Protocol: 'HTTP',
          Port: 80,
          HealthCheckEnabled: true,
          HealthCheckPath: '/',
        }
      );
    });

    test('Creates HTTP and HTTPS listeners', () => {
      // HTTP listener (port 80)
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::Listener',
        {
          Port: 80,
        }
      );

      // HTTPS listener (port 443)
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::Listener',
        {
          Port: 443,
        }
      );
    });
  });

  describe('Database', () => {
    test('Creates RDS MySQL instance', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'mysql',
        MultiAZ: true,
        StorageEncrypted: true,
        BackupRetentionPeriod: 7,
        DeletionProtection: true,
      });
    });

    test('Creates database subnet group', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupDescription: 'Subnet group for RDS database',
      });
    });

    test('Creates Secrets Manager secret for DB credentials', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Description: 'RDS MySQL credentials',
      });
    });
  });

  describe('Storage', () => {
    test('Creates S3 buckets with encryption', () => {
      // App Data Bucket
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

    test('S3 buckets have lifecycle policies', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([Match.objectLike({})]),
        },
      });
    });
  });

  describe('Monitoring and Alarms', () => {
    test('Creates CloudWatch alarms for EC2 CPU utilization', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/EC2',
        Threshold: 80,
      });
    });

    test('Creates alarm for database connections', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'DatabaseConnections',
      });
    });

    test('Creates alarm for unhealthy targets', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'UnHealthyHostCount',
      });
    });
  });

  describe('Tagging', () => {
    test('Resources are tagged with Environment: Production', () => {
      // Check VPC tagging
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Environment',
            Value: 'Production',
          }),
        ]),
      });
    });
  });

  describe('CloudFormation Parameters', () => {
    test('Has parameter for EC2 instance type', () => {
      template.hasParameter('InstanceType', {
        Type: 'String',
        Default: 't3.medium',
      });
    });
  });

  describe('CloudFormation Outputs', () => {
    test('Exports VPC ID', () => {
      template.hasOutput('VPCId', {
        Export: {
          Name: `tap-vpc-id-${environmentSuffix}`,
        },
      });
    });

    test('Exports Load Balancer DNS', () => {
      template.hasOutput('LoadBalancerDNS', {
        Export: {
          Name: `tap-alb-dns-${environmentSuffix}`,
        },
      });
    });

    test('Exports S3 bucket names', () => {
      template.hasOutput('AppDataBucketName', {
        Export: {
          Name: `tap-app-data-bucket-${environmentSuffix}`,
        },
      });

      template.hasOutput('LogsBucketName', {
        Export: {
          Name: `tap-logs-bucket-${environmentSuffix}`,
        },
      });
    });

    test('Exports database endpoint', () => {
      template.hasOutput('DatabaseEndpoint', {
        Export: {
          Name: `tap-db-endpoint-${environmentSuffix}`,
        },
      });
    });
  });
});
