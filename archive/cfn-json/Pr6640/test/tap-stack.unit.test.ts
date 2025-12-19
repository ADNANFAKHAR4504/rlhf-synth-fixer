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

  describe('Write Integration TESTS', () => {
    test('Dont forget!', async () => {
      expect(true).toBe(true);
    });
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('HIPAA-compliant patient data processing');
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('prod');
      expect(envSuffixParam.Description).toBeDefined();
      expect(envSuffixParam.AllowedPattern).toBeDefined();
    });

    test('should have ExternalId parameter', () => {
      expect(template.Parameters.ExternalId).toBeDefined();
      expect(template.Parameters.ExternalId.Type).toBe('String');
      expect(template.Parameters.ExternalId.NoEcho).toBe(true);
      expect(template.Parameters.ExternalId.MinLength).toBe(8);
    });

    test('should have DatabasePassword parameter', () => {
      expect(template.Parameters.DatabasePassword).toBeDefined();
      expect(template.Parameters.DatabasePassword.Type).toBe('String');
      expect(template.Parameters.DatabasePassword.NoEcho).toBe(true);
      expect(template.Parameters.DatabasePassword.MinLength).toBe(12);
    });
  });

  describe('Resources', () => {
    test('should have PatientDataBucket resource', () => {
      expect(template.Resources.PatientDataBucket).toBeDefined();
      expect(template.Resources.PatientDataBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('PatientDataBucket should have encryption enabled', () => {
      const bucket = template.Resources.PatientDataBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();
    });

    test('should have PatientDataProcessor Lambda function', () => {
      expect(template.Resources.PatientDataProcessor).toBeDefined();
      expect(template.Resources.PatientDataProcessor.Type).toBe('AWS::Lambda::Function');
    });

    test('PatientDataProcessor should have correct memory size', () => {
      const lambda = template.Resources.PatientDataProcessor;
      expect(lambda.Properties.MemorySize).toBe(1024);
    });

    test('should have EncryptionKey KMS key', () => {
      expect(template.Resources.EncryptionKey).toBeDefined();
      expect(template.Resources.EncryptionKey.Type).toBe('AWS::KMS::Key');
    });

    test('EncryptionKey should have key rotation enabled', () => {
      const key = template.Resources.EncryptionKey;
      expect(key.Properties.EnableKeyRotation).toBe(true);
    });

    test('should have LambdaExecutionRole IAM role', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      expect(template.Resources.LambdaExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have PatientDataProcessorLogGroup CloudWatch Logs', () => {
      expect(template.Resources.PatientDataProcessorLogGroup).toBeDefined();
      expect(template.Resources.PatientDataProcessorLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('PatientDataProcessorLogGroup should have retention policy', () => {
      const logGroup = template.Resources.PatientDataProcessorLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBe(90);
    });

    test('should have PatientDataBucketPolicy', () => {
      expect(template.Resources.PatientDataBucketPolicy).toBeDefined();
      expect(template.Resources.PatientDataBucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'S3BucketArn',
        'S3BucketName',
        'LambdaFunctionArn',
        'LambdaFunctionName',
        'KMSKeyId',
        'KMSKeyArn',
        'LogGroupName',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('S3BucketArn output should be correct', () => {
      const output = template.Outputs.S3BucketArn;
      expect(output.Description).toBeDefined();
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['PatientDataBucket', 'Arn'] });
    });

    test('S3BucketName output should be correct', () => {
      const output = template.Outputs.S3BucketName;
      expect(output.Description).toBeDefined();
      expect(output.Value).toEqual({ Ref: 'PatientDataBucket' });
    });

    test('LambdaFunctionArn output should be correct', () => {
      const output = template.Outputs.LambdaFunctionArn;
      expect(output.Description).toBeDefined();
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['PatientDataProcessor', 'Arn'] });
    });

    test('LambdaFunctionName output should be correct', () => {
      const output = template.Outputs.LambdaFunctionName;
      expect(output.Description).toBeDefined();
      expect(output.Value).toEqual({ Ref: 'PatientDataProcessor' });
    });

    test('KMSKeyId output should be correct', () => {
      const output = template.Outputs.KMSKeyId;
      expect(output.Description).toBeDefined();
      expect(output.Value).toEqual({ Ref: 'EncryptionKey' });
    });

    test('KMSKeyArn output should be correct', () => {
      const output = template.Outputs.KMSKeyArn;
      expect(output.Description).toBeDefined();
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['EncryptionKey', 'Arn'] });
    });

    test('LogGroupName output should be correct', () => {
      const output = template.Outputs.LogGroupName;
      expect(output.Description).toBeDefined();
      expect(output.Value).toEqual({ Ref: 'PatientDataProcessorLogGroup' });
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

    test('should have correct number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(8);
    });

    test('should have correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(3);
    });

    test('should have correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(7);
    });
  });

  describe('Security and Compliance', () => {
    test('S3 bucket should have versioning enabled', () => {
      const bucket = template.Resources.PatientDataBucket;
      expect(bucket.Properties.VersioningConfiguration).toBeDefined();
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('S3 bucket should block public access', () => {
      const bucket = template.Resources.PatientDataBucket;
      expect(bucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
    });

    test('Lambda should use KMS encryption for environment variables', () => {
      const lambda = template.Resources.PatientDataProcessor;
      expect(lambda.Properties.KmsKeyArn).toBeDefined();
    });

    test('Log group should have retention policy for compliance', () => {
      const logGroup = template.Resources.PatientDataProcessorLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBe(90);
    });
  });
});
