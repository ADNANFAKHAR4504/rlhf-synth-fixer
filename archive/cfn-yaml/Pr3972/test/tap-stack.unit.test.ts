import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('RDS MySQL CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Secure RDS MySQL deployment with VPC, encryption, automated backups, and monitoring'
      );
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.Description).toBe(
        'Environment suffix for resource naming (e.g., dev, staging, prod)'
      );
      expect(envSuffixParam.MinLength).toBe(1);
      expect(envSuffixParam.MaxLength).toBe(10);
    });

    test('should have DBName parameter', () => {
      expect(template.Parameters.DBName).toBeDefined();
    });

    test('DBName parameter should have correct properties', () => {
      const dbNameParam = template.Parameters.DBName;
      expect(dbNameParam.Type).toBe('String');
      expect(dbNameParam.Default).toBe('customerdb');
      expect(dbNameParam.AllowedPattern).toBe('[a-zA-Z][a-zA-Z0-9]*');
      expect(dbNameParam.MinLength).toBe(1);
      expect(dbNameParam.MaxLength).toBe(64);
    });
  });

  describe('Security Resources', () => {
    test('should have Secrets Manager secret for DB credentials', () => {
      expect(template.Resources.DBSecret).toBeDefined();
      expect(template.Resources.DBSecret.Type).toBe('AWS::SecretsManager::Secret');
    });

    test('DBSecret should have proper configuration', () => {
      const secret = template.Resources.DBSecret;
      expect(secret.Properties.GenerateSecretString).toBeDefined();
      expect(secret.Properties.GenerateSecretString.PasswordLength).toBe(32);
      expect(secret.Properties.GenerateSecretString.RequireEachIncludedType).toBe(true);
    });

    test('should have KMS key for RDS encryption', () => {
      expect(template.Resources.RDSKMSKey).toBeDefined();
      expect(template.Resources.RDSKMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('KMS key should have proper policy', () => {
      const kmsKey = template.Resources.RDSKMSKey;
      expect(kmsKey.Properties.KeyPolicy).toBeDefined();
      expect(kmsKey.Properties.KeyPolicy.Statement).toHaveLength(2);
    });

    test('should have security group for RDS', () => {
      expect(template.Resources.DBSecurityGroup).toBeDefined();
      expect(template.Resources.DBSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('security group should restrict MySQL access to VPC', () => {
      const sg = template.Resources.DBSecurityGroup;
      const ingressRule = sg.Properties.SecurityGroupIngress[0];
      expect(ingressRule.FromPort).toBe(3306);
      expect(ingressRule.ToPort).toBe(3306);
      expect(ingressRule.CidrIp).toBe('10.0.0.0/16');
    });
  });

  describe('Network Resources', () => {
    test('should have VPC', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct CIDR block', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have private subnets for RDS', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
    });

    test('private subnet 1 should have correct CIDR', () => {
      const subnet = template.Resources.PrivateSubnet1;
      expect(subnet.Properties.CidrBlock).toBe('10.0.10.0/24');
    });

    test('private subnet 2 should have correct CIDR', () => {
      const subnet = template.Resources.PrivateSubnet2;
      expect(subnet.Properties.CidrBlock).toBe('10.0.11.0/24');
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have NAT Gateway for outbound connectivity', () => {
      expect(template.Resources.NATGateway).toBeDefined();
      expect(template.Resources.NATGateway.Type).toBe('AWS::EC2::NatGateway');
    });

    test('should have DB subnet group', () => {
      expect(template.Resources.DBSubnetGroup).toBeDefined();
      expect(template.Resources.DBSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });
  });

  describe('RDS Database', () => {
    test('should have RDS MySQL instance', () => {
      expect(template.Resources.DBInstance).toBeDefined();
      expect(template.Resources.DBInstance.Type).toBe('AWS::RDS::DBInstance');
    });

    test('RDS instance should have correct engine configuration', () => {
      const db = template.Resources.DBInstance;
      expect(db.Properties.Engine).toBe('mysql');
      expect(db.Properties.EngineVersion).toBe('8.0.39');
      expect(db.Properties.DBInstanceClass).toBe('db.m5.large');
    });

    test('RDS instance should have encryption enabled', () => {
      const db = template.Resources.DBInstance;
      expect(db.Properties.StorageEncrypted).toBe(true);
      expect(db.Properties.KmsKeyId).toBeDefined();
    });

    test('RDS instance should have automated backups configured', () => {
      const db = template.Resources.DBInstance;
      expect(db.Properties.BackupRetentionPeriod).toBe(7);
      expect(db.Properties.PreferredBackupWindow).toBe('03:00-04:00');
    });

    test('RDS instance should not be publicly accessible', () => {
      const db = template.Resources.DBInstance;
      expect(db.Properties.PubliclyAccessible).toBe(false);
    });

    test('RDS instance should have Performance Insights enabled', () => {
      const db = template.Resources.DBInstance;
      expect(db.Properties.EnablePerformanceInsights).toBe(true);
      expect(db.Properties.PerformanceInsightsRetentionPeriod).toBe(7);
    });

  });

  describe('IAM Resources', () => {
    test('should have RDS monitoring role', () => {
      expect(template.Resources.RDSMonitoringRole).toBeDefined();
      expect(template.Resources.RDSMonitoringRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have database access role', () => {
      expect(template.Resources.DBAccessRole).toBeDefined();
      expect(template.Resources.DBAccessRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have secret rotation lambda role', () => {
      expect(template.Resources.SecretRotationLambdaRole).toBeDefined();
      expect(template.Resources.SecretRotationLambdaRole.Type).toBe('AWS::IAM::Role');
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('should have CPU utilization alarm', () => {
      expect(template.Resources.DatabaseCPUAlarm).toBeDefined();
      expect(template.Resources.DatabaseCPUAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('CPU alarm should have correct threshold', () => {
      const alarm = template.Resources.DatabaseCPUAlarm;
      expect(alarm.Properties.Threshold).toBe(80);
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm.Properties.Namespace).toBe('AWS/RDS');
    });

    test('should have database connections alarm', () => {
      expect(template.Resources.DatabaseConnectionsAlarm).toBeDefined();
      expect(template.Resources.DatabaseConnectionsAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('should have storage space alarm', () => {
      expect(template.Resources.DatabaseStorageAlarm).toBeDefined();
      expect(template.Resources.DatabaseStorageAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('should have SNS topic for alarms', () => {
      expect(template.Resources.DBAlarmTopic).toBeDefined();
      expect(template.Resources.DBAlarmTopic.Type).toBe('AWS::SNS::Topic');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'DBInstanceEndpoint',
        'DBInstancePort',
        'DBName',
        'KMSKeyId',
        'DBSecurityGroupId',
        'DBAccessRoleArn',
        'SNSTopicArn',
        'DBSecretArn'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('database endpoint output should be correct', () => {
      const output = template.Outputs.DBInstanceEndpoint;
      expect(output.Description).toBe('RDS MySQL instance endpoint');
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['DBInstance', 'Endpoint.Address'] });
    });

    test('database port output should be correct', () => {
      const output = template.Outputs.DBInstancePort;
      expect(output.Description).toBe('RDS MySQL instance port');
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['DBInstance', 'Endpoint.Port'] });
    });
  });

  describe('Resource Naming Convention', () => {
    test('resources should follow naming convention with environment suffix', () => {
      const resources = [
        'DBSecret',
        'VPC',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'DBInstance',
        'RDSKMSKey',
        'DBSecurityGroup'
      ];

      resources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Properties.Name) {
          expect(resource.Properties.Name).toEqual({
            'Fn::Sub': expect.stringContaining('${EnvironmentSuffix}')
          });
        }
      });
    });

  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have correct resource count for secure RDS deployment', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(15); // Should have many resources for complete deployment
    });

    test('should have two parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(2);
    });

    test('should have comprehensive outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(11);
    });
  });
});