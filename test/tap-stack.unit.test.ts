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

    test('should have required sections', () => {
      expect(template.Description).toBeDefined();
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
      expect(template.Mappings).toBeDefined();
      expect(template.Rules).toBeDefined();
      expect(template.Conditions).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have required parameters', () => {
      expect(template.Parameters.EnvironmentSuffixName).toBeDefined();
      expect(template.Parameters.ArtifactBucketName).toBeDefined();
      expect(template.Parameters.ArtifactS3Key).toBeDefined();
    });

    test('EnvironmentSuffixName should have correct constraints', () => {
      const envParam = template.Parameters.EnvironmentSuffixName;
      expect(envParam.Type).toBe('String');
      expect(envParam.Default).toBe('dev');
      expect(envParam.ConstraintDescription).toBe('Must be one of dev, staging, prod, or pr followed by numbers (e.g., pr553)');
    });
  });

  describe('Mappings', () => {
    test('should have environment configurations for all environments', () => {
      const envConfig = template.Mappings.EnvironmentConfig;
      ['dev', 'staging', 'prod'].forEach(env => {
        expect(envConfig[env]).toBeDefined();
        expect(envConfig[env].ResourcePrefix).toBeDefined();
        expect(envConfig[env].LambdaMemorySize).toBeDefined();
      });
    });
  });

  describe('Resources', () => {
    test('should have core serverless resources', () => {
      expect(template.Resources.LambdaArtifactsBucket).toBeDefined();
      expect(template.Resources.HelloWorldFunction).toBeDefined();
      expect(template.Resources.HelloWorldApi).toBeDefined();
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
    });

    test('Lambda function should use correct runtime', () => {
      const function_ = template.Resources.HelloWorldFunction;
      expect(function_.Properties.Runtime).toBe('nodejs22.x');
    });

    test('S3 buckets should have encryption enabled', () => {
      const artifactsBucket = template.Resources.LambdaArtifactsBucket;
      expect(artifactsBucket.Properties.BucketEncryption).toBeDefined();
    });

    test('conditional resources should have proper conditions', () => {
      expect(template.Resources.AccessLogsBucket.Condition).toBe('CreateAccessLogsBucket');
      expect(template.Resources.AccessLogsBucketPolicy.Condition).toBe('CreateAccessLogsBucket');
    });
  });

  describe('Outputs', () => {
    test('should have required outputs', () => {
      const expectedOutputs = [
        'ApiGatewayInvokeUrl',
        'LambdaFunctionArn',
        'ArtifactsBucketName',
        'EnvironmentName'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('conditional output should have condition', () => {
      expect(template.Outputs.AccessLogsBucketName.Condition).toBe('CreateAccessLogsBucket');
    });
  });

  describe('Security and Best Practices', () => {
    test('S3 buckets should have public access blocked', () => {
      const artifactsBucket = template.Resources.LambdaArtifactsBucket;
      expect(artifactsBucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
    });

    test('Lambda function should have proper timeout', () => {
      const function_ = template.Resources.HelloWorldFunction;
      expect(function_.Properties.Timeout).toBe(30);
    });

    test('API Gateway should be regional', () => {
      const api = template.Resources.HelloWorldApi;
      expect(api.Properties.EndpointConfiguration.Types).toContain('REGIONAL');
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should have reasonable resource count', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(5);
      expect(resourceCount).toBeLessThan(20);
    });
  });
});