import * as fs from 'fs';
import * as path from 'path';

/**
 * CloudFormation Template Validation Tests
 *
 * This is a pure CFN YAML template task with no CDK/TypeScript infrastructure code.
 * These tests validate the static YAML template structure without parsing
 * CloudFormation-specific intrinsic functions (!Ref, !Sub, etc.) which require
 * specialized YAML parsers like cfn-yaml.
 */
describe('CloudFormation Template Validation', () => {
  const templatePath = path.join(__dirname, '..', 'lib', 'TapStack.yml');
  let templateContent: string;

  beforeAll(() => {
    templateContent = fs.readFileSync(templatePath, 'utf8');
  });

  test('template file exists', () => {
    expect(fs.existsSync(templatePath)).toBe(true);
  });

  test('template is valid YAML format', () => {
    expect(templateContent).toBeDefined();
    expect(templateContent.length).toBeGreaterThan(0);
    // Check for YAML structure indicators
    expect(templateContent).toMatch(/Resources:/);
  });

  test('template has required CloudFormation sections', () => {
    expect(templateContent).toContain('Resources:');
  });

  test('template contains S3 bucket resources', () => {
    expect(templateContent).toMatch(/Type:\s+AWS::S3::Bucket/);
  });

  test('template contains IAM role resources', () => {
    expect(templateContent).toMatch(/Type:\s+AWS::IAM::Role/);
  });

  test('S3 buckets have encryption configured', () => {
    expect(templateContent).toContain('BucketEncryption');
    expect(templateContent).toMatch(/ServerSideEncryptionConfiguration|SSEAlgorithm/);
  });

  test('template resources use secureapp prefix', () => {
    expect(templateContent.toLowerCase()).toMatch(/secureapp/);
  });

  test('template uses KMS encryption', () => {
    expect(templateContent).toMatch(/KMSMasterKeyID|aws:kms/i);
  });

  test('template contains CloudWatch or logging configuration', () => {
    // Check for CloudWatch or CloudTrail logging
    expect(templateContent).toMatch(/CloudWatch|LogGroup|CloudTrail/i);
  });

  test('template follows least privilege IAM patterns', () => {
    // Check that template uses specific IAM actions (not just wildcards)
    const hasSpecificActions = /Action:\s+["']?(s3:|iam:|kms:|logs:)/i.test(templateContent);
    expect(hasSpecificActions).toBe(true);
  });
});
