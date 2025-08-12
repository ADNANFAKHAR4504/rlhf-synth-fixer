import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'pr807'; // match your stack suffix

describe('CloudFormation Template Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    // Load your compiled CloudFormation template JSON here
    const templatePath = path.join(__dirname, '../lib/TapStack.json'); // adjust path if needed
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

    test('has Parameters section (if defined)', () => {
      // Optional, only test if parameters are defined
      if (template.Parameters) {
        const param = template.Parameters.EnvironmentSuffix;
        expect(param).toBeDefined();
        expect(param.Type).toBe('String');
        expect(param.Default).toBeDefined();
        expect(param.Description).toMatch(/environment suffix/i);
        expect(param.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
        expect(param.ConstraintDescription).toBeDefined();
      }
    });

    test('has Resources section with S3 Bucket encrypted with KMS', () => {
      expect(template.Resources).toBeDefined();

      // Find a resource of type S3::Bucket
      const bucketEntry = Object.entries(template.Resources).find(
        ([_, resource]: any) => resource.Type === 'AWS::S3::Bucket'
      );

      expect(bucketEntry).toBeDefined();
      const [bucketLogicalId, bucket] = bucketEntry!;

      const encryption = bucket.Properties?.BucketEncryption;
      expect(encryption).toBeDefined();
      expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();

      const rules = encryption.ServerSideEncryptionConfiguration.Rules;
      expect(Array.isArray(rules)).toBe(true);
      expect(rules.length).toBeGreaterThan(0);

      const kmsRule = rules.find(
        (rule: any) =>
          rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm === 'aws:kms' &&
          typeof rule.ApplyServerSideEncryptionByDefault.KMSMasterKeyID === 'string'
      );
      expect(kmsRule).toBeDefined();
    });

    test('has SecretsManager secret resource with correct properties', () => {
      expect(template.Resources).toBeDefined();

      // Find a resource of type SecretsManager::Secret
      const secretEntry = Object.entries(template.Resources).find(
        ([_, resource]: any) => resource.Type === 'AWS::SecretsManager::Secret'
      );

      expect(secretEntry).toBeDefined();
      const [_, secret] = secretEntry!;

      expect(secret.Properties).toBeDefined();

      const secretName = secret.Properties.Name;
      expect(secretName).toBeDefined();
      expect(secretName).toMatch(new RegExp(environmentSuffix));

      expect(secret.Properties.Description).toBeDefined();
    });
  });

  describe('Outputs', () => {
    test('has expected Outputs with correct keys', () => {
      expect(template.Outputs).toBeDefined();

      const expectedKeys = ['SecretArn', 'KMSKeyArn', 'BucketName'];
      expectedKeys.forEach(outputKey => {
        expect(template.Outputs[outputKey]).toBeDefined();
        expect(template.Outputs[outputKey].Value).toBeDefined();
      });
    });
  });
});
