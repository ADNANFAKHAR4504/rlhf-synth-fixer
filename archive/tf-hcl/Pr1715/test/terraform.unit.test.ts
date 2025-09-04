// tests/unit/unit-tests.ts
// Unit tests for Terraform infrastructure code
// No Terraform or CDKTF commands are executed.

import fs from 'fs';
import path from 'path';

const STACK_REL = '../lib/tap_stack.tf'; // adjust if your structure differs
const stackPath = path.resolve(__dirname, STACK_REL);

describe('Terraform single-file stack: tap_stack.tf', () => {
  let content: string;

  beforeAll(() => {
    if (fs.existsSync(stackPath)) {
      content = fs.readFileSync(stackPath, 'utf8');
    }
  });

  test('tap_stack.tf exists', () => {
    const exists = fs.existsSync(stackPath);
    if (!exists) {
      console.error(`[unit] Expected stack at: ${stackPath}`);
    }
    expect(exists).toBe(true);
  });

  test('provider.tf exists', () => {
    const providerPath = path.resolve(__dirname, '../lib/provider.tf');
    expect(fs.existsSync(providerPath)).toBe(true);
  });

  // --- Variable declarations ---
  test('declares aws_region variable', () => {
    expect(content).toMatch(/variable\s+"aws_region"\s*{/);
  });

  test('declares environment_suffix variable', () => {
    expect(content).toMatch(/variable\s+"environment_suffix"\s*{/);
  });

  test('declares project_name variable', () => {
    expect(content).toMatch(/variable\s+"project_name"\s*{/);
  });

  test('declares environment variable', () => {
    expect(content).toMatch(/variable\s+"environment"\s*{/);
  });

  // --- Resource presence checks ---
  test('creates S3 bucket resource', () => {
    expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"project_files"/);
  });

  test('enables S3 versioning', () => {
    expect(content).toMatch(
      /resource\s+"aws_s3_bucket_versioning"\s+"project_files"/
    );
    expect(content).toMatch(/status\s*=\s*"Enabled"/);
  });

  test('configures S3 public access block', () => {
    expect(content).toMatch(
      /resource\s+"aws_s3_bucket_public_access_block"\s+"project_files"/
    );
    expect(content).toMatch(/block_public_acls\s*=\s*true/);
    expect(content).toMatch(/block_public_policy\s*=\s*true/);
  });

  test('enables S3 encryption', () => {
    expect(content).toMatch(
      /resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"project_files"/
    );
    expect(content).toMatch(/sse_algorithm\s*=\s*"AES256"/);
  });

  test('creates VPC resource', () => {
    expect(content).toMatch(/resource\s+"aws_vpc"\s+"main"/);
    expect(content).toMatch(/cidr_block\s*=\s*"10\.0\.0\.0\/16"/);
  });

  test('creates public subnets', () => {
    expect(content).toMatch(/resource\s+"aws_subnet"\s+"public"/);
    expect(content).toMatch(/map_public_ip_on_launch\s*=\s*true/);
  });

  test('creates private subnets for RDS', () => {
    expect(content).toMatch(/resource\s+"aws_subnet"\s+"private"/);
  });

  test('creates RDS PostgreSQL instance', () => {
    expect(content).toMatch(/resource\s+"aws_db_instance"\s+"postgres"/);
    expect(content).toMatch(/engine\s*=\s*"postgres"/);
  });

  test('configures RDS with Multi-AZ', () => {
    expect(content).toMatch(/multi_az\s*=\s*true/);
  });

  test('uses Graviton2 instance class for RDS', () => {
    expect(content).toMatch(/instance_class\s*=\s*"db\.t4g\.micro"/);
  });

  test('uses gp3 storage for RDS', () => {
    expect(content).toMatch(/storage_type\s*=\s*"gp3"/);
  });

  test('creates EC2 instance', () => {
    expect(content).toMatch(/resource\s+"aws_instance"\s+"dev"/);
    expect(content).toMatch(/instance_type\s*=\s*"t2\.micro"/);
  });

  test('creates security groups', () => {
    expect(content).toMatch(/resource\s+"aws_security_group"\s+"ec2"/);
    expect(content).toMatch(/resource\s+"aws_security_group"\s+"rds"/);
  });

  // --- Best practices checks ---
  test('S3 bucket has force_destroy for cleanup', () => {
    expect(content).toMatch(/force_destroy\s*=\s*true/);
  });

  test('RDS has deletion_protection disabled for cleanup', () => {
    expect(content).toMatch(/deletion_protection\s*=\s*false/);
  });

  test('RDS has skip_final_snapshot enabled', () => {
    expect(content).toMatch(/skip_final_snapshot\s*=\s*true/);
  });

  test('uses environment_suffix in resource names', () => {
    expect(content).toMatch(/\$\{var\.environment_suffix\}/);
  });

  // --- Output declarations ---
  test('declares required outputs', () => {
    expect(content).toMatch(/output\s+"s3_bucket_name"/);
    expect(content).toMatch(/output\s+"ec2_instance_id"/);
    expect(content).toMatch(/output\s+"ec2_public_ip"/);
    expect(content).toMatch(/output\s+"rds_endpoint"/);
    expect(content).toMatch(/output\s+"vpc_id"/);
  });

  test('marks sensitive outputs correctly', () => {
    expect(content).toMatch(
      /output\s+"private_key_pem"[\s\S]*?sensitive\s*=\s*true/
    );
  });

  test('does NOT declare provider in tap_stack.tf (provider.tf owns providers)', () => {
    expect(content).not.toMatch(/\bprovider\s+"aws"\s*{/);
  });
});
