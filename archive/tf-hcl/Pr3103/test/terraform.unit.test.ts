// test/terraform.unit.test.ts
import fs from 'fs';
import path from 'path';

describe('tap_stack.tf static verification', () => {
  const tfPath = path.join(__dirname, '../lib/tap_stack.tf');
  const content = fs.readFileSync(tfPath, 'utf-8');

  const has = (regex: RegExp) => regex.test(content);

  it('exists and is a non-trivial config file', () => {
    expect(content.length).toBeGreaterThan(100);
  });

  it('declares required input variables', () => {
    [
      'region',
      'vpc_cidr',
      'availability_zones',
      'instance_type',
      'ssh_allowed_cidr',
      'domain_name',
      'rds_instance_class',
      'min_size',
      'max_size',
      'desired_capacity'
    ].forEach(variable =>
      expect(has(new RegExp(`variable\\s+"${variable}"`))).toBe(true)
    );
  });

  it('declares essential data sources', () => {
    expect(has(/data\s+"aws_ami"\s+"amazon_linux_2"/)).toBe(true);
  });

  it('defines locals for tags, suffix, and subnets', () => {
    ['name_prefix', 'common_tags', 'public_subnet_cidrs', 'private_subnet_cidrs', 'azs'].forEach(local =>
      expect(has(new RegExp(`${local}\\s*=`))).toBe(true)
    );
  });

  it('creates random username and password for RDS', () => {
    [/resource\s+"random_string"\s+"rds_username_suffix"/, /resource\s+"random_password"\s+"rds_password"/].forEach(rx =>
      expect(has(rx)).toBe(true)
    );
  });

  it('declares VPC, subnets, IGW, NAT, and route tables', () => {
    [
      /resource\s+"aws_vpc"\s+"main"/,
      /resource\s+"aws_subnet"\s+"public"/,
      /resource\s+"aws_subnet"\s+"private"/,
      /resource\s+"aws_internet_gateway"\s+"main"/,
      /resource\s+"aws_nat_gateway"\s+"main"/,
      /resource\s+"aws_route_table"\s+"public"/,
      /resource\s+"aws_route_table"\s+"private"/,
      /resource\s+"aws_route_table_association"\s+"public"/,
      /resource\s+"aws_route_table_association"\s+"private"/,
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('creates security groups for EC2, ALB, and RDS', () => {
    [
      /resource\s+"aws_security_group"\s+"ec2"/,
      /resource\s+"aws_security_group"\s+"alb"/,
      /resource\s+"aws_security_group"\s+"rds"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('defines IAM stack for EC2 and CloudTrail', () => {
    [
      /resource\s+"aws_iam_role"\s+"ec2"/,
      /resource\s+"aws_iam_role"\s+"cloudtrail"/,
      /resource\s+"aws_iam_instance_profile"\s+"ec2"/,
      /resource\s+"aws_iam_role_policy_attachment"\s+"ec2_ssm"/,
      /resource\s+"aws_iam_role_policy_attachment"\s+"ec2_cloudwatch"/,
      /resource\s+"aws_iam_role_policy"\s+"cloudtrail_cloudwatch"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('defines Launch Template, ALB, Target Group, Listener, and Auto Scaling Group', () => {
    [
      /resource\s+"aws_launch_template"\s+"app"/,
      /resource\s+"aws_lb"\s+"main"/,
      /resource\s+"aws_lb_target_group"\s+"main"/,
      /resource\s+"aws_lb_listener"\s+"main"/,
      /resource\s+"aws_autoscaling_group"\s+"main"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('defines RDS resources', () => {
    [
      /resource\s+"aws_db_subnet_group"\s+"main"/,
      /resource\s+"aws_db_instance"\s+"postgres"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('defines S3 buckets with versioning, encryption, pab, logging, and policies', () => {
    [
      /resource\s+"aws_s3_bucket"\s+"static"/,
      /resource\s+"aws_s3_bucket_versioning"\s+"static"/,
      /resource\s+"aws_s3_bucket_public_access_block"\s+"static"/,
      /resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"static"/,
      /resource\s+"aws_s3_bucket"\s+"cloudtrail"/,
      /resource\s+"aws_s3_bucket_policy"\s+"cloudtrail"/,
      /resource\s+"aws_s3_bucket_public_access_block"\s+"cloudtrail"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('defines CloudWatch Log Groups, Dashboard, and CloudTrail', () => {
    [
      /resource\s+"aws_cloudwatch_log_group"\s+"app"/,
      /resource\s+"aws_cloudwatch_log_group"\s+"cloudtrail"/,
      /resource\s+"aws_cloudwatch_log_stream"\s+"cloudtrail"/,
      /resource\s+"aws_cloudwatch_dashboard"\s+"main"/,
      /resource\s+"aws_cloudtrail"\s+"main"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('defines Route 53 zone, records, and health check', () => {
    [
      /resource\s+"aws_route53_zone"\s+"main"/,
      /resource\s+"aws_route53_record"\s+"www"/,
      /resource\s+"aws_route53_health_check"\s+"main"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('defines outputs for major resources', () => {
    [
      'vpc_id',
      'vpc_cidr',
      'public_subnet_ids',
      'private_subnet_ids',
      'internet_gateway_id',
      'nat_gateway_ids',
      'elastic_ip_addresses',
      'ec2_security_group_id',
      'alb_security_group_id',
      'rds_security_group_id',
      'ec2_iam_role_arn',
      'cloudtrail_iam_role_arn',
      'instance_profile_name',
      'launch_template_id',
      'autoscaling_group_name',
      'alb_dns_name',
      'alb_arn',
      'target_group_arn',
      'rds_endpoint',
      'rds_instance_id',
      'rds_database_name',
      'rds_username',
      'static_s3_bucket_name',
      'static_s3_bucket_arn',
      'cloudtrail_s3_bucket_name',
      'cloudtrail_name',
      'cloudtrail_arn',
      'cloudwatch_log_group_app',
      'cloudwatch_log_group_cloudtrail',
      'cloudwatch_dashboard_name',
      'route53_zone_id',
      'route53_name_servers',
      'route53_domain_name',
      'route53_www_record',
      'route53_health_check_id',
      'ami_id'
    ].forEach(output => expect(has(new RegExp(`output\\s+"${output}"`))).toBe(true));
  });
});
