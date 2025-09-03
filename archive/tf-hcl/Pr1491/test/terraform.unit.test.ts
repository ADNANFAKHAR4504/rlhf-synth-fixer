// tests/unit/unit-tests.ts
// Simple presence + sanity checks for ../lib/tap_stack.tf
// No Terraform or CDKTF commands are executed.

import fs from 'fs';
import path from 'path';

const STACK_REL = '../lib/tap_stack.tf'; // adjust if your structure differs
const PROVIDER_REL = '../lib/provider.tf';
const VARS_REL = '../lib/vars.tf';
const stackPath = path.resolve(__dirname, STACK_REL);
const providerPath = path.resolve(__dirname, PROVIDER_REL);

describe('Terraform single-file stack: tap_stack.tf', () => {
  test('tap_stack.tf exists', () => {
    const exists = fs.existsSync(stackPath);
    if (!exists) {
      console.error(`[unit] Expected stack at: ${stackPath}`);
    }
    expect(exists).toBe(true);
  });

  // --- Optional sanity checks (keep lightweight) ---

  test('does NOT declare provider in tap_stack.tf (provider.tf owns providers)', () => {
    const content = fs.readFileSync(stackPath, 'utf8');
    expect(content).not.toMatch(/\bprovider\s+"aws"\s*{/);
  });

  test('declares aws_region variable in vars.tf (not in tap_stack.tf)', () => {
    const varsPath = path.resolve(__dirname, VARS_REL);
    const exists = fs.existsSync(varsPath);
    expect(exists).toBe(true);
    const content = fs.readFileSync(varsPath, 'utf8');
    expect(content).toMatch(/variable\s+"aws_region"\s*{/);
  });

  test('provider.tf exists and defines required providers', () => {
    const exists = fs.existsSync(providerPath);
    expect(exists).toBe(true);
    const content = fs.readFileSync(providerPath, 'utf8');
    expect(content).toMatch(
      /required_providers\s*{[\s\S]*aws\s*=\s*{[\s\S]*source\s*=\s*"hashicorp\/aws"/
    );
    expect(content).toMatch(
      /provider\s+"aws"\s*{[\s\S]*region\s*=\s*"us-west-1"/
    );
    expect(content).toMatch(
      /provider\s+"aws"\s*{[\s\S]*alias\s*=\s*"eu_central_1"[\s\S]*region\s*=\s*"eu-central-1"/
    );
  });

  test('declares create_vpcs and create_cloudtrail with secure defaults (false) in vars.tf', () => {
    const varsPath = path.resolve(__dirname, VARS_REL);
    const content = fs.readFileSync(varsPath, 'utf8');
    expect(content).toMatch(/variable\s+"create_vpcs"[\s\S]*?default\s*=\s*false/);
    expect(content).toMatch(/variable\s+"create_cloudtrail"[\s\S]*?default\s*=\s*false/);
  });

  test('declares sensitive db_password variable in vars.tf', () => {
    const varsPath = path.resolve(__dirname, VARS_REL);
    const content = fs.readFileSync(varsPath, 'utf8');
    expect(content).toMatch(/variable\s+"db_password"[\s\S]*?sensitive\s*=\s*true/);
  });

  test('network_xregion module is wired with allowed_cidr_blocks variable', () => {
    const content = fs.readFileSync(stackPath, 'utf8');
    expect(content).toMatch(/module\s+"network_xregion"\s*{[\s\S]*allowed_cidr_blocks\s*=\s*var\.allowed_cidr_blocks/);
  });

  test('S3 modules use KMS keys (module wiring)', () => {
    const content = fs.readFileSync(stackPath, 'utf8');
    expect(content).toMatch(/module\s+"s3_buckets"[\s\S]*primary_kms_key_arn\s*=\s*module\.kms_keys\.primary_key_arn/);
    expect(content).toMatch(/module\s+"s3_buckets"[\s\S]*secondary_kms_key_arn\s*=\s*module\.kms_keys\.secondary_key_arn/);
    expect(content).toMatch(/module\s+"s3_replication"[\s\S]*source_kms_key_arn\s*=\s*module\.kms_keys\.primary_key_arn/);
  });

  test('key modules are defined (KMS keys, S3, Data)', () => {
    const content = fs.readFileSync(stackPath, 'utf8');
    expect(content).toMatch(/module\s+"kms_keys"\s*{/);
    expect(content).toMatch(/module\s+"s3_buckets"\s*{/);
    expect(content).toMatch(/module\s+"data"\s*{/);
  });

  test('expected outputs are present', () => {
    const content = fs.readFileSync(stackPath, 'utf8');
    const outputs = [
      'primary_vpc_id',
      'secondary_vpc_id',
      'primary_s3_bucket_name',
      'secondary_s3_bucket_name',
      'logging_s3_bucket_name',
      'primary_kms_key_id',
      'secondary_kms_key_id',
      'dynamodb_table_name',
      'vpc_peering_connection_id',
    ];
    outputs.forEach(name => {
      expect(content).toMatch(new RegExp(`output\\s+"${name}"`));
    });
  });
});
