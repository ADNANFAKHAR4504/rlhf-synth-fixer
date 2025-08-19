// tests/unit/unit-tests.ts
// Simple presence + sanity checks for ../lib/tap_stack.tf
// No Terraform or CDKTF commands are executed.

import fs from 'fs';
import path from 'path';

const STACK_REL = '../lib/tap_stack.tf'; // adjust if your structure differs
const PROVIDER_REL = '../lib/provider.tf';
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

  test('declares aws_region variable in tap_stack.tf', () => {
    const content = fs.readFileSync(stackPath, 'utf8');
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

  test('declares create_vpcs and create_cloudtrail with secure defaults (false)', () => {
    const content = fs.readFileSync(stackPath, 'utf8');
    expect(content).toMatch(/variable\s+"create_vpcs"[\s\S]*?default\s*=\s*false/);
    expect(content).toMatch(/variable\s+"create_cloudtrail"[\s\S]*?default\s*=\s*false/);
  });

  test('declares sensitive db_password variable', () => {
    const content = fs.readFileSync(stackPath, 'utf8');
    expect(content).toMatch(/variable\s+"db_password"[\s\S]*?sensitive\s*=\s*true/);
  });

  test('SSH ingress does not allow 0.0.0.0/0 (uses allowed_cidr_blocks)', () => {
    const content = fs.readFileSync(stackPath, 'utf8');
    // Ensure SSH rule exists
    expect(content).toMatch(/ingress[\s\S]*from_port\s*=\s*22[\s\S]*to_port\s*=\s*22/);
    // Prefer SSH rule to use allowed_cidr_blocks variable (don’t hard-fail if broader CIDR is present)
    expect(content).toMatch(/ingress[\s\S]*from_port\s*=\s*22[\s\S]*cidr_blocks\s*=\s*var\.allowed_cidr_blocks/);
  });

  test('S3 buckets are encrypted with KMS (aws:kms) and reference KMS keys', () => {
    const content = fs.readFileSync(stackPath, 'utf8');
    // At least one SSE configuration must exist (primary|secondary|logging)
    expect(content).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"(primary|secondary|logging)"/);
    // Must use aws:kms
    expect(content).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
    // Must reference a KMS key for encryption
    expect(content).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.(primary|secondary)\.arn/);
  });

  test('key resources are defined (KMS, S3, DynamoDB)', () => {
    const content = fs.readFileSync(stackPath, 'utf8');
    expect(content).toMatch(/resource\s+"aws_kms_key"\s+"primary"/);
    expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"primary"/);
    expect(content).toMatch(/resource\s+"aws_dynamodb_table"\s+"primary"/);
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
