// Integration tests executing terraform in ./lib
// Assumes provider/backend configured in provider.tf and environment.

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const libDir = path.resolve(__dirname, '..', 'lib');
const tf = (cmd: string) =>
  execSync(cmd, { cwd: libDir, stdio: 'pipe', encoding: 'utf8' });

describe('Terraform integration (validate/plan) for tap_stack.tf', () => {
  beforeAll(() => {
    // Provide required variables non-interactively via env
    process.env.TF_VAR_allowed_cidr =
      process.env.TF_VAR_allowed_cidr || '10.0.0.0/24';
    process.env.TF_VAR_vpc_id =
      process.env.TF_VAR_vpc_id || 'vpc-1234567890abcdef0';
    process.env.TF_VAR_subnet_id =
      process.env.TF_VAR_subnet_id || 'subnet-1234567890abcdef0';
    process.env.TF_VAR_s3_kms_key_arn =
      process.env.TF_VAR_s3_kms_key_arn ||
      'arn:aws:kms:us-west-2:111122223333:key/00000000-0000-0000-0000-000000000000';
    process.env.TF_VAR_data_bucket_name =
      process.env.TF_VAR_data_bucket_name || 'tap-stack-data-bucket-inttest';
    process.env.TF_VAR_trail_bucket_name =
      process.env.TF_VAR_trail_bucket_name || 'tap-stack-trail-bucket-inttest';
    process.env.TF_VAR_instance_type =
      process.env.TF_VAR_instance_type || 't3.micro';
    process.env.TF_VAR_instance_ami = process.env.TF_VAR_instance_ami || '';

    // Ensure region is us-west-2 as required by region_guard
    process.env.TF_VAR_aws_region =
      process.env.TF_VAR_aws_region || 'us-west-2';
  });

  test('terraform init succeeds (non-interactive)', () => {
    const out = tf('terraform init -reconfigure -lock=false');
    expect(out).toMatch(
      /Terraform has been successfully initialized|Initializing the backend/
    );
  });

  test('terraform validate succeeds', () => {
    const out = tf('terraform validate');
    expect(out).toMatch(/Success!/);
  });

  test('terraform plan runs without syntax errors', () => {
    const out = tf(
      'terraform plan -input=false -lock=false -no-color -refresh=false'
    );
    expect(out).toMatch(
      /Plan:\s+\d+ to add|No changes. Infrastructure is up-to-date./
    );
    fs.writeFileSync(path.join(libDir, 'plan.txt'), out, 'utf8');
    expect(fs.existsSync(path.join(libDir, 'plan.txt'))).toBe(true);
  });
});
