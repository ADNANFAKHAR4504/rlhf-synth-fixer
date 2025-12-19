import * as fs from 'fs';
import * as path from 'path';

describe('TapStack - Transaction Processing Infrastructure Unit Tests', () => {
  // Test configuration
  const templatePath = path.resolve(__dirname, '../lib/TapStack.yml');

  // Load template
  let templateYaml: string;

  beforeAll(() => {
    // Load template
    templateYaml = fs.readFileSync(templatePath, 'utf8');
  });

  // =================
  // BASIC VALIDATION
  // =================
  describe('Template Structure Validation', () => {
    test('Template has all required sections', () => {
      expect(templateYaml).toContain('AWSTemplateFormatVersion: \'2010-09-09\'');
      expect(templateYaml).toContain('Description:');
      expect(templateYaml).toContain('Parameters:');
      expect(templateYaml).toContain('Resources:');
    });

    test('Template contains EnvironmentSuffix parameter', () => {
      expect(templateYaml).toContain('EnvironmentSuffix:');
      expect(templateYaml).toContain('Type: String');
    });

    test('Template contains Resources section', () => {
      expect(templateYaml).toContain('Resources:');
      // Verify at least one resource exists
      const resourcesMatch = templateYaml.match(/^\s+\w+:\s*$/gm);
      expect(resourcesMatch).toBeTruthy();
      expect(resourcesMatch!.length).toBeGreaterThan(0);
    });
  });

  // ===========
  // PARAMETERS
  // ===========
  describe('Parameters Section', () => {
    test('EnvironmentSuffix parameter has proper validation', () => {
      expect(templateYaml).toContain('EnvironmentSuffix:');
      expect(templateYaml).toContain('AllowedPattern:');
    });
  });

  // ===================
  // RESOURCES VALIDATION
  // ===================
  describe('Resources Section', () => {
    test('Template contains AWS resource definitions', () => {
      expect(templateYaml).toContain('Type: AWS::');
    });

    test('Resources have proper CloudFormation structure', () => {
      // Verify resources follow proper YAML structure
      const resourcePattern = /^\s+\w+:\s*$\n\s+Type:\s+AWS::/m;
      expect(templateYaml).toMatch(resourcePattern);
    });
  });
});

