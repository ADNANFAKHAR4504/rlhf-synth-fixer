import fs from 'fs';
import path from 'path';

describe('CloudFormation Template Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
  });

  describe('Template Basic Structure', () => {
    test('AWSTemplateFormatVersion is 2010-09-09', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('Description exists and is non-empty', () => {
      expect(typeof template.Description).toBe('string');
      expect(template.Description.length).toBeGreaterThan(0);
    });

    test('Optional Parameters section meets expectations', () => {
      if (template.Parameters) {
        const param = template.Parameters.EnvironmentSuffix;
        expect(param.Type).toBe('String');
        expect(param.Default).toBeDefined();
        expect(param.Description).toMatch(/environment suffix/i);
      }
    });

    test('S3 Bucket is encrypted with KMS', () => {
      const bucketEntry = Object.entries(template.Resources).find(
        ([, r]: [string, any]) => r.Type === 'AWS::S3::Bucket'
      );
      expect(bucketEntry).toBeDefined();

      const [, bucket] = bucketEntry as [string, any];
      const enc = bucket.Properties?.BucketEncryption?.ServerSideEncryptionConfiguration;
      expect(Array.isArray(enc)).toBe(true);
      expect(enc.length).toBeGreaterThan(0);

      const firstRule = enc[0];
      expect(firstRule.ServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');

      const keyId = firstRule.ServerSideEncryptionByDefault?.KMSMasterKeyID;
      expect(keyId).toBeDefined();
      expect(typeof keyId).toBe('object'); // Expecting a Ref object, not a string
      expect(Object.keys(keyId).length).toBe(1);
      expect(keyId.Ref).toBe('S3KMSKey');
    });

    test('SecretsManager secret exists with correct properties', () => {
      const secretEntry = Object.entries(template.Resources).find(
        ([, r]: [string, any]) => r.Type === 'AWS::SecretsManager::Secret'
      );
      expect(secretEntry).toBeDefined();

      const [, secret] = secretEntry as [string, any];
      expect(secret.Properties.Name).toBe('MyAppPassword');
      expect(secret.Properties.Description).toBeDefined();
    });
  });

  describe('Outputs verification', () => {
    const expected = ['BucketName', 'SecretArn', 'KMSKeyArn'];
    expected.forEach(key => {
      test(`Output "${key}" is defined`, () => {
        expect(template.Outputs[key]).toBeDefined();
        expect(template.Outputs[key].Value).toBeDefined();
      });
    });
  });
});
