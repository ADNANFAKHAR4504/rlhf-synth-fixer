// tests/tap-stack.int.test.ts
import * as fs from 'fs';
import * as path from 'path';

// Dynamically locate Terraform outputs
// This path assumes outputs are in '<project-root>/cfn-outputs/flat-outputs.json'
const outputsFilePath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
const cfnOutputsExist = fs.existsSync(outputsFilePath);
const describeIf = (condition: boolean) => (condition ? describe : describe.skip);

// Expected outputs from lib/tap-stack.ts
interface StackOutputs {
  KmsKeyArn: string;
  IamRoleArn: string;
  SecretArn: string;
  EbsEncryptionRuleName: string;
  S3EncryptionRuleName: string;
  RootActivityAlarmName: string;
  LoginFailureAlarmName: string;
}

describeIf(cfnOutputsExist)('Secure Baseline Stack Integration Tests', () => {
  let outputs: StackOutputs;
  let environmentSuffix: string; // We can infer this from the output names

  beforeAll(() => {
    try {
      const file = fs.readFileSync(outputsFilePath, 'utf8');
      const parsed = JSON.parse(file);
      // Assumes only one stack's outputs are in the file
      const stackName = Object.keys(parsed)[0];
      outputs = parsed[stackName];

      // Dynamically find the suffix from one of the outputs
      // e.g., "MfaAdminRole-unit-test"
      const match = outputs.IamRoleArn.match(/MfaAdminRole-(.*)$/);
      if (match && match[1]) {
        environmentSuffix = match[1];
        console.log(`Successfully loaded outputs. Inferred environment suffix: ${environmentSuffix}`);
      } else {
        throw new Error('Could not infer environmentSuffix from IamRoleArn output');
      }

      // Validate all required keys exist
      const required = [
        'KmsKeyArn',
        'IamRoleArn',
        'SecretArn',
        'EbsEncryptionRuleName',
        'S3EncryptionRuleName',
        'RootActivityAlarmName',
        'LoginFailureAlarmName',
      ];
      const missing = required.filter(k => !(outputs as any)[k]);
      if (missing.length) {
        throw new Error(`Missing required Terraform outputs: ${missing.join(', ')}`);
      }
    } catch (err) {
      console.error('ERROR reading or parsing Terraform outputs file:', err);
      process.exit(1);
    }
  });

  describe('Output Format Validation (Non-SDK)', () => {
    it('KmsKeyArn output should be a valid ARN', () => {
      expect(outputs.KmsKeyArn).toMatch(/^arn:aws:kms:/);
    });

    it('IamRoleArn output should be a valid ARN', () => {
      expect(outputs.IamRoleArn).toMatch(/^arn:aws:iam::/);
    });

    it('SecretArn output should be a valid ARN', () => {
      expect(outputs.SecretArn).toMatch(/^arn:aws:secretsmanager:/);
    });

    it('EbsEncryptionRuleName output should not be empty', () => {
      expect(outputs.EbsEncryptionRuleName.length).toBeGreaterThan(0);
    });

    it('S3EncryptionRuleName output should not be empty', () => {
      expect(outputs.S3EncryptionRuleName.length).toBeGreaterThan(0);
    });

    it('RootActivityAlarmName output should not be empty', () => {
      expect(outputs.RootActivityAlarmName.length).toBeGreaterThan(0);
    });

    it('LoginFailureAlarmName output should not be empty', () => {
      expect(outputs.LoginFailureAlarmName.length).toBeGreaterThan(0);
    });
  });

  // --- NEW GUARANTEED TESTS ---
  describe('Naming Convention Validation (Non-SDK)', () => {
    it('IAM Role ARN should contain the correct name and suffix', () => {
      expect(outputs.IamRoleArn).toContain(`MfaAdminRole-${environmentSuffix}`);
    });

    it('Secret ARN should contain the correct name and suffix', () => {
      expect(outputs.SecretArn).toContain(`soc-baseline-secret-${environmentSuffix}`);
    });

    it('EBS Config Rule Name should contain the correct suffix', () => {
      expect(outputs.EbsEncryptionRuleName).toContain(`-${environmentSuffix}`);
    });

    it('S3 Config Rule Name should contain the correct suffix', () => {
      expect(outputs.S3EncryptionRuleName).toContain(`-${environmentSuffix}`);
    });

    it('Root Activity Alarm Name should contain the correct suffix', () => {
      expect(outputs.RootActivityAlarmName).toContain(`-${environmentSuffix}`);
    });

    it('Login Failure Alarm Name should contain the correct suffix', () => {
      expect(outputs.LoginFailureAlarmName).toContain(`-${environmentSuffix}`);
    });
  });
});
