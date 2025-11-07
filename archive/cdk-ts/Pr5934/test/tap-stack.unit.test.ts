import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';
import { getEnvironmentConfig } from '../lib/environment-config';

describe('TapStack Unit Tests - 100% Coverage', () => {
  let app: cdk.App;

  beforeEach(() => {
    app = new cdk.App();
  });

  describe('FIX 5: Environment Validation', () => {
    test('should throw error for invalid environment', () => {
      expect(() => {
        getEnvironmentConfig('invalid');
      }).toThrow('Invalid environment: invalid. Valid values: dev, staging, prod');
    });

    test('should accept valid environment: dev', () => {
      expect(() => {
        getEnvironmentConfig('dev');
      }).not.toThrow();
    });

    test('should accept valid environment: staging', () => {
      expect(() => {
        getEnvironmentConfig('staging');
      }).not.toThrow();
    });

    test('should accept valid environment: prod', () => {
      expect(() => {
        getEnvironmentConfig('prod');
      }).not.toThrow();
    });
  });

  describe('FIX 6: Environment Configs - Dev Environment', () => {
    let stack: TapStack;
    let template: Template;

    beforeEach(() => {
      stack = new TapStack(app, 'TestDevStack', {
        environmentSuffix: 'dev',
        environment: 'dev',
      });
      template = Template.fromStack(stack);
    });

    test('dev environment should have correct VPC CIDR (10.0.0.0/16)', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
      });
    });

    test('FIX 2: dev environment should use db.t3.micro RDS instance', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceClass: 'db.t3.micro',
      });
    });

    test('dev environment should have correct Lambda memory size (512)', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        MemorySize: 512,
      });
    });

    test('FIX 3 & FIX 4: dev environment should have correct log retention (7 days) with RemovalPolicy', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 7,
      });
    });

    test('dev environment should have RDS backup retention of 7 days', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        BackupRetentionPeriod: 7,
      });
    });

    test('dev environment should have single-AZ RDS (multiAz: false)', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        MultiAZ: false,
      });
    });

    test('dev environment should have S3 versioning disabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: Match.absent(),
      });
    });

    test('dev environment should use PAY_PER_REQUEST billing mode', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        BillingMode: 'PAY_PER_REQUEST',
      });
    });
  });

  describe('FIX 6: Environment Configs - Staging Environment', () => {
    let stack: TapStack;
    let template: Template;

    beforeEach(() => {
      stack = new TapStack(app, 'TestStagingStack', {
        environmentSuffix: 'staging',
        environment: 'staging',
      });
      template = Template.fromStack(stack);
    });

    test('staging environment should have correct VPC CIDR (10.1.0.0/16)', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.1.0.0/16',
      });
    });

    test('FIX 2: staging environment should use db.t3.small RDS instance', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceClass: 'db.t3.small',
      });
    });

    test('staging environment should have correct Lambda memory size (1024)', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        MemorySize: 1024,
      });
    });

    test('FIX 3 & FIX 4: staging environment should have correct log retention (30 days)', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 30,
      });
    });

    test('staging environment should have RDS backup retention of 14 days', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        BackupRetentionPeriod: 14,
      });
    });

    test('staging environment should have S3 versioning enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });
  });

  describe('FIX 6: Environment Configs - Production Environment', () => {
    let stack: TapStack;
    let template: Template;

    beforeEach(() => {
      stack = new TapStack(app, 'TestProdStack', {
        environmentSuffix: 'prod',
        environment: 'prod',
      });
      template = Template.fromStack(stack);
    });

    test('prod environment should have correct VPC CIDR (10.2.0.0/16)', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.2.0.0/16',
      });
    });

    test('FIX 2: prod environment should use db.r5.large RDS instance', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceClass: 'db.r5.large',
      });
    });

    test('prod environment should have correct Lambda memory size (2048)', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        MemorySize: 2048,
      });
    });

    test('FIX 3 & FIX 4: prod environment should have correct log retention (90 days)', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 90,
      });
    });

    test('prod environment should have RDS backup retention of 30 days', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        BackupRetentionPeriod: 30,
      });
    });

    test('prod environment should have multi-AZ RDS (multiAz: true)', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        MultiAZ: true,
      });
    });

    test('prod environment should have S3 versioning enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('prod environment should use PROVISIONED billing mode', () => {
      // Find the DynamoDB table (not custom resources)
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'analytics-state-prod',
        BillingMode: Match.absent(), // When provisioned, BillingMode is not set
      });

      // Verify provisioned throughput is set
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'analytics-state-prod',
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      });
    });
  });

  describe('FIX 1: RDS Storage Encryption', () => {
    test('RDS instance should have StorageEncrypted: true', () => {
      const stack = new TapStack(app, 'TestEncryptionStack', {
        environmentSuffix: 'dev',
        environment: 'dev',
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::RDS::DBInstance', {
        StorageEncrypted: true,
      });
    });

    test('RDS encryption should be enabled in all environments', () => {
      const environments = ['dev', 'staging', 'prod'];

      environments.forEach((env) => {
        const testApp = new cdk.App();
        const stack = new TapStack(testApp, `Test${env}EncStack`, {
          environmentSuffix: env,
          environment: env,
        });
        const template = Template.fromStack(stack);

        template.hasResourceProperties('AWS::RDS::DBInstance', {
          StorageEncrypted: true,
        });
      });
    });
  });

  describe('FIX 2: RDS Instance Type Configuration', () => {
    test('RDS should use config value for instance type in dev', () => {
      const stack = new TapStack(app, 'TestRDSDevStack', {
        environmentSuffix: 'dev',
        environment: 'dev',
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceClass: 'db.t3.micro',
      });
    });

    test('RDS should correctly parse and apply instance types from config', () => {
      const configs = [
        { env: 'dev', expected: 'db.t3.micro' },
        { env: 'staging', expected: 'db.t3.small' },
        { env: 'prod', expected: 'db.r5.large' },
      ];

      configs.forEach(({ env, expected }) => {
        const testApp = new cdk.App();
        const stack = new TapStack(testApp, `TestRDS${env}Stack`, {
          environmentSuffix: env,
          environment: env,
        });
        const template = Template.fromStack(stack);

        template.hasResourceProperties('AWS::RDS::DBInstance', {
          DBInstanceClass: expected,
        });
      });
    });
  });

  describe('FIX 3: CloudWatch Log Retention Enum', () => {
    test('Log groups should use RetentionDays enum values', () => {
      const stack = new TapStack(app, 'TestLogRetentionStack', {
        environmentSuffix: 'dev',
        environment: 'dev',
      });
      const template = Template.fromStack(stack);

      // Verify log retention is set to valid enum value (7 days for dev)
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 7,
      });
    });

    test('Log retention should match config for all environments', () => {
      const configs = [
        { env: 'dev', retention: 7 },
        { env: 'staging', retention: 30 },
        { env: 'prod', retention: 90 },
      ];

      configs.forEach(({ env, retention }) => {
        const testApp = new cdk.App();
        const stack = new TapStack(testApp, `TestLog${env}Stack`, {
          environmentSuffix: env,
          environment: env,
        });
        const template = Template.fromStack(stack);

        template.hasResourceProperties('AWS::Logs::LogGroup', {
          RetentionInDays: retention,
        });
      });
    });
  });

  describe('FIX 4: RemovalPolicy for Log Groups', () => {
    test('Log groups should have RemovalPolicy.DESTROY', () => {
      const stack = new TapStack(app, 'TestRemovalPolicyStack', {
        environmentSuffix: 'dev',
        environment: 'dev',
      });
      const template = Template.fromStack(stack);

      // Check that log group has DeletionPolicy set to Delete
      const logGroups = template.findResources('AWS::Logs::LogGroup');
      const logGroupKeys = Object.keys(logGroups);

      expect(logGroupKeys.length).toBeGreaterThan(0);
      logGroupKeys.forEach((key) => {
        expect(logGroups[key].DeletionPolicy).toBe('Delete');
      });
    });

    test('RemovalPolicy should be Delete in all environments', () => {
      const environments = ['dev', 'staging', 'prod'];

      environments.forEach((env) => {
        const testApp = new cdk.App();
        const stack = new TapStack(testApp, `TestRemoval${env}Stack`, {
          environmentSuffix: env,
          environment: env,
        });
        const template = Template.fromStack(stack);

        const logGroups = template.findResources('AWS::Logs::LogGroup');
        const logGroupKeys = Object.keys(logGroups);

        logGroupKeys.forEach((key) => {
          expect(logGroups[key].DeletionPolicy).toBe('Delete');
        });
      });
    });
  });

  describe('VPC Configuration', () => {
    let stack: TapStack;
    let template: Template;

    beforeEach(() => {
      stack = new TapStack(app, 'TestVPCStack', {
        environmentSuffix: 'dev',
        environment: 'dev',
      });
      template = Template.fromStack(stack);
    });

    test('VPC should be created with correct CIDR block', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
      });
    });

    test('VPC should have public and private subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 4); // 2 public + 2 private (2 AZs)
    });

    test('VPC should have VPC endpoints for AWS services (no NAT Gateway)', () => {
      // Should have 0 NAT Gateways to avoid AWS account limits
      template.resourceCountIs('AWS::EC2::NatGateway', 0);
      // Should have VPC endpoints instead
      template.resourceCountIs('AWS::EC2::VPCEndpoint', 3); // Secrets Manager, S3, DynamoDB
    });

    test('VPC should have Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });

    test('VPC should have correct tag', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: 'vpc-dev',
          }),
        ]),
      });
    });
  });

  describe('Security Groups Configuration', () => {
    let stack: TapStack;
    let template: Template;

    beforeEach(() => {
      stack = new TapStack(app, 'TestSecurityGroupStack', {
        environmentSuffix: 'dev',
        environment: 'dev',
      });
      template = Template.fromStack(stack);
    });

    test('Lambda security group should be created', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Lambda functions',
      });
    });

    test('Database security group should be created', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for RDS database',
      });
    });

    test('Database security group should allow PostgreSQL from Lambda', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 5432,
        ToPort: 5432,
        Description: 'Allow PostgreSQL access from Lambda',
      });
    });

    test('should have at least 2 security groups (Lambda and Database)', () => {
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      expect(Object.keys(securityGroups).length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('RDS Database Configuration', () => {
    let stack: TapStack;
    let template: Template;

    beforeEach(() => {
      stack = new TapStack(app, 'TestRDSStack', {
        environmentSuffix: 'dev',
        environment: 'dev',
      });
      template = Template.fromStack(stack);
    });

    test('RDS instance should be created', () => {
      template.resourceCountIs('AWS::RDS::DBInstance', 1);
    });

    test('RDS should use PostgreSQL 14.15', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'postgres',
        EngineVersion: '14.15',
      });
    });

    test('RDS should have correct database name', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBName: 'analytics',
      });
    });

    test('RDS should have storage configuration', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        AllocatedStorage: '20',
        MaxAllocatedStorage: 100,
      });
    });

    test('RDS should have deletion protection disabled', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DeletionProtection: false,
      });
    });

    test('RDS should have correct RemovalPolicy', () => {
      const dbInstances = template.findResources('AWS::RDS::DBInstance');
      const dbInstanceKeys = Object.keys(dbInstances);
      expect(dbInstanceKeys.length).toBe(1);
      expect(dbInstances[dbInstanceKeys[0]].DeletionPolicy).toBe('Delete');
    });

    test('RDS should be in private subnets', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        PubliclyAccessible: false,
      });
    });

    test('RDS should have database secret created', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Name: 'db-credentials-dev',
        GenerateSecretString: Match.objectLike({
          SecretStringTemplate: Match.stringLikeRegexp('.*dbadmin.*'),
        }),
      });
    });

    test('RDS should have correct name tag', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: 'database-dev',
          }),
        ]),
      });
    });
  });

  describe('Lambda Function Configuration', () => {
    let stack: TapStack;
    let template: Template;

    beforeEach(() => {
      stack = new TapStack(app, 'TestLambdaStack', {
        environmentSuffix: 'dev',
        environment: 'dev',
      });
      template = Template.fromStack(stack);
    });

    test('Lambda function should be created', () => {
      // There are 2 Lambda functions: data processor + custom resource for S3 auto-delete
      template.resourceCountIs('AWS::Lambda::Function', 2);
      // Verify our data processor function exists
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'data-processor-dev',
      });
    });

    test('Lambda should use Python 3.11 runtime', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'python3.11',
      });
    });

    test('Lambda should have correct handler', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Handler: 'index.handler',
      });
    });

    test('Lambda should have correct function name with environment suffix', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'data-processor-dev',
      });
    });

    test('Lambda should have correct timeout', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Timeout: 30,
      });
    });

    test('Lambda should have VPC configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        VpcConfig: Match.objectLike({
          SubnetIds: Match.anyValue(),
          SecurityGroupIds: Match.anyValue(),
        }),
      });
    });

    test('Lambda should have database secret ARN in environment variables', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            DB_SECRET_ARN: Match.anyValue(),
          },
        },
      });
    });

    test('Lambda should have IAM role with VPC access', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            }),
          ]),
        },
        ManagedPolicyArns: Match.arrayWith([
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              Match.arrayWith([
                Match.stringLikeRegexp('.*AWSLambdaVPCAccessExecutionRole.*'),
              ]),
            ]),
          }),
        ]),
      });
    });

    test('Lambda role should have Secrets Manager permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'secretsmanager:GetSecretValue',
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('Lambda should have associated log group', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/lambda/data-processor-dev',
      });
    });
  });

  describe('S3 Bucket Configuration', () => {
    let stack: TapStack;
    let template: Template;

    beforeEach(() => {
      stack = new TapStack(app, 'TestS3Stack', {
        environmentSuffix: 'dev',
        environment: 'dev',
      });
      template = Template.fromStack(stack);
    });

    test('S3 bucket should be created', () => {
      template.resourceCountIs('AWS::S3::Bucket', 1);
    });

    test('S3 bucket should have correct name with environment suffix', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'analytics-data-dev',
      });
    });

    test('S3 bucket should have encryption enabled', () => {
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

    test('S3 bucket should have auto-delete objects enabled', () => {
      // Check for custom resource that enables auto-delete
      const customResources = template.findResources('Custom::S3AutoDeleteObjects');
      expect(Object.keys(customResources).length).toBeGreaterThan(0);
    });

    test('Lambda should have S3 read/write permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                's3:GetObject*',
                's3:GetBucket*',
                's3:List*',
              ]),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });
  });

  describe('DynamoDB Table Configuration', () => {
    let stack: TapStack;
    let template: Template;

    beforeEach(() => {
      stack = new TapStack(app, 'TestDynamoDBStack', {
        environmentSuffix: 'dev',
        environment: 'dev',
      });
      template = Template.fromStack(stack);
    });

    test('DynamoDB table should be created', () => {
      template.resourceCountIs('AWS::DynamoDB::Table', 1);
    });

    test('DynamoDB table should have correct name with environment suffix', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'analytics-state-dev',
      });
    });

    test('DynamoDB table should have correct partition key', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        KeySchema: [
          {
            AttributeName: 'id',
            KeyType: 'HASH',
          },
        ],
        AttributeDefinitions: [
          {
            AttributeName: 'id',
            AttributeType: 'S',
          },
        ],
      });
    });

    test('DynamoDB table should have encryption enabled', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        SSESpecification: {
          SSEEnabled: true,
        },
      });
    });

    test('DynamoDB table should have correct RemovalPolicy', () => {
      const tables = template.findResources('AWS::DynamoDB::Table');
      const tableKeys = Object.keys(tables);
      expect(tableKeys.length).toBe(1);
      expect(tables[tableKeys[0]].DeletionPolicy).toBe('Delete');
    });

    test('Lambda should have DynamoDB read/write permissions', () => {
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
              ]),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });
  });

  describe('SSM Parameters Configuration', () => {
    let stack: TapStack;
    let template: Template;

    beforeEach(() => {
      stack = new TapStack(app, 'TestSSMStack', {
        environmentSuffix: 'dev',
        environment: 'dev',
      });
      template = Template.fromStack(stack);
    });

    test('should create three SSM parameters', () => {
      template.resourceCountIs('AWS::SSM::Parameter', 3);
    });

    test('should create database endpoint parameter', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: '/dev/database/endpoint',
        Type: 'String',
        Description: 'RDS database endpoint',
        Tier: 'Standard',
      });
    });

    test('should create S3 bucket parameter', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: '/dev/storage/bucket',
        Type: 'String',
        Description: 'S3 data bucket name',
        Tier: 'Standard',
      });
    });

    test('should create DynamoDB table parameter', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: '/dev/storage/table',
        Type: 'String',
        Description: 'DynamoDB state table name',
        Tier: 'Standard',
      });
    });

    test('SSM parameters should use environment-specific paths', () => {
      const environments = ['dev', 'staging', 'prod'];

      environments.forEach((env) => {
        const testApp = new cdk.App(); // Create new app for each environment
        const testStack = new TapStack(testApp, `TestSSM${env}Stack`, {
          environmentSuffix: env,
          environment: env,
        });
        const testTemplate = Template.fromStack(testStack);

        testTemplate.hasResourceProperties('AWS::SSM::Parameter', {
          Name: `/${env}/database/endpoint`,
        });
      });
    });
  });

  describe('Stack Tags', () => {
    let stack: TapStack;
    let template: Template;

    beforeEach(() => {
      stack = new TapStack(app, 'TestTagsStack', {
        environmentSuffix: 'dev',
        environment: 'dev',
      });
      template = Template.fromStack(stack);
    });

    test('stack should have Environment tag', () => {
      // Check stack-level tags through VPC (stack tags propagate to resources)
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Environment',
            Value: 'dev',
          }),
        ]),
      });
    });

    test('stack should have CostCenter tag', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'CostCenter',
            Value: 'analytics',
          }),
        ]),
      });
    });

    test('stack should have ManagedBy tag', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'ManagedBy',
            Value: 'cdk',
          }),
        ]),
      });
    });
  });

  describe('Resource Naming with Environment Suffix', () => {
    test('all resources should include environment suffix in names', () => {
      const stack = new TapStack(app, 'TestNamingStack', {
        environmentSuffix: 'test123',
        environment: 'dev',
      });
      const template = Template.fromStack(stack);

      // Check Lambda function name
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'data-processor-test123',
      });

      // Check S3 bucket name
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'analytics-data-test123',
      });

      // Check DynamoDB table name
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'analytics-state-test123',
      });

      // Check log group name
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/lambda/data-processor-test123',
      });
    });

    test('different environment suffixes should create different resource names', () => {
      const app1 = new cdk.App();
      const stack1 = new TapStack(app1, 'TestNaming1Stack', {
        environmentSuffix: 'env1',
        environment: 'dev',
      });
      const template1 = Template.fromStack(stack1);

      const app2 = new cdk.App();
      const stack2 = new TapStack(app2, 'TestNaming2Stack', {
        environmentSuffix: 'env2',
        environment: 'dev',
      });
      const template2 = Template.fromStack(stack2);

      // Verify different suffixes result in different resource names
      template1.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'data-processor-env1',
      });

      template2.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'data-processor-env2',
      });
    });
  });

  describe('Complete Stack Synthesis', () => {
    test('stack should synthesize without errors', () => {
      const stack = new TapStack(app, 'TestSynthesisStack', {
        environmentSuffix: 'dev',
        environment: 'dev',
      });

      expect(() => {
        app.synth();
      }).not.toThrow();
    });

    test('all environments should synthesize successfully', () => {
      const environments = ['dev', 'staging', 'prod'];

      environments.forEach((env) => {
        const testApp = new cdk.App();
        new TapStack(testApp, `TestSynth${env}Stack`, {
          environmentSuffix: env,
          environment: env,
        });

        expect(() => {
          testApp.synth();
        }).not.toThrow();
      });
    });

    test('stack should have correct resource counts', () => {
      const stack = new TapStack(app, 'TestResourceCountStack', {
        environmentSuffix: 'dev',
        environment: 'dev',
      });
      const template = Template.fromStack(stack);

      // Verify minimum resource counts
      template.resourceCountIs('AWS::EC2::VPC', 1);
      template.resourceCountIs('AWS::RDS::DBInstance', 1);
      // Lambda count includes custom resource for S3 auto-delete
      const lambdaFunctions = template.findResources('AWS::Lambda::Function');
      expect(Object.keys(lambdaFunctions).length).toBeGreaterThanOrEqual(1);
      template.resourceCountIs('AWS::S3::Bucket', 1);
      template.resourceCountIs('AWS::DynamoDB::Table', 1);
      template.resourceCountIs('AWS::SSM::Parameter', 3);
      // Log groups include Lambda log group and potentially custom resource log groups
      const logGroups = template.findResources('AWS::Logs::LogGroup');
      expect(Object.keys(logGroups).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('All 6 Fixes Validation', () => {
    test('ALL FIXES should be present in the stack', () => {
      const stack = new TapStack(app, 'TestAllFixesStack', {
        environmentSuffix: 'dev',
        environment: 'dev',
      });
      const template = Template.fromStack(stack);

      // FIX 1: RDS Encryption
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        StorageEncrypted: true,
      });

      // FIX 2: RDS Instance Type from config
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceClass: 'db.t3.micro',
      });

      // FIX 3: Log Retention Enum
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 7,
      });

      // FIX 4: RemovalPolicy on Log Groups
      const logGroups = template.findResources('AWS::Logs::LogGroup');
      Object.keys(logGroups).forEach((key) => {
        expect(logGroups[key].DeletionPolicy).toBe('Delete');
      });

      // FIX 5: Environment Validation (tested via config function)
      expect(() => {
        getEnvironmentConfig('invalid');
      }).toThrow();

      // FIX 6: Environment Configs (all three environments work)
      ['dev', 'staging', 'prod'].forEach((env) => {
        expect(() => {
          getEnvironmentConfig(env);
        }).not.toThrow();
      });
    });
  });
});
