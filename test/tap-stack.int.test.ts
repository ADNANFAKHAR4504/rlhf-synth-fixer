import fs from 'fs';
import path from 'path';

describe('TapStack Outputs', () => {
  let outputs: Record<string, any>;

  beforeAll(() => {
    const outputsPath = path.join(__dirname, '../cdktf.out/flat-outputs.json');
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
  });

  test('vpc_id should be a non-empty string', () => {
    expect(typeof outputs.vpc_id.value).toBe('string');
    expect(outputs.vpc_id.value).not.toHaveLength(0);
  });

  test('public_subnet_ids should be a non-empty array', () => {
    expect(Array.isArray(outputs.public_subnet_ids.value)).toBe(true);
    expect(outputs.public_subnet_ids.value.length).toBeGreaterThan(0);
  });

  test('private_subnet_ids should be a non-empty array', () => {
    expect(Array.isArray(outputs.private_subnet_ids.value)).toBe(true);
    expect(outputs.private_subnet_ids.value.length).toBeGreaterThan(0);
  });

  test('state_bucket_name should be a valid string', () => {
    expect(typeof outputs.state_bucket_name.value).toBe('string');
    expect(outputs.state_bucket_name.value).toMatch(/^[a-z0-9.-]+$/);
  });

  test('state_bucket_arn should start with arn:aws:s3:::', () => {
    expect(typeof outputs.state_bucket_arn.value).toBe('string');
    expect(outputs.state_bucket_arn.value).toMatch(/^arn:aws:s3:::/);
  });

  test('ec2_role_name should be a non-empty string', () => {
    expect(typeof outputs.ec2_role_name.value).toBe('string');
    expect(outputs.ec2_role_name.value).not.toHaveLength(0);
  });
});
