// test/terraform.unit.test.ts
import fs from 'fs';
import path from 'path';

describe('tap_stack.tf static verification', () => {
  const tfPath = path.join(__dirname, '../lib/tap_stack.tf');
  const content = fs.readFileSync(tfPath, 'utf-8');

  const has = (regex: RegExp) => regex.test(content);

  it('exists and is a non-trivial config file', () => {
    expect(content.length).toBeGreaterThan(500);
  });


  it('defines VPC, subnets, and networking resources', () => {
    [
      /resource\s+"aws_vpc"/,
      /resource\s+"aws_subnet"/,
      /resource\s+"aws_internet_gateway"/,
      /resource\s+"aws_nat_gateway"/,
      /resource\s+"aws_route_table"/,
      /resource\s+"aws_route_table_association"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('defines IAM roles and policies that exist', () => {
    [
      /resource\s+"aws_iam_role"/,
      /resource\s+"aws_iam_instance_profile"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('creates S3 buckets that exist', () => {
    [
      /resource\s+"aws_s3_bucket"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('creates RDS instance if present', () => {
    [
      /resource\s+"aws_db_instance"/,
      /resource\s+"aws_db_subnet_group"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('creates CloudTrail if present', () => {
    expect(has(/resource\s+"aws_cloudtrail"/)).toBe(true);
  });

  it('declares outputs that exist', () => {
    const outputs = [
      'vpc_id',
      'rds_endpoint',
      's3_bucket_id',
      'cloudtrail_name',
      'autoscaling_group_name',
      'ami_id'
    ];
    outputs.forEach(o => {
      const regex = new RegExp(`output\\s+"${o}"`);
      expect(has(regex)).toBe(true);
    });
  });
});

