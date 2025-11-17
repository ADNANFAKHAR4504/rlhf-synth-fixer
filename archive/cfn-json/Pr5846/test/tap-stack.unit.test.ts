import * as fs from 'fs';
import * as path from 'path';

describe('TapStack CloudFormation RDS Template', () => {
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
      expect(template.Description).toContain('RDS PostgreSQL');
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.AllowedPattern).toBeDefined();
    });

    test('should have VpcId parameter', () => {
      expect(template.Parameters.VpcId).toBeDefined();
      expect(template.Parameters.VpcId.Type).toBe('String');
      expect(template.Parameters.VpcId.Default).toBe('vpc-05b5a7c91cdf3ab25');
    });

    test('should have DatabaseSubnet1Id parameter', () => {
      expect(template.Parameters.DatabaseSubnet1Id).toBeDefined();
      expect(template.Parameters.DatabaseSubnet1Id.Type).toBe('String');
    });

    test('should have DatabaseSubnet2Id parameter', () => {
      expect(template.Parameters.DatabaseSubnet2Id).toBeDefined();
      expect(template.Parameters.DatabaseSubnet2Id.Type).toBe('String');
    });

    test('should have DatabaseSubnet3Id parameter', () => {
      expect(template.Parameters.DatabaseSubnet3Id).toBeDefined();
      expect(template.Parameters.DatabaseSubnet3Id.Type).toBe('String');
    });

    test('should have AppSubnet1Cidr parameter', () => {
      expect(template.Parameters.AppSubnet1Cidr).toBeDefined();
      expect(template.Parameters.AppSubnet1Cidr.Default).toBe('10.0.1.0/24');
    });

    test('should have AppSubnet2Cidr parameter', () => {
      expect(template.Parameters.AppSubnet2Cidr).toBeDefined();
      expect(template.Parameters.AppSubnet2Cidr.Default).toBe('10.0.2.0/24');
    });

    test('should have AppSubnet3Cidr parameter', () => {
      expect(template.Parameters.AppSubnet3Cidr).toBeDefined();
      expect(template.Parameters.AppSubnet3Cidr.Default).toBe('10.0.3.0/24');
    });

    test('should have database configuration parameters', () => {
      expect(template.Parameters.DatabaseName).toBeDefined();
      expect(template.Parameters.DatabaseUsername).toBeDefined();
      expect(template.Parameters.DatabaseInstanceClass).toBeDefined();
      expect(template.Parameters.DatabaseAllocatedStorage).toBeDefined();
    });
  });

  describe('KMS Resources', () => {
    test('should have KMS key resource', () => {
      expect(template.Resources.DatabaseEncryptionKey).toBeDefined();
      expect(template.Resources.DatabaseEncryptionKey.Type).toBe('AWS::KMS::Key');
    });

    test('should have key rotation enabled', () => {
      const kmsKey = template.Resources.DatabaseEncryptionKey;
      expect(kmsKey.Properties.EnableKeyRotation).toBe(true);
    });

    test('should have correct deletion policies', () => {
      const kmsKey = template.Resources.DatabaseEncryptionKey;
      expect(kmsKey.DeletionPolicy).toBe('Delete');
      expect(kmsKey.UpdateReplacePolicy).toBe('Delete');
    });
  });

  describe('Secrets Manager Resources', () => {
    test('should have Secrets Manager secret', () => {
      expect(template.Resources.DatabaseSecret).toBeDefined();
      expect(template.Resources.DatabaseSecret.Type).toBe('AWS::SecretsManager::Secret');
    });

    test('should generate password with correct length', () => {
      const secret = template.Resources.DatabaseSecret;
      const genConfig = secret.Properties.GenerateSecretString;
      expect(genConfig.PasswordLength).toBe(32);
      expect(genConfig.RequireEachIncludedType).toBe(true);
    });

    test('should be encrypted with KMS key', () => {
      const secret = template.Resources.DatabaseSecret;
      expect(secret.Properties.KmsKeyId).toEqual({ Ref: 'DatabaseEncryptionKey' });
    });

    test('should have SecretRDSAttachment resource', () => {
      expect(template.Resources.SecretRDSAttachment).toBeDefined();
      expect(template.Resources.SecretRDSAttachment.Type).toBe('AWS::SecretsManager::SecretTargetAttachment');
      expect(template.Resources.SecretRDSAttachment.Properties.TargetType).toBe('AWS::RDS::DBInstance');
    });
  });

  describe('Network Resources', () => {
    test('should have DB subnet group', () => {
      expect(template.Resources.DatabaseSubnetGroup).toBeDefined();
      expect(template.Resources.DatabaseSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });

    test('should have security group', () => {
      expect(template.Resources.DatabaseSecurityGroup).toBeDefined();
      expect(template.Resources.DatabaseSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should allow PostgreSQL traffic on port 5432', () => {
      const sg = template.Resources.DatabaseSecurityGroup;
      const ingressRules = sg.Properties.SecurityGroupIngress;
      expect(ingressRules).toHaveLength(3);
      ingressRules.forEach((rule: any) => {
        expect(rule.FromPort).toBe(5432);
        expect(rule.ToPort).toBe(5432);
      });
    });
  });

  describe('RDS Parameter Group', () => {
    test('should have parameter group for PostgreSQL 14', () => {
      expect(template.Resources.DatabaseParameterGroup).toBeDefined();
      const paramGroup = template.Resources.DatabaseParameterGroup;
      expect(paramGroup.Properties.Family).toBe('postgres14');
    });

    test('should have max_connections set to 1000', () => {
      const paramGroup = template.Resources.DatabaseParameterGroup;
      expect(paramGroup.Properties.Parameters.max_connections).toBe('1000');
    });

    test('should have UTF8 client encoding', () => {
      const paramGroup = template.Resources.DatabaseParameterGroup;
      expect(paramGroup.Properties.Parameters.client_encoding).toBe('UTF8');
    });

    test('should NOT have server_encoding parameter', () => {
      const paramGroup = template.Resources.DatabaseParameterGroup;
      expect(paramGroup.Properties.Parameters.server_encoding).toBeUndefined();
    });
  });

  describe('RDS Database Instance', () => {
    test('should have RDS instance', () => {
      expect(template.Resources.DatabaseInstance).toBeDefined();
      expect(template.Resources.DatabaseInstance.Type).toBe('AWS::RDS::DBInstance');
    });

    test('should be PostgreSQL 14', () => {
      const rds = template.Resources.DatabaseInstance;
      expect(rds.Properties.Engine).toBe('postgres');
      expect(rds.Properties.EngineVersion).toMatch(/^14\./);
    });

    test('should have Multi-AZ enabled', () => {
      const rds = template.Resources.DatabaseInstance;
      expect(rds.Properties.MultiAZ).toBe(true);
    });

    test('should use gp3 storage', () => {
      const rds = template.Resources.DatabaseInstance;
      expect(rds.Properties.StorageType).toBe('gp3');
    });

    test('should have storage encryption enabled', () => {
      const rds = template.Resources.DatabaseInstance;
      expect(rds.Properties.StorageEncrypted).toBe(true);
    });

    test('should not be publicly accessible', () => {
      const rds = template.Resources.DatabaseInstance;
      expect(rds.Properties.PubliclyAccessible).toBe(false);
    });

    test('should have 7-day backup retention', () => {
      const rds = template.Resources.DatabaseInstance;
      expect(rds.Properties.BackupRetentionPeriod).toBe(7);
    });

    test('should have Performance Insights enabled', () => {
      const rds = template.Resources.DatabaseInstance;
      expect(rds.Properties.EnablePerformanceInsights).toBe(true);
      expect(rds.Properties.PerformanceInsightsRetentionPeriod).toBe(7);
    });

    test('should not have deletion protection', () => {
      const rds = template.Resources.DatabaseInstance;
      expect(rds.Properties.DeletionProtection).toBe(false);
    });

    test('should have correct deletion policies', () => {
      const rds = template.Resources.DatabaseInstance;
      expect(rds.DeletionPolicy).toBe('Delete');
      expect(rds.UpdateReplacePolicy).toBe('Delete');
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should have CPU alarm', () => {
      expect(template.Resources.DatabaseCPUAlarm).toBeDefined();
      expect(template.Resources.DatabaseCPUAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('should monitor CPU utilization above 80%', () => {
      const alarm = template.Resources.DatabaseCPUAlarm;
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm.Properties.Threshold).toBe(80);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('should have storage alarm', () => {
      expect(template.Resources.DatabaseStorageAlarm).toBeDefined();
      expect(template.Resources.DatabaseStorageAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('should monitor free storage space below 10GB', () => {
      const alarm = template.Resources.DatabaseStorageAlarm;
      expect(alarm.Properties.MetricName).toBe('FreeStorageSpace');
      expect(alarm.Properties.Threshold).toBe(10737418240);
      expect(alarm.Properties.ComparisonOperator).toBe('LessThanThreshold');
    });
  });

  describe('Outputs', () => {
    test('should have database endpoint output', () => {
      expect(template.Outputs.DatabaseEndpoint).toBeDefined();
    });

    test('should have database port output', () => {
      expect(template.Outputs.DatabasePort).toBeDefined();
    });

    test('should have secret ARN output', () => {
      expect(template.Outputs.DatabaseSecretArn).toBeDefined();
    });

    test('should have DatabaseInstanceIdentifier output', () => {
      expect(template.Outputs.DatabaseInstanceIdentifier).toBeDefined();
      expect(template.Outputs.DatabaseInstanceIdentifier.Value).toEqual({ Ref: 'DatabaseInstance' });
    });

    test('should have DatabaseSecurityGroupId output', () => {
      expect(template.Outputs.DatabaseSecurityGroupId).toBeDefined();
      expect(template.Outputs.DatabaseSecurityGroupId.Value).toEqual({ Ref: 'DatabaseSecurityGroup' });
    });

    test('should have DatabaseEncryptionKeyId output', () => {
      expect(template.Outputs.DatabaseEncryptionKeyId).toBeDefined();
      expect(template.Outputs.DatabaseEncryptionKeyId.Value).toEqual({ Ref: 'DatabaseEncryptionKey' });
    });

    test('StackName output should be correct', () => {
      const output = template.Outputs.StackName;
      expect(output.Value).toEqual({ Ref: 'AWS::StackName' });
    });

    test('EnvironmentSuffix output should be correct', () => {
      const output = template.Outputs.EnvironmentSuffix;
      expect(output.Value).toEqual({ Ref: 'EnvironmentSuffix' });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have all required RDS resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThanOrEqual(8);
    });
  });

  describe('Resource Naming Convention', () => {
    test('resources should use environment suffix in names', () => {
      const kmsAlias = template.Resources.DatabaseEncryptionKeyAlias;
      expect(kmsAlias.Properties.AliasName['Fn::Sub']).toContain('${EnvironmentSuffix}');

      const secret = template.Resources.DatabaseSecret;
      expect(secret.Properties.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');

      const rds = template.Resources.DatabaseInstance;
      expect(rds.Properties.DBInstanceIdentifier['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('export names should follow naming convention', () => {
      const outputs = template.Outputs;
      Object.values(outputs).forEach((output: any) => {
        if (output.Export) {
          expect(output.Export.Name['Fn::Sub']).toContain('${AWS::StackName}');
        }
      });
    });
  });
});
