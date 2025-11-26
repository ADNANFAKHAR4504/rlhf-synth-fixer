import fs from 'fs';
import path from 'path';

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
      expect(template.Description).toContain('Blue-Green');
    });

    test('should have resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(Object.keys(template.Resources).length).toBeGreaterThan(0);
    });
  });

  describe('Parameters', () => {
    test('should have Environment Suffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });
  });

  describe('Resources', () => {
    test('should have KMS Key', () => {
      expect(template.Resources.KMSKey).toBeDefined();
      expect(template.Resources.KMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('should have Database Secret', () => {
      expect(template.Resources.DatabaseSecret).toBeDefined();
      expect(template.Resources.DatabaseSecret.Type).toBe('AWS::SecretsManager::Secret');
    });

    test('should have Backup Vault', () => {
      expect(template.Resources.BackupVault).toBeDefined();
    });
  });

  describe('Outputs', () => {
    test('should have KMS outputs', () => {
      expect(template.Outputs.KMSKeyId).toBeDefined();
      expect(template.Outputs.KMSKeyArn).toBeDefined();
    });
  });
});
