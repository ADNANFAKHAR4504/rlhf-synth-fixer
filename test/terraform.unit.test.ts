// tests/unit/terraform.unit.test.ts
// Comprehensive unit tests for IAM-centric Terraform configuration
// Validates presence and basic configuration via regex without running Terraform

import fs from 'fs';
import path from 'path';

const STACK_PATH = path.resolve(__dirname, '../lib/main.tf');
const PROVIDER_PATH = path.resolve(__dirname, '../lib/provider.tf');
const VARS_PATH = path.resolve(__dirname, '../lib/vars.tf');

describe('Terraform Infrastructure Unit Tests (IAM Stack)', () => {
  let stackContent: string;
  let providerContent: string;
  let varsContent: string;

  beforeAll(() => {
    expect(fs.existsSync(STACK_PATH)).toBe(true);
    expect(fs.existsSync(PROVIDER_PATH)).toBe(true);
    expect(fs.existsSync(VARS_PATH)).toBe(true);

    stackContent = fs.readFileSync(STACK_PATH, 'utf8');
    providerContent = fs.readFileSync(PROVIDER_PATH, 'utf8');
    varsContent = fs.readFileSync(VARS_PATH, 'utf8');
  });

  describe('File Structure', () => {
    test('main.tf exists', () => {
      expect(fs.existsSync(STACK_PATH)).toBe(true);
    });

    test('provider.tf exists', () => {
      expect(fs.existsSync(PROVIDER_PATH)).toBe(true);
    });

    test('vars.tf exists', () => {
      expect(fs.existsSync(VARS_PATH)).toBe(true);
    });

    test('does NOT declare provider in tap_stack.tf (provider.tf owns providers)', () => {
      expect(stackContent).not.toMatch(/(^|\n)\s*provider\s+"aws"\s*{/);
    });
  });

  describe('Provider Configuration', () => {
    test('AWS provider version >= 5.0', () => {
      expect(providerContent).toMatch(/required_providers[\s\S]*aws[\s\S]*version\s*=\s*">=\s*5\.0"/);
    });

    test('S3 backend configured', () => {
      expect(providerContent).toMatch(/backend\s+"s3"/);
    });

    test('AWS region set from variable', () => {
      expect(providerContent).toMatch(/provider\s+"aws"[\s\S]*region\s*=\s*var\.aws_region/);
    });

    test('Terraform required_version present (>= 1.4.0)', () => {
      expect(providerContent).toMatch(/terraform[\s\S]*required_version\s*=\s*">=\s*1\.4\.0"/);
    });
  });

  describe('Variables', () => {
    test('aws_region variable with default us-west-2', () => {
      expect(varsContent).toMatch(/variable\s+"aws_region"\s*{/);
      expect(varsContent).toMatch(/default\s*=\s*"us-west-2"/);
    });

    test('project_name variable defined', () => {
      expect(varsContent).toMatch(/variable\s+"project_name"\s*{/);
    });

    test('allowed_ip_cidr variable default 203.0.113.0/24', () => {
      expect(varsContent).toMatch(/variable\s+"allowed_ip_cidr"\s*{/);
      expect(varsContent).toMatch(/default\s*=\s*"203\.0\.113\.0\/24"/);
    });

    test('iam_users variable defined', () => {
      expect(varsContent).toMatch(/variable\s+"iam_users"\s*{/);
    });

    test('iam_roles variable defined', () => {
      expect(varsContent).toMatch(/variable\s+"iam_roles"\s*{/);
    });

    test('force_mfa variable default true', () => {
      expect(varsContent).toMatch(/variable\s+"force_mfa"\s*{/);
      expect(varsContent).toMatch(/default\s*=\s*true/);
    });
  });

  describe('S3 Backend and Random ID', () => {
    test('S3 backend resources inlined (bucket and dynamodb lock table)', () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"terraform_state"/);
      expect(stackContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"terraform_state_lock"/);
    });

    test('random_id bucket_suffix resource defined', () => {
      expect(stackContent).toMatch(/resource\s+"random_id"\s+"bucket_suffix"/);
    });
  });

  describe('IAM Policies and Password Policy', () => {
    test('IAM password policy resource with strong requirements', () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_account_password_policy"\s+"strict"/);
      expect(stackContent).toMatch(/minimum_password_length\s*=\s*12/);
      expect(stackContent).toMatch(/require_lowercase_characters\s*=\s*true/);
      expect(stackContent).toMatch(/require_numbers\s*=\s*true/);
      expect(stackContent).toMatch(/require_uppercase_characters\s*=\s*true/);
      expect(stackContent).toMatch(/require_symbols\s*=\s*true/);
    });

    test('IP restriction IAM policy defined and uses allowed_ip_cidr variable', () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_policy"\s+"ip_restriction"/);
      expect(stackContent).toMatch(/"aws:SourceIp"/);
      expect(stackContent).toMatch(/var\.allowed_ip_cidr/);
    });

    test('Force MFA policy is conditionally created and denies non-MFA', () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_policy"\s+"force_mfa"/);
      expect(stackContent).toMatch(/count\s*=\s*var\.force_mfa\s*\?\s*1\s*:\s*0/);
      expect(stackContent).toMatch(/DenyAllExceptUnlessSignedInWithMFA/);
      expect(stackContent).toMatch(/"aws:MultiFactorAuthPresent"/);
    });
  });

  describe('IAM Modules, Groups, and Attachments', () => {
    test('IAM users and roles resources present', () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_user"\s+"users"/);
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"roles"/);
    });

    test('IAM groups for developers and administrators exist', () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_group"\s+"developers"/);
      expect(stackContent).toMatch(/resource\s+"aws_iam_group"\s+"administrators"/);
    });

    test('Policy attachments for groups are configured', () => {
      expect(stackContent).toMatch(/aws_iam_group_policy_attachment"\s+"developers_readonly"[\s\S]*ReadOnlyAccess/);
      expect(stackContent).toMatch(/aws_iam_group_policy_attachment"\s+"administrators_admin"[\s\S]*IAMFullAccess/);
      expect(stackContent).toMatch(/aws_iam_group_policy_attachment"\s+"developers_ip_restriction"/);
      expect(stackContent).toMatch(/aws_iam_group_policy_attachment"\s+"administrators_ip_restriction"/);
      expect(stackContent).toMatch(/aws_iam_group_policy_attachment"\s+"developers_mfa"[\s\S]*count\s*=\s*var\.force_mfa/);
      expect(stackContent).toMatch(/aws_iam_group_policy_attachment"\s+"administrators_mfa"[\s\S]*count\s*=\s*var\.force_mfa/);
    });
  });

  describe('Outputs', () => {
    test('core outputs exist', () => {
      expect(stackContent).toMatch(/output\s+"account_id"/);
      expect(stackContent).toMatch(/output\s+"region"/);
      expect(stackContent).toMatch(/output\s+"environment"/);
    });

    test('list and policy outputs exist', () => {
      expect(stackContent).toMatch(/output\s+"created_users"/);
      expect(stackContent).toMatch(/output\s+"created_roles"/);
      expect(stackContent).toMatch(/output\s+"ip_restriction_policy_arn"/);
      expect(stackContent).toMatch(/output\s+"mfa_policy_arn"/);
      expect(stackContent).toMatch(/output\s+"s3_backend_bucket"/);
    });
  });
});
