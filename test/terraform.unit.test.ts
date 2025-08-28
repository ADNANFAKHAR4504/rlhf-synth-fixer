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
    ['aws_region', 'allowed_cidr_blocks']
      .forEach(variable =>
        expect(has(new RegExp(`variable\\s+"${variable}"`))).toBe(true)
      );
  });

  it('defines locals for tags, prefixes, vpc cidrs, and subnets', () => {
    [
      'common_tags', 'name_prefix', 'vpc_cidr',
      'availability_zones', 'public_subnet_cidrs', 'private_subnet_cidrs'
    ].forEach(local =>
      expect(has(new RegExp(`${local}\\s*=`))).toBe(true)
    );
  });

  it('declares essential data sources for AMIs', () => {
    expect(has(/data\s+"aws_ami"\s+"amazon_linux"/)).toBe(true);
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
      /resource\s+"aws_iam_role_policy_attachment"\s+"ssm_managed_instance"/,
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

  it('creates scaling policies and alarms', () => {
    [
      /resource\s+"aws_autoscaling_policy"\s+"scale_up"/,
      /resource\s+"aws_autoscaling_policy"\s+"scale_down"/,
      /resource\s+"aws_cloudwatch_metric_alarm"\s+"high_cpu"/,
      /resource\s+"aws_cloudwatch_metric_alarm"\s+"low_cpu"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('creates a standalone EC2 instance', () => {
    expect(has(/resource\s+"aws_instance"\s+"standalone"/)).toBe(true);
  });

  it('defines outputs for major resources', () => {
    [
      "load_balancer_dns",
      "load_balancer_zone_id",
      "vpc_id",
      "vpc_cidr_block",
      "public_subnet_ids",
      "private_subnet_ids",
      "alb_security_group_id",
      "ec2_security_group_id",
      "ec2_iam_role_arn",
      "ec2_instance_profile_name",
      "amazon_linux_ami_id",
      "amazon_linux_ami_name",
      "autoscaling_group_name",
      "launch_template_id",
      "target_group_arn",
      "standalone_instance_id",
      "standalone_instance_public_ip",
      "standalone_instance_public_dns",
      "nat_gateway_ids",
      "elastic_ip_addresses",
      "internet_gateway_id",
      "public_route_table_id",
      "private_route_table_ids"
    ].forEach(output =>
      expect(has(new RegExp(`output\\s+"${output}"`))).toBe(true)
    );
  });

});
