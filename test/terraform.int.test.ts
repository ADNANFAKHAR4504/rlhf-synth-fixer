// test/terraform.int.test.ts
import { execSync } from 'child_process';

describe('Terraform Infrastructure Integration Tests', () => {
  let tfOutputs: Record<string, any> = {};

  beforeAll(() => {
    // Get Terraform outputs as JSON
    const output = execSync('cd lib && terraform output -json', {
      encoding: 'utf-8',
    });
    tfOutputs = JSON.parse(output);
  });

  test('ALB DNS name should exist and be non-empty', () => {
    expect(tfOutputs).toHaveProperty('alb_dns_name');
    expect(tfOutputs.alb_dns_name.value).toMatch(/^.+$/); // Not empty
  });

  test('RDS endpoint should exist and look like a hostname', () => {
    expect(tfOutputs).toHaveProperty('rds_endpoint');
    expect(tfOutputs.rds_endpoint.value).toMatch(/^[a-z0-9.-]+$/);
  });

  test('S3 buckets should have been created', () => {
    expect(tfOutputs).toHaveProperty('app_data_bucket');
    expect(tfOutputs.app_data_bucket.value).toMatch(/^[a-z0-9-]+$/);
  });
});

