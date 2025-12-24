import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'pr807';

describe('CloudFormation Template Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json'); // Adjust path as needed
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

      const bucketEntry = Object.entries(template.Resources).find(
        ([_, resource]: [string, any]) => resource.Type === 'AWS::S3::Bucket'
      );

      expect(bucketEntry).toBeDefined();

      const [_, bucketResource] = bucketEntry as [string, any];

      const encryption = bucketResource?.Properties?.BucketEncryption;
      expect(encryption).toBeDefined();

      const rules = encryption?.ServerSideEncryptionConfiguration;
      expect(Array.isArray(rules)).toBe(true);

      if (!Array.isArray(rules)) {
        throw new Error('Invalid or missing encryption rules for S3 bucket.');
      }

      expect(rules.length).toBeGreaterThan(0);

      // **Note the exact key names from your CFN template: KMSMasterKeyID**
      const kmsRule = rules.find(
        (rule: any) =>
          rule.ServerSideEncryptionByDefault?.SSEAlgorithm === 'aws:kms' &&
          typeof rule.ServerSideEncryptionByDefault?.KMSMasterKeyID === 'string'
      );
    });

    test('has SecretsManager secret resource with correct properties', () => {
      expect(template.Resources).toBeDefined();

      const secretEntry = Object.entries(template.Resources).find(
        ([_, resource]: [string, any]) => resource.Type === 'AWS::SecretsManager::Secret'
      );

      const [__, secretResource] = secretEntry as [string, any];

      // Secret name now includes EnvironmentSuffix parameter
      const secretName = secretResource.Properties.Name;
      expect(secretName).toBeDefined();
      // Check if it's a Fn::Sub with EnvironmentSuffix or contains MyAppPassword
      if (typeof secretName === 'string') {
        expect(secretName).toContain('MyAppPassword');
      } else if (secretName && typeof secretName === 'object' && 'Fn::Sub' in secretName) {
        const subValue = secretName['Fn::Sub'];
        expect(subValue).toContain('MyAppPassword');
        expect(subValue).toContain('EnvironmentSuffix');
      }
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
