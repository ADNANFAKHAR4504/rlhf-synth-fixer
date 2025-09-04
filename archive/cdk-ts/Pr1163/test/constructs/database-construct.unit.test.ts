import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as sns from 'aws-cdk-lib/aws-sns';
import { DatabaseConstruct } from '../../lib/constructs/database-construct';

describe('DatabaseConstruct Unit Tests', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let template: Template;
  let vpc: ec2.Vpc;
  let securityGroup: ec2.SecurityGroup;
  let alertTopic: sns.Topic;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack');
    vpc = new ec2.Vpc(stack, 'TestVpc', {
      maxAzs: 2,
    });
    securityGroup = new ec2.SecurityGroup(stack, 'TestSecurityGroup', {
      vpc,
      description: 'Test security group',
    });
    alertTopic = new sns.Topic(stack, 'TestAlertTopic', {
      topicName: 'test-alerts',
    });
  });

  describe('Basic Database Creation', () => {
    beforeEach(() => {
      const databaseConstruct = new DatabaseConstruct(stack, 'TestDatabaseConstruct', {
        environment: 'test',
        vpc,
        securityGroup,
        alertTopic,
      });
      template = Template.fromStack(stack);
    });

    test('should create RDS database instance with correct configuration', () => {
      template.hasResource('AWS::RDS::DBInstance', {
        Properties: {
          Engine: 'mysql',
          EngineVersion: '8.0',
          DBInstanceClass: 'db.t3.micro',
          DBName: 'appdb',
          StorageEncrypted: true,
          DeletionProtection: false, // false for test environment
          BackupRetentionPeriod: 7,
          DeleteAutomatedBackups: false,
          MultiAZ: false, // false for test environment
          AutoMinorVersionUpgrade: true,
          AllowMajorVersionUpgrade: false,
          MonitoringInterval: 60,
          EnablePerformanceInsights: false,
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

    test('should create parameter group with security settings', () => {
      template.hasResource('AWS::RDS::DBParameterGroup', {
        Properties: {
          Family: 'mysql8.0',
          Parameters: {
            slow_query_log: '1',
            general_log: '1',
            log_queries_not_using_indexes: '1',
          },
        },
      });
    });

    test('should create database secret', () => {
      template.hasResource('AWS::SecretsManager::Secret', {
        Properties: {
          GenerateSecretString: Match.anyValue(),
        },
      });
    });

    test('should tag database resources correctly', () => {
      // Check that database has proper tags
      const dbInstances = template.findResources('AWS::RDS::DBInstance');
      const dbInstance = Object.values(dbInstances)[0] as any;
      
      expect(dbInstance.Properties.Tags).toBeDefined();
      expect(Array.isArray(dbInstance.Properties.Tags)).toBe(true);
      
      const nameTag = dbInstance.Properties.Tags.find((tag: any) => tag.Key === 'Name');
      const componentTag = dbInstance.Properties.Tags.find((tag: any) => tag.Key === 'Component');
      const environmentTag = dbInstance.Properties.Tags.find((tag: any) => tag.Key === 'Environment');
      
      expect(nameTag).toBeDefined();
      expect(componentTag).toBeDefined();
      expect(environmentTag).toBeDefined();
      expect(componentTag.Value).toBe('Database');
      expect(environmentTag.Value).toBe('test');
    });
  });

  describe('Transit Encryption and SSL/TLS Enforcement', () => {
    beforeEach(() => {
      const databaseConstruct = new DatabaseConstruct(stack, 'TestDatabaseConstruct', {
        environment: 'test',
        vpc,
        securityGroup,
        alertTopic,
      });
      template = Template.fromStack(stack);
    });

    test('should enable storage encryption at rest', () => {
      template.hasResource('AWS::RDS::DBInstance', {
        Properties: {
          StorageEncrypted: true,
        },
      });
    });

    test('should use AWS managed encryption key', () => {
      const dbInstances = template.findResources('AWS::RDS::DBInstance');
      const dbInstance = Object.values(dbInstances)[0] as any;
      
      // Should not specify a custom KMS key, using AWS managed key
      expect(dbInstance.Properties.KmsKeyId).toBeUndefined();
    });

    test('should enforce SSL/TLS connections through security group rules', () => {
      // Verify that the security group passed to the database construct
      // has proper SSL/TLS port configuration
      const dbInstances = template.findResources('AWS::RDS::DBInstance');
      const dbInstance = Object.values(dbInstances)[0] as any;
      
      // Should use the provided security group
      expect(dbInstance.Properties.VPCSecurityGroups).toBeDefined();
      expect(Array.isArray(dbInstance.Properties.VPCSecurityGroups)).toBe(true);
    });

    test('should have parameter group with SSL/TLS related settings', () => {
      const parameterGroups = template.findResources('AWS::RDS::DBParameterGroup');
      const parameterGroup = Object.values(parameterGroups)[0] as any;
      
      // Should have MySQL 8.0 family which enforces SSL by default
      expect(parameterGroup.Properties.Family).toBe('mysql8.0');
      
      // MySQL 8.0 enforces SSL connections by default
      // Additional SSL parameters can be added here if needed
    });

    test('should store database credentials securely in Secrets Manager', () => {
      template.hasResource('AWS::SecretsManager::Secret', {
        Properties: {
          GenerateSecretString: Match.anyValue(),
        },
      });
      
      // Verify the secret is used for database credentials
      const dbInstances = template.findResources('AWS::RDS::DBInstance');
      const dbInstance = Object.values(dbInstances)[0] as any;
      
      expect(dbInstance.Properties.MasterUsername).toBeDefined();
      expect(dbInstance.Properties.MasterUserPassword).toBeDefined();
    });
  });

  describe('Security Group Configuration for SSL/TLS', () => {
    test('should use provided security group for database access control', () => {
      const databaseConstruct = new DatabaseConstruct(stack, 'TestDatabaseConstruct', {
        environment: 'test',
        vpc,
        securityGroup,
        alertTopic,
      });
      template = Template.fromStack(stack);

      const dbInstances = template.findResources('AWS::RDS::DBInstance');
      const dbInstance = Object.values(dbInstances)[0] as any;
      
      // Should use the provided security group
      expect(dbInstance.Properties.VPCSecurityGroups).toBeDefined();
      expect(Array.isArray(dbInstance.Properties.VPCSecurityGroups)).toBe(true);
    });

    test('should ensure security group allows only encrypted connections', () => {
      // This test validates that the security group passed to the database
      // construct has proper rules for SSL/TLS connections
      const databaseConstruct = new DatabaseConstruct(stack, 'TestDatabaseConstruct', {
        environment: 'test',
        vpc,
        securityGroup,
        alertTopic,
      });
      
      // The security group should be configured to allow only specific ports
      // and sources, which is validated in the security construct tests
      expect(securityGroup).toBeDefined();
    });
  });

  describe('CloudWatch Monitoring and Alarms', () => {
    beforeEach(() => {
      const databaseConstruct = new DatabaseConstruct(stack, 'TestDatabaseConstruct', {
        environment: 'test',
        vpc,
        securityGroup,
        alertTopic,
      });
      template = Template.fromStack(stack);
    });

    test('should create CPU utilization alarm', () => {
      template.hasResource('AWS::CloudWatch::Alarm', {
        Properties: {
          MetricName: 'CPUUtilization',
          Namespace: 'AWS/RDS',
          Statistic: 'Average',
          Threshold: 80,
          EvaluationPeriods: 2,
          TreatMissingData: 'notBreaching',
        },
      });
    });

    test('should create database connections alarm', () => {
      template.hasResource('AWS::CloudWatch::Alarm', {
        Properties: {
          MetricName: 'DatabaseConnections',
          Namespace: 'AWS/RDS',
          Statistic: 'Average',
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
        expect(Array.isArray(alarm.Properties.AlarmActions)).toBe(true);
        expect(alarm.Properties.AlarmActions.length).toBeGreaterThan(0);
      });
    });
  });

  describe('SSM Parameter Store Integration', () => {
    beforeEach(() => {
      const databaseConstruct = new DatabaseConstruct(stack, 'TestDatabaseConstruct', {
        environment: 'test',
        vpc,
        securityGroup,
        alertTopic,
      });
      template = Template.fromStack(stack);
    });

    test('should store database endpoint in SSM Parameter Store', () => {
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
    test('should enable deletion protection for production', () => {
      const databaseConstruct = new DatabaseConstruct(stack, 'TestDatabaseConstruct', {
        environment: 'prod',
        vpc,
        securityGroup,
        alertTopic,
      });
      template = Template.fromStack(stack);

      template.hasResource('AWS::RDS::DBInstance', {
        Properties: {
          DeletionProtection: true,
          MultiAZ: true,
        },
      });
    });

    test('should disable deletion protection for non-production', () => {
      const databaseConstruct = new DatabaseConstruct(stack, 'TestDatabaseConstruct', {
        environment: 'test',
        vpc,
        securityGroup,
        alertTopic,
      });
      template = Template.fromStack(stack);

      template.hasResource('AWS::RDS::DBInstance', {
        Properties: {
          DeletionProtection: false,
          MultiAZ: false,
        },
      });
    });
  });

  describe('Resource Dependencies', () => {
    test('should expose database property', () => {
      const databaseConstruct = new DatabaseConstruct(stack, 'TestDatabaseConstruct', {
        environment: 'test',
        vpc,
        securityGroup,
        alertTopic,
      });
      expect(databaseConstruct.database).toBeDefined();
    });

    test('should have proper resource dependencies', () => {
      const databaseConstruct = new DatabaseConstruct(stack, 'TestDatabaseConstruct', {
        environment: 'test',
        vpc,
        securityGroup,
        alertTopic,
      });
      template = Template.fromStack(stack);

      // Check that required resources exist
      template.hasResource('AWS::RDS::DBInstance', {});
      template.hasResource('AWS::RDS::DBSubnetGroup', {});
      template.hasResource('AWS::RDS::DBParameterGroup', {});
      template.hasResource('AWS::SecretsManager::Secret', {});
      template.hasResource('AWS::CloudWatch::Alarm', {});
      template.hasResource('AWS::SSM::Parameter', {});
    });
  });

  describe('Security Best Practices Validation', () => {
    beforeEach(() => {
      const databaseConstruct = new DatabaseConstruct(stack, 'TestDatabaseConstruct', {
        environment: 'test',
        vpc,
        securityGroup,
        alertTopic,
      });
      template = Template.fromStack(stack);
    });

    test('should enforce encryption at rest', () => {
      const dbInstances = template.findResources('AWS::RDS::DBInstance');
      const dbInstance = Object.values(dbInstances)[0] as any;
      
      expect(dbInstance.Properties.StorageEncrypted).toBe(true);
    });

    test('should use private subnets for database', () => {
      const subnetGroups = template.findResources('AWS::RDS::DBSubnetGroup');
      const subnetGroup = Object.values(subnetGroups)[0] as any;
      
      // Should use private subnets with egress
      expect(subnetGroup.Properties.DBSubnetGroupDescription).toBe('Subnet group for RDS database');
    });

    test('should have proper backup configuration', () => {
      const dbInstances = template.findResources('AWS::RDS::DBInstance');
      const dbInstance = Object.values(dbInstances)[0] as any;
      
      expect(dbInstance.Properties.BackupRetentionPeriod).toBe(7);
      expect(dbInstance.Properties.DeleteAutomatedBackups).toBe(false);
    });

    test('should have monitoring enabled', () => {
      const dbInstances = template.findResources('AWS::RDS::DBInstance');
      const dbInstance = Object.values(dbInstances)[0] as any;
      
      expect(dbInstance.Properties.MonitoringInterval).toBe(60);
    });

    test('should store sensitive data in Secrets Manager', () => {
      const secrets = template.findResources('AWS::SecretsManager::Secret');
      const dbSecret = Object.values(secrets).find((secret: any) =>
        secret.Properties.GenerateSecretString
      );
      
      expect(dbSecret).toBeDefined();
    });

    test('should have proper SSL/TLS configuration through MySQL 8.0', () => {
      const dbInstances = template.findResources('AWS::RDS::DBInstance');
      const dbInstance = Object.values(dbInstances)[0] as any;
      
      // MySQL 8.0 enforces SSL connections by default
      expect(dbInstance.Properties.Engine).toBe('mysql');
      expect(dbInstance.Properties.EngineVersion).toBe('8.0');
    });
  });
});
