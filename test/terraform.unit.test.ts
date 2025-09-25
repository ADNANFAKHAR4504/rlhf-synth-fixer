import * as fs from 'fs';
import * as path from 'path';

const filePath = path.join(__dirname, '../lib/tap_stack.tf');
let tf: string;

beforeAll(() => {
  tf = fs.readFileSync(filePath, 'utf8');
});

function has(rx: RegExp): boolean {
  return rx.test(tf);
}

describe('tap_stack.tf static verification', () => {

  it('exists and is a non-trivial config file', () => {
    expect(tf).toBeDefined();
    expect(tf.length).toBeGreaterThan(1000);
    expect(tf).toMatch(/resource|variable|output/);
  });

  it('declares required input variables', () => {
    ['aws_region', 'environment', 'project_name']
      .forEach(variable =>
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

  it('defines locals for tags, azs, and subnets', () => {
    [
      'common_tags',
      'suffix',
      'azs',
      'public_subnet_cidrs',
      'private_subnet_cidrs'
    ].forEach(local =>
      expect(has(new RegExp(`${local}\\s*=`))).toBe(true)
    );
  });

  it('creates random username and password for RDS', () => {
    [
      /resource\s+"random_string"\s+"rds_username"/,
      /resource\s+"random_password"\s+"rds_password"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('declares VPC, subnets, IGW, NAT, and route tables', () => {
    [
      /resource\s+"aws_vpc"\s+"main_vpc"/,
      /resource\s+"aws_subnet"\s+"public_subnets"/,
      /resource\s+"aws_subnet"\s+"private_subnets"/,
      /resource\s+"aws_internet_gateway"\s+"main_igw"/,
      /resource\s+"aws_eip"\s+"nat_eips"/,
      /resource\s+"aws_nat_gateway"\s+"nat_gws"/,
      /resource\s+"aws_route_table"\s+"public_rt"/,
      /resource\s+"aws_route_table"\s+"private_rt"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('creates security groups for ALB, EC2, and RDS', () => {
    [
      /resource\s+"aws_security_group"\s+"alb_sg"/,
      /resource\s+"aws_security_group"\s+"ec2_sg"/,
      /resource\s+"aws_security_group"\s+"rds_sg"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('defines IAM stack for EC2', () => {
    [
      /resource\s+"aws_iam_role"\s+"ec2_role"/,
      /resource\s+"aws_iam_role_policy"\s+"ec2_policy"/,
      /resource\s+"aws_iam_instance_profile"\s+"ec2_profile"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('creates an S3 bucket with versioning, encryption, pab, and policy', () => {
    [
      /resource\s+"aws_s3_bucket"\s+"static_content"/,
      /resource\s+"aws_s3_bucket_versioning"\s+"static_content_versioning"/,
      /resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"static_content_encryption"/,
      /resource\s+"aws_s3_bucket_public_access_block"\s+"static_content_pab"/,
      /resource\s+"aws_s3_bucket_policy"\s+"static_content_policy"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('defines Secrets Manager for RDS credentials', () => {
    [
      /resource\s+"aws_secretsmanager_secret"\s+"rds_credentials"/,
      /resource\s+"aws_secretsmanager_secret_version"\s+"rds_credentials_version"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('defines RDS resources', () => {
    [
      /resource\s+"aws_db_subnet_group"\s+"rds_subnet_group"/,
      /resource\s+"aws_db_instance"\s+"main_rds"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('defines load balancer and listener', () => {
    [
      /resource\s+"aws_lb"\s+"main_alb"/,
      /resource\s+"aws_lb_target_group"\s+"main_tg"/,
      /resource\s+"aws_lb_listener"\s+"main_listener"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('defines launch template and autoscaling group', () => {
    [
      /resource\s+"aws_launch_template"\s+"app_lt"/,
      /resource\s+"aws_autoscaling_group"\s+"app_asg"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('creates scaling policies and alarms', () => {
    [
      /resource\s+"aws_autoscaling_policy"\s+"scale_up"/,
      /resource\s+"aws_autoscaling_policy"\s+"scale_down"/,
      /resource\s+"aws_cloudwatch_metric_alarm"\s+"high_cpu"/,
      /resource\s+"aws_cloudwatch_metric_alarm"\s+"low_cpu"/,
      /resource\s+"aws_cloudwatch_metric_alarm"\s+"rds_cpu"/,
      /resource\s+"aws_cloudwatch_metric_alarm"\s+"alb_unhealthy_hosts"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('defines Route 53 resources', () => {
    [
      /resource\s+"aws_route53_zone"\s+"main_zone"/,
      /resource\s+"aws_route53_health_check"\s+"alb_health"/,
      /resource\s+"aws_route53_record"\s+"www"/,
      /resource\s+"aws_route53_record"\s+"root"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('defines outputs for major resources', () => {
    [
      "vpc_id",
      "vpc_cidr",
      "public_subnet_ids",
      "private_subnet_ids",
      "internet_gateway_id",
      "nat_gateway_ids",
      "nat_gateway_public_ips",
      "alb_security_group_id",
      "ec2_security_group_id",
      "rds_security_group_id",
      "rds_endpoint",
      "rds_database_name",
      "rds_secrets_arn",
      "s3_bucket_name",
      "s3_bucket_arn",
      "alb_dns_name",
      "alb_arn",
      "alb_target_group_arn",
      "ec2_iam_role_arn",
      "ec2_instance_profile_arn",
      "route53_zone_id",
      "route53_name_servers",
      "route53_domain_name",
      "autoscaling_group_name",
      "launch_template_id",
      "ami_id",
      "ami_name",
      "cloudwatch_alarm_high_cpu",
      "cloudwatch_alarm_low_cpu",
      "cloudwatch_alarm_rds_cpu",
      "cloudwatch_alarm_alb_unhealthy"
    ].forEach(output =>
      expect(has(new RegExp(`output\\s+"${output}"`))).toBe(true)
    );
  });

});
