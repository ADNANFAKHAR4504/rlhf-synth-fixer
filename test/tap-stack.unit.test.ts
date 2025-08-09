import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('CloudFormation Template Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    // Load your compiled CloudFormation template JSON here
    const templatePath = path.join(__dirname, '../lib/TapStack.json'); // adjust path as needed
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Basic Structure', () => {
    test('has valid AWSTemplateFormatVersion', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('has Description field', () => {
      expect(template.Description).toBeDefined();
      expect(typeof template.Description).toBe('string');
      expect(template.Description.length).toBeGreaterThan(0);
    });

    test('has Parameters section with EnvironmentSuffix parameter', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();

      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.Description).toMatch(/environment suffix/i);
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(param.ConstraintDescription).toBeDefined();
    });

    test('has Resources section with S3 Bucket encrypted with KMS', () => {
      expect(template.Resources).toBeDefined();

      // Assuming your bucket logical ID is MyEncryptedBucket - adjust as needed
      const bucket = template.Resources.MyEncryptedBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');

      // Check bucket encryption property presence and structure
      const encryption = bucket.Properties?.BucketEncryption;
      expect(encryption).toBeDefined();
      expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();

      const rules = encryption.ServerSideEncryptionConfiguration.Rules;
      expect(Array.isArray(rules)).toBe(true);
      expect(rules.length).toBeGreaterThan(0);

      // Check that one of the rules uses AWS KMS encryption
      const kmsRule = rules.find(
        (rule: any) =>
          rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm === 'aws:kms' &&
          typeof rule.ApplyServerSideEncryptionByDefault.KMSMasterKeyID === 'string'
      );
      expect(kmsRule).toBeDefined();
    });

    test('has SecretsManager secret resource with correct properties', () => {
      // Assuming logical ID of secret is MyAppSecret - adjust as needed
      const secret = template.Resources.MyAppSecret;
      expect(secret).toBeDefined();
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');

      // Validate properties exist
      expect(secret.Properties).toBeDefined();
      expect(secret.Properties.Name).toMatch(new RegExp(environmentSuffix));
      expect(secret.Properties.Description).toBeDefined();
    });
  });

  describe('Outputs', () => {
    test('has expected Outputs', () => {
      expect(template.Outputs).toBeDefined();

      // Check outputs keys exist (adjust keys as per your template)
      ['MyEncryptedBucketName', 'MyAppSecretArn', 'S3KMSKeyArn', 'EnvironmentSuffix'].forEach(outputKey => {
        expect(template.Outputs[outputKey]).toBeDefined();
        expect(template.Outputs[outputKey].Value).toBeDefined();
      });
    });
  });
});
