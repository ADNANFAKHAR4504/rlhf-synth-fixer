// test/tap-stack.unit.test.ts
import * as fs from 'fs';
import * as path from 'path';

describe('TapStack CloudFormation Template', () => {
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
        'TAP Stack - Task Assignment Platform CloudFormation Template with Production Features'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(param.ConstraintDescription).toBeDefined();
    });

    test('should have Environment parameter', () => {
      expect(template.Parameters.Environment).toBeDefined();
      expect(template.Parameters.Environment.Type).toBe('String');
      expect(template.Parameters.Environment.AllowedValues).toContain('production');
    });

    test('should have EnableKMSEncryption parameter', () => {
      expect(template.Parameters.EnableKMSEncryption).toBeDefined();
      expect(template.Parameters.EnableKMSEncryption.Type).toBe('String');
    });

    test('should have EnablePointInTimeRecovery parameter', () => {
      expect(template.Parameters.EnablePointInTimeRecovery).toBeDefined();
    });

    test('should have EnableBackup parameter', () => {
      expect(template.Parameters.EnableBackup).toBeDefined();
    });
  });

  describe('Conditions', () => {
    test('should have IsProduction condition', () => {
      expect(template.Conditions.IsProduction).toBeDefined();
    });

    test('should have UseKMSEncryption condition', () => {
      expect(template.Conditions.UseKMSEncryption).toBeDefined();
    });

    test('should have EnablePITR condition', () => {
      expect(template.Conditions.EnablePITR).toBeDefined();
    });

    test('should have EnableBackupPlan condition', () => {
      expect(template.Conditions.EnableBackupPlan).toBeDefined();
    });
  });

  describe('Resources', () => {
    test('should have TurnAroundPromptTable resource', () => {
      expect(template.Resources.TurnAroundPromptTable).toBeDefined();
    });

    test('TurnAroundPromptTable should be a DynamoDB table', () => {
      expect(template.Resources.TurnAroundPromptTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('TurnAroundPromptTable should have correct deletion policies', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.DeletionPolicy).toBe('Delete');
      expect(table.UpdateReplacePolicy).toBe('Delete');
    });

    test('TurnAroundPromptTable should have conditional deletion protection', () => {
      const properties = template.Resources.TurnAroundPromptTable.Properties;
      expect(properties.DeletionProtectionEnabled).toBeDefined();
      expect(properties.DeletionProtectionEnabled['Fn::If']).toBeDefined();
      expect(properties.DeletionProtectionEnabled['Fn::If'][0]).toBe('IsProduction');
    });

    test('TurnAroundPromptTable should have correct properties', () => {
      const properties = template.Resources.TurnAroundPromptTable.Properties;
      expect(properties.TableName).toBeDefined();
      expect(properties.TableName['Fn::Sub']).toContain('TurnAroundPromptTable');
      expect(properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('TurnAroundPromptTable should have correct attribute definitions', () => {
      const properties = template.Resources.TurnAroundPromptTable.Properties;
      expect(properties.AttributeDefinitions).toBeDefined();
      expect(properties.AttributeDefinitions).toHaveLength(1);
      expect(properties.AttributeDefinitions[0].AttributeName).toBe('id');
      expect(properties.AttributeDefinitions[0].AttributeType).toBe('S');
    });

    test('TurnAroundPromptTable should have correct key schema', () => {
      const properties = template.Resources.TurnAroundPromptTable.Properties;
      expect(properties.KeySchema).toBeDefined();
      expect(properties.KeySchema).toHaveLength(1);
      expect(properties.KeySchema[0].AttributeName).toBe('id');
      expect(properties.KeySchema[0].KeyType).toBe('HASH');
    });

    test('TurnAroundPromptTable should have SSE specification', () => {
      const properties = template.Resources.TurnAroundPromptTable.Properties;
      expect(properties.SSESpecification).toBeDefined();
    });

    test('TurnAroundPromptTable should have point-in-time recovery specification', () => {
      const properties = template.Resources.TurnAroundPromptTable.Properties;
      expect(properties.PointInTimeRecoverySpecification).toBeDefined();
    });

    test('TurnAroundPromptTable should have tags', () => {
      const properties = template.Resources.TurnAroundPromptTable.Properties;
      expect(properties.Tags).toBeDefined();
      expect(Array.isArray(properties.Tags)).toBe(true);
      expect(properties.Tags.length).toBeGreaterThan(0);
    });

    test('should have TableEncryptionKey resource', () => {
      expect(template.Resources.TableEncryptionKey).toBeDefined();
      expect(template.Resources.TableEncryptionKey.Type).toBe('AWS::KMS::Key');
    });

    test('should have TableEncryptionKeyAlias resource', () => {
      expect(template.Resources.TableEncryptionKeyAlias).toBeDefined();
      expect(template.Resources.TableEncryptionKeyAlias.Type).toBe('AWS::KMS::Alias');
    });

    test('should have CloudWatch alarms', () => {
      expect(template.Resources.TableReadCapacityAlarm).toBeDefined();
      expect(template.Resources.TableWriteCapacityAlarm).toBeDefined();
      expect(template.Resources.TableUserErrorsAlarm).toBeDefined();
    });

    test('should have backup resources', () => {
      expect(template.Resources.BackupVault).toBeDefined();
      expect(template.Resources.BackupPlan).toBeDefined();
      expect(template.Resources.BackupRole).toBeDefined();
      expect(template.Resources.BackupSelection).toBeDefined();
    });
  });

  describe('Outputs', () => {
    test('should have all required base outputs', () => {
      expect(template.Outputs.TurnAroundPromptTableName).toBeDefined();
      expect(template.Outputs.TurnAroundPromptTableArn).toBeDefined();
      expect(template.Outputs.StackName).toBeDefined();
      expect(template.Outputs.EnvironmentSuffix).toBeDefined();
    });

    test('should have conditional outputs for encryption', () => {
      expect(template.Outputs.EncryptionKeyId).toBeDefined();
      expect(template.Outputs.EncryptionKeyArn).toBeDefined();
    });

    test('should have conditional output for backup vault', () => {
      expect(template.Outputs.BackupVaultName).toBeDefined();
    });

    test('TurnAroundPromptTableName output should be correct', () => {
      const output = template.Outputs.TurnAroundPromptTableName;
      expect(output.Description).toBeDefined();
      expect(output.Value).toBeDefined();
      expect(output.Export).toBeDefined();
      expect(output.Export.Name['Fn::Sub']).toContain('TurnAroundPromptTableName');
    });

    test('TurnAroundPromptTableArn output should be correct', () => {
      const output = template.Outputs.TurnAroundPromptTableArn;
      expect(output.Description).toBeDefined();
      expect(output.Value).toBeDefined();
      expect(output.Value['Fn::GetAtt']).toBeDefined();
    });

    test('StackName output should be correct', () => {
      const output = template.Outputs.StackName;
      expect(output.Description).toBeDefined();
      expect(output.Value).toBeDefined();
    });

    test('EnvironmentSuffix output should be correct', () => {
      const output = template.Outputs.EnvironmentSuffix;
      expect(output.Description).toBeDefined();
      expect(output.Value).toBeDefined();
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

    test('should have production-ready resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThanOrEqual(10);
    });

    test('should have multiple parameters for flexibility', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBeGreaterThanOrEqual(5);
    });

    test('should have conditional and base outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThanOrEqual(7);
    });

    test('should have conditions section', () => {
      expect(template.Conditions).toBeDefined();
      const conditionCount = Object.keys(template.Conditions).length;
      expect(conditionCount).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Resource Naming Convention', () => {
    test('table name should follow naming convention with environment suffix', () => {
      const tableName = template.Resources.TurnAroundPromptTable.Properties.TableName;
      expect(tableName['Fn::Sub']).toContain('${EnvironmentSuffix}');
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

  describe('Security Features', () => {
    test('KMS key should have key rotation enabled', () => {
      const kmsKey = template.Resources.TableEncryptionKey;
      expect(kmsKey.Properties.EnableKeyRotation).toBe(true);
    });

    test('KMS key should have proper key policy', () => {
      const kmsKey = template.Resources.TableEncryptionKey;
      expect(kmsKey.Properties.KeyPolicy).toBeDefined();
      expect(kmsKey.Properties.KeyPolicy.Statement).toBeDefined();
      expect(Array.isArray(kmsKey.Properties.KeyPolicy.Statement)).toBe(true);
    });

    test('all conditional resources should have conditions', () => {
      expect(template.Resources.TableEncryptionKey.Condition).toBe('UseKMSEncryption');
      expect(template.Resources.TableEncryptionKeyAlias.Condition).toBe('UseKMSEncryption');
      expect(template.Resources.BackupVault.Condition).toBe('EnableBackupPlan');
      expect(template.Resources.BackupPlan.Condition).toBe('EnableBackupPlan');
    });
  });

  describe('Tags and Cost Tracking', () => {
    test('DynamoDB table should have cost tracking tags', () => {
      const tags = template.Resources.TurnAroundPromptTable.Properties.Tags;
      const tagKeys = tags.map((tag: any) => tag.Key);
      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('ManagedBy');
      expect(tagKeys).toContain('CostCenter');
    });

    test('KMS key should have tags', () => {
      const tags = template.Resources.TableEncryptionKey.Properties.Tags;
      expect(tags).toBeDefined();
      expect(Array.isArray(tags)).toBe(true);
    });
  });
});
