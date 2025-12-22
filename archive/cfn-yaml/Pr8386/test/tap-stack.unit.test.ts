import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If youre testing a yaml template. run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
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
      expect(typeof template.Description).toBe('string');
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
    });
  });

  describe('Resources', () => {
    const expectedResources = [
      'TAPAccessRole',
      'TAPDynamoDBKMSKey', 
      'TAPDynamoDBKMSKeyAlias',
      'TAPSecureS3Bucket',
      'TAPS3AccessLogsBucket',
      'TAPSecureS3BucketPolicy',
      'TAPS3LogGroup',
      'TurnAroundPromptTable',
      'TAPDynamoDBAccessPolicy'
    ];

    test('should have all required resources', () => {
      expectedResources.forEach(resourceName => {
        expect(template.Resources[resourceName]).toBeDefined();
      });
    });

    test('should have correct resource types', () => {
      expect(template.Resources.TAPAccessRole.Type).toBe('AWS::IAM::Role');
      expect(template.Resources.TAPDynamoDBKMSKey.Type).toBe('AWS::KMS::Key');
      expect(template.Resources.TAPDynamoDBKMSKeyAlias.Type).toBe('AWS::KMS::Alias');
      expect(template.Resources.TAPSecureS3Bucket.Type).toBe('AWS::S3::Bucket');
      expect(template.Resources.TAPS3AccessLogsBucket.Type).toBe('AWS::S3::Bucket');
      expect(template.Resources.TAPSecureS3BucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
      expect(template.Resources.TAPS3LogGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(template.Resources.TurnAroundPromptTable.Type).toBe('AWS::DynamoDB::Table');
      expect(template.Resources.TAPDynamoDBAccessPolicy.Type).toBe('AWS::IAM::Policy');
    });
  });

  describe('Outputs', () => {
    const expectedOutputs = [
      'S3BucketName',
      'S3BucketArn', 
      'TurnAroundPromptTableName',
      'TurnAroundPromptTableArn',
      'KMSKeyId',
      'TAPAccessRoleArn',
      'StackName',
      'EnvironmentSuffix',
    ];

    test('should have all required outputs', () => {
      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('outputs should have descriptions', () => {
      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName].Description).toBeDefined();
        expect(typeof template.Outputs[outputName].Description).toBe('string');
      });
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

    test('should have reasonable number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThanOrEqual(8);
      expect(resourceCount).toBeLessThan(20); // Reasonable upper bound
    });

    test('should have reasonable number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThanOrEqual(8);
      expect(outputCount).toBeLessThan(15); // Reasonable upper bound
    });
  });
});