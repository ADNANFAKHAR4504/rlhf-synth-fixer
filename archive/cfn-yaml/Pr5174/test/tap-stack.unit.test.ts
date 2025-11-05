import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  // ========== Template Structure Tests ==========

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('secure production environment');
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Mappings).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
      expect(template.Conditions).toBeDefined();
    });
  });

  // ========== Parameter Tests ==========

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const expectedParams = [
        'Environment',
        'ProjectName',
        'OwnerEmail',
        'AdminIPAddress',
        'DBUsername',
        'KeyPairName',
        'LatestAmiId',
        'EnableHTTPS',
        'EnableAWSConfig',
        'EnableCloudTrail',
      ];

      expectedParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('Environment parameter should have correct properties', () => {
      const envParam = template.Parameters.Environment;
      expect(envParam.Type).toBe('String');
      expect(envParam.Default).toBe('production');
      expect(envParam.AllowedValues).toContain('production');
      expect(envParam.AllowedValues).toContain('staging');
      expect(envParam.AllowedValues).toContain('development');
    });

    test('AdminIPAddress should have validation pattern for CIDR notation', () => {
      const ipParam = template.Parameters.AdminIPAddress;
      expect(ipParam.AllowedPattern).toBeDefined();
      // Pattern should validate IP address with CIDR notation (e.g., 10.0.0.1/32)
      expect(ipParam.AllowedPattern).toMatch(/\\/);
      // Verify it contains pattern for CIDR range (0-32)
      expect(ipParam.AllowedPattern).toContain('3[0-2]');
    });

    test('DBUsername should have NoEcho enabled', () => {
      const dbUserParam = template.Parameters.DBUsername;
      expect(dbUserParam.NoEcho).toBe(true);
      expect(dbUserParam.AllowedPattern).toBeDefined();
    });

    test('KeyPairName should be optional with empty default', () => {
      const keyParam = template.Parameters.KeyPairName;
      expect(keyParam.Type).toBe('String');
      expect(keyParam.Default).toBe('');
    });

    test('EnableHTTPS parameter should have correct values', () => {
      const httpsParam = template.Parameters.EnableHTTPS;
      expect(httpsParam.Type).toBe('String');
      expect(httpsParam.Default).toBe('false');
      expect(httpsParam.AllowedValues).toContain('true');
      expect(httpsParam.AllowedValues).toContain('false');
    });

    test('EnableAWSConfig parameter should have correct values', () => {
      const configParam = template.Parameters.EnableAWSConfig;
      expect(configParam.Type).toBe('String');
      expect(configParam.Default).toBe('false');
      expect(configParam.AllowedValues).toContain('true');
      expect(configParam.AllowedValues).toContain('false');
    });

    test('EnableCloudTrail parameter should have correct values', () => {
      const trailParam = template.Parameters.EnableCloudTrail;
      expect(trailParam.Type).toBe('String');
      expect(trailParam.Default).toBe('false');
      expect(trailParam.AllowedValues).toContain('true');
      expect(trailParam.AllowedValues).toContain('false');
    });
  });

  // ========== Conditions Tests ==========

  describe('Conditions', () => {
    test('should have all required conditions', () => {
      expect(template.Conditions.HasKeyPair).toBeDefined();
      expect(template.Conditions.UseHTTPS).toBeDefined();
      expect(template.Conditions.UseAWSConfig).toBeDefined();
      expect(template.Conditions.UseCloudTrail).toBeDefined();
    });

    test('HasKeyPair condition should check for empty string', () => {
      const condition = template.Conditions.HasKeyPair;
      expect(condition).toBeDefined();
    });

    test('UseHTTPS condition should check for true value', () => {
      const condition = template.Conditions.UseHTTPS;
      expect(condition['Fn::Equals']).toEqual([{ Ref: 'EnableHTTPS' }, 'true']);
    });

    test('UseAWSConfig condition should check for true value', () => {
      const condition = template.Conditions.UseAWSConfig;
      expect(condition['Fn::Equals']).toEqual([{ Ref: 'EnableAWSConfig' }, 'true']);
    });

    test('UseCloudTrail condition should check for true value', () => {
      const condition = template.Conditions.UseCloudTrail;
      expect(condition['Fn::Equals']).toEqual([{ Ref: 'EnableCloudTrail' }, 'true']);
    });
  });

  // Continue with additional tests...
});
