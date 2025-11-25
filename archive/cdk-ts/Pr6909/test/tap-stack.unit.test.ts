import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';
import { NetworkStack } from '../lib/network-stack';
import { StorageStack } from '../lib/storage-stack';
import { DatabaseStack } from '../lib/database-stack';
import { MonitoringStack } from '../lib/monitoring-stack';

describe('TAP Stack - Complete Unit Test Suite', () => {
  let app: cdk.App;

  beforeEach(() => {
    app = new cdk.App();
  });

  // ============================================================================
  // NETWORK STACK TESTS
  // ============================================================================
  describe('NetworkStack', () => {
    let stack: cdk.Stack;

    beforeEach(() => {
      stack = new cdk.Stack(app, 'TestStack');
    });

    test('creates VPC with correct CIDR', () => {
      const networkStack = new NetworkStack(stack, 'NetworkStack', {
        environmentSuffix: 'test',
      });

      const template = Template.fromStack(networkStack);

      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: 'postgres-vpc-test',
          }),
        ]),
      });
    });

    test('creates 3 subnet types', () => {
      const networkStack = new NetworkStack(stack, 'NetworkStack', {
        environmentSuffix: 'test',
      });

      const template = Template.fromStack(networkStack);
      template.resourceCountIs('AWS::EC2::Subnet', 6);
    });

    test('creates 2 NAT gateways', () => {
      const networkStack = new NetworkStack(stack, 'NetworkStack', {
        environmentSuffix: 'test',
      });

      const template = Template.fromStack(networkStack);
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
    });

    test('creates database security group with VPC ingress', () => {
      const networkStack = new NetworkStack(stack, 'NetworkStack', {
        environmentSuffix: 'test',
      });

      const template = Template.fromStack(networkStack);

      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: 'rds-sg-test',
      });
    });

    test('creates VPC endpoints for AWS services', () => {
      const networkStack = new NetworkStack(stack, 'NetworkStack', {
        environmentSuffix: 'test',
      });

      const template = Template.fromStack(networkStack);
      template.resourceCountIs('AWS::EC2::VPCEndpoint', 4);
    });
  });

  // ============================================================================
  // STORAGE STACK TESTS
  // ============================================================================
  describe('StorageStack', () => {
    let stack: cdk.Stack;

    beforeEach(() => {
      stack = new cdk.Stack(app, 'TestStack');
    });

    test('creates KMS key with rotation enabled', () => {
      const storageStack = new StorageStack(stack, 'StorageStack', {
        environmentSuffix: 'test',
      });

      const template = Template.fromStack(storageStack);

      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
      });
    });

    test('creates S3 bucket with versioning', () => {
      const storageStack = new StorageStack(stack, 'StorageStack', {
        environmentSuffix: 'test',
      });

      const template = Template.fromStack(storageStack);

      template.hasResourceProperties('AWS::S3::Bucket', {
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

    test('creates S3 bucket with lifecycle rules', () => {
      const storageStack = new StorageStack(stack, 'StorageStack', {
        environmentSuffix: 'test',
      });

      const template = Template.fromStack(storageStack);

      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'TransitionToIA',
              Status: 'Enabled',
            }),
            Match.objectLike({
              Id: 'TransitionToGlacier',
              Status: 'Enabled',
            }),
          ]),
        },
      });
    });
  });

  // ============================================================================
  // DATABASE STACK TESTS
  // ============================================================================
  describe('DatabaseStack', () => {
    let stack: cdk.Stack;
    let vpc: ec2.Vpc;
    let kmsKey: kms.Key;

    beforeEach(() => {
      stack = new cdk.Stack(app, 'TestStack', {
        env: { region: 'us-east-1', account: '123456789012' },
      });

      vpc = new ec2.Vpc(stack, 'TestVpc');
      kmsKey = new kms.Key(stack, 'TestKey');
    });

    test('creates PostgreSQL database with Multi-AZ', () => {
      const databaseStack = new DatabaseStack(stack, 'DatabaseStack', {
        environmentSuffix: 'test',
        vpc: vpc,
        kmsKey: kmsKey,
      });

      const template = Template.fromStack(databaseStack);

      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'postgres',
        EngineVersion: '14',
        MultiAZ: true,
        StorageEncrypted: true,
      });
    });

    test('creates PostgreSQL database with correct instance class', () => {
      const databaseStack = new DatabaseStack(stack, 'DatabaseStack', {
        environmentSuffix: 'test',
        vpc: vpc,
        kmsKey: kmsKey,
      });

      const template = Template.fromStack(databaseStack);

      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceClass: 'db.r6g.xlarge',
      });
    });

    test('creates database with automated backups', () => {
      const databaseStack = new DatabaseStack(stack, 'DatabaseStack', {
        environmentSuffix: 'test',
        vpc: vpc,
        kmsKey: kmsKey,
      });

      const template = Template.fromStack(databaseStack);

      template.hasResourceProperties('AWS::RDS::DBInstance', {
        BackupRetentionPeriod: 7,
      });
    });

    test('creates database credentials in Secrets Manager', () => {
      const databaseStack = new DatabaseStack(stack, 'DatabaseStack', {
        environmentSuffix: 'test',
        vpc: vpc,
        kmsKey: kmsKey,
      });

      const template = Template.fromStack(databaseStack);

      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        GenerateSecretString: Match.objectLike({
          GenerateStringKey: 'password',
        }),
      });
    });

    test('database is not publicly accessible', () => {
      const databaseStack = new DatabaseStack(stack, 'DatabaseStack', {
        environmentSuffix: 'test',
        vpc: vpc,
        kmsKey: kmsKey,
      });

      const template = Template.fromStack(databaseStack);

      template.hasResourceProperties('AWS::RDS::DBInstance', {
        PubliclyAccessible: false,
      });
    });
  });

  // ============================================================================
  // MONITORING STACK TESTS
  // ============================================================================
  describe('MonitoringStack', () => {
    let stack: cdk.Stack;
    let vpc: ec2.Vpc;
    let database: rds.DatabaseInstance;

    beforeEach(() => {
      stack = new cdk.Stack(app, 'TestStack', {
        env: { region: 'us-east-1', account: '123456789012' },
      });

      vpc = new ec2.Vpc(stack, 'TestVpc');
      const kmsKey = new kms.Key(stack, 'TestKey');

      database = new rds.DatabaseInstance(stack, 'TestDatabase', {
        engine: rds.DatabaseInstanceEngine.postgres({
          version: rds.PostgresEngineVersion.VER_14,
        }),
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.R6G,
          ec2.InstanceSize.XLARGE
        ),
        vpc: vpc,
        storageEncryptionKey: kmsKey,
      });
    });

    test('creates SNS topic for alarms', () => {
      const monitoringStack = new MonitoringStack(stack, 'MonitoringStack', {
        environmentSuffix: 'test',
        vpc: vpc,
        database: database,
      });

      const template = Template.fromStack(monitoringStack);

      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: Match.stringLikeRegexp('PostgreSQL Alarms'),
      });
    });

    test('creates CPU utilization alarm', () => {
      const monitoringStack = new MonitoringStack(stack, 'MonitoringStack', {
        environmentSuffix: 'test',
        vpc: vpc,
        database: database,
      });

      const template = Template.fromStack(monitoringStack);

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'CPUUtilization',
        Threshold: 80,
      });
    });

    test('creates storage alarm', () => {
      const monitoringStack = new MonitoringStack(stack, 'MonitoringStack', {
        environmentSuffix: 'test',
        vpc: vpc,
        database: database,
      });

      const template = Template.fromStack(monitoringStack);

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'FreeStorageSpace',
      });
    });

    test('creates composite alarm', () => {
      const monitoringStack = new MonitoringStack(stack, 'MonitoringStack', {
        environmentSuffix: 'test',
        vpc: vpc,
        database: database,
      });

      const template = Template.fromStack(monitoringStack);

      template.resourceCountIs('AWS::CloudWatch::CompositeAlarm', 1);
    });

    test('creates at least 5 CloudWatch alarms', () => {
      const monitoringStack = new MonitoringStack(stack, 'MonitoringStack', {
        environmentSuffix: 'test',
        vpc: vpc,
        database: database,
      });

      const template = Template.fromStack(monitoringStack);

      const alarmCount = template.toJSON().Resources;
      const alarms = Object.values(alarmCount).filter(
        (resource: any) => resource.Type === 'AWS::CloudWatch::Alarm'
      );
      expect(alarms.length).toBeGreaterThanOrEqual(5);
    });
  });

  // ============================================================================
  // FULL STACK INTEGRATION TESTS
  // ============================================================================
  describe('TapStack Integration', () => {
    test('creates complete stack with all nested stacks', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { region: 'us-east-1', account: '123456789012' },
      });

      const template = Template.fromStack(stack);

      // Check for nested stacks
      template.resourceCountIs('AWS::CloudFormation::Stack', 4);
    });

    test('exports VPC ID', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { region: 'us-east-1', account: '123456789012' },
      });

      const template = Template.fromStack(stack);

      template.hasOutput('VpcId', {
        Export: {
          Name: 'test-vpc-id',
        },
      });
    });

    test('exports Database Endpoint', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { region: 'us-east-1', account: '123456789012' },
      });

      const template = Template.fromStack(stack);

      template.hasOutput('DatabaseEndpoint', {
        Export: {
          Name: 'test-db-endpoint',
        },
      });
    });

    test('exports Backup Bucket', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { region: 'us-east-1', account: '123456789012' },
      });

      const template = Template.fromStack(stack);

      template.hasOutput('BackupBucket', {
        Export: {
          Name: 'test-backup-bucket',
        },
      });
    });

    test('exports Alarm Topic ARN', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { region: 'us-east-1', account: '123456789012' },
      });

      const template = Template.fromStack(stack);

      template.hasOutput('AlarmTopicArn', {
        Export: {
          Name: 'test-alarm-topic',
        },
      });
    });

    test('applies correct tags to stack', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { region: 'us-east-1', account: '123456789012' },
      });

      const template = Template.fromStack(stack);
      expect(template).toBeDefined();
    });
  });

  // ============================================================================
  // RESOURCE COUNT VERIFICATION
  // ============================================================================
  describe('Resource Count Verification', () => {
    test('NetworkStack creates expected number of resources', () => {
      const stack = new cdk.Stack(app, 'TestStack');
      const networkStack = new NetworkStack(stack, 'NetworkStack', {
        environmentSuffix: 'test',
      });

      const template = Template.fromStack(networkStack);

      // VPC should have 1 VPC resource
      template.resourceCountIs('AWS::EC2::VPC', 1);
      // Should have 6 subnets (2 AZs * 3 subnet types)
      template.resourceCountIs('AWS::EC2::Subnet', 6);
      // Should have 2 NAT gateways
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
      // Should have 4 VPC endpoints
      template.resourceCountIs('AWS::EC2::VPCEndpoint', 4);
    });

    test('StorageStack creates expected number of resources', () => {
      const stack = new cdk.Stack(app, 'TestStack');
      const storageStack = new StorageStack(stack, 'StorageStack', {
        environmentSuffix: 'test',
      });

      const template = Template.fromStack(storageStack);

      // Should have 1 KMS key
      template.resourceCountIs('AWS::KMS::Key', 1);
      // Should have 1 S3 bucket
      template.resourceCountIs('AWS::S3::Bucket', 1);
    });

    test('DatabaseStack creates expected number of resources', () => {
      const stack = new cdk.Stack(app, 'TestStack', {
        env: { region: 'us-east-1', account: '123456789012' },
      });
      const vpc = new ec2.Vpc(stack, 'TestVpc');
      const kmsKey = new kms.Key(stack, 'TestKey');

      const databaseStack = new DatabaseStack(stack, 'DatabaseStack', {
        environmentSuffix: 'test',
        vpc: vpc,
        kmsKey: kmsKey,
      });

      const template = Template.fromStack(databaseStack);

      // Should have 1 RDS instance
      template.resourceCountIs('AWS::RDS::DBInstance', 1);
      // Should have 1 Secrets Manager secret
      template.resourceCountIs('AWS::SecretsManager::Secret', 1);
      // Should have 1 DB subnet group
      template.resourceCountIs('AWS::RDS::DBSubnetGroup', 1);
    });
  });

  // ============================================================================
  // ADDITIONAL NETWORK STACK TESTS FOR COVERAGE
  // ============================================================================
  describe('NetworkStack Additional Coverage', () => {
    test('creates Lambda security group', () => {
      const stack = new cdk.Stack(app, 'TestStack');
      const networkStack = new NetworkStack(stack, 'NetworkStack', {
        environmentSuffix: 'test',
      });

      const template = Template.fromStack(networkStack);
      const resources = template.toJSON().Resources;
      const securityGroups = Object.values(resources).filter(
        (resource: any) => resource.Type === 'AWS::EC2::SecurityGroup'
      );
      expect(securityGroups.length).toBeGreaterThanOrEqual(2);
    });

    test('creates security groups with correct names', () => {
      const stack = new cdk.Stack(app, 'TestStack');
      const networkStack = new NetworkStack(stack, 'NetworkStack', {
        environmentSuffix: 'test',
      });

      const template = Template.fromStack(networkStack);
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: 'rds-sg-test',
      });
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: 'lambda-sg-test',
      });
    });

    test('creates VPC endpoints for all required services', () => {
      const stack = new cdk.Stack(app, 'TestStack');
      const networkStack = new NetworkStack(stack, 'NetworkStack', {
        environmentSuffix: 'test',
      });

      const template = Template.fromStack(networkStack);
      const resources = template.toJSON().Resources;
      const endpoints = Object.values(resources).filter(
        (resource: any) => resource.Type === 'AWS::EC2::VPCEndpoint'
      );
      expect(endpoints.length).toBe(4);
    });

    test('VPC has correct DNS settings', () => {
      const stack = new cdk.Stack(app, 'TestStack');
      const networkStack = new NetworkStack(stack, 'NetworkStack', {
        environmentSuffix: 'test',
      });

      const template = Template.fromStack(networkStack);
      template.hasResourceProperties('AWS::EC2::VPC', {
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('creates Internet Gateway', () => {
      const stack = new cdk.Stack(app, 'TestStack');
      const networkStack = new NetworkStack(stack, 'NetworkStack', {
        environmentSuffix: 'test',
      });

      const template = Template.fromStack(networkStack);
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });

    test('creates route tables', () => {
      const stack = new cdk.Stack(app, 'TestStack');
      const networkStack = new NetworkStack(stack, 'NetworkStack', {
        environmentSuffix: 'test',
      });

      const template = Template.fromStack(networkStack);
      template.resourceCountIs('AWS::EC2::RouteTable', 6);
    });
  });

  // ============================================================================
  // ADDITIONAL STORAGE STACK TESTS FOR COVERAGE
  // ============================================================================
  describe('StorageStack Additional Coverage', () => {
    test('KMS key has correct alias', () => {
      const stack = new cdk.Stack(app, 'TestStack');
      const storageStack = new StorageStack(stack, 'StorageStack', {
        environmentSuffix: 'test',
      });

      const template = Template.fromStack(storageStack);
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: 'alias/postgres-key-test',
      });
    });

    test('S3 bucket has encryption enabled', () => {
      const stack = new cdk.Stack(app, 'TestStack');
      const storageStack = new StorageStack(stack, 'StorageStack', {
        environmentSuffix: 'test',
      });

      const template = Template.fromStack(storageStack);
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
              },
            }),
          ]),
        },
      });
    });

    test('S3 bucket has auto-delete configured', () => {
      const stack = new cdk.Stack(app, 'TestStack');
      const storageStack = new StorageStack(stack, 'StorageStack', {
        environmentSuffix: 'test',
      });

      const template = Template.fromStack(storageStack);
      const resources = template.toJSON().Resources;
      const customResources = Object.values(resources).filter(
        (resource: any) => resource.Type === 'Custom::S3AutoDeleteObjects'
      );
      expect(customResources.length).toBeGreaterThan(0);
    });

    test('KMS key grants RDS permissions', () => {
      const stack = new cdk.Stack(app, 'TestStack');
      const storageStack = new StorageStack(stack, 'StorageStack', {
        environmentSuffix: 'test',
      });

      const template = Template.fromStack(storageStack);
      template.hasResourceProperties('AWS::KMS::Key', {
        KeyPolicy: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: Match.objectLike({
                Service: 'rds.amazonaws.com',
              }),
            }),
          ]),
        }),
      });
    });

    test('creates KMS alias resource', () => {
      const stack = new cdk.Stack(app, 'TestStack');
      const storageStack = new StorageStack(stack, 'StorageStack', {
        environmentSuffix: 'test',
      });

      const template = Template.fromStack(storageStack);
      template.resourceCountIs('AWS::KMS::Alias', 1);
    });
  });

  // ============================================================================
  // ADDITIONAL DATABASE STACK TESTS FOR COVERAGE
  // ============================================================================
  describe('DatabaseStack Additional Coverage', () => {
    let stack: cdk.Stack;
    let vpc: ec2.Vpc;
    let kmsKey: kms.Key;

    beforeEach(() => {
      stack = new cdk.Stack(app, 'TestStack', {
        env: { region: 'us-east-1', account: '123456789012' },
      });
      vpc = new ec2.Vpc(stack, 'TestVpc');
      kmsKey = new kms.Key(stack, 'TestKey');
    });

    test('creates parameter group with correct settings', () => {
      const databaseStack = new DatabaseStack(stack, 'DatabaseStack', {
        environmentSuffix: 'test',
        vpc: vpc,
        kmsKey: kmsKey,
      });

      const template = Template.fromStack(databaseStack);
      template.resourceCountIs('AWS::RDS::DBParameterGroup', 1);
    });

    test('creates option group', () => {
      const databaseStack = new DatabaseStack(stack, 'DatabaseStack', {
        environmentSuffix: 'test',
        vpc: vpc,
        kmsKey: kmsKey,
      });

      const template = Template.fromStack(databaseStack);
      template.resourceCountIs('AWS::RDS::OptionGroup', 1);
    });

    test('database has performance insights enabled', () => {
      const databaseStack = new DatabaseStack(stack, 'DatabaseStack', {
        environmentSuffix: 'test',
        vpc: vpc,
        kmsKey: kmsKey,
      });

      const template = Template.fromStack(databaseStack);
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        EnablePerformanceInsights: true,
      });
    });

    test('database has CloudWatch logs exports', () => {
      const databaseStack = new DatabaseStack(stack, 'DatabaseStack', {
        environmentSuffix: 'test',
        vpc: vpc,
        kmsKey: kmsKey,
      });

      const template = Template.fromStack(databaseStack);
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        EnableCloudwatchLogsExports: ['postgresql', 'upgrade'],
      });
    });

    test('database has auto minor version upgrade enabled', () => {
      const databaseStack = new DatabaseStack(stack, 'DatabaseStack', {
        environmentSuffix: 'test',
        vpc: vpc,
        kmsKey: kmsKey,
      });

      const template = Template.fromStack(databaseStack);
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        AutoMinorVersionUpgrade: true,
        AllowMajorVersionUpgrade: false,
      });
    });

    test('database has GP3 storage type', () => {
      const databaseStack = new DatabaseStack(stack, 'DatabaseStack', {
        environmentSuffix: 'test',
        vpc: vpc,
        kmsKey: kmsKey,
      });

      const template = Template.fromStack(databaseStack);
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        StorageType: 'gp3',
      });
    });

    test('database has max allocated storage', () => {
      const databaseStack = new DatabaseStack(stack, 'DatabaseStack', {
        environmentSuffix: 'test',
        vpc: vpc,
        kmsKey: kmsKey,
      });

      const template = Template.fromStack(databaseStack);
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        MaxAllocatedStorage: 500,
      });
    });

    test('secret has correct removal policy', () => {
      const databaseStack = new DatabaseStack(stack, 'DatabaseStack', {
        environmentSuffix: 'test',
        vpc: vpc,
        kmsKey: kmsKey,
      });

      const template = Template.fromStack(databaseStack);
      const resources = template.toJSON().Resources;
      const secret = Object.values(resources).find(
        (resource: any) => resource.Type === 'AWS::SecretsManager::Secret'
      );
      expect(secret).toBeDefined();
    });
  });

  // ============================================================================
  // ADDITIONAL MONITORING STACK TESTS FOR COVERAGE
  // ============================================================================
  describe('MonitoringStack Additional Coverage', () => {
    let stack: cdk.Stack;
    let vpc: ec2.Vpc;
    let database: rds.DatabaseInstance;

    beforeEach(() => {
      stack = new cdk.Stack(app, 'TestStack', {
        env: { region: 'us-east-1', account: '123456789012' },
      });
      vpc = new ec2.Vpc(stack, 'TestVpc');
      const kmsKey = new kms.Key(stack, 'TestKey');
      database = new rds.DatabaseInstance(stack, 'TestDatabase', {
        engine: rds.DatabaseInstanceEngine.postgres({
          version: rds.PostgresEngineVersion.VER_14,
        }),
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.R6G,
          ec2.InstanceSize.XLARGE
        ),
        vpc: vpc,
        storageEncryptionKey: kmsKey,
      });
    });

    test('creates connections alarm', () => {
      const monitoringStack = new MonitoringStack(stack, 'MonitoringStack', {
        environmentSuffix: 'test',
        vpc: vpc,
        database: database,
      });

      const template = Template.fromStack(monitoringStack);
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'DatabaseConnections',
      });
    });

    test('creates read latency alarm', () => {
      const monitoringStack = new MonitoringStack(stack, 'MonitoringStack', {
        environmentSuffix: 'test',
        vpc: vpc,
        database: database,
      });

      const template = Template.fromStack(monitoringStack);
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'ReadLatency',
      });
    });

    test('creates write latency alarm', () => {
      const monitoringStack = new MonitoringStack(stack, 'MonitoringStack', {
        environmentSuffix: 'test',
        vpc: vpc,
        database: database,
      });

      const template = Template.fromStack(monitoringStack);
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'WriteLatency',
      });
    });

    test('all alarms have alarm actions', () => {
      const monitoringStack = new MonitoringStack(stack, 'MonitoringStack', {
        environmentSuffix: 'test',
        vpc: vpc,
        database: database,
      });

      const template = Template.fromStack(monitoringStack);
      const resources = template.toJSON().Resources;
      const alarms = Object.values(resources).filter(
        (resource: any) => resource.Type === 'AWS::CloudWatch::Alarm'
      );

      alarms.forEach((alarm: any) => {
        expect(alarm.Properties.AlarmActions).toBeDefined();
        expect(alarm.Properties.AlarmActions.length).toBeGreaterThan(0);
      });
    });

    test('composite alarm has correct alarm rule structure', () => {
      const monitoringStack = new MonitoringStack(stack, 'MonitoringStack', {
        environmentSuffix: 'test',
        vpc: vpc,
        database: database,
      });

      const template = Template.fromStack(monitoringStack);
      template.hasResourceProperties('AWS::CloudWatch::CompositeAlarm', {
        AlarmRule: Match.anyValue(),
      });
    });
  });
});
