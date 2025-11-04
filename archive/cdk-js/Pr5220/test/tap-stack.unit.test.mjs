import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack.mjs';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

describe('TapStack', () => {
  let app;
  let stack;
  let template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      env: {
        account: '123456789012',
        region: 'ca-central-1',
      },
      environmentSuffix,
    });
    template = Template.fromStack(stack);
  });

  describe('VPC and Networking', () => {
    test('creates a VPC', () => {
      template.resourceCountIs('AWS::EC2::VPC', 1);
    });

    test('creates subnets for multi-AZ deployment', () => {
      const subnets = template.findResources('AWS::EC2::Subnet');
      expect(Object.keys(subnets).length).toBeGreaterThan(1);
    });

    test('creates security groups', () => {
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      expect(Object.keys(securityGroups).length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('KMS Encryption', () => {
    test('creates KMS keys with rotation enabled', () => {
      const kmsKeys = template.findResources('AWS::KMS::Key');
      expect(Object.keys(kmsKeys).length).toBeGreaterThan(0);

      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
      });
    });
  });

  describe('Secrets Manager', () => {
    test('creates database credentials secret', () => {
      template.resourceCountIs('AWS::SecretsManager::Secret', 1);
    });
  });

  describe('Kinesis Data Streams', () => {
    test('creates Kinesis stream with encryption', () => {
      template.resourceCountIs('AWS::Kinesis::Stream', 1);
      template.hasResourceProperties('AWS::Kinesis::Stream', {
        StreamEncryption: {
          EncryptionType: 'KMS',
        },
        ShardCount: 10,
        RetentionPeriodHours: 24,
      });
    });
  });

  describe('RDS Database', () => {
    test('creates RDS cluster with encryption and backups', () => {
      template.resourceCountIs('AWS::RDS::DBCluster', 1);
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        StorageEncrypted: true,
        BackupRetentionPeriod: 7,
      });
    });

    test('RDS instances are not publicly accessible', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        PubliclyAccessible: false,
      });
    });
  });

  describe('EFS Storage', () => {
    test('creates encrypted EFS file system', () => {
      template.resourceCountIs('AWS::EFS::FileSystem', 1);
      template.hasResourceProperties('AWS::EFS::FileSystem', {
        Encrypted: true,
      });
    });

    test('creates EFS mount targets for multi-AZ', () => {
      const mountTargets = template.findResources('AWS::EFS::MountTarget');
      expect(Object.keys(mountTargets).length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('ElastiCache Redis', () => {
    test('creates ElastiCache with failover and encryption', () => {
      template.resourceCountIs('AWS::ElastiCache::ReplicationGroup', 1);
      template.hasResourceProperties('AWS::ElastiCache::ReplicationGroup', {
        AutomaticFailoverEnabled: true,
        MultiAZEnabled: true,
        TransitEncryptionEnabled: true,
        AtRestEncryptionEnabled: true,
      });
    });
  });

  describe('ECS Fargate', () => {
    test('creates ECS cluster and Fargate task definition', () => {
      template.resourceCountIs('AWS::ECS::Cluster', 1);
      template.resourceCountIs('AWS::ECS::TaskDefinition', 1);
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        RequiresCompatibilities: ['FARGATE'],
        NetworkMode: 'awsvpc',
      });
    });

    test('creates ECS service with auto-scaling', () => {
      template.resourceCountIs('AWS::ECS::Service', 1);
      template.resourceCountIs('AWS::ApplicationAutoScaling::ScalableTarget', 1);
    });
  });

  describe('API Gateway', () => {
    test('creates REST API with CloudWatch logging', () => {
      template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
      template.resourceCountIs('AWS::ApiGateway::Stage', 1);
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        MethodSettings: [
          {
            DataTraceEnabled: true,
            LoggingLevel: 'INFO',
          },
        ],
      });
    });
  });

  describe('CodePipeline', () => {
    test('creates CodePipeline with CodeBuild', () => {
      template.resourceCountIs('AWS::CodePipeline::Pipeline', 1);
      template.resourceCountIs('AWS::CodeBuild::Project', 1);
    });

    test('S3 buckets have encryption', () => {
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
  });

  describe('CloudWatch Monitoring', () => {
    test('creates CloudWatch log groups with retention', () => {
      const logGroups = template.findResources('AWS::Logs::LogGroup');
      expect(Object.keys(logGroups).length).toBeGreaterThan(0);
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 7,
      });
    });
  });

  describe('HIPAA Compliance', () => {
    test('all data stores have encryption at rest', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        StorageEncrypted: true,
      });
      template.hasResourceProperties('AWS::EFS::FileSystem', {
        Encrypted: true,
      });
      template.hasResourceProperties('AWS::ElastiCache::ReplicationGroup', {
        AtRestEncryptionEnabled: true,
      });
      template.hasResourceProperties('AWS::Kinesis::Stream', {
        StreamEncryption: {
          EncryptionType: 'KMS',
        },
      });
    });

    test('data in transit is encrypted', () => {
      template.hasResourceProperties('AWS::ElastiCache::ReplicationGroup', {
        TransitEncryptionEnabled: true,
      });
    });
  });

  describe('Disaster Recovery', () => {
    test('automated backups and multi-AZ deployment configured', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        BackupRetentionPeriod: 7,
      });
      template.hasResourceProperties('AWS::ElastiCache::ReplicationGroup', {
        MultiAZEnabled: true,
        AutomaticFailoverEnabled: true,
      });
    });
  });

  describe('Stack Outputs', () => {
    test('stack exports key resource information', () => {
      template.hasOutput('StackName', {});
      template.hasOutput('Region', {});
    });
  });

  describe('TapStack Specific Tests', () => {
    test('creates stack with environment suffix from props', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack', {
        environmentSuffix: 'prod',
        env: {
          account: '123456789012',
          region: 'ca-central-1',
        },
      });

      expect(testStack).toBeDefined();
      const testTemplate = Template.fromStack(testStack);
      expect(testTemplate).toBeDefined();
    });

    test('creates stack with environment suffix from context', () => {
      const testApp = new cdk.App({
        context: {
          environmentSuffix: 'staging',
        },
      });
      const testStack = new TapStack(testApp, 'TestStack', {
        env: {
          account: '123456789012',
          region: 'ca-central-1',
        },
      });

      expect(testStack).toBeDefined();
    });

    test('creates stack with default environment suffix', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack', {
        env: {
          account: '123456789012',
          region: 'ca-central-1',
        },
      });

      expect(testStack).toBeDefined();
    });

    test('creates all nested stacks', () => {
      const stackNames = stack.node.children.map(child => child.node.id);

      expect(stackNames).toContain('Networking');
      expect(stackNames).toContain('Security');
      expect(stackNames).toContain('DataIngestion');
      expect(stackNames).toContain('Database');
      expect(stackNames).toContain('Storage');
      expect(stackNames).toContain('Cache');
      expect(stackNames).toContain('Compute');
      expect(stackNames).toContain('Api');
      expect(stackNames).toContain('Pipeline');
    });

    test('outputs have correct descriptions', () => {
      const outputs = template.findOutputs('*');
      expect(outputs.StackName).toBeDefined();
      expect(outputs.Region).toBeDefined();
    });
  });
});