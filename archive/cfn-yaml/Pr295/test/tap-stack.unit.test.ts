import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template - projectX', () => {
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
        'Serverless infrastructure for projectX using AWS Lambda and API Gateway with CloudWatch monitoring.'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should include EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('should have at least 5 parameters', () => {
      const paramCount = Object.keys(template.Parameters).length;
      expect(paramCount).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Resources', () => {
    test('should define Lambda function', () => {
      const lambdaResources = Object.values(template.Resources).filter(
        (res: any) => res.Type === 'AWS::Lambda::Function'
      );
      expect(lambdaResources.length).toBeGreaterThan(0);
    });

    test('should define API Gateway', () => {
      const apiResources = Object.values(template.Resources).filter(
        (res: any) => res.Type === 'AWS::ApiGatewayV2::Api'
      );
      expect(apiResources.length).toBeGreaterThan(0);
    });

    test('should define CloudWatch Log Group', () => {
      const logGroup = Object.values(template.Resources).find(
        (res: any) => res.Type === 'AWS::Logs::LogGroup'
      );
      expect(logGroup).toBeDefined();
    });

    test('should define integration for Lambda and API Gateway', () => {
      const integration = Object.values(template.Resources).find(
        (res: any) => res.Type === 'AWS::ApiGatewayV2::Integration'
      );
      expect(integration).toBeDefined();
    });

    test('should define at least 8 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThanOrEqual(8);
    });
  });

  describe('Outputs', () => {
    test('should have at least 2 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });
  });
});
