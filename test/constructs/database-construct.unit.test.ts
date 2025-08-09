import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as sns from 'aws-cdk-lib/aws-sns';
import { DatabaseConstruct } from '../../lib/constructs/database-construct';

describe('DatabaseConstruct Unit Tests', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let vpc: ec2.Vpc;
  let securityGroup: ec2.SecurityGroup;
  let alertTopic: sns.Topic;
  let databaseConstruct: DatabaseConstruct;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack');

    // Create dependencies
    vpc = new ec2.Vpc(stack, 'TestVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
    });

    securityGroup = new ec2.SecurityGroup(stack, 'TestSecurityGroup', {
      vpc,
      description: 'Test security group',
    });

    alertTopic = new sns.Topic(stack, 'TestAlertTopic', {
      topicName: 'test-alerts',
    });

    databaseConstruct = new DatabaseConstruct(stack, 'TestDatabaseConstruct', {
      environment: 'test',
      vpc,
      securityGroup,
      alertTopic,
    });

    template = Template.fromStack(stack);
  });

  describe('RDS Instance Creation', () => {
    test('should create RDS instance with correct engine', () => {
      template.hasResource('AWS::RDS::DBInstance', {
        Properties: {
          Engine: 'mysql',
          EngineVersion: '8.0',
          DBInstanceClass: 'db.t3.micro',
        },
      });
    });

    test('should create RDS instance with encryption enabled', () => {
      template.hasResource('AWS::RDS::DBInstance', {
        Properties: {
          StorageEncrypted: true,
        },
      });
    });

    test('should create RDS instance with correct database name', () => {
      template.hasResource('AWS::RDS::DBInstance', {
        Properties: {
          DBName: 'appdb',
        },
      });
    });

    test('should create RDS instance with backup configuration', () => {
      template.hasResource('AWS::RDS::DBInstance', {
        Properties: {
          BackupRetentionPeriod: 7,
          DeleteAutomatedBackups: false,
        },
      });
    });

    test('should create RDS instance with monitoring enabled', () => {
      template.hasResource('AWS::RDS::DBInstance', {
        Properties: {
          MonitoringInterval: 60,
          EnablePerformanceInsights: false,
        },
      });
    });

    test('should create RDS instance with correct tags', () => {
      template.hasResource('AWS::RDS::DBInstance', {
        Properties: {
          Tags: Match.arrayWith([
            {
              Key: 'Name',
              Value: 'Database-test',
            },
          ]),
        },
      });
    });
  });

  describe('Database Security', () => {
    test('should create database secret', () => {
      template.hasResource('AWS::SecretsManager::Secret', {});
    });

    test('should use database secret for credentials', () => {
      template.hasResource('AWS::RDS::DBInstance', {
        Properties: {
          MasterUsername: Match.anyValue(),
          MasterUserPassword: Match.anyValue(),
        },
      });
    });

    test('should create DB subnet group', () => {
      template.hasResource('AWS::RDS::DBSubnetGroup', {
        Properties: {
          DBSubnetGroupDescription: 'Subnet group for RDS database',
        },
      });
    });

    test('should use provided security group', () => {
      template.hasResource('AWS::RDS::DBInstance', {
        Properties: {
          VPCSecurityGroups: Match.anyValue(),
        },
      });
    });
  });

  describe('Database Parameter Group', () => {
    test('should create parameter group', () => {
      template.hasResource('AWS::RDS::DBParameterGroup', {
        Properties: {
          Family: Match.stringLikeRegexp('mysql8\\.0'),
          Parameters: {
            slow_query_log: '1',
            general_log: '1',
            log_queries_not_using_indexes: '1',
          },
        },
      });
    });

    test('should associate parameter group with RDS instance', () => {
      template.hasResource('AWS::RDS::DBInstance', {
        Properties: {
          DBParameterGroupName: Match.anyValue(),
        },
      });
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('should create CPU utilization alarm', () => {
      template.hasResource('AWS::CloudWatch::Alarm', {
        Properties: {
          MetricName: Match.stringLikeRegexp('.*CPU.*'),
          Threshold: 80,
          EvaluationPeriods: 2,
          TreatMissingData: 'notBreaching',
        },
      });
    });

    test('should create database connections alarm', () => {
      template.hasResource('AWS::CloudWatch::Alarm', {
        Properties: {
          MetricName: Match.stringLikeRegexp('.*Connection.*'),
          Threshold: 80,
          EvaluationPeriods: 2,
          TreatMissingData: 'notBreaching',
        },
      });
    });

    test('should add SNS actions to alarms', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      Object.values(alarms).forEach((alarm: any) => {
        expect(alarm.Properties.AlarmActions).toBeDefined();
      });
    });
  });

  describe('SSM Parameter Store', () => {
    test('should create SSM parameter for database endpoint', () => {
      template.hasResource('AWS::SSM::Parameter', {
        Properties: {
          Name: '/app/test/database/endpoint',
          Type: 'String',
          Description: 'RDS Database Endpoint',
        },
      });
    });
  });

  describe('Environment-Specific Configuration', () => {
    test('should have environment-specific configuration', () => {
      // Check that the database has the expected configuration for test environment
      template.hasResource('AWS::RDS::DBInstance', {
        Properties: {
          DeletionProtection: false,
          MultiAZ: false,
        },
      });
    });
  });

  describe('Database Properties', () => {
    test('should expose database property', () => {
      expect(databaseConstruct.database).toBeDefined();
      expect(databaseConstruct.database.instanceEndpoint).toBeDefined();
    });

    test('should have correct database configuration', () => {
      expect(databaseConstruct.database.vpc).toBeDefined();
    });
  });

  describe('Resource Dependencies', () => {
    test('should have correct resource dependencies', () => {
      // Check that required resources exist
      template.hasResource('AWS::RDS::DBInstance', {});
      template.hasResource('AWS::RDS::DBSubnetGroup', {});
      template.hasResource('AWS::RDS::DBParameterGroup', {});
      template.hasResource('AWS::SecretsManager::Secret', {});
      template.hasResource('AWS::CloudWatch::Alarm', {});
    });
  });
});
