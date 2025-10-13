import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack, TapStackConfig } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;
  let config: TapStackConfig;

  beforeEach(() => {
    app = new cdk.App();
    config = {
      isPrimary: true,
      regionName: 'us-west-1',
      peerRegion: 'us-west-2',
      environmentSuffix: environmentSuffix,
    };
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
      config,
    });
    template = Template.fromStack(stack);
  });

  describe('Stack Construction', () => {
    test('should create stack with correct properties', () => {
      expect(stack).toBeDefined();
      expect(stack.stackName).toBe('TestTapStack');
    });

    test('should handle missing environmentSuffix with default', () => {
      const stackWithoutEnv = new TapStack(app, 'TestStackNoEnv', {
        config: {
          isPrimary: false,
          regionName: 'us-west-2',
          peerRegion: 'us-west-1',
        },
      });
      expect(stackWithoutEnv).toBeDefined();
    });
  });

  describe('KMS Key', () => {
    test('should create KMS key with correct properties', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: `Master KMS key for ${config.regionName} region`,
        EnableKeyRotation: true,
      });
    });

    test('should create KMS alias', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: `alias/tap-${environmentSuffix}-${config.regionName}`,
      });
    });
  });

  describe('S3 Bucket', () => {
    test('should create S3 bucket for audit logs', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('should create S3 bucket with lifecycle rules', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'DeleteOldLogs',
              Status: 'Enabled',
              ExpirationInDays: 90,
              Transitions: [
                {
                  StorageClass: 'GLACIER',
                  TransitionInDays: 30,
                },
              ],
            },
          ],
        },
      });
    });
  });

  describe('CloudTrail', () => {
    test('should create CloudTrail for audit logging', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        IncludeGlobalServiceEvents: config.isPrimary,
        IsMultiRegionTrail: config.isPrimary,
        EnableLogFileValidation: true,
      });
    });
  });

  describe('VPC', () => {
    test('should create VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        Tags: [
          {
            Key: 'Name',
            Value: `tap-vpc-${environmentSuffix}-${config.regionName}`,
          },
        ],
      });
    });

    test('should create VPC with custom CIDR when provided', () => {
      const customApp = new cdk.App();
      const customConfig = { ...config, vpcCidr: '10.1.0.0/16' };
      const customStack = new TapStack(customApp, 'CustomVpcStack', {
        environmentSuffix,
        config: customConfig,
      });
      const customTemplate = Template.fromStack(customStack);
      
      customTemplate.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.1.0.0/16',
      });
    });
  });

  describe('Aurora Cluster', () => {
    test('should create Aurora cluster with correct engine', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        Engine: 'aurora-mysql',
        EngineVersion: '8.0.mysql_aurora.3.04.2',
        DBClusterIdentifier: `tap-aurora-${environmentSuffix}-${config.regionName}`,
        StorageEncrypted: true,
      });
    });

    test('should create Aurora cluster instances', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceClass: 'db.r6g.xlarge',
        Engine: 'aurora-mysql',
      });
    });

    test('should create Aurora cluster with correct instance count', () => {
      const instances = template.findResources('AWS::RDS::DBInstance');
      expect(Object.keys(instances)).toHaveLength(2);
    });
  });

  describe('DynamoDB Table', () => {
    test('should create DynamoDB table for primary region', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `tap-sessions-${environmentSuffix}`,
        BillingMode: 'PAY_PER_REQUEST',
        SSESpecification: {
          SSEEnabled: true,
        },
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
        StreamSpecification: {
          StreamViewType: 'NEW_AND_OLD_IMAGES',
        },
      });
    });

    test('should create DynamoDB table with correct key schema', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        KeySchema: [
          {
            AttributeName: 'sessionId',
            KeyType: 'HASH',
          },
          {
            AttributeName: 'timestamp',
            KeyType: 'RANGE',
          },
        ],
        AttributeDefinitions: [
          {
            AttributeName: 'sessionId',
            AttributeType: 'S',
          },
          {
            AttributeName: 'timestamp',
            AttributeType: 'N',
          },
          {
            AttributeName: 'userId',
            AttributeType: 'S',
          },
        ],
      });
    });

    test('should create DynamoDB GSI for user lookups', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        GlobalSecondaryIndexes: [
          {
            IndexName: 'UserIndex',
            KeySchema: [
              {
                AttributeName: 'userId',
                KeyType: 'HASH',
              },
            ],
            Projection: {
              ProjectionType: 'ALL',
            },
          },
        ],
      });
    });

    test('should not create DynamoDB table for DR region', () => {
      const drApp = new cdk.App();
      const drConfig = { ...config, isPrimary: false };
      const drStack = new TapStack(drApp, 'DRStack', {
        environmentSuffix,
        config: drConfig,
      });
      const drTemplate = Template.fromStack(drStack);
      
      const tables = drTemplate.findResources('AWS::DynamoDB::Table');
      expect(Object.keys(tables)).toHaveLength(0);
    });
  });

  describe('ECS Cluster', () => {
    test('should create ECS cluster', () => {
      template.hasResourceProperties('AWS::ECS::Cluster', {
        ClusterName: `tap-cluster-${environmentSuffix}-${config.regionName}`,
        ClusterSettings: [
          {
            Name: 'containerInsights',
            Value: 'enabled',
          },
        ],
      });
    });
  });

  describe('Application Load Balancer', () => {
    test('should create ALB with correct configuration', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Name: `tap-alb-${environmentSuffix}-${config.regionName}`,
        Scheme: 'internet-facing',
        Type: 'application',
      });
    });
  });

  describe('Lambda Function', () => {
    test('should create failover Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `tap-failover-${environmentSuffix}-${config.regionName}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Timeout: 300,
      });
    });
  });

  describe('Route 53 Health Check', () => {
    test('should create Route 53 health check', () => {
      template.hasResourceProperties('AWS::Route53::HealthCheck', {
        HealthCheckConfig: {
          Type: 'HTTPS',
          ResourcePath: '/health',
          Port: 443,
          RequestInterval: 30,
          FailureThreshold: 3,
        },
        HealthCheckTags: [
          {
            Key: 'Name',
            Value: `${config.regionName}-health-check`,
          },
        ],
      });
    });

    test('should create CloudWatch alarm for health check', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        Namespace: 'AWS/Route53',
        MetricName: 'HealthCheckStatus',
        Threshold: 1,
        EvaluationPeriods: 2,
        TreatMissingData: 'breaching',
      });
    });
  });

  describe('CloudWatch Dashboard', () => {
    test('should create operational dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `TapStack-${environmentSuffix}-${config.regionName}`,
      });
    });

    test('should create dashboard with widgets', () => {
      const dashboards = template.findResources('AWS::CloudWatch::Dashboard');
      expect(Object.keys(dashboards)).toHaveLength(1);
    });
  });

  describe('Backup and Recovery', () => {
    test('should create backup vault', () => {
      template.hasResourceProperties('AWS::Backup::BackupVault', {
        BackupVaultName: `tap-backup-vault-${environmentSuffix}-${config.regionName}`,
      });
    });

    test('should create backup plan', () => {
      template.hasResourceProperties('AWS::Backup::BackupPlan', {
        BackupPlan: {
          BackupPlanName: `tap-backup-plan-${environmentSuffix}-${config.regionName}`,
        },
      });
    });

    test('should create backup rules', () => {
      template.hasResourceProperties('AWS::Backup::BackupPlan', {
        BackupPlan: {
          BackupPlanRule: [
            {
              RuleName: 'DailyBackup',
              ScheduleExpression: 'cron(0 2 * * ? *)',
              Lifecycle: {
                DeleteAfterDays: 30,
              },
            },
            {
              RuleName: 'WeeklyBackup',
              ScheduleExpression: 'cron(0 3 0 * ? *)',
              Lifecycle: {
                DeleteAfterDays: 90,
              },
            },
          ],
        },
      });
    });

    test('should create backup selection with Aurora cluster', () => {
      template.hasResourceProperties('AWS::Backup::BackupSelection', {
        BackupSelection: {
          SelectionName: 'CriticalResources',
        },
      });
    });

    test('should include DynamoDB table in backup for primary region', () => {
      const backupSelections = template.findResources('AWS::Backup::BackupSelection');
      const selection = Object.values(backupSelections)[0];
      expect(selection.Properties.BackupSelection.Resources).toHaveLength(2);
    });

    test('should exclude DynamoDB table from backup for DR region', () => {
      const drApp = new cdk.App();
      const drConfig = { ...config, isPrimary: false };
      const drStack = new TapStack(drApp, 'DRBackupStack', {
        environmentSuffix,
        config: drConfig,
      });
      const drTemplate = Template.fromStack(drStack);
      
      const backupSelections = drTemplate.findResources('AWS::Backup::BackupSelection');
      const selection = Object.values(backupSelections)[0];
      expect(selection.Properties.BackupSelection.Resources).toHaveLength(1);
    });
  });

  describe('Operational Alarms', () => {
    test('should create SNS topic for alarms', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: 'Operational Alarms',
        TopicName: `tap-alarms-${environmentSuffix}-${config.regionName}`,
      });
    });

    test('should create email subscription for alarms', () => {
      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'ops-team@example.com',
      });
    });

    test('should create database high CPU alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/RDS',
        Threshold: 80,
        EvaluationPeriods: 2,
        TreatMissingData: 'breaching',
        AlarmDescription: 'Aurora cluster CPU utilization is too high',
      });
    });

    test('should create high latency alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'TargetResponseTime',
        Namespace: 'AWS/ApplicationELB',
        Threshold: 1000,
        EvaluationPeriods: 3,
        TreatMissingData: 'notBreaching',
        AlarmDescription: 'Application latency is too high',
      });
    });

    test('should create low transaction rate alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'TransactionCount',
        Namespace: 'TapApplication',
        Threshold: 500,
        EvaluationPeriods: 2,
        ComparisonOperator: 'LessThanThreshold',
        TreatMissingData: 'breaching',
        AlarmDescription: 'Transaction rate is below expected threshold',
      });
    });
  });

  describe('CloudFormation Outputs', () => {
    test('should create VPC ID output', () => {
      template.hasOutput('VPCId', {
        Description: 'VPC ID',
        Export: {
          Name: `${stack.stackName}-VpcId`,
        },
      });
    });

    test('should create ALB endpoint output', () => {
      template.hasOutput('ALBEndpoint', {
        Description: 'Application Load Balancer DNS name',
        Export: {
          Name: `${stack.stackName}-AlbDns`,
        },
      });
    });

    test('should create Aurora endpoint output', () => {
      template.hasOutput('AuroraEndpoint', {
        Description: 'Aurora cluster endpoint',
        Export: {
          Name: `${stack.stackName}-AuroraEndpoint`,
        },
      });
    });
  });

  describe('Resource Counts', () => {
    test('should create expected number of resources', () => {
      // Count resources by checking specific resource types we know exist
      const kmsKeys = template.findResources('AWS::KMS::Key');
      const s3Buckets = template.findResources('AWS::S3::Bucket');
      const vpcs = template.findResources('AWS::EC2::VPC');
      const rdsClusters = template.findResources('AWS::RDS::DBCluster');
      const dynamoTables = template.findResources('AWS::DynamoDB::Table');
      const ecsClusters = template.findResources('AWS::ECS::Cluster');
      const albs = template.findResources('AWS::ElasticLoadBalancingV2::LoadBalancer');
      const lambdaFunctions = template.findResources('AWS::Lambda::Function');
      const cloudWatchAlarms = template.findResources('AWS::CloudWatch::Alarm');
      const snsTopics = template.findResources('AWS::SNS::Topic');
      
      const totalResources = Object.keys(kmsKeys).length + 
                           Object.keys(s3Buckets).length + 
                           Object.keys(vpcs).length + 
                           Object.keys(rdsClusters).length + 
                           Object.keys(dynamoTables).length + 
                           Object.keys(ecsClusters).length + 
                           Object.keys(albs).length + 
                           Object.keys(lambdaFunctions).length + 
                           Object.keys(cloudWatchAlarms).length + 
                           Object.keys(snsTopics).length;
      
      // Expected minimum resource count (adjust based on actual resources)
      expect(totalResources).toBeGreaterThan(10);
    });

    test('should create all required resource types', () => {
      const requiredResources = [
        'AWS::KMS::Key',
        'AWS::KMS::Alias',
        'AWS::S3::Bucket',
        'AWS::CloudTrail::Trail',
        'AWS::EC2::VPC',
        'AWS::RDS::DBCluster',
        'AWS::RDS::DBInstance',
        'AWS::DynamoDB::Table',
        'AWS::ECS::Cluster',
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        'AWS::Lambda::Function',
        'AWS::Route53::HealthCheck',
        'AWS::CloudWatch::Dashboard',
        'AWS::Backup::BackupVault',
        'AWS::Backup::BackupPlan',
        'AWS::SNS::Topic',
        'AWS::CloudWatch::Alarm',
      ];

      requiredResources.forEach(resourceType => {
        const resources = template.findResources(resourceType);
        expect(Object.keys(resources).length).toBeGreaterThan(0);
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing certificate ARN gracefully', () => {
      const configWithoutCert = { ...config, certificateArn: undefined };
      const stackWithoutCert = new TapStack(app, 'NoCertStack', {
        environmentSuffix,
        config: configWithoutCert,
      });
      expect(stackWithoutCert).toBeDefined();
    });

    test('should handle different region configurations', () => {
      const usEastApp = new cdk.App();
      const usEastConfig = { ...config, regionName: 'us-east-1', peerRegion: 'us-west-2' };
      const usEastStack = new TapStack(usEastApp, 'USEastStack', {
        environmentSuffix,
        config: usEastConfig,
      });
      expect(usEastStack).toBeDefined();
    });
  });
});
