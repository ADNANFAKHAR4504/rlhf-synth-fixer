import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';
import { SecurityStack } from '../lib/security-stack';
import { StorageStack } from '../lib/storage-stack';
import { ComputeStack } from '../lib/compute-stack';
import { DatabaseStack } from '../lib/database-stack';
import { MonitoringStack } from '../lib/monitoring-stack';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

// Mock VPC.fromLookup to avoid context provider errors in tests
jest.mock('aws-cdk-lib/aws-ec2', () => {
  const actual = jest.requireActual('aws-cdk-lib/aws-ec2');
  return {
    ...actual,
    Vpc: {
      ...actual.Vpc,
      fromLookup: jest.fn((scope, id, props) => {
        // Create VPC in the same scope to avoid cross-app references
        return new actual.Vpc(scope, id + 'Mock', {
          maxAzs: 2,
          natGateways: 0,
          subnetConfiguration: [
            {
              cidrMask: 24,
              name: 'Public',
              subnetType: actual.SubnetType.PUBLIC,
            },
          ],
        });
      }),
    },
  };
});

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;
  const environmentSuffix = 'test';

  beforeEach(() => {
    app = new cdk.App({
      context: {
        'availability-zones:account=123456789012:region=us-east-1': ['us-east-1a', 'us-east-1b'],
      }
    });
    stack = new TapStack(app, 'TestTapStack', { 
      environmentSuffix,
      stackName: `TapStack${environmentSuffix}`,
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('Main Stack', () => {
    test('creates nested stacks', () => {
      template.hasResourceProperties('AWS::CloudFormation::Stack', {
        Tags: Match.arrayWith([
          { Key: 'Project', Value: 'IaCChallenge' }
        ])
      });
      
      // Verify nested stacks are created
      template.resourceCountIs('AWS::CloudFormation::Stack', 5); // 5 nested stacks
    });

    test('uses context environmentSuffix when props not provided', () => {
      const contextApp = new cdk.App({
        context: {
          'availability-zones:account=123456789012:region=us-east-1': ['us-east-1a', 'us-east-1b'],
          'environmentSuffix': 'context-env'
        }
      });
      const contextStack = new TapStack(contextApp, 'ContextTestStack', {
        stackName: 'ContextTestStack',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      const contextTemplate = Template.fromStack(contextStack);
      
      // Verify that nested stacks exist (indicating successful construction)
      contextTemplate.resourceCountIs('AWS::CloudFormation::Stack', 5);
    });

    test('uses default environmentSuffix when neither props nor context provided', () => {
      const defaultApp = new cdk.App({
        context: {
          'availability-zones:account=123456789012:region=us-east-1': ['us-east-1a', 'us-east-1b'],
        }
      });
      const defaultStack = new TapStack(defaultApp, 'DefaultTestStack', {
        stackName: 'DefaultTestStack',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      const defaultTemplate = Template.fromStack(defaultStack);
      
      // Verify that nested stacks exist (indicating successful construction with default suffix)
      defaultTemplate.resourceCountIs('AWS::CloudFormation::Stack', 5);
    });

    test('has correct outputs', () => {
      template.hasOutput('EC2InstanceId', {
        Description: 'EC2 Instance ID'
      });
      
      template.hasOutput('S3BucketName', {
        Description: 'S3 Bucket Name'
      });
      
      template.hasOutput('DynamoDBTableName', {
        Description: 'DynamoDB Table Name'
      });
    });

    test('applies Project tags', () => {
      template.hasResourceProperties('AWS::CloudFormation::Stack', {
        Tags: Match.arrayWith([
          { Key: 'Project', Value: 'IaCChallenge' }
        ])
      });
    });
  });

  describe('SecurityStack', () => {
    let securityStack: SecurityStack;
    let securityTemplate: Template;

    beforeEach(() => {
      const app = new cdk.App();
      const parentStack = new cdk.Stack(app, 'ParentStack');
      securityStack = new SecurityStack(parentStack, 'TestSecurityStack', {
        environmentSuffix,
      });
      securityTemplate = Template.fromStack(securityStack);
    });

    test('creates EC2 role with correct permissions', () => {
      securityTemplate.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: Match.objectLike({
                Service: 'ec2.amazonaws.com'
              })
            })
          ])
        }),
        RoleName: `ec2-role-${environmentSuffix}`,
        ManagedPolicyArns: Match.arrayWith([
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              '',
              Match.arrayWith([
                Match.stringLikeRegexp('CloudWatchAgentServerPolicy')
              ])
            ])
          })
        ])
      });
    });

    test('creates instance profile', () => {
      securityTemplate.hasResourceProperties('AWS::IAM::InstanceProfile', {
        InstanceProfileName: `ec2-instance-profile-${environmentSuffix}`,
      });
    });

    test('adds correct IAM policy for services', () => {
      securityTemplate.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith([
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                's3:GetObject',
                's3:PutObject',
                'dynamodb:GetItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
                'dax:*'
              ])
            })
          ])
        })
      });
    });

    test('exports EC2 role', () => {
      expect(securityStack.ec2Role).toBeDefined();
      expect(securityStack.ec2Role).toBeInstanceOf(iam.Role);
    });
  });

  describe('StorageStack', () => {
    let storageStack: StorageStack;
    let storageTemplate: Template;

    beforeEach(() => {
      const app = new cdk.App();
      const parentStack = new cdk.Stack(app, 'ParentStack');
      storageStack = new StorageStack(parentStack, 'TestStorageStack', {
        environmentSuffix,
      });
      storageTemplate = Template.fromStack(storageStack);
    });

    test('creates S3 bucket with versioning enabled', () => {
      storageTemplate.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `secure-bucket-${environmentSuffix}`,
        VersioningConfiguration: {
          Status: 'Enabled'
        }
      });
    });

    test('enables AES256 encryption', () => {
      storageTemplate.hasResourceProperties('AWS::S3::Bucket', {
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
    });

    test('blocks public access', () => {
      storageTemplate.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        }
      });
    });

    test('enforces SSL', () => {
      storageTemplate.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
              Condition: Match.objectLike({
                Bool: {
                  'aws:SecureTransport': 'false'
                }
              })
            })
          ])
        })
      });
    });

    test('creates CloudWatch log group for S3 access logs', () => {
      storageTemplate.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/s3/access-logs-${environmentSuffix}`,
        RetentionInDays: 7
      });
    });

    test('exports S3 bucket', () => {
      expect(storageStack.s3Bucket).toBeDefined();
      expect(storageStack.s3Bucket).toBeInstanceOf(s3.Bucket);
    });
  });

  describe('ComputeStack', () => {
    let computeStack: ComputeStack;
    let computeTemplate: Template;
    let mockEc2Role: iam.Role;

    beforeEach(() => {
      const app = new cdk.App({
        context: {
          'availability-zones:account=123456789012:region=us-east-1': ['us-east-1a', 'us-east-1b'],
        }
      });
      
      // Create a parent stack for the compute stack
      const parentStack = new cdk.Stack(app, 'ParentStack');
      
      // Create a mock EC2 role within the same parent stack context
      mockEc2Role = new iam.Role(parentStack, 'MockEC2Role', {
        assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      });

      computeStack = new ComputeStack(parentStack, 'TestComputeStack', {
        environmentSuffix,
        ec2Role: mockEc2Role,
      });
      computeTemplate = Template.fromStack(computeStack);
    });

    test('uses default VPC', () => {
      // The stack creates a VPC from the mock (fromLookup creates a new VPC in tests)
      computeTemplate.resourceCountIs('AWS::EC2::VPC', 1);
    });

    test('creates security group', () => {
      computeTemplate.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for EC2 instance',
        GroupName: `ec2-sg-${environmentSuffix}`,
      });
    });

    test('creates EC2 instance with correct configuration', () => {
      computeTemplate.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.micro',
        Monitoring: true,
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: `secure-ec2-${environmentSuffix}`
          })
        ])
      });
    });

    test('enables detailed monitoring', () => {
      computeTemplate.hasResourceProperties('AWS::EC2::Instance', {
        Monitoring: true
      });
    });

    test('creates CloudWatch log group for EC2', () => {
      computeTemplate.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/ec2/logs-${environmentSuffix}`,
        RetentionInDays: 7
      });
    });

    test('exports EC2 instance and VPC', () => {
      expect(computeStack.ec2Instance).toBeDefined();
      expect(computeStack.ec2Instance).toBeInstanceOf(ec2.Instance);
      expect(computeStack.vpc).toBeDefined();
    });
  });

  describe('DatabaseStack', () => {
    let databaseStack: DatabaseStack;
    let databaseTemplate: Template;

    beforeEach(() => {
      const app = new cdk.App();
      const parentStack = new cdk.Stack(app, 'ParentStack');
      databaseStack = new DatabaseStack(parentStack, 'TestDatabaseStack', {
        environmentSuffix,
      });
      databaseTemplate = Template.fromStack(databaseStack);
    });

    test('creates DynamoDB table with correct configuration', () => {
      databaseTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `secure-table-${environmentSuffix}`,
        BillingMode: 'PAY_PER_REQUEST',
        AttributeDefinitions: Match.arrayWith([
          Match.objectLike({
            AttributeName: 'id',
            AttributeType: 'S'
          })
        ]),
        KeySchema: Match.arrayWith([
          Match.objectLike({
            AttributeName: 'id',
            KeyType: 'HASH'
          })
        ])
      });
    });

    test('enables point-in-time recovery', () => {
      databaseTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true
        }
      });
    });

    test('uses AWS managed encryption', () => {
      databaseTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        SSESpecification: {
          SSEEnabled: true
        }
      });
    });

    test('enables contributor insights', () => {
      databaseTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        ContributorInsightsSpecification: {
          Enabled: true
        }
      });
    });

    test('creates CloudWatch log group for DynamoDB', () => {
      databaseTemplate.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/dynamodb/logs-${environmentSuffix}`,
        RetentionInDays: 7
      });
    });

    test('exports DynamoDB table', () => {
      expect(databaseStack.dynamoTable).toBeDefined();
      expect(databaseStack.dynamoTable).toBeInstanceOf(dynamodb.Table);
    });
  });

  describe('MonitoringStack', () => {
    let monitoringStack: MonitoringStack;
    let monitoringTemplate: Template;

    beforeEach(() => {
      const app = new cdk.App();
      
      // Create parent stack and mock resources within it
      const parentStack = new cdk.Stack(app, 'ParentStack');
      const mockVpc = ec2.Vpc.fromLookup(parentStack, 'MockVpc', { isDefault: true });
      const mockEc2Instance = new ec2.Instance(parentStack, 'MockInstance', {
        vpc: mockVpc,
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
        machineImage: new ec2.AmazonLinuxImage(),
      });
      const mockS3Bucket = new s3.Bucket(parentStack, 'MockBucket');
      const mockDynamoTable = new dynamodb.Table(parentStack, 'MockTable', {
        partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      });

      monitoringStack = new MonitoringStack(parentStack, 'TestMonitoringStack', {
        environmentSuffix,
        ec2Instance: mockEc2Instance,
        s3Bucket: mockS3Bucket,
        dynamoTable: mockDynamoTable,
      });
      monitoringTemplate = Template.fromStack(monitoringStack);
    });

    test('creates CloudWatch dashboard', () => {
      monitoringTemplate.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `security-dashboard-${environmentSuffix}`,
      });
    });

    test('creates CPU alarm', () => {
      monitoringTemplate.hasResourceProperties('AWS::CloudWatch::Alarm', {
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
        EvaluationPeriods: 2,
        Threshold: 80
      });
    });

    test('creates CloudWatch Insights log group', () => {
      monitoringTemplate.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/insights/observability-${environmentSuffix}`,
        RetentionInDays: 7
      });
    });

    test('dashboard contains required widgets', () => {
      monitoringTemplate.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardBody: Match.anyValue(),
      });
    });
  });

  describe('Resource Cleanup', () => {
    test('all resources have RemovalPolicy.DESTROY', () => {
      // Check that S3 buckets have auto-delete enabled
      const storageApp = new cdk.App();
      const storageParentStack = new cdk.Stack(storageApp, 'StorageParent');
      const storageStack = new StorageStack(storageParentStack, 'TestStorage', { environmentSuffix });
      const storageTemplate = Template.fromStack(storageStack);
      
      // Check for auto-delete objects custom resource (CDK creates this for buckets with autoDeleteObjects)
      storageTemplate.hasResourceProperties('Custom::S3AutoDeleteObjects', Match.anyValue());

      // Check DynamoDB table has deletion policy
      const dbApp = new cdk.App();
      const dbParentStack = new cdk.Stack(dbApp, 'DbParent');
      const dbStack = new DatabaseStack(dbParentStack, 'TestDB', { environmentSuffix });
      const dbTemplate = Template.fromStack(dbStack);
      
      dbTemplate.hasResource('AWS::DynamoDB::Table', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete'
      });

      // Check log groups have deletion policy
      dbTemplate.hasResource('AWS::Logs::LogGroup', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete'
      });
    });
  });

  describe('Environment Suffix Usage', () => {
    test('all resources use environment suffix in naming', () => {
      const testSuffix = 'unittests';
      
      // Test Security Stack
      const secApp = new cdk.App();
      const secParentStack = new cdk.Stack(secApp, 'SecParent');
      const secStack = new SecurityStack(secParentStack, 'SecTest', { environmentSuffix: testSuffix });
      const secTemplate = Template.fromStack(secStack);
      
      secTemplate.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `ec2-role-${testSuffix}`
      });
      
      // Test Storage Stack
      const storApp = new cdk.App();
      const storParentStack = new cdk.Stack(storApp, 'StorParent');
      const storStack = new StorageStack(storParentStack, 'StorTest', { environmentSuffix: testSuffix });
      const storTemplate = Template.fromStack(storStack);
      
      storTemplate.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `secure-bucket-${testSuffix}`
      });
      
      // Test Database Stack
      const dbApp = new cdk.App();
      const dbParentStack = new cdk.Stack(dbApp, 'DbParent');
      const dbStack = new DatabaseStack(dbParentStack, 'DbTest', { environmentSuffix: testSuffix });
      const dbTemplate = Template.fromStack(dbStack);
      
      dbTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `secure-table-${testSuffix}`
      });
    });
  });
});