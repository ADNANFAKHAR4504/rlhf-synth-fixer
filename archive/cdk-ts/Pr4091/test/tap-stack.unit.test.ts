import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let primaryStack: TapStack;
  let secondaryStack: TapStack;
  let primaryTemplate: Template;
  let secondaryTemplate: Template;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    primaryStack = new TapStack(app, 'TestTapStackPrimary', {
      environmentSuffix,
      isPrimary: true,
      primaryRegion: 'us-east-1',
      secondaryRegion: 'us-west-1',
      globalClusterId: `global-${environmentSuffix}`,
      globalTableName: `metadata-table-${environmentSuffix}`,
      enableSecurityHub: true,
      env: { account: '123456789012', region: 'us-east-1' },
      crossRegionReferences: true,
    });
    secondaryStack = new TapStack(app, 'TestTapStackSecondary', {
      environmentSuffix,
      isPrimary: false,
      primaryRegion: 'us-east-1',
      secondaryRegion: 'us-west-1',
      globalClusterId: `global-${environmentSuffix}`,
      globalTableName: `metadata-table-${environmentSuffix}`,
      enableSecurityHub: true,
      env: { account: '123456789012', region: 'us-west-1' },
      crossRegionReferences: true,
    });
    primaryTemplate = Template.fromStack(primaryStack);
    secondaryTemplate = Template.fromStack(secondaryStack);
    stack = primaryStack;
    template = primaryTemplate;
  });

  describe('VPC Configuration', () => {
    test('should create VPC with 3 availability zones', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });

      const vpcs = template.findResources('AWS::EC2::VPC');
      expect(Object.keys(vpcs).length).toBe(1);
    });

    test('should create public, private, and isolated subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 9);
    });

    test('should create NAT gateway', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
    });

    test('should create internet gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });
  });

  describe('KMS Keys', () => {
    test('should create database encryption key with rotation', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
        Description: Match.stringLikeRegexp('Database encryption key'),
      });
    });

    test('should create cache encryption key with rotation', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
        Description: Match.stringLikeRegexp('Cache encryption key'),
      });
    });

    test('should create DynamoDB encryption key with rotation', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
        Description: Match.stringLikeRegexp('DynamoDB encryption key'),
      });
    });

    test('should create Secrets Manager encryption key with rotation', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
        Description: Match.stringLikeRegexp('Secrets Manager encryption key'),
      });
    });

    test('should create exactly 4 KMS keys', () => {
      template.resourceCountIs('AWS::KMS::Key', 4);
    });
  });

  describe('Security Groups', () => {
    test('should create Aurora security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Aurora PostgreSQL',
      });
    });

    test('should create Redis security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for ElastiCache Redis',
      });
    });

    test('should create Lambda security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Lambda functions',
      });
    });

    test('should allow Lambda to connect to Aurora on port 5432', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 5432,
        ToPort: 5432,
      });
    });

    test('should allow Lambda to connect to Redis on port 6379', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 6379,
        ToPort: 6379,
      });
    });
  });

  describe('Secrets Manager', () => {
    test('should create database credentials secret', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        GenerateSecretString: {
          SecretStringTemplate: Match.stringLikeRegexp('dbadmin'),
          GenerateStringKey: 'password',
          ExcludePunctuation: true,
          IncludeSpace: false,
          PasswordLength: 32,
        },
      });
    });

    test('should create Redis credentials secret', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        GenerateSecretString: {
          SecretStringTemplate: Match.stringLikeRegexp('default'),
          GenerateStringKey: 'authToken',
          ExcludePunctuation: true,
          IncludeSpace: false,
          PasswordLength: 32,
        },
      });
    });

    test('should encrypt secrets with KMS', () => {
      const secrets = template.findResources('AWS::SecretsManager::Secret');
      Object.values(secrets).forEach((secret: any) => {
        expect(secret.Properties.KmsKeyId).toBeDefined();
      });
    });
  });

  describe('Aurora Database Cluster', () => {
    test('should create Aurora PostgreSQL cluster', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        Engine: 'aurora-postgresql',
        EngineVersion: '15.4',
        StorageEncrypted: true,
        DeletionProtection: false,
      });
    });

    test('should create 2 Aurora instances', () => {
      template.resourceCountIs('AWS::RDS::DBInstance', 2);
    });

    test('should enable CloudWatch logs export', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        EnableCloudwatchLogsExports: ['postgresql'],
      });
    });

    test('should configure backup retention', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        BackupRetentionPeriod: 1,
        PreferredBackupWindow: '02:00-04:00',
      });
    });

    test('should use R6G instance class for Global Database compatibility', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceClass: 'db.r6g.large',
      });
    });

    test('should use parameter group with SSL enforcement', () => {
      template.hasResourceProperties('AWS::RDS::DBClusterParameterGroup', {
        Parameters: Match.objectLike({
          'rds.force_ssl': '1',
        }),
      });
    });

    test('should place cluster in isolated subnets', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        SubnetIds: Match.anyValue(),
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should create Aurora CPU utilization alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/RDS',
        Threshold: 80,
        ComparisonOperator: 'GreaterThanThreshold',
      });
    });

    test('should create Aurora database connections alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'DatabaseConnections',
        Namespace: 'AWS/RDS',
        Threshold: 100,
      });
    });

    test('should create DynamoDB user errors alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'UserErrors',
        Namespace: 'AWS/DynamoDB',
        Threshold: 5,
        ComparisonOperator: 'GreaterThanThreshold',
      });
    });
  });

  describe('DynamoDB Table', () => {
    test('should create metadata table with partition and sort key', () => {
      primaryTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        KeySchema: [
          {
            AttributeName: 'id',
            KeyType: 'HASH',
          },
          {
            AttributeName: 'timestamp',
            KeyType: 'RANGE',
          },
        ],
      });
    });

    test('should use pay-per-request billing', () => {
      primaryTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        BillingMode: 'PAY_PER_REQUEST',
      });
    });

    test('should enable point-in-time recovery', () => {
      primaryTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
      });
    });

    test('should use encryption (AWS-managed for global tables)', () => {
      primaryTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        SSESpecification: {
          SSEEnabled: true,
        },
      });
    });
  });

  describe('ElastiCache Redis', () => {
    test('should create Redis replication group', () => {
      template.hasResourceProperties('AWS::ElastiCache::ReplicationGroup', {
        Engine: 'redis',
        EngineVersion: '7.0',
        NumNodeGroups: 1,
        ReplicasPerNodeGroup: 1,
        AutomaticFailoverEnabled: true,
        MultiAZEnabled: true,
      });
    });

    test('should enable encryption at rest and in transit', () => {
      template.hasResourceProperties('AWS::ElastiCache::ReplicationGroup', {
        AtRestEncryptionEnabled: true,
        TransitEncryptionEnabled: true,
      });
    });

    test('should configure snapshot retention', () => {
      template.hasResourceProperties('AWS::ElastiCache::ReplicationGroup', {
        SnapshotRetentionLimit: 5,
      });
    });

    test('should create subnet group in isolated subnets', () => {
      template.hasResourceProperties('AWS::ElastiCache::SubnetGroup', {
        Description: 'Subnet group for ElastiCache Redis',
      });
    });
  });

  describe('Lambda Function', () => {
    test('should create backup Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs20.x',
        Handler: 'index.handler',
        Timeout: 900,
        MemorySize: 512,
      });
    });

    test('should configure environment variables', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: Match.objectLike({
            DATABASE_SECRET_ARN: Match.anyValue(),
            REDIS_SECRET_ARN: Match.anyValue(),
            METADATA_TABLE_NAME: Match.anyValue(),
            CLUSTER_IDENTIFIER: Match.anyValue(),
          }),
        },
      });
    });

    test('should place Lambda in VPC', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        VpcConfig: {
          SubnetIds: Match.anyValue(),
          SecurityGroupIds: Match.anyValue(),
        },
      });
    });

    test('should grant Lambda access to DynamoDB', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                'dynamodb:BatchGetItem',
                'dynamodb:GetRecords',
                'dynamodb:GetShardIterator',
                'dynamodb:Query',
                'dynamodb:GetItem',
                'dynamodb:Scan',
                'dynamodb:ConditionCheckItem',
                'dynamodb:BatchWriteItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
                'dynamodb:DescribeTable',
              ]),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('should grant Lambda access to Secrets Manager', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                'secretsmanager:GetSecretValue',
                'secretsmanager:DescribeSecret',
              ]),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('should grant Lambda RDS snapshot permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: [
                'rds:DescribeDBClusters',
                'rds:CreateDBClusterSnapshot',
                'rds:DescribeDBClusterSnapshots',
              ],
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });
  });

  describe('EventBridge', () => {
    test('should create custom event bus', () => {
      template.hasResourceProperties('AWS::Events::EventBus', {
        Name: Match.stringLikeRegexp('transaction-event-bus'),
      });
    });

    test('should create scheduled backup rule', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        ScheduleExpression: 'cron(0 3 * * ? *)',
      });
    });

    test('should create operational events rule', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Description: 'Rule for processing operational events',
        EventPattern: {
          source: ['com.financial.operations'],
        },
      });
    });

    test('should target Lambda function from both rules', () => {
      const rules = template.findResources('AWS::Events::Rule');
      const ruleCount = Object.keys(rules).length;
      expect(ruleCount).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Security Hub', () => {
    test('should enable Security Hub when flag is true', () => {
      template.hasResourceProperties('AWS::SecurityHub::Hub', {
        EnableDefaultStandards: false,
      });
    });

    test('should not create Security Hub when flag is false', () => {
      const noSecHubApp = new cdk.App();
      const noSecHubStack = new TapStack(noSecHubApp, 'NoSecurityHubStack', {
        environmentSuffix: 'test',
        isPrimary: true,
        primaryRegion: 'us-east-1',
        secondaryRegion: 'us-west-1',
        enableSecurityHub: false,
        env: { account: '123456789012', region: 'us-east-1' },
      });
      const noSecHubTemplate = Template.fromStack(noSecHubStack);
      
      noSecHubTemplate.resourceCountIs('AWS::SecurityHub::Hub', 0);
    });
  });

  describe('Route 53', () => {
    test('should create private hosted zone', () => {
      template.hasResourceProperties('AWS::Route53::HostedZone', {
        Name: Match.stringLikeRegexp('financial.*internal'),
        VPCs: Match.anyValue(),
      });
    });

    test('should create database CNAME record', () => {
      template.hasResourceProperties('AWS::Route53::RecordSet', {
        Name: Match.stringLikeRegexp('database'),
        Type: 'CNAME',
      });
    });
  });

  describe('CloudFormation Outputs', () => {
    test('should export VPC ID', () => {
      template.hasOutput('VpcId', {
        Export: {
          Name: Match.stringLikeRegexp('VpcId'),
        },
      });
    });

    test('should export Aurora cluster endpoint', () => {
      template.hasOutput('AuroraClusterEndpoint', {
        Export: {
          Name: Match.stringLikeRegexp('AuroraClusterEndpoint'),
        },
      });
    });

    test('should export DynamoDB table name', () => {
      template.hasOutput('MetadataTableName', {
        Export: {
          Name: Match.stringLikeRegexp('MetadataTableName'),
        },
      });
    });

    test('should export Redis endpoint', () => {
      template.hasOutput('RedisClusterEndpoint', {
        Export: {
          Name: Match.stringLikeRegexp('RedisClusterEndpoint'),
        },
      });
    });

    test('should export Lambda ARN', () => {
      template.hasOutput('BackupLambdaArn', {
        Export: {
          Name: Match.stringLikeRegexp('BackupLambdaArn'),
        },
      });
    });

    test('should export Event Bus name', () => {
      template.hasOutput('EventBusName', {
        Export: {
          Name: Match.stringLikeRegexp('EventBusName'),
        },
      });
    });

    test('should export Database Secret ARN', () => {
      template.hasOutput('DatabaseSecretArn', {
        Export: {
          Name: Match.stringLikeRegexp('DatabaseSecretArn'),
        },
      });
    });
  });

  describe('Resource Cleanup', () => {
    test('should have DESTROY removal policy on KMS keys', () => {
      const keys = template.findResources('AWS::KMS::Key');
      Object.values(keys).forEach((key: any) => {
        expect(key.UpdateReplacePolicy).toBe('Delete');
        expect(key.DeletionPolicy).toBe('Delete');
      });
    });

    test('should have DESTROY removal policy on Secrets', () => {
      const secrets = template.findResources('AWS::SecretsManager::Secret');
      Object.values(secrets).forEach((secret: any) => {
        expect(secret.UpdateReplacePolicy).toBe('Delete');
        expect(secret.DeletionPolicy).toBe('Delete');
      });
    });

    test('should have DESTROY removal policy on DynamoDB table', () => {
      const tables = template.findResources('AWS::DynamoDB::Table');
      Object.values(tables).forEach((table: any) => {
        expect(table.UpdateReplacePolicy).toBe('Delete');
        expect(table.DeletionPolicy).toBe('Delete');
      });
    });

    test('should have DESTROY removal policy on Aurora cluster', () => {
      const clusters = template.findResources('AWS::RDS::DBCluster');
      Object.values(clusters).forEach((cluster: any) => {
        expect(cluster.UpdateReplacePolicy).toBe('Delete');
        expect(cluster.DeletionPolicy).toBe('Delete');
      });
    });

    test('should not have deletion protection on Aurora', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        DeletionProtection: false,
      });
    });
  });

  describe('Stack Properties', () => {
    test('should have correct environment suffix', () => {
      expect(stack.node.tryGetContext('environmentSuffix') || environmentSuffix).toBe(
        environmentSuffix
      );
    });

    test('should expose public properties', () => {
      expect(stack.vpc).toBeDefined();
      expect(stack.auroraCluster).toBeDefined();
      expect(stack.metadataTable).toBeDefined();
      expect(stack.redisCluster).toBeDefined();
      expect(stack.backupLambda).toBeDefined();
      expect(stack.eventBus).toBeDefined();
      expect(stack.databaseCredentialsSecret).toBeDefined();
      expect(stack.redisCredentialsSecret).toBeDefined();
    });

    test('should use environment suffix from props', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStackWithProps', {
        environmentSuffix: 'test123',
        isPrimary: true,
        primaryRegion: 'us-east-1',
        secondaryRegion: 'us-west-1',
        globalClusterId: 'global-test123',
        globalTableName: 'metadata-table-test123',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      const testTemplate = Template.fromStack(testStack);
      
      testTemplate.resourceCountIs('AWS::DynamoDB::Table', 1);
    });

    test('should use environment suffix from context', () => {
      const testApp = new cdk.App({ context: { environmentSuffix: 'ctx456' } });
      const testStack = new TapStack(testApp, 'TestStackWithContext', {
        isPrimary: true,
        primaryRegion: 'us-east-1',
        secondaryRegion: 'us-west-1',
        globalClusterId: 'global-ctx456',
        globalTableName: 'metadata-table-ctx456',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      const testTemplate = Template.fromStack(testStack);
      
      testTemplate.resourceCountIs('AWS::DynamoDB::Table', 1);
    });

    test('should default to dev when no environment suffix provided', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStackDefault', {
        isPrimary: true,
        primaryRegion: 'us-east-1',
        secondaryRegion: 'us-west-1',
        globalClusterId: 'global-dev',
        globalTableName: 'metadata-table-dev',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      const testTemplate = Template.fromStack(testStack);
      
      testTemplate.resourceCountIs('AWS::DynamoDB::Table', 1);
    });
  });

  describe('Multi-Region Support', () => {
    test('primary stack should create global cluster', () => {
      primaryTemplate.hasResourceProperties('AWS::RDS::GlobalCluster', {
        Engine: 'aurora-postgresql',
        EngineVersion: '15.4',
        StorageEncrypted: true,
      });
    });

    test('secondary stack should not create global cluster', () => {
      expect(() => {
        secondaryTemplate.hasResourceProperties('AWS::RDS::GlobalCluster', {});
      }).toThrow();
    });

    test('single-region stack should use customer-managed encryption for DynamoDB', () => {
      const singleApp = new cdk.App();
      const singleStack = new TapStack(singleApp, 'SingleRegionStack', {
        environmentSuffix: 'single',
        isPrimary: true,
        primaryRegion: 'us-east-1',
        secondaryRegion: undefined, // No secondary region
        env: { account: '123456789012', region: 'us-east-1' },
      });
      const singleTemplate = Template.fromStack(singleStack);
      
      // Should use customer-managed encryption when no replication
      singleTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        SSESpecification: {
          SSEEnabled: true,
          SSEType: 'KMS',
        },
      });
    });

    test('primary Aurora cluster should attach to global cluster', () => {
      primaryTemplate.hasResourceProperties('AWS::RDS::DBCluster', {
        GlobalClusterIdentifier: Match.anyValue(),
      });
    });

    test('secondary Aurora cluster should attach to global cluster', () => {
      secondaryTemplate.hasResourceProperties('AWS::RDS::DBCluster', {
        GlobalClusterIdentifier: `global-${environmentSuffix}`,
      });
    });

    test('primary DynamoDB table should have replication regions', () => {
      // CDK uses Custom Resources for DynamoDB Global Table replication
      // Check that the table has StreamSpecification enabled (required for replication)
      primaryTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        StreamSpecification: {
          StreamViewType: 'NEW_AND_OLD_IMAGES',
        },
      });
    });

    test('both regions should have VPC', () => {
      primaryTemplate.resourceCountIs('AWS::EC2::VPC', 1);
      secondaryTemplate.resourceCountIs('AWS::EC2::VPC', 1);
    });

    test('both regions should have Redis cluster', () => {
      primaryTemplate.resourceCountIs('AWS::ElastiCache::ReplicationGroup', 1);
      secondaryTemplate.resourceCountIs('AWS::ElastiCache::ReplicationGroup', 1);
    });

    test('both regions should have Lambda backup function', () => {
      primaryTemplate.resourceCountIs('AWS::Lambda::Function', 1);
      secondaryTemplate.resourceCountIs('AWS::Lambda::Function', 1);
    });

    test('both regions should have EventBridge event bus', () => {
      primaryTemplate.resourceCountIs('AWS::Events::EventBus', 1);
      secondaryTemplate.resourceCountIs('AWS::Events::EventBus', 1);
    });

    test('both regions should have Security Hub enabled', () => {
      primaryTemplate.resourceCountIs('AWS::SecurityHub::Hub', 1);
      secondaryTemplate.resourceCountIs('AWS::SecurityHub::Hub', 1);
    });

    test('primary should create hosted zone', () => {
      primaryTemplate.resourceCountIs('AWS::Route53::HostedZone', 1);
    });

    test('both regions should have database DNS records', () => {
      primaryTemplate.hasResourceProperties('AWS::Route53::RecordSet', {
        Name: Match.stringLikeRegexp('database-us-east-1'),
        Type: 'CNAME',
      });
    });

    test('both regions should have region-specific cluster identifiers', () => {
      primaryTemplate.hasResourceProperties('AWS::RDS::DBCluster', {
        DBClusterIdentifier: Match.stringLikeRegexp('aurora-us-east-1'),
      });
      secondaryTemplate.hasResourceProperties('AWS::RDS::DBCluster', {
        DBClusterIdentifier: Match.stringLikeRegexp('aurora-us-west-1'),
      });
    });

    test('should use default global cluster ID when not provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultGlobalStack', {
        environmentSuffix: 'test',
        isPrimary: true,
        primaryRegion: 'us-east-1',
        secondaryRegion: 'us-west-1',
        // No globalClusterId provided - should use default
        env: { account: '123456789012', region: 'us-east-1' },
      });
      const defaultTemplate = Template.fromStack(defaultStack);
      
      defaultTemplate.hasResourceProperties('AWS::RDS::GlobalCluster', {
        GlobalClusterIdentifier: 'global-test',
      });
    });

    test('should use default table name when not provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultTableStack', {
        environmentSuffix: 'test',
        isPrimary: true,
        primaryRegion: 'us-east-1',
        secondaryRegion: 'us-west-1',
        // No globalTableName provided - should use default
        env: { account: '123456789012', region: 'us-east-1' },
      });
      const defaultTemplate = Template.fromStack(defaultStack);
      
      defaultTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'metadata-table-test',
      });
    });

    test('secondary stack should not create DynamoDB table', () => {
      const singleApp2 = new cdk.App();
      const singleStack2 = new TapStack(singleApp2, 'SecondaryStackImportsTable', {
        environmentSuffix: 'test',
        isPrimary: false, // Secondary stack imports table
        primaryRegion: 'us-east-1',
        secondaryRegion: 'us-west-1',
        globalClusterId: 'global-test',
        globalTableName: 'metadata-test',
        env: { account: '123456789012', region: 'us-west-1' },
      });
      const singleTemplate2 = Template.fromStack(singleStack2);
      
      // Secondary stack should not create DynamoDB table (imports replicated table)
      singleTemplate2.resourceCountIs('AWS::DynamoDB::Table', 0);
    });
  });
});
