import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

describe('Web App CloudFormation Template Integration Tests', () => {
  const yamlTemplatePath = path.join(__dirname, '../lib/webapp-environment-setup.yaml');
  const jsonTemplatePath = path.join(__dirname, '../lib/webapp-environment-setup.json');

  describe('Template File Validation', () => {
    test('YAML template should exist and be valid', () => {
      expect(fs.existsSync(yamlTemplatePath)).toBe(true);
      
      const yamlContent = fs.readFileSync(yamlTemplatePath, 'utf8');
      expect(() => yaml.load(yamlContent)).not.toThrow();
    });

    test('JSON template should exist and be valid', () => {
      expect(fs.existsSync(jsonTemplatePath)).toBe(true);
      
      const jsonContent = fs.readFileSync(jsonTemplatePath, 'utf8');
      expect(() => JSON.parse(jsonContent)).not.toThrow();
    });

    test('YAML and JSON templates should have consistent content', () => {
      const yamlContent = yaml.load(fs.readFileSync(yamlTemplatePath, 'utf8')) as any;
      const jsonContent = JSON.parse(fs.readFileSync(jsonTemplatePath, 'utf8'));

      // Compare key sections for consistency
      expect(yamlContent.AWSTemplateFormatVersion).toBe(jsonContent.AWSTemplateFormatVersion);
      expect(yamlContent.Description.trim()).toBe(jsonContent.Description.trim());
      
      // Check that both have the same resource types
      const yamlResourceTypes = Object.values(yamlContent.Resources).map((r: any) => r.Type).sort();
      const jsonResourceTypes = Object.values(jsonContent.Resources).map((r: any) => r.Type).sort();
      expect(yamlResourceTypes).toEqual(jsonResourceTypes);
      
      // Check parameter names match
      expect(Object.keys(yamlContent.Parameters).sort()).toEqual(Object.keys(jsonContent.Parameters).sort());
    });
  });

  describe('CloudFormation Template Structure Validation', () => {
    let template: any;

    beforeAll(() => {
      template = JSON.parse(fs.readFileSync(jsonTemplatePath, 'utf8'));
    });

    test('should have all required top-level sections', () => {
      expect(template.AWSTemplateFormatVersion).toBeDefined();
      expect(template.Description).toBeDefined();
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('should have all required resources for web app environment', () => {
      const expectedResources = [
        'WebAppAssets',           // S3 Bucket
        'WebAppServer',           // EC2 Instance
        'WebAppDatabase',         // RDS Instance
        'WebAppServerSecurityGroup',       // Security Groups
        'WebAppDatabaseSecurityGroup',
        'MyWebAppDBPasswordSecret' // Secrets Manager
      ];

      expectedResources.forEach(resourceName => {
        expect(template.Resources[resourceName]).toBeDefined();
      });
    });

    test('should have comprehensive outputs for integration', () => {
      const expectedOutputs = [
        'WebAppServerId',
        'WebAppServerPublicIp',
        'WebAppAssetsBucketName',
        'WebAppDatabaseEndpoint',
        'WebAppDatabasePort',
        'DBMasterUserSecretArn'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
        expect(template.Outputs[outputName].Description).toBeDefined();
        expect(template.Outputs[outputName].Value).toBeDefined();
      });
    });
  });
});
