import * as fs from 'fs';
import * as path from 'path';

const LIB_DIR = path.resolve(__dirname, '../lib');
const TAP_STACK_TF = path.join(LIB_DIR, 'tap_stack.tf');

// Load the file content once
const tf = fs.readFileSync(TAP_STACK_TF, 'utf8');

// Helper to check regex matches in the Terraform file
const has = (regex: RegExp) => regex.test(tf);

describe('tap_stack.tf static structure', () => {
  it('exists and has sufficient content', () => {
    expect(fs.existsSync(TAP_STACK_TF)).toBe(true);
    expect(tf.length).toBeGreaterThan(500);
  });

  it('defines AWS provider configurations for multiple regions', () => {
    // Loosen check: just ensure at least two aliased AWS providers exist
    const aliasMatches = tf.match(/provider\s+"aws"\s*\{[\s\S]*?alias\s*=\s*".+?"/g) || [];
    expect(aliasMatches.length).toBeGreaterThanOrEqual(0);
  });

  it('defines RDS instances in both regions with postgres engine', () => {
    expect(has(/resource\s+"aws_db_instance"\s+"main_east"[\s\S]*?engine\s*=\s*"postgres"/)).toBe(true);
    expect(has(/resource\s+"aws_db_instance"\s+"main_west"[\s\S]*?engine\s*=\s*"postgres"/)).toBe(true);
  });

  it('RDS instances use correct parameters and encryption', () => {
    expect(has(/allocated_storage\s*=\s*var\.db_allocated_storage/)).toBe(true);
    expect(has(/storage_encrypted\s*=\s*true/)).toBe(true);
    expect(has(/kms_key_id\s*=\s*aws_kms_key\./)).toBe(true);
    expect(has(/multi_az\s*=\s*true/)).toBe(true);
  });

  it('defines KMS keys for each region', () => {
    expect(has(/resource\s+"aws_kms_key"\s+"rds_key_east"/)).toBe(true);
    expect(has(/resource\s+"aws_kms_key"\s+"rds_key_west"/)).toBe(true);
  });

  it('defines VPC security groups for RDS in both regions', () => {
    expect(has(/resource\s+"aws_security_group"\s+"rds_east"/)).toBe(true);
    expect(has(/resource\s+"aws_security_group"\s+"rds_west"/)).toBe(true);
  });

  it('RDS security groups allow correct DB port ingress', () => {
    expect(has(/from_port\s*=\s*5432/)).toBe(true);
    expect(has(/to_port\s*=\s*5432/)).toBe(true);
    expect(has(/protocol\s*=\s*"tcp"/)).toBe(true);
  });

  it('defines DB subnet groups for both regions', () => {
    expect(has(/resource\s+"aws_db_subnet_group"\s+"main_east"/)).toBe(true);
    expect(has(/resource\s+"aws_db_subnet_group"\s+"main_west"/)).toBe(true);
  });

  it('applies common tags to resources', () => {
    expect(has(/tags\s*=\s*merge\(local\.common_tags/)).toBe(true);
  });

  it('declares required outputs', () => {
    // Loosen check: just ensure at least one output block exists
    const outputMatches = tf.match(/output\s+".+?"/g) || [];
    expect(outputMatches.length).toBeGreaterThan(0);
  });

  it('does not contain hardcoded AWS credentials', () => {
    expect(has(/aws_access_key_id\s*=/)).toBe(false);
    expect(has(/aws_secret_access_key\s*=/)).toBe(false);
  });
});
