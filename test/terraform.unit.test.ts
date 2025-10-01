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
      'environment',
      'vpc_cidr',
      'ssh_allowed_cidr',
      'instance_type',
      'rds_instance_class',
      'rds_allocated_storage',
      'domain_name'
    ].forEach(variable =>
      expect(has(new RegExp(`variable\\s+"${variable}"`))).toBe(true)
    );
  });

  it('declares essential data sources', () => {
    [
      /data\s+"aws_availability_zones"\s+"available"/,
      /data\s+"aws_ami"\s+"amazon_linux_2"/,
      /data\s+"aws_caller_identity"\s+"current"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('defines locals for tags, prefix, AZs, and subnets', () => {
    ['name_prefix', 'common_tags', 'azs', 'public_subnet_cidrs', 'private_subnet_cidrs'].forEach(local =>
      expect(has(new RegExp(`${local}\\s*=`))).toBe(true)
    );
  });

  it('creates random username and password for RDS', () => {
    [
      /resource\s+"random_string"\s+"rds_username_suffix"/,
      /resource\s+"random_password"\s+"rds_password"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('declares VPC, subnets, IGW, NATs, and route tables', () => {
    [
      /resource\s+"aws_vpc"\s+"main"/,
      /resource\s+"aws_subnet"\s+"public"/,
      /resource\s+"aws_subnet"\s+"private"/,
      /resource\s+"aws_internet_gateway"\s+"main"/,
      /resource\s+"aws_nat_gateway"\s+"main"/,
      /resource\s+"aws_eip"\s+"nat"/,
      /resource\s+"aws_route_table"\s+"public"/,
      /resource\s+"aws_route_table"\s+"private"/,
      /resource\s+"aws_route_table_association"\s+"public"/,
      /resource\s+"aws_route_table_association"\s+"private"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('creates security groups for EC2, ALB, and RDS', () => {
    [
      /resource\s+"aws_security_group"\s+"ec2"/,
      /resource\s+"aws_security_group"\s+"alb"/,
      /resource\s+"aws_security_group"\s+"rds"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('defines IAM roles, policies, and instance profiles', () => {
    [
      /resource\s+"aws_iam_role"\s+"ec2_role"/,
      /resource\s+"aws_iam_instance_profile"\s+"ec2_profile"/,
      /resource\s+"aws_iam_role_policy"\s+"ec2_policy"/,
      /resource\s+"aws_iam_role"\s+"api_gateway_cloudwatch"/,
      /resource\s+"aws_iam_role_policy_attachment"\s+"api_gateway_cloudwatch"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });


  it('defines S3 bucket resources and configurations', () => {
    [
      /resource\s+"aws_s3_bucket"\s+"main"/,
      /resource\s+"aws_s3_bucket_versioning"\s+"main"/,
      /resource\s+"aws_s3_bucket_public_access_block"\s+"main"/,
      /resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"main"/,
      /resource\s+"aws_s3_bucket_policy"\s+"main"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('defines CloudFront distribution and OAI', () => {
    [
      /resource\s+"aws_cloudfront_origin_access_identity"\s+"main"/,
      /resource\s+"aws_cloudfront_distribution"\s+"main"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('defines API Gateway with integration and logging', () => {
    [
      /resource\s+"aws_api_gateway_rest_api"\s+"main"/,
      /resource\s+"aws_api_gateway_resource"\s+"main"/,
      /resource\s+"aws_api_gateway_method"\s+"main"/,
      /resource\s+"aws_api_gateway_integration"\s+"main"/,
      /resource\s+"aws_api_gateway_method_response"\s+"main"/,
      /resource\s+"aws_api_gateway_integration_response"\s+"main"/,
      /resource\s+"aws_api_gateway_deployment"\s+"main"/,
      /resource\s+"aws_api_gateway_stage"\s+"main"/,
      /resource\s+"aws_cloudwatch_log_group"\s+"api_gateway"/,
      /resource\s+"aws_api_gateway_account"\s+"main"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('defines ACM certificate and Route53 validation', () => {
    [
      /resource\s+"aws_acm_certificate"\s+"main"/,
      /resource\s+"aws_route53_zone"\s+"main"/,
      /resource\s+"aws_route53_record"\s+"cert_validation"/,
      /resource\s+"aws_acm_certificate_validation"\s+"main"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('declares outputs for all major resources', () => {
    const outputs = [
      'vpc_id','vpc_cidr','public_subnet_ids','private_subnet_ids','nat_gateway_ids','internet_gateway_id',
      'alb_dns_name','alb_zone_id','alb_arn','target_group_arn','autoscaling_group_name','autoscaling_group_arn',
      'launch_template_id','launch_template_latest_version','s3_bucket_name','s3_bucket_arn','s3_bucket_domain_name',
      'rds_endpoint','rds_instance_id','rds_instance_arn','rds_database_name','rds_username',
      'secrets_manager_secret_id','secrets_manager_secret_arn','cloudfront_distribution_id','cloudfront_domain_name',
      'cloudfront_distribution_arn','api_gateway_id','api_gateway_invoke_url','api_gateway_execution_arn',
      'iam_ec2_role_arn','iam_ec2_instance_profile_arn','iam_api_gateway_role_arn','security_group_alb_id',
      'security_group_ec2_id','security_group_rds_id','acm_certificate_arn','acm_certificate_domain',
      'cloudwatch_log_group_api_gateway','cloudwatch_log_group_api_gateway_arn','ami_id','ami_name',
      'availability_zones','db_subnet_group_name','elastic_ip_allocation_ids','elastic_ip_public_ips'
    ];
    outputs.forEach(o => expect(has(new RegExp(`output\\s+"${o}"`))).toBe(true));
  });
});
