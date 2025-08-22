// Comprehensive unit tests for ../lib/main.tf (falls back to ../lib/tap_stack.tf)
// - Validates structure and key resources by reading HCL as text
// - Does NOT run terraform init/plan/apply

import fs from 'fs';
import path from 'path';

const MAIN_REL = '../lib/main.tf';
const TAP_REL = '../lib/tap_stack.tf';
const mainPath = path.resolve(__dirname, MAIN_REL);
const tapPath = path.resolve(__dirname, TAP_REL);

const stackPath = fs.existsSync(mainPath) ? mainPath : tapPath;
const stackName = stackPath.endsWith('main.tf') ? 'main.tf' : 'tap_stack.tf';

const read = () => fs.readFileSync(stackPath, 'utf8');

describe(`Terraform single-file stack: ${stackName}`, () => {
  test('stack file exists', () => {
    expect(fs.existsSync(stackPath)).toBe(true);
  });

  test('variables declared as required by prompt', () => {
    const src = read();
    expect(src).toMatch(/variable\s+"environment"\s*\{/);
    expect(src).toMatch(/variable\s+"owner"\s*\{/);
    expect(src).toMatch(/variable\s+"designated_tag_key"\s*\{/);
    expect(src).toMatch(/variable\s+"designated_tag_value"\s*\{/);
    expect(src).toMatch(/variable\s+"allowed_ssh_cidrs"\s*\{/);
  });

  test('provider aliases for us-east-1 and eu-west-1 are present', () => {
    const src = read();
    expect(src).toMatch(
      /provider\s+"aws"\s*\{[\s\S]*alias\s*=\s*"us_east_1"[\s\S]*region\s*=\s*"us-east-1"[\s\S]*\}/
    );
    expect(src).toMatch(
      /provider\s+"aws"\s*\{[\s\S]*alias\s*=\s*"eu_west_1"[\s\S]*region\s*=\s*"eu-west-1"[\s\S]*\}/
    );
  });

  test('locals include common tags with Environment and Owner', () => {
    const src = read();
    expect(src).toMatch(
      /locals\s*\{[\s\S]*common_tags\s*=\s*\{[\s\S]*Environment\s*=\s*var\.environment[\s\S]*Owner\s*=\s*var\.owner[\s\S]*\}[\s\S]*\}/
    );
  });

  describe('S3: buckets per region with SSE-S3, versioning, public access block', () => {
    test('us-east-1 buckets + controls', () => {
      const s = read();
      expect(s).toMatch(/resource\s+"aws_s3_bucket"\s+"config_us_east_1"/);
      expect(s).toMatch(/resource\s+"aws_s3_bucket"\s+"data_us_east_1"/);
      expect(s).toMatch(
        /resource\s+"aws_s3_bucket_public_access_block"\s+"config_pab_us_east_1"/
      );
      expect(s).toMatch(
        /resource\s+"aws_s3_bucket_public_access_block"\s+"data_pab_us_east_1"/
      );
      expect(s).toMatch(
        /resource\s+"aws_s3_bucket_versioning"\s+"config_ver_us_east_1"/
      );
      expect(s).toMatch(
        /resource\s+"aws_s3_bucket_versioning"\s+"data_ver_us_east_1"/
      );
      // SSE-S3 AES256, multi-line nested blocks (no single-line)
      expect(s).toMatch(
        /resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"config_enc_us_east_1"[\s\S]*apply_server_side_encryption_by_default[\s\S]*sse_algorithm\s*=\s*"AES256"[\s\S]*\}/
      );
      expect(s).toMatch(
        /resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"data_enc_us_east_1"[\s\S]*apply_server_side_encryption_by_default[\s\S]*sse_algorithm\s*=\s*"AES256"[\s\S]*\}/
      );
      expect(s).not.toMatch(/bucket_key_enabled/);
    });

    test('eu-west-1 buckets + controls', () => {
      const s = read();
      expect(s).toMatch(/resource\s+"aws_s3_bucket"\s+"config_eu_west_1"/);
      expect(s).toMatch(/resource\s+"aws_s3_bucket"\s+"data_eu_west_1"/);
      expect(s).toMatch(
        /resource\s+"aws_s3_bucket_public_access_block"\s+"config_pab_eu_west_1"/
      );
      expect(s).toMatch(
        /resource\s+"aws_s3_bucket_public_access_block"\s+"data_pab_eu_west_1"/
      );
      expect(s).toMatch(
        /resource\s+"aws_s3_bucket_versioning"\s+"config_ver_eu_west_1"/
      );
      expect(s).toMatch(
        /resource\s+"aws_s3_bucket_versioning"\s+"data_ver_eu_west_1"/
      );
      expect(s).toMatch(
        /resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"config_enc_eu_west_1"[\s\S]*sse_algorithm\s*=\s*"AES256"/
      );
      expect(s).toMatch(
        /resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"data_enc_eu_west_1"[\s\S]*sse_algorithm\s*=\s*"AES256"/
      );
      expect(s).not.toMatch(/bucket_key_enabled/);
    });
  });

  describe('AWS Config in both regions (recorder, delivery, status, rule)', () => {
    test('IAM role + attachment for Config', () => {
      const s = read();
      expect(s).toMatch(/resource\s+"aws_iam_role"\s+"config_role"/);
      expect(s).toMatch(
        /resource\s+"aws_iam_role_policy_attachment"\s+"config_role_attach"/
      );
    });

    test('us-east-1 config pipeline', () => {
      const s = read();
      expect(s).toMatch(
        /resource\s+"aws_config_configuration_recorder"\s+"rec_us_east_1"/
      );
      expect(s).toMatch(
        /resource\s+"aws_config_delivery_channel"\s+"dc_us_east_1"[\s\S]*depends_on/
      );
      expect(s).toMatch(
        /resource\s+"aws_config_configuration_recorder_status"\s+"enable_us_east_1"[\s\S]*depends_on/
      );
      expect(s).toMatch(
        /resource\s+"aws_config_config_rule"\s+"encrypted_volumes_us_east_1"[\s\S]*source[\s\S]*ENCRYPTED_VOLUMES/
      );
    });

    test('eu-west-1 config pipeline', () => {
      const s = read();
      expect(s).toMatch(
        /resource\s+"aws_config_configuration_recorder"\s+"rec_eu_west_1"/
      );
      expect(s).toMatch(
        /resource\s+"aws_config_delivery_channel"\s+"dc_eu_west_1"[\s\S]*depends_on/
      );
      expect(s).toMatch(
        /resource\s+"aws_config_configuration_recorder_status"\s+"enable_eu_west_1"[\s\S]*depends_on/
      );
      expect(s).toMatch(
        /resource\s+"aws_config_config_rule"\s+"encrypted_volumes_eu_west_1"[\s\S]*source[\s\S]*ENCRYPTED_VOLUMES/
      );
    });
  });

  describe('Lambda SSH auto-remediation in both regions + EventBridge', () => {
    test('role + policy + packaging', () => {
      const s = read();
      expect(s).toMatch(
        /resource\s+"aws_iam_role"\s+"lambda_remediation_role"/
      );
      expect(s).toMatch(
        /resource\s+"aws_iam_role_policy"\s+"lambda_remediation_policy"/
      );
      expect(s).toMatch(/data\s+"archive_file"\s+"lambda_pkg"/);
    });

    test('us-east-1 lambda + rule + target + permission', () => {
      const s = read();
      expect(s).toMatch(
        /resource\s+"aws_lambda_function"\s+"remediate_us_east_1"/
      );
      expect(s).toMatch(
        /resource\s+"aws_cloudwatch_event_rule"\s+"sg_changes_us_east_1"/
      );
      expect(s).toMatch(
        /resource\s+"aws_cloudwatch_event_target"\s+"lambda_target_us_east_1"/
      );
      expect(s).toMatch(
        /resource\s+"aws_lambda_permission"\s+"allow_events_us_east_1"/
      );
    });

    test('eu-west-1 lambda + rule + target + permission', () => {
      const s = read();
      expect(s).toMatch(
        /resource\s+"aws_lambda_function"\s+"remediate_eu_west_1"/
      );
      expect(s).toMatch(
        /resource\s+"aws_cloudwatch_event_rule"\s+"sg_changes_eu_west_1"/
      );
      expect(s).toMatch(
        /resource\s+"aws_cloudwatch_event_target"\s+"lambda_target_eu_west_1"/
      );
      expect(s).toMatch(
        /resource\s+"aws_lambda_permission"\s+"allow_events_eu_west_1"/
      );
    });
  });

  describe('IAM policies: MFA enforcement and tag-based', () => {
    test('MFA policy + group attachment', () => {
      const s = read();
      expect(s).toMatch(/resource\s+"aws_iam_policy"\s+"enforce_mfa"/);
      expect(s).toMatch(/resource\s+"aws_iam_group"\s+"mfa_required"/);
      expect(s).toMatch(
        /resource\s+"aws_iam_group_policy_attachment"\s+"mfa_required_attach"/
      );
    });

    test('Tag-based EC2 policy uses variable key/value', () => {
      const s = read();
      expect(s).toMatch(/resource\s+"aws_iam_policy"\s+"tag_based_ec2"/);
      expect(s).toMatch(/aws:PrincipalTag\/\$\{var\.designated_tag_key\}/);
      expect(s).toMatch(/=\s*var\.designated_tag_value/);
    });
  });

  describe('Secrets Manager in both regions', () => {
    test('secrets and versions per region', () => {
      const s = read();
      expect(s).toMatch(
        /resource\s+"aws_secretsmanager_secret"\s+"app_config_us_east_1"/
      );
      expect(s).toMatch(
        /resource\s+"aws_secretsmanager_secret_version"\s+"app_config_ver_us_east_1"/
      );
      expect(s).toMatch(
        /resource\s+"aws_secretsmanager_secret"\s+"app_config_eu_west_1"/
      );
      expect(s).toMatch(
        /resource\s+"aws_secretsmanager_secret_version"\s+"app_config_ver_eu_west_1"/
      );
    });
  });

  describe('Outputs present to aid verification', () => {
    test('expected outputs exist', () => {
      const s = read();
      expect(s).toMatch(/output\s+"s3_config_buckets"/);
      expect(s).toMatch(/output\s+"s3_data_buckets"/);
      expect(s).toMatch(/output\s+"config_rules"/);
      expect(s).toMatch(/output\s+"lambda_functions"/);
      expect(s).toMatch(/output\s+"iam_policies"/);
    });
  });
});
