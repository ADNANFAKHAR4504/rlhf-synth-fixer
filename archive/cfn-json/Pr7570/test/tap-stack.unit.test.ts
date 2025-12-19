import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Infrastructure Compliance Monitoring System', () => {
  let template: any;

  beforeAll(() => {
    // Try template.json first, then TapStack.json
    const templatePath = fs.existsSync(path.join(__dirname, '../lib/template.json'))
      ? path.join(__dirname, '../lib/template.json')
      : path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(typeof template.Description).toBe('string');
    });

    test('should have required template sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Description).toBeDefined();
    });
  });

  describe('Resources', () => {
    test('should have at least one resource', () => {
      const resourceCount = Object.keys(template.Resources || {}).length;
      expect(resourceCount).toBeGreaterThan(0);
    });

    test('all resources should have Type property', () => {
      const resources = template.Resources || {};
      Object.keys(resources).forEach((resourceName) => {
        expect(resources[resourceName].Type).toBeDefined();
        expect(typeof resources[resourceName].Type).toBe('string');
      });
    });
  });
});

