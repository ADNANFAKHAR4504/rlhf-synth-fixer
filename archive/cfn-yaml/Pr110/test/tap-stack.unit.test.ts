import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Templates', () => {
  let jsonTemplate: any;

  beforeAll(() => {
    // Load JSON template
    const jsonTemplatePath = path.join(__dirname, '../lib/TapStack.json');
    const jsonTemplateContent = fs.readFileSync(jsonTemplatePath, 'utf8');
    jsonTemplate = JSON.parse(jsonTemplateContent);
  });

  describe('Template Files Existence', () => {
    test('JSON template file should exist', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.json');
      expect(fs.existsSync(templatePath)).toBe(true);
    });

    test('YAML template file should exist', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      expect(fs.existsSync(templatePath)).toBe(true);
    });

    test('JSON template should be parseable', () => {
      expect(jsonTemplate).toBeDefined();
      expect(typeof jsonTemplate).toBe('object');
    });
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(jsonTemplate.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(jsonTemplate.Description).toBeDefined();
      expect(jsonTemplate.Description.trim()).toBe(
        'Basic Development Environment in us-east-1 with two public subnets, EC2 instances, security groups, Internet access, and tagging.'
      );
    });

    test('should have required sections', () => {
      expect(jsonTemplate.Parameters).toBeDefined();
      expect(jsonTemplate.Mappings).toBeDefined();
      expect(jsonTemplate.Resources).toBeDefined();
      expect(jsonTemplate.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have KeyName parameter', () => {
      expect(jsonTemplate.Parameters.KeyName).toBeDefined();
    });

    test('KeyName parameter should have correct properties', () => {
      const keyName = jsonTemplate.Parameters.KeyName;
      expect(keyName.Type).toBe('AWS::EC2::KeyPair::KeyName');
      expect(keyName.Description).toBe('Name of an existing EC2 KeyPair to enable SSH access to the instances.');
      expect(keyName.Default).toBe('iac-rlhf-aws-trainer-instance');
    });
  });

  describe('VPC Resources', () => {
    test('should have VPC resource', () => {
      expect(jsonTemplate.Resources.VPC).toBeDefined();
    });

    test('VPC should have correct properties', () => {
      const vpc = jsonTemplate.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
    });
  });

  describe('Resource Count Validation', () => {
    test('should have exactly 12 resources', () => {
      const resourceCount = Object.keys(jsonTemplate.Resources).length;
      expect(resourceCount).toBe(12);
    });

    test('should have exactly 1 parameter', () => {
      const parameterCount = Object.keys(jsonTemplate.Parameters).length;
      expect(parameterCount).toBe(1);
    });

    test('should have exactly 2 outputs', () => {
      const outputCount = Object.keys(jsonTemplate.Outputs).length;
      expect(outputCount).toBe(2);
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(jsonTemplate).toBeDefined();
      expect(typeof jsonTemplate).toBe('object');
    });

    test('should not have any undefined or null required sections', () => {
      expect(jsonTemplate.AWSTemplateFormatVersion).not.toBeNull();
      expect(jsonTemplate.Description).not.toBeNull();
      expect(jsonTemplate.Parameters).not.toBeNull();
      expect(jsonTemplate.Resources).not.toBeNull();
      expect(jsonTemplate.Outputs).not.toBeNull();
    });
  });
});
