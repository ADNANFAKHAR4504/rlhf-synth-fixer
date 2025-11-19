import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';
import { NetworkStack } from '../lib/network-stack';
import { DatabaseStack } from '../lib/database-stack';
import { StorageStack } from '../lib/storage-stack';
import { MonitoringStack } from '../lib/monitoring-stack';
import { FailoverStack } from '../lib/failover-stack';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
      isPrimary: true,
      primaryRegion: 'us-east-1',
      drRegion: 'us-east-2',
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    template = Template.fromStack(stack);
  });

  test('Stack creates nested stacks', () => {
    // Root stack should contain nested stack references
    template.resourceCountIs('AWS::CloudFormation::Stack', 5);
  });

  test('Stack has required outputs', () => {
    template.hasOutput('VpcId', {});
    template.hasOutput('DatabaseEndpoint', {});
    template.hasOutput('BackupBucket', {});
    template.hasOutput('AlarmTopicArn', {});
  });
});

describe('NetworkStack', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let networkStack: NetworkStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack', {
      env: { account: '123456789012', region: 'us-east-1' },
    });
    networkStack = new NetworkStack(stack, 'NetworkStack', {
      environmentSuffix: 'test',
      isPrimary: true,
      primaryRegion: 'us-east-1',
      drRegion: 'us-east-2',
    });
    template = Template.fromStack(networkStack);
  });

  test('Creates VPC with correct configuration', () => {
    template.resourceCountIs('AWS::EC2::VPC', 1);
    template.hasResourceProperties('AWS::EC2::VPC', {
      EnableDnsHostnames: true,
      EnableDnsSupport: true,
    });
  });

  test('Creates NAT gateways', () => {
    template.resourceCountIs('AWS::EC2::NatGateway', 2);
  });

  test('Creates security groups', () => {
    const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
    expect(Object.keys(securityGroups).length).toBeGreaterThanOrEqual(2);
  });

  test('Creates VPC endpoints', () => {
    const endpoints = template.findResources('AWS::EC2::VPCEndpoint');
    expect(Object.keys(endpoints).length).toBeGreaterThanOrEqual(3);
  });
});

describe('DatabaseStack', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let vpc: ec2.Vpc;
  let kmsKey: kms.Key;
  let databaseStack: DatabaseStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack', {
      env: { account: '123456789012', region: 'us-east-1' },
    });

    vpc = new ec2.Vpc(stack, 'Vpc', { maxAzs: 2 });
    kmsKey = new kms.Key(stack, 'Key');

    databaseStack = new DatabaseStack(stack, 'DatabaseStack', {
      environmentSuffix: 'test',
      isPrimary: true,
      primaryRegion: 'us-east-1',
      drRegion: 'us-east-2',
      vpc: vpc,
      kmsKey: kmsKey,
    });
    template = Template.fromStack(databaseStack);
  });

  test('Creates RDS PostgreSQL instance', () => {
    template.resourceCountIs('AWS::RDS::DBInstance', 2); // Primary + Read Replica
    template.hasResourceProperties('AWS::RDS::DBInstance', {
      Engine: 'postgres',
      DBInstanceClass: 'db.r6g.xlarge',
      StorageEncrypted: true,
      MultiAZ: true,
    });
  });

  test('Database has proper backup configuration', () => {
    template.hasResourceProperties('AWS::RDS::DBInstance', {
      BackupRetentionPeriod: 7,
      PreferredBackupWindow: '03:00-04:00',
    });
  });

  test('Secrets Manager secret is created for database credentials', () => {
    template.resourceCountIs('AWS::SecretsManager::Secret', 1);
  });

  test('Creates read replica in primary region', () => {
    const instances = template.findResources('AWS::RDS::DBInstance');
    const instanceKeys = Object.keys(instances);
    expect(instanceKeys.length).toBe(2);
  });
});

describe('StorageStack', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let storageStack: StorageStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack', {
      env: { account: '123456789012', region: 'us-east-1' },
    });
    storageStack = new StorageStack(stack, 'StorageStack', {
      environmentSuffix: 'test',
      isPrimary: true,
      primaryRegion: 'us-east-1',
      drRegion: 'us-east-2',
    });
    template = Template.fromStack(storageStack);
  });

  test('Creates KMS key for encryption', () => {
    template.resourceCountIs('AWS::KMS::Key', 1);
    template.hasResourceProperties('AWS::KMS::Key', {
      EnableKeyRotation: true,
    });
  });

  test('Creates S3 bucket for backups', () => {
    template.resourceCountIs('AWS::S3::Bucket', 1);
    template.hasResourceProperties('AWS::S3::Bucket', {
      VersioningConfiguration: {
        Status: 'Enabled',
      },
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          {
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'aws:kms',
            },
          },
        ],
      },
    });
  });
});

describe('MonitoringStack', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let vpc: ec2.Vpc;
  let kmsKey: kms.Key;
  let database: rds.DatabaseInstance;
  let monitoringStack: MonitoringStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack', {
      env: { account: '123456789012', region: 'us-east-1' },
    });

    vpc = new ec2.Vpc(stack, 'Vpc', { maxAzs: 2 });
    kmsKey = new kms.Key(stack, 'Key');

    // Create a real database instance for testing
    const secret = new secretsmanager.Secret(stack, 'Secret', {
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'postgres' }),
        generateStringKey: 'password',
      },
    });

    database = new rds.DatabaseInstance(stack, 'Database', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_14,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      vpc: vpc,
      credentials: rds.Credentials.fromSecret(secret),
    });

    monitoringStack = new MonitoringStack(stack, 'MonitoringStack', {
      environmentSuffix: 'test',
      isPrimary: true,
      primaryRegion: 'us-east-1',
      drRegion: 'us-east-2',
      vpc: vpc,
      database: database,
    });
    template = Template.fromStack(monitoringStack);
  });

  test('Creates SNS topic for alarms', () => {
    template.resourceCountIs('AWS::SNS::Topic', 1);
  });

  test('Creates CloudWatch alarms', () => {
    template.resourceCountIs('AWS::CloudWatch::Alarm', 5);
  });

  test('Creates composite alarm', () => {
    template.resourceCountIs('AWS::CloudWatch::CompositeAlarm', 1);
  });

  test('Lambda not created without read replica', () => {
    // Lambda and EventBridge are only created when readReplica is provided
    template.resourceCountIs('AWS::Lambda::Function', 0);
    template.resourceCountIs('AWS::Events::Rule', 0);
  });
});

describe('FailoverStack', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let vpc: ec2.Vpc;
  let database: rds.DatabaseInstance;
  let alarmTopic: sns.Topic;
  let failoverStack: FailoverStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack', {
      env: { account: '123456789012', region: 'us-east-1' },
    });

    vpc = new ec2.Vpc(stack, 'Vpc', { maxAzs: 2 });

    // Create real constructs for testing
    const secret = new secretsmanager.Secret(stack, 'Secret', {
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'postgres' }),
        generateStringKey: 'password',
      },
    });

    database = new rds.DatabaseInstance(stack, 'Database', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_14,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      vpc: vpc,
      credentials: rds.Credentials.fromSecret(secret),
    });

    alarmTopic = new sns.Topic(stack, 'AlarmTopic', {
      displayName: 'Test Alarm Topic',
    });

    failoverStack = new FailoverStack(stack, 'FailoverStack', {
      environmentSuffix: 'test',
      primaryRegion: 'us-east-1',
      drRegion: 'us-east-2',
      primaryDatabase: database,
      alarmTopic: alarmTopic,
    });
    template = Template.fromStack(failoverStack);
  });

  test('Creates Lambda function for failover', () => {
    template.resourceCountIs('AWS::Lambda::Function', 1);
  });

  test('Creates EventBridge rules', () => {
    template.resourceCountIs('AWS::Events::Rule', 2);
  });

  test('Creates Lambda IAM role', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
          },
        ],
      },
    });
  });
});

describe('TapStack DR Region', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestStackDR', {
      environmentSuffix: 'test',
      isPrimary: false,
      primaryRegion: 'us-east-1',
      drRegion: 'us-east-2',
      env: {
        account: '123456789012',
        region: 'us-east-2',
      },
    });
    template = Template.fromStack(stack);
  });

  test('DR stack creates nested stacks', () => {
    // DR region has 4 nested stacks (no FailoverStack)
    template.resourceCountIs('AWS::CloudFormation::Stack', 4);
  });

  test('DR stack has required outputs', () => {
    template.hasOutput('VpcId', {});
    template.hasOutput('DatabaseEndpoint', {});
  });
});
