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
    expect(tf.length).toBeGreaterThan(500);
    expect(tf).toMatch(/resource|variable|output/);
  });

  it('declares required input variables', () => {
    ['aws_region', 'allowed_cidr_blocks', 'vpc_cidr', 'instance_type']
      .forEach(variable =>
        expect(has(new RegExp(`variable\\s+"${variable}"`))).toBe(true)
      );
  });

  it('defines locals for tags, prefixes, and subnets', () => {
  [
    'common_tags',
    'name_prefix',
    'availability_zones',
    'public_subnets',
    'private_subnets'
  ].forEach(local =>
    expect(has(new RegExp(`${local}\\s*=`))).toBe(true)
  );
 });

  it('declares essential data sources', () => {
    [
      /data\s+"aws_ami"\s+"amazon_linux_2"/,
      /data\s+"aws_caller_identity"\s+"current"/,
      /data\s+"aws_region"\s+"current"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('declares VPC, subnets, IGW, NAT, and route tables', () => {
    [
      /resource\s+"aws_vpc"\s+"main"/,
      /resource\s+"aws_subnet"\s+"public"/,
      /resource\s+"aws_subnet"\s+"private"/,
      /resource\s+"aws_internet_gateway"\s+"main"/,
      /resource\s+"aws_eip"\s+"nat"/,
      /resource\s+"aws_nat_gateway"\s+"main"/,
      /resource\s+"aws_route_table"\s+"public"/,
      /resource\s+"aws_route_table"\s+"private"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('creates security groups for ALB and EC2', () => {
    [
      /resource\s+"aws_security_group"\s+"alb"/,
      /resource\s+"aws_security_group"\s+"ec2"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('defines IAM stack for EC2', () => {
    [
      /resource\s+"aws_iam_role"\s+"ec2_role"/,
      /resource\s+"aws_iam_role_policy"\s+"ec2_policy"/,
      /resource\s+"aws_iam_role_policy_attachment"\s+"ec2_ssm"/,
      /resource\s+"aws_iam_role_policy_attachment"\s+"ec2_cloudwatch"/,
      /resource\s+"aws_iam_instance_profile"\s+"ec2_profile"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('defines load balancer and listener', () => {
    [
      /resource\s+"aws_lb"\s+"main"/,
      /resource\s+"aws_lb_target_group"\s+"main"/,
      /resource\s+"aws_lb_listener"\s+"main"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('defines launch template and autoscaling group', () => {
    [
      /resource\s+"aws_launch_template"\s+"main"/,
      /resource\s+"aws_autoscaling_group"\s+"main"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('creates scaling policies and alarms with correct names', () => {
    [
      /resource\s+"aws_autoscaling_policy"\s+"scale_up"/,
      /resource\s+"aws_autoscaling_policy"\s+"scale_down"/,
      /resource\s+"aws_cloudwatch_metric_alarm"\s+"cpu_high"/,
      /resource\s+"aws_cloudwatch_metric_alarm"\s+"cpu_low"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('creates a standalone EC2 instance', () => {
    expect(has(/resource\s+"aws_instance"\s+"standalone"/)).toBe(true);
  });

  it('defines outputs for major resources', () => {
    [
      "vpc_id",
      "vpc_cidr_block",
      "public_subnet_ids",
      "private_subnet_ids",
      "internet_gateway_id",
      "nat_gateway_ids",
      "elastic_ip_addresses",
      "alb_security_group_id",
      "ec2_security_group_id",
      "ami_id",
      "ami_name",
      "standalone_instance_id",
      "standalone_instance_private_ip",
      "standalone_instance_arn",
      "launch_template_id",
      "launch_template_latest_version",
      "autoscaling_group_name",
      "target_group_arn",
      "load_balancer_dns_name",
      "load_balancer_zone_id",
      "cloudfront_distribution_domain_name",
      "kms_key_arn",
      "logs_bucket_arn",
      "backup_vault_id",
      "dlm_lifecycle_policy_id",
      "cloudwatch_alarm_cpu_high_arn"
    ].forEach(output =>
      expect(has(new RegExp(`output\\s+"${output}"`))).toBe(true)
    );
  });

});
