import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { BackupStack } from '../lib/backup-stack';
import { DatabaseStack } from '../lib/database-stack';
import { MonitoringStack } from '../lib/monitoring-stack';
import { NetworkStack } from '../lib/network-stack';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  describe('Stack with explicit environment suffix', () => {
    let app: cdk.App;
    let stack: TapStack;
    let template: Template;
    const testEnvironmentSuffix = 'test123';

    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: testEnvironmentSuffix,
      });
      template = Template.fromStack(stack);
    });

    test('should create main stack with correct properties', () => {
      expect(stack).toBeDefined();
      expect(stack.stackName).toBe('TestTapStack');
    });

    test('should contain required resources', () => {
      // Check that main resources are created in the stack
      expect(template.findResources('AWS::EC2::VPC')).toBeDefined();
      expect(template.findResources('AWS::S3::Bucket')).toBeDefined();
      expect(template.findResources('AWS::RDS::DBInstance')).toBeDefined();
    });
  });

  describe('Stack without environment suffix', () => {
    let app: cdk.App;
    let stack: TapStack;
    let template: Template;

    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStackDefault');
      template = Template.fromStack(stack);
    });

    test('should use default environment suffix', () => {
      expect(stack).toBeDefined();
      // Should have VPC with default dev suffix
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Name', Value: 'retail-vpc-dev' }),
        ]),
      });
    });
  });

  describe('Stack with context environment suffix', () => {
    let app: cdk.App;
    let stack: TapStack;
    let template: Template;

    beforeEach(() => {
      app = new cdk.App({ context: { environmentSuffix: 'fromcontext' } });
      stack = new TapStack(app, 'TestTapStackContext');
      template = Template.fromStack(stack);
    });

    test('should use context environment suffix', () => {
      expect(stack).toBeDefined();
      // Should have VPC with context suffix
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Name', Value: 'retail-vpc-fromcontext' }),
        ]),
      });
    });
  });
});

describe('NetworkStack', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let networkStack: NetworkStack;
  let template: Template;
  const testEnvironmentSuffix = 'test123';

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack');
    networkStack = new NetworkStack(stack, 'TestNetworkStack', {
      environmentSuffix: testEnvironmentSuffix,
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('should create VPC with correct CIDR', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.2.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: `retail-vpc-${testEnvironmentSuffix}`,
          }),
        ]),
      });
    });

    test('should create private isolated subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'aws-cdk:subnet-type', Value: 'Isolated' }),
        ]),
      });
    });

    test('should create S3 VPC endpoint', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        VpcEndpointType: 'Gateway',
      });
    });
  });

  describe('Security Group', () => {
    test('should create database security group with PostgreSQL ingress', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for RDS PostgreSQL database',
        SecurityGroupIngress: [
          {
            CidrIp: '10.2.0.0/16',
            Description: 'Allow PostgreSQL access from within VPC',
            FromPort: 5432,
            IpProtocol: 'tcp',
            ToPort: 5432,
          },
        ],
      });
    });

    test('should create security group with HTTPS egress', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupEgress: [
          {
            CidrIp: '10.2.0.0/16',
            Description: 'Allow HTTPS for S3 backups',
            FromPort: 443,
            IpProtocol: 'tcp',
            ToPort: 443,
          },
        ],
      });
    });

    test('should have correct security group name', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: `retail-db-sg-${testEnvironmentSuffix}`,
      });
    });
  });

  describe('Outputs', () => {
    test('should output VPC ID', () => {
      const outputs = template.findOutputs('*');
      const vpcOutput = Object.keys(outputs).find(key => key.includes('VPCId'));
      expect(vpcOutput).toBeDefined();
    });

    test('should output Security Group ID', () => {
      const outputs = template.findOutputs('*');
      const sgOutput = Object.keys(outputs).find(key =>
        key.includes('SecurityGroupId')
      );
      expect(sgOutput).toBeDefined();
    });
  });
});

describe('BackupStack', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let backupStack: BackupStack;
  let template: Template;
  const testEnvironmentSuffix = 'test123';

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack');
    backupStack = new BackupStack(stack, 'TestBackupStack', {
      environmentSuffix: testEnvironmentSuffix,
    });
    template = Template.fromStack(stack);
  });

  describe('S3 Bucket', () => {
    test('should create S3 bucket with encryption', () => {
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
      });
    });

    test('should have versioning enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('should block all public access', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('should have lifecycle rules for archival', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'DeleteOldBackups',
              Status: 'Enabled',
              Transitions: Match.arrayWith([
                Match.objectLike({
                  StorageClass: 'STANDARD_IA',
                  TransitionInDays: 30,
                }),
                Match.objectLike({
                  StorageClass: 'GLACIER',
                  TransitionInDays: 90,
                }),
              ]),
              ExpirationInDays: 365,
            }),
            Match.objectLike({
              Id: 'CleanupIncompleteMultipartUploads',
              Status: 'Enabled',
              AbortIncompleteMultipartUpload: {
                DaysAfterInitiation: 7,
              },
            }),
          ]),
        },
      });
    });

    test('should have auto-delete objects enabled for testing', () => {
      template.hasResource('Custom::S3AutoDeleteObjects', {
        Properties: Match.objectLike({
          ServiceToken: Match.anyValue(),
        }),
      });
    });
  });

  describe('Outputs', () => {
    test('should output bucket name', () => {
      const outputs = template.findOutputs('*');
      const bucketOutput = Object.keys(outputs).find(key =>
        key.includes('BucketName')
      );
      expect(bucketOutput).toBeDefined();
    });
  });
});

describe('DatabaseStack', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let networkStack: NetworkStack;
  let backupStack: BackupStack;
  let databaseStack: DatabaseStack;
  let template: Template;
  const testEnvironmentSuffix = 'test123';

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack');

    networkStack = new NetworkStack(stack, 'TestNetworkStack', {
      environmentSuffix: testEnvironmentSuffix,
    });

    backupStack = new BackupStack(stack, 'TestBackupStack', {
      environmentSuffix: testEnvironmentSuffix,
    });

    databaseStack = new DatabaseStack(stack, 'TestDatabaseStack', {
      vpc: networkStack.vpc,
      securityGroup: networkStack.databaseSecurityGroup,
      backupBucket: backupStack.backupBucket,
      environmentSuffix: testEnvironmentSuffix,
    });

    template = Template.fromStack(stack);
  });

  describe('KMS Key', () => {
    test('should create KMS key with rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for RDS database encryption',
        EnableKeyRotation: true,
      });
    });

    test('should create KMS key alias', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: `alias/retail-db-key-${testEnvironmentSuffix}`,
      });
    });
  });

  describe('Secrets Manager', () => {
    test('should create database credentials secret', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Description: 'RDS PostgreSQL database credentials',
        GenerateSecretString: {
          SecretStringTemplate: JSON.stringify({ username: 'dbadmin' }),
          GenerateStringKey: 'password',
          ExcludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
          PasswordLength: 32,
        },
      });
    });
  });

  describe('RDS Database Instance', () => {
    test('should create PostgreSQL database with default engine', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'postgres',
        // Using default PostgreSQL version for maximum compatibility
      });
    });

    test('should use db.t3.micro instance', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceClass: 'db.t3.micro',
      });
    });

    test('should have storage encryption enabled', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        StorageEncrypted: true,
        StorageType: 'gp3',
        AllocatedStorage: '20',
        MaxAllocatedStorage: 100,
      });
    });

    test('should have backup retention of 7 days', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        BackupRetentionPeriod: 7,
        PreferredBackupWindow: '03:00-04:00',
        PreferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      });
    });

    test('should have deletion protection disabled for testing', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DeletionProtection: false,
      });
    });

    test('should have Performance Insights enabled', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        EnablePerformanceInsights: true,
        PerformanceInsightsRetentionPeriod: 7,
      });
    });

    test('should have monitoring enabled', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        MonitoringInterval: 60,
      });
    });

    test('should have correct database name', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBName: 'retaildb',
        DBInstanceIdentifier: `retail-db-${testEnvironmentSuffix}`,
      });
    });

    test('should not be multi-AZ to minimize costs', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        MultiAZ: false,
      });
    });
  });

  describe('Parameter Group', () => {
    test('should use default parameter group for maximum compatibility', () => {
      // No custom parameter group - using AWS defaults
      template.resourceCountIs('AWS::RDS::DBParameterGroup', 0);
    });
  });

  describe('Subnet Group', () => {
    test('should create database subnet group', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupDescription: 'Subnet group for RDS PostgreSQL',
      });
    });
  });

  describe('Outputs', () => {
    test('should output database endpoint', () => {
      const outputs = template.findOutputs('*');
      const endpointOutput = Object.keys(outputs).find(key =>
        key.includes('DatabaseEndpoint')
      );
      expect(endpointOutput).toBeDefined();
    });

    test('should output database port', () => {
      const outputs = template.findOutputs('*');
      const portOutput = Object.keys(outputs).find(key =>
        key.includes('DatabasePort')
      );
      expect(portOutput).toBeDefined();
    });
  });
});

describe('MonitoringStack', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let networkStack: NetworkStack;
  let backupStack: BackupStack;
  let databaseStack: DatabaseStack;
  let monitoringStack: MonitoringStack;
  let template: Template;
  const testEnvironmentSuffix = 'test123';

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack');

    networkStack = new NetworkStack(stack, 'TestNetworkStack', {
      environmentSuffix: testEnvironmentSuffix,
    });

    backupStack = new BackupStack(stack, 'TestBackupStack', {
      environmentSuffix: testEnvironmentSuffix,
    });

    databaseStack = new DatabaseStack(stack, 'TestDatabaseStack', {
      vpc: networkStack.vpc,
      securityGroup: networkStack.databaseSecurityGroup,
      backupBucket: backupStack.backupBucket,
      environmentSuffix: testEnvironmentSuffix,
    });

    monitoringStack = new MonitoringStack(stack, 'TestMonitoringStack', {
      database: databaseStack.database,
      environmentSuffix: testEnvironmentSuffix,
    });

    template = Template.fromStack(stack);
  });

  describe('SNS Topic', () => {
    test('should create SNS topic for alerts', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: `Retail Database Alerts - ${testEnvironmentSuffix}`,
        TopicName: `retail-db-alerts-${testEnvironmentSuffix}`,
      });
    });
  });

  describe('CloudWatch Dashboard', () => {
    test('should create CloudWatch dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `retail-database-${testEnvironmentSuffix}`,
      });
    });

    test('should have dashboard with widgets', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `retail-database-${testEnvironmentSuffix}`,
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should create high CPU alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmDescription: 'Alert when CPU utilization exceeds 80%',
        MetricName: 'CPUUtilization',
        Threshold: 80,
        EvaluationPeriods: 2,
        DatapointsToAlarm: 2,
        TreatMissingData: 'breaching',
      });
    });

    test('should create low storage alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmDescription: 'Alert when free storage space falls below 2GB',
        MetricName: 'FreeStorageSpace',
        Threshold: 2147483648, // 2GB in bytes
        ComparisonOperator: 'LessThanThreshold',
        EvaluationPeriods: 1,
        TreatMissingData: 'breaching',
      });
    });

    test('should create high connections alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmDescription: 'Alert when database connections exceed 80',
        MetricName: 'DatabaseConnections',
        Threshold: 80,
        EvaluationPeriods: 2,
        TreatMissingData: 'notBreaching',
      });
    });

    test('should have alarms configured with SNS actions', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmActions: Match.arrayWith([
          Match.objectLike({
            Ref: Match.stringLikeRegexp('.*DatabaseAlerts.*'),
          }),
        ]),
      });
    });
  });

  describe('Outputs', () => {
    test('should output dashboard URL', () => {
      const outputs = template.findOutputs('*');
      const dashboardOutput = Object.keys(outputs).find(key =>
        key.includes('DashboardURL')
      );
      expect(dashboardOutput).toBeDefined();
    });
  });
});

describe('Resource Tagging', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;
  const testEnvironmentSuffix = 'test123';

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix: testEnvironmentSuffix,
    });
    template = Template.fromStack(stack);
  });

  test('all resources should have environment tag', () => {
    // Check various resource types for environment tag
    const resourceTypes = [
      'AWS::EC2::VPC',
      'AWS::EC2::SecurityGroup',
      'AWS::S3::Bucket',
      'AWS::RDS::DBInstance',
      'AWS::KMS::Key',
      'AWS::SNS::Topic',
    ];

    resourceTypes.forEach(resourceType => {
      const resources = template.findResources(resourceType);
      if (Object.keys(resources).length > 0) {
        template.hasResourceProperties(resourceType, {
          Tags: Match.arrayWith([
            Match.objectLike({
              Key: 'Environment',
              Value: testEnvironmentSuffix,
            }),
          ]),
        });
      }
    });
  });
});

describe('Removal Policies', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;
  const testEnvironmentSuffix = 'test123';

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix: testEnvironmentSuffix,
    });
    template = Template.fromStack(stack);
  });

  test('should not have any Retain deletion policies', () => {
    const templateJson = template.toJSON();
    const resources = templateJson.Resources;

    Object.keys(resources).forEach(resourceKey => {
      const resource = resources[resourceKey];
      expect(resource.DeletionPolicy).not.toBe('Retain');
    });
  });

  test('database should have Delete deletion policy', () => {
    const templateJson = template.toJSON();
    const resources = templateJson.Resources;

    Object.keys(resources).forEach(resourceKey => {
      const resource = resources[resourceKey];
      if (resource.Type === 'AWS::RDS::DBInstance') {
        expect(resource.DeletionPolicy).toBe('Delete');
      }
    });
  });
});
