/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import * as fs from 'fs';
import * as path from 'path';

type Outputs = Record<string, string>;

const environmentSuffix: string = process.env.ENVIRONMENT_SUFFIX ?? 'dev';

// Load outputs lazily inside a function so tests can throw a helpful message if missing
function loadOutputs(): Outputs {
  const outputsPath = path.resolve(process.cwd(), 'cfn-outputs', 'flat-outputs.json');
  const json = fs.readFileSync(outputsPath, 'utf8');
  return JSON.parse(json) as Outputs;
}

describe('Secure Baseline Infrastructure Integration Tests', () => {
  let outputs: Outputs;

  beforeAll(() => {
    outputs = loadOutputs();
  });

  describe('CloudWatch Logs Integration', () => {
    test('should have centralized log group with correct properties', () => {
      expect(outputs.CentralLogGroupName).toBe(`/Prod/central-${environmentSuffix}`);
      expect(outputs.CentralLogGroupArn).toMatch(/^arn:aws[-a-z]*:logs:/);
    });

    test('should support log stream creation workflow (structure only)', () => {
      // Structural assertions only — no AWS calls in CI
      expect(outputs.CentralLogGroupArn).toContain('log-group');
      expect(outputs.LogsKmsKeyArn).toMatch(/^arn:aws[-a-z]*:kms:/);
    });
  });

  describe('S3 Bucket Security Integration', () => {
    test('should have secure bucket with proper naming', () => {
      expect(outputs.SecureBucketName).toMatch(/^prod-secure-artifacts-.*$/);
      expect(outputs.SecureBucketName).toContain(environmentSuffix);
    });

    test('should have KMS encryption configured', () => {
      expect(outputs.S3KmsKeyArn).toMatch(/^arn:aws[-a-z]*:kms:/);
    });
  });

  describe('KMS Keys Integration', () => {
    test('should have separate KMS keys for different services', () => {
      expect(outputs.LogsKmsKeyArn).toMatch(/^arn:aws[-a-z]*:kms:/);
      expect(outputs.S3KmsKeyArn).toMatch(/^arn:aws[-a-z]*:kms:/);
      expect(outputs.LogsKmsKeyArn).not.toBe(outputs.S3KmsKeyArn);
    });
  });

  describe('IAM Resources Integration', () => {
    test('should have MFA-required group with environment suffix', () => {
      expect(outputs.MFARequiredGroupName).toBe(`Prod-MFA-Required-${environmentSuffix}`);
    });

    test('should have central logs writer role with environment suffix', () => {
      expect(outputs.CentralLogsWriterRoleArn).toMatch(/^arn:aws[-a-z]*:iam:/);
      expect(outputs.CentralLogsWriterRoleArn).toContain(environmentSuffix);
    });
  });

  describe('End-to-End Workflow Tests', () => {
    test('should have all required outputs for logging workflow', () => {
      const requiredOutputs: Array<keyof Outputs> = [
        'CentralLogGroupName',
        'CentralLogGroupArn',
        'CentralLogsWriterRoleArn',
        'LogsKmsKeyArn',
      ];
      requiredOutputs.forEach((key) => {
        expect(outputs[key]).toBeDefined();
        expect(String(outputs[key]).length).toBeGreaterThan(0);
      });
    });

    test('should have all security-related outputs', () => {
      const securityOutputs: Array<keyof Outputs> = [
        'LogsKmsKeyArn',
        'S3KmsKeyArn',
        'MFARequiredGroupName',
        'SecureBucketName',
      ];
      securityOutputs.forEach((key) => {
        expect(outputs[key]).toBeDefined();
        expect(String(outputs[key]).length).toBeGreaterThan(0);
      });
    });

    test('should have environment-specific resource naming', () => {
      const envSpecificValues = [
        outputs.CentralLogGroupName,
        outputs.SecureBucketName,
        outputs.MFARequiredGroupName,
        outputs.CentralLogsWriterRoleArn,
      ];
      envSpecificValues.forEach((val) => {
        expect(typeof val).toBe('string');
        expect(val).toContain(environmentSuffix);
      });
    });
  });
});
