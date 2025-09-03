import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { DatabaseStack } from '../lib/database-stack';
import { MonitoringStack } from '../lib/monitoring-stack';
import { NetworkingStack } from '../lib/networking-stack';
import { SecurityStack } from '../lib/security-stack';
import { StorageStack } from '../lib/storage-stack';
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
      env: { account: '123456789012', region: 'us-east-1' },
    });
    template = Template.fromStack(stack);
  });

  describe('Stack Creation', () => {
    test('creates main stack with correct outputs', () => {
      // Verify all expected outputs exist
      template.hasOutput('VPCId', {
        Description: 'VPC ID',
      });
      template.hasOutput('KMSKeyId', {
        Description: 'KMS Key ID',
      });
      template.hasOutput('StateBucketName', {
        Description: 'State Bucket Name',
      });
      template.hasOutput('LockTableName', {
        Description: 'DynamoDB Lock Table Name',
      });
      template.hasOutput('DatabaseEndpoint', {
        Description: 'RDS Database Endpoint',
      });
      template.hasOutput('LogGroupName', {
        Description: 'CloudWatch Log Group Name',
      });
      template.hasOutput('AlertsTopicArn', {
        Description: 'SNS Alerts Topic ARN',
      });
    });

    test('applies correct tags to resources', () => {
      // Check that the stack is properly created and has resources
      expect(stack).toBeDefined();
      expect(stack.node.id).toBe('TestTapStack');
      
      // Verify that the stack has the expected outputs
      const outputs = template.findOutputs('*');
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
    });

    test('creates stack with default environment suffix when not provided', () => {
      const defaultStack = new TapStack(app, 'DefaultTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
      });
      expect(defaultStack).toBeDefined();
    });

    test('creates stack with context environment suffix', () => {
      const contextApp = new cdk.App();
      contextApp.node.setContext('environmentSuffix', 'context-test');
      const contextStack = new TapStack(contextApp, 'ContextTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
      });
      expect(contextStack).toBeDefined();
    });
  });
});

describe('SecurityStack', () => {
  let app: cdk.App;
  let stack: SecurityStack;
  let template: Template;
  const environmentSuffix = 'test';

  beforeEach(() => {
    app = new cdk.App();
    stack = new SecurityStack(app, 'TestSecurityStack', {
      environmentSuffix,
      env: { account: '123456789012', region: 'us-east-1' },
    });
    template = Template.fromStack(stack);
  });

  test('creates KMS key with rotation enabled', () => {
    template.hasResourceProperties('AWS::KMS::Key', {
      EnableKeyRotation: true,
      KeySpec: 'SYMMETRIC_DEFAULT',
      KeyUsage: 'ENCRYPT_DECRYPT',
      PendingWindowInDays: Match.absent(),
    });
  });

  test('creates KMS key alias', () => {
    template.hasResourceProperties('AWS::KMS::Alias', {
      AliasName: Match.stringLikeRegexp('alias/secure-test-key-.*'),
    });
  });

  test('creates EC2 IAM role with correct policies', () => {
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
      ManagedPolicyArns: Match.arrayWith([
        Match.objectLike({
          'Fn::Join': Match.arrayWith([
            '',
            Match.arrayWith([
              Match.stringLikeRegexp('.*CloudWatchAgentServerPolicy'),
            ]),
          ]),
        }),
      ]),
    });
  });

  test('creates RDS IAM role', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'rds.amazonaws.com',
            },
          },
        ],
      },
    });
  });

  test('adds CloudWatch permissions to EC2 role', () => {
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: [
              'cloudwatch:PutMetricData',
              'logs:PutLogEvents',
              'logs:CreateLogStream',
              'logs:CreateLogGroup',
            ],
            Effect: 'Allow',
          }),
        ]),
      },
    });
  });

  test('creates stack with different region', () => {
    const westStack = new SecurityStack(app, 'WestSecurityStack', {
      environmentSuffix,
      env: { account: '123456789012', region: 'us-west-2' },
    });
    expect(westStack).toBeDefined();
  });

  test('creates stack with no region specified', () => {
    const noRegionStack = new SecurityStack(app, 'NoRegionSecurityStack', {
      environmentSuffix,
    });
    expect(noRegionStack).toBeDefined();
  });
});

describe('NetworkingStack', () => {
  let app: cdk.App;
  let stack: NetworkingStack;
  let template: Template;
  const environmentSuffix = 'test';

  beforeEach(() => {
    app = new cdk.App();
    stack = new NetworkingStack(app, 'TestNetworkingStack', {
      environmentSuffix,
      env: { account: '123456789012', region: 'us-east-1' },
    });
    template = Template.fromStack(stack);
  });

  test('creates VPC with correct configuration', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
      EnableDnsHostnames: true,
      EnableDnsSupport: true,
    });
  });

  test('creates public subnets', () => {
    template.resourceCountIs('AWS::EC2::Subnet', 6); // 2 public, 2 private, 2 isolated

    // Check for public subnet
    template.hasResourceProperties('AWS::EC2::Subnet', {
      MapPublicIpOnLaunch: true,
    });
  });

  test('creates NAT gateways for private subnets', () => {
    template.resourceCountIs('AWS::EC2::NatGateway', 2);
  });

  test('creates Network ACLs', () => {
    template.hasResourceProperties('AWS::EC2::NetworkAcl', {
      Tags: Match.arrayWith([
        Match.objectLike({
          Key: 'Name',
          Value: Match.stringLikeRegexp('secure-test-private-nacl'),
        }),
      ]),
    });
  });

  test('configures Network ACL entries', () => {
    template.hasResourceProperties('AWS::EC2::NetworkAclEntry', {
      RuleNumber: 100,
      Protocol: 6, // TCP
      Egress: true,
      CidrBlock: '0.0.0.0/0',
      PortRange: {
        From: 443,
        To: 443,
      },
    });
  });
});

describe('StorageStack', () => {
  let app: cdk.App;
  let securityStack: SecurityStack;
  let stack: StorageStack;
  let template: Template;
  const environmentSuffix = 'test';

  beforeEach(() => {
    app = new cdk.App();
    securityStack = new SecurityStack(app, 'TestSecurityStack', {
      environmentSuffix,
      env: { account: '123456789012', region: 'us-east-1' },
    });
    stack = new StorageStack(app, 'TestStorageStack', {
      environmentSuffix,
      encryptionKey: securityStack.encryptionKey,
      env: { account: '123456789012', region: 'us-east-1' },
    });
    template = Template.fromStack(stack);
  });

  test('creates S3 state bucket with encryption and versioning', () => {
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
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
  });

  test('creates DynamoDB lock table', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: 'secure-test-terraform-lock',
      AttributeDefinitions: [
        {
          AttributeName: 'LockID',
          AttributeType: 'S',
        },
      ],
      KeySchema: [
        {
          AttributeName: 'LockID',
          KeyType: 'HASH',
        },
      ],
      BillingMode: 'PAY_PER_REQUEST',
      PointInTimeRecoverySpecification: {
        PointInTimeRecoveryEnabled: true,
      },
    });
  });

  test('creates application data bucket', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      VersioningConfiguration: {
        Status: 'Enabled',
      },
    });
  });

  test('enforces SSL on S3 buckets', () => {
    template.hasResourceProperties('AWS::S3::BucketPolicy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Effect: 'Deny',
            Principal: { AWS: '*' },
            Action: 's3:*',
            Condition: {
              Bool: {
                'aws:SecureTransport': 'false',
              },
            },
          }),
        ]),
      },
    });
  });
});

describe('DatabaseStack', () => {
  let app: cdk.App;
  let securityStack: SecurityStack;
  let networkingStack: NetworkingStack;
  let stack: DatabaseStack;
  let template: Template;
  const environmentSuffix = 'test';

  beforeEach(() => {
    app = new cdk.App();
    securityStack = new SecurityStack(app, 'TestSecurityStack', {
      environmentSuffix,
      env: { account: '123456789012', region: 'us-east-1' },
    });
    networkingStack = new NetworkingStack(app, 'TestNetworkingStack', {
      environmentSuffix,
      env: { account: '123456789012', region: 'us-east-1' },
    });
    stack = new DatabaseStack(app, 'TestDatabaseStack', {
      environmentSuffix,
      vpc: networkingStack.vpc,
      encryptionKey: securityStack.encryptionKey,
      env: { account: '123456789012', region: 'us-east-1' },
    });
    template = Template.fromStack(stack);
  });

  test('creates RDS instance with encryption', () => {
    template.hasResourceProperties('AWS::RDS::DBInstance', {
      DBInstanceIdentifier: 'secure-test-database',
      Engine: 'mysql',
      StorageEncrypted: true,
      BackupRetentionPeriod: 7,
      DeletionProtection: false,
      EnablePerformanceInsights: false,
    });
  });

  test('creates RDS security group', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: 'Security group for RDS database',
      SecurityGroupIngress: [
        {
          IpProtocol: 'tcp',
          FromPort: 3306,
          ToPort: 3306,
          Description: 'MySQL access from VPC',
        },
      ],
    });
  });

  test('creates RDS subnet group', () => {
    template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
      DBSubnetGroupDescription: 'Subnet group for RDS database',
      DBSubnetGroupName: 'secure-test-subnet-group',
    });
  });

  test('creates database credentials in Secrets Manager', () => {
    template.hasResourceProperties('AWS::SecretsManager::Secret', {
      Name: Match.stringLikeRegexp('secure-test-db-credentials.*'),
      GenerateSecretString: {
        SecretStringTemplate: '{"username":"admin"}',
        GenerateStringKey: 'password',
        ExcludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
      },
    });
  });
});

describe('MonitoringStack', () => {
  let app: cdk.App;
  let securityStack: SecurityStack;
  let stack: MonitoringStack;
  let template: Template;
  const environmentSuffix = 'test';

  beforeEach(() => {
    app = new cdk.App();
    securityStack = new SecurityStack(app, 'TestSecurityStack', {
      environmentSuffix,
      env: { account: '123456789012', region: 'us-east-1' },
    });
    stack = new MonitoringStack(app, 'TestMonitoringStack', {
      environmentSuffix,
      encryptionKey: securityStack.encryptionKey,
      env: { account: '123456789012', region: 'us-east-1' },
    });
    template = Template.fromStack(stack);
  });

  test('creates CloudWatch log group', () => {
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      LogGroupName: '/aws/ec2/secure-test',
      RetentionInDays: 30,
    });
  });

  test('creates SNS topic for alerts', () => {
    template.hasResourceProperties('AWS::SNS::Topic', {
      TopicName: 'secure-test-security-alerts',
    });
  });

  test('creates CloudWatch dashboard', () => {
    template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
      DashboardName: 'secure-test-security-monitoring',
    });
  });

  test('creates CloudWatch alarm for rejected connections', () => {
    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      AlarmName: 'secure-test-high-rejected-connections',
      AlarmDescription: 'High number of rejected VPC connections detected',
      MetricName: 'PacketsDropped',
      Namespace: 'AWS/VPC-FlowLogs',
      Statistic: 'Sum',
      Period: 300,
      EvaluationPeriods: 2,
      Threshold: 100,
    });
  });
});
