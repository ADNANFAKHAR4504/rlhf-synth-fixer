/**
 * Integration Tests for tap_stack.tf
 *
 * This file validates the outputs of the root Terraform configuration.
 */

import { readFileSync } from 'fs';
import path from 'path';

interface TerraformOutput {
  sensitive: boolean;
  type: string | string[];
  value: any;
}

interface TerraformOutputs {
  [key: string]: TerraformOutput;
}

describe('tap_stack.tf Integration Tests', () => {
  let tf: TerraformOutputs;

  beforeAll(() => {
    // Use relative path so this works in CI/CD and locally
    let tfOutputPath =
      process.env.TF_OUTPUT_PATH ||
      path.resolve(process.cwd(), 'tf-output.json');
    if (!path.isAbsolute(tfOutputPath)) {
      tfOutputPath = path.resolve(process.cwd(), tfOutputPath);
    }
    const raw = readFileSync(tfOutputPath, 'utf8');
    tf = JSON.parse(raw);
  });

  it('should output a valid VPC ID', () => {
    expect(tf.vpc_id.value).toMatch(/^vpc-[a-z0-9]+$/);
  });

  it('should output a valid S3 data bucket name', () => {
    expect(tf.s3_data_bucket_name.value).toMatch(/^[a-z0-9.-]{3,63}$/);
  });
});

describe('Resource Verification Tests (tap_stack.tf)', () => {
  it.todo('should verify that the VPC exists');
  it.todo('should verify that the S3 data bucket exists');
});
