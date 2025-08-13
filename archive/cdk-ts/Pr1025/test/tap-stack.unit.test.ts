import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';
import { NetworkingConstruct } from '../lib/networking-construct';
import { SecurityConstruct } from '../lib/security-construct';
import { ComputeConstruct } from '../lib/compute-construct';
import { DatabaseConstruct } from '../lib/database-construct';
import { StorageConstruct } from '../lib/storage-construct';
import { MonitoringConstruct } from '../lib/monitoring-construct';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { 
      environmentSuffix,
      env: {
        account: '123456789012',
        region: 'us-west-2'
      }
    });
    template = Template.fromStack(stack);
  });

  describe('Stack Structure', () => {
    test('creates all required constructs', () => {
      // Check VPC exists
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true
      });

      // Check security groups exist
      template.resourceCountIs('AWS::EC2::SecurityGroup', 2);
      
      // Check EC2 instances exist
      template.resourceCountIs('AWS::EC2::Instance', 2);
      
      // Check RDS database exists
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'mysql',
        DBInstanceClass: 'db.t3.micro'
      });
      
      // Check S3 buckets exist
      template.resourceCountIs('AWS::S3::Bucket', 2);
      
      // Check WAF WebACL exists
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Scope: 'REGIONAL'
      });
      
      // Check CloudWatch alarms exist (CPU, Status, DB connections)
      template.resourceCountIs('AWS::CloudWatch::Alarm', 5); // 2 CPU + 2 status + 1 DB
      
      // Check SNS topic exists
      template.resourceCountIs('AWS::SNS::Topic', 1);
    });

    test('creates stack outputs', () => {
      // Check all required outputs exist
      template.hasOutput('VpcId', {
        Description: 'VPC ID'
      });
      
      template.hasOutput('DatabaseEndpoint', {
        Description: 'RDS Database Endpoint'
      });
      
      template.hasOutput('S3BucketName', {
        Description: 'S3 Bucket Name'
      });
      
      template.hasOutput('WAFWebAclArn', {
        Description: 'WAF Web ACL ARN'
      });
      
      template.hasOutput('DashboardUrl', {
        Description: 'CloudWatch Dashboard URL'
      });
    });

    test('applies correct tags', () => {
      const tags = cdk.Tags.of(stack);
      // Tags are applied at the app level, so we check resource tagging
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Environment', Value: environmentSuffix })
        ])
      });
    });
  });

  describe('Networking Infrastructure', () => {
    test('creates VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true
      });
    });

    test('creates public and private subnets', () => {
      // Check public subnets
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'aws-cdk:subnet-type', Value: 'Public' })
        ])
      });

      // Check private subnets
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'aws-cdk:subnet-type', Value: 'Private' })
        ])
      });
    });

    test('creates Internet Gateway and NAT Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
    });

    test('creates route tables with correct routes', () => {
      // Public route to IGW
      template.hasResourceProperties('AWS::EC2::Route', {
        DestinationCidrBlock: '0.0.0.0/0',
        GatewayId: Match.anyValue()
      });

      // Private route to NAT
      template.hasResourceProperties('AWS::EC2::Route', {
        DestinationCidrBlock: '0.0.0.0/0',
        NatGatewayId: Match.anyValue()
      });
    });
  });

  describe('Security Infrastructure', () => {
    test('creates web security group with correct rules', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for web application servers',
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            FromPort: 80,
            ToPort: 80,
            IpProtocol: 'tcp',
            CidrIp: '0.0.0.0/0'
          }),
          Match.objectLike({
            FromPort: 443,
            ToPort: 443,
            IpProtocol: 'tcp',
            CidrIp: '0.0.0.0/0'
          })
        ])
      });
    });

    test('creates database security group with restricted access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for RDS database'
      });

      // Check ingress rule from web security group
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        FromPort: 3306,
        ToPort: 3306,
        IpProtocol: 'tcp'
      });
    });

    test('creates WAF WebACL with managed rule groups', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Scope: 'REGIONAL',
        Rules: Match.arrayWith([
          Match.objectLike({
            Name: 'AWSManagedRulesCommonRuleSet',
            Statement: {
              ManagedRuleGroupStatement: {
                Name: 'AWSManagedRulesCommonRuleSet',
                VendorName: 'AWS'
              }
            }
          }),
          Match.objectLike({
            Name: 'AWSManagedRulesKnownBadInputsRuleSet',
            Statement: {
              ManagedRuleGroupStatement: {
                Name: 'AWSManagedRulesKnownBadInputsRuleSet',
                VendorName: 'AWS'
              }
            }
          })
        ])
      });
    });
  });

  describe('Compute Infrastructure', () => {
    test('creates EC2 instances with correct configuration', () => {
      template.resourceCountIs('AWS::EC2::Instance', 2);
      
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.micro',
        UserData: Match.anyValue()
      });
    });

    test('creates IAM role for EC2 instances', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: Match.objectLike({
                Service: 'ec2.amazonaws.com'
              })
            })
          ])
        })
      });
    });

    test('creates instance profiles', () => {
      template.resourceCountIs('AWS::IAM::InstanceProfile', 2);
    });
  });

  describe('Database Infrastructure', () => {
    test('creates RDS MySQL database', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'mysql',
        EngineVersion: '8.0',
        DBInstanceClass: 'db.t3.micro',
        AllocatedStorage: '20',
        StorageEncrypted: true,
        MultiAZ: false,
        DeletionProtection: false
      });
    });

    test('creates database secret', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        GenerateSecretString: Match.objectLike({
          SecretStringTemplate: '{"username":"admin"}'
        })
      });
    });

    test('creates DB subnet group', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupDescription: Match.anyValue(),
        SubnetIds: Match.anyValue()
      });
    });

    test('enables CloudWatch logs for database', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        EnableCloudwatchLogsExports: Match.arrayWith(['error', 'general', 'slowquery'])
      });
    });
  });

  describe('Storage Infrastructure', () => {
    test('creates S3 buckets with encryption', () => {
      template.resourceCountIs('AWS::S3::Bucket', 2);
      
      // Check main bucket
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256'
              }
            })
          ])
        },
        VersioningConfiguration: {
          Status: 'Enabled'
        }
      });
    });

    test('creates bucket with lifecycle rules', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Status: 'Enabled'
            })
          ])
        }
      });
    });

    test('enables access logging', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LoggingConfiguration: Match.objectLike({
          DestinationBucketName: Match.anyValue(),
          LogFilePrefix: 'access-logs/'
        })
      });
    });

    test('blocks public access', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        }
      });
    });
  });

  describe('Monitoring Infrastructure', () => {
    test('creates CloudWatch alarms', () => {
      // CPU alarms
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        Threshold: 80,
        EvaluationPeriods: 2
      });

      // Status check alarms
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        Threshold: 1,
        EvaluationPeriods: 1
      });

      // Database connection alarm
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        Threshold: 80
      });
    });

    test('creates SNS topic for alarms', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: 'Web Application Alarms'
      });
    });

    test('creates CloudWatch dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: Match.stringLikeRegexp('WebApp-Dashboard-.*')
      });
    });
  });

  describe('NetworkingConstruct', () => {
    test('creates VPC with specified properties', () => {
      const testApp = new cdk.App();
      const testStack = new cdk.Stack(testApp, 'TestNetworkingStack');
      const networking = new NetworkingConstruct(testStack, 'TestNetworking', {
        environmentSuffix: 'test'
      });

      const template = Template.fromStack(testStack);
      
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true
      });

      expect(networking.vpc).toBeDefined();
      expect(networking.publicSubnets).toBeDefined();
      expect(networking.privateSubnets).toBeDefined();
    });
  });

  describe('SecurityConstruct', () => {
    test('creates security groups and WAF', () => {
      const testApp = new cdk.App();
      const testStack = new cdk.Stack(testApp, 'TestSecurityStack');
      const vpc = new ec2.Vpc(testStack, 'TestVpc');
      
      const security = new SecurityConstruct(testStack, 'TestSecurity', {
        vpc,
        environmentSuffix: 'test'
      });

      const template = Template.fromStack(testStack);
      
      template.resourceCountIs('AWS::EC2::SecurityGroup', 2);
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Scope: 'REGIONAL'
      });

      expect(security.webSecurityGroup).toBeDefined();
      expect(security.dbSecurityGroup).toBeDefined();
      expect(security.webAcl).toBeDefined();
    });
  });

  describe('ComputeConstruct', () => {
    test('creates EC2 instances with IAM role', () => {
      const testApp = new cdk.App();
      const testStack = new cdk.Stack(testApp, 'TestComputeStack');
      const vpc = new ec2.Vpc(testStack, 'TestVpc');
      const securityGroup = new ec2.SecurityGroup(testStack, 'TestSG', { vpc });
      
      const compute = new ComputeConstruct(testStack, 'TestCompute', {
        vpc,
        environmentSuffix: 'test',
        securityGroup
      });

      const template = Template.fromStack(testStack);
      
      template.resourceCountIs('AWS::EC2::Instance', 2);
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: Match.objectLike({
                Service: 'ec2.amazonaws.com'
              })
            })
          ])
        })
      });

      expect(compute.instances).toBeDefined();
      expect(compute.instances.length).toBe(2);
      expect(compute.role).toBeDefined();
    });
  });

  describe('DatabaseConstruct', () => {
    test('creates RDS database with security', () => {
      const testApp = new cdk.App();
      const testStack = new cdk.Stack(testApp, 'TestDatabaseStack');
      const vpc = new ec2.Vpc(testStack, 'TestVpc');
      const securityGroup = new ec2.SecurityGroup(testStack, 'TestSG', { vpc });
      
      const database = new DatabaseConstruct(testStack, 'TestDatabase', {
        vpc,
        environmentSuffix: 'test',
        securityGroup
      });

      const template = Template.fromStack(testStack);
      
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'mysql',
        StorageEncrypted: true
      });
      
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        GenerateSecretString: Match.objectLike({
          SecretStringTemplate: '{"username":"admin"}'
        })
      });

      expect(database.database).toBeDefined();
      expect(database.credentials).toBeDefined();
    });
  });

  describe('StorageConstruct', () => {
    test('creates S3 buckets with proper configuration', () => {
      const testApp = new cdk.App();
      const testStack = new cdk.Stack(testApp, 'TestStorageStack');
      
      const storage = new StorageConstruct(testStack, 'TestStorage', {
        environmentSuffix: 'test'
      });

      const template = Template.fromStack(testStack);
      
      template.resourceCountIs('AWS::S3::Bucket', 2);
      
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256'
              }
            })
          ])
        }
      });

      expect(storage.bucket).toBeDefined();
      expect(storage.logBucket).toBeDefined();
    });
  });

  describe('MonitoringConstruct', () => {
    test('creates monitoring resources', () => {
      const testApp = new cdk.App();
      const testStack = new cdk.Stack(testApp, 'TestMonitoringStack');
      const vpc = new ec2.Vpc(testStack, 'TestVpc');
      const instance = new ec2.Instance(testStack, 'TestInstance', {
        vpc,
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
        machineImage: ec2.MachineImage.latestAmazonLinux2023()
      });
      
      // Import cloudwatch to create proper metric
      const cloudwatch = require('aws-cdk-lib/aws-cloudwatch');
      const dbInstance = {
        instanceIdentifier: 'test-db',
        instanceEndpoint: {
          hostname: 'test.rds.amazonaws.com',
          port: 3306
        },
        metricDatabaseConnections: () => new cloudwatch.Metric({
          namespace: 'AWS/RDS',
          metricName: 'DatabaseConnections'
        })
      } as any;
      
      const monitoring = new MonitoringConstruct(testStack, 'TestMonitoring', {
        environmentSuffix: 'test',
        instances: [instance],
        database: dbInstance
      });

      const template = Template.fromStack(testStack);
      
      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: 'Web Application Alarms'
      });
      
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: Match.stringLikeRegexp('WebApp-Dashboard-.*')
      });

      expect(monitoring.alarmTopic).toBeDefined();
      expect(monitoring.dashboard).toBeDefined();
    });
  });

  describe('Environment Suffix Handling', () => {
    test('applies environment suffix to resource names', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestEnvStack', { 
        environmentSuffix: 'prod123',
        env: {
          account: '123456789012',
          region: 'us-west-2'
        }
      });
      
      const template = Template.fromStack(testStack);
      
      // Check WAF name includes suffix
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Name: 'webapp-waf-prod123'
      });
      
      // Check SNS topic name includes suffix
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: 'webapp-alarms-prod123'
      });
    });

    test('uses default suffix when none provided', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestDefaultStack');
      
      const template = Template.fromStack(testStack);
      
      // Check uses 'dev' as default suffix
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Name: 'webapp-waf-dev'
      });
    });

    test('gets suffix from context when not in props', () => {
      const testApp = new cdk.App({
        context: {
          environmentSuffix: 'fromcontext'
        }
      });
      const testStack = new TapStack(testApp, 'TestContextStack');
      
      const template = Template.fromStack(testStack);
      
      // Check uses context suffix
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Name: 'webapp-waf-fromcontext'
      });
    });
  });
});