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

  it('declares AWS region variable', () => {
    expect(has(/variable\s+"aws_region"/)).toBe(true);
    expect(has(/default\s*=\s*"us-east-2"/)).toBe(true);
  });

  it('defines a VPC with correct CIDR and DNS support', () => {
    expect(has(/resource\s+"aws_vpc"\s+"main"/)).toBe(true);
    expect(has(/cidr_block\s*=\s*"10.0.0.0\/16"/)).toBe(true);
    expect(has(/enable_dns_support\s*=\s*true/)).toBe(true);
    expect(has(/enable_dns_hostnames\s*=\s*true/)).toBe(true);
  });

  it('creates public and private subnets in 2 AZs', () => {
    expect(has(/resource\s+"aws_subnet"\s+"public"/)).toBe(true);
    expect(has(/resource\s+"aws_subnet"\s+"private"/)).toBe(true);
    expect(has(/count\s*=\s*2/)).toBe(true);
  });

  it('creates Internet Gateway and NAT Gateway', () => {
    expect(has(/resource\s+"aws_internet_gateway"/)).toBe(true);
    expect(has(/resource\s+"aws_nat_gateway"/)).toBe(true);
  });

  it('associates public and private route tables correctly', () => {
    expect(has(/resource\s+"aws_route_table_association"\s+"public"/)).toBe(true);
    expect(has(/resource\s+"aws_route_table_association"\s+"private"/)).toBe(true);
  });

  it('defines security group for web servers', () => {
    expect(has(/resource\s+"aws_security_group"\s+"web"/)).toBe(true);
    expect(has(/from_port\s*=\s*80/)).toBe(true);
    expect(has(/from_port\s*=\s*443/)).toBe(true);
    expect(has(/from_port\s*=\s*22/)).toBe(true);
  });

  it('defines security group for RDS allowing correct DB port ingress', () => {
    expect(has(/resource\s+"aws_security_group"\s+"rds"/)).toBe(true);
    expect(has(/from_port\s*=\s*local\.db_config\[var\.db_engine\]\.port/)).toBe(true);
    expect(has(/to_port\s*=\s*local\.db_config\[var\.db_engine\]\.port/)).toBe(true);
    expect(has(/protocol\s*=\s*"tcp"/)).toBe(true);
  });

  it('defines IAM roles and instance profiles for EC2 and RDS', () => {
    expect(has(/resource\s+"aws_iam_role"\s+"ec2_role"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_instance_profile"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_role"\s+"rds_monitoring"/)).toBe(true);
  });

  it('creates an EC2 launch template and Auto Scaling Group', () => {
    expect(has(/resource\s+"aws_launch_template"/)).toBe(true);
    expect(has(/resource\s+"aws_autoscaling_group"/)).toBe(true);
    expect(has(/vpc_zone_identifier\s*=\s*aws_subnet\.public\[\*\]\.id/)).toBe(true);
  });

  it('defines RDS DB instance with correct engine and subnet group', () => {
    expect(has(/resource\s+"aws_db_instance"\s+"main"/)).toBe(true);
    expect(has(/engine\s*=\s*local\.db_config\[var\.db_engine\]\.engine/)).toBe(true);
    expect(has(/db_subnet_group_name\s*=\s*aws_db_subnet_group\.main\.name/)).toBe(true);
    expect(has(/storage_encrypted\s*=\s*true/)).toBe(true);
  });

  it('defines DB subnet group', () => {
    expect(has(/resource\s+"aws_db_subnet_group"/)).toBe(true);
    expect(has(/subnet_ids\s*=\s*aws_subnet\.private\[\*\]\.id/)).toBe(true);
  });

  it('creates S3 bucket for app data and CloudTrail logs with encryption and versioning', () => {
    expect(has(/resource\s+"aws_s3_bucket"\s+"app_data"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket"\s+"cloudtrail_logs"/)).toBe(true);
    expect(has(/aws_s3_bucket_versioning/)).toBe(true);
    expect(has(/aws_s3_bucket_server_side_encryption_configuration/)).toBe(true);
    expect(has(/aws_s3_bucket_public_access_block/)).toBe(true);
  });

  it('defines CloudTrail with logging enabled', () => {
    expect(has(/resource\s+"aws_cloudtrail"/)).toBe(true);
    expect(has(/enable_logging\s*=\s*true/)).toBe(true);
    expect(has(/s3_bucket_name\s*=\s*aws_s3_bucket\.cloudtrail_logs\.bucket/)).toBe(true);
  });

  it('applies common tags to all resources', () => {
    expect(has(/tags\s*=\s*merge\(local\.common_tags/)).toBe(true);
  });

  it('declares required outputs', () => {
    expect(has(/output\s+"vpc_id"/)).toBe(true);
    expect(has(/output\s+"public_subnet_ids"/)).toBe(true);
    expect(has(/output\s+"private_subnet_ids"/)).toBe(true);
    expect(has(/output\s+"autoscaling_group_name"/)).toBe(true);
    expect(has(/output\s+"rds_endpoint"/)).toBe(true);
    expect(has(/output\s+"app_data_bucket_name"/)).toBe(true);
    expect(has(/output\s+"cloudtrail_arn"/)).toBe(true);
  });

  it('does not contain hardcoded AWS credentials', () => {
    expect(has(/aws_access_key_id\s*=/)).toBe(false);
    expect(has(/aws_secret_access_key\s*=/)).toBe(false);
  });
});
