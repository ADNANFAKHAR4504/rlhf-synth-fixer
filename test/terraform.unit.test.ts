// tests/unit/unit-tests.ts
// Comprehensive tests for multi-region infrastructure in ../lib/tap_stack.tf
// No Terraform commands are executed.

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const stackPath = path.resolve(__dirname, STACK_REL);

const file = () => fs.readFileSync(stackPath, "utf8");
const has = (re: RegExp) => re.test(file());
const s = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

describe("Terraform Multi-Region Infrastructure: tap_stack.tf", () => {
  test("tap_stack.tf exists and has content", () => {
    const exists = fs.existsSync(stackPath);
    if (!exists) {
      console.error(`[unit] Expected stack at: ${stackPath}`);
    }
    expect(exists).toBe(true);
    expect(file().length).toBeGreaterThan(1000);
  });

  test("does NOT declare provider in tap_stack.tf (provider.tf owns providers)", () => {
    const content = file();
    expect(content).not.toMatch(/\bprovider\s+"aws"\s*{/);
  });

  test("declares aws_region variable", () => {
    expect(has(/variable\s+"aws_region"\s*{/)).toBe(true);
    expect(has(/default\s*=\s*"us-east-1"/)).toBe(true);
  });

  test("defines local values for app configuration", () => {
    expect(has(/locals\s*{/)).toBe(true);
    expect(has(/app_name\s*=\s*"tapapp"/)).toBe(true);
    expect(has(/regions\s*=\s*{/)).toBe(true);
    expect(has(/primary\s*=\s*"us-east-1"/)).toBe(true);
    expect(has(/secondary\s*=\s*"us-west-2"/)).toBe(true);
  });

  test("defines AMI mapping for different regions", () => {
    expect(has(/ami_map\s*=\s*{/)).toBe(true);
    expect(has(/"us-east-1"\s*=\s*"ami-/)).toBe(true);
    expect(has(/"us-west-2"\s*=\s*"ami-/)).toBe(true);
  });

  test("creates VPCs for both regions", () => {
    expect(has(/resource\s+"aws_vpc"\s+"primary"/)).toBe(true);
    expect(has(/resource\s+"aws_vpc"\s+"secondary"/)).toBe(true);
    expect(has(/cidr_block\s*=\s*"10\.0\.0\.0\/16"/)).toBe(true);
    expect(has(/cidr_block\s*=\s*"10\.1\.0\.0\/16"/)).toBe(true);
    expect(has(/enable_dns_hostnames\s*=\s*true/)).toBe(true);
    expect(has(/enable_dns_support\s*=\s*true/)).toBe(true);
  });

  test("creates internet gateways for both regions", () => {
    expect(has(/resource\s+"aws_internet_gateway"\s+"primary"/)).toBe(true);
    expect(has(/resource\s+"aws_internet_gateway"\s+"secondary"/)).toBe(true);
  });

  test("creates public subnets in both regions", () => {
    expect(has(/resource\s+"aws_subnet"\s+"primary_public"/)).toBe(true);
    expect(has(/resource\s+"aws_subnet"\s+"secondary_public"/)).toBe(true);
    expect(has(/count\s*=\s*2/)).toBe(true);
    expect(has(/map_public_ip_on_launch\s*=\s*true/)).toBe(true);
  });

  test("creates route tables for public subnets", () => {
    expect(has(/resource\s+"aws_route_table"\s+"primary_public"/)).toBe(true);
    expect(has(/resource\s+"aws_route_table"\s+"secondary_public"/)).toBe(true);
    expect(has(/cidr_block\s*=\s*"0\.0\.0\.0\/0"/)).toBe(true);
  });

  test("creates security groups for ALB and EC2 instances", () => {
    expect(has(/resource\s+"aws_security_group"\s+"primary_alb"/)).toBe(true);
    expect(has(/resource\s+"aws_security_group"\s+"secondary_alb"/)).toBe(true);
    expect(has(/resource\s+"aws_security_group"\s+"primary_ec2"/)).toBe(true);
    expect(has(/resource\s+"aws_security_group"\s+"secondary_ec2"/)).toBe(true);
  });

  test("ALB security groups allow HTTP and HTTPS traffic", () => {
    expect(has(/ingress[\s\S]*?from_port\s*=\s*80[\s\S]*?to_port\s*=\s*80[\s\S]*?protocol\s*=\s*"tcp"/)).toBe(true);
    expect(has(/ingress[\s\S]*?from_port\s*=\s*443[\s\S]*?to_port\s*=\s*443[\s\S]*?protocol\s*=\s*"tcp"/)).toBe(true);
  });

  test("EC2 security groups allow HTTP from ALB and SSH from VPC", () => {
    expect(has(/ingress[\s\S]*?from_port\s*=\s*80[\s\S]*?to_port\s*=\s*80[\s\S]*?security_groups/)).toBe(true);
    expect(has(/ingress[\s\S]*?from_port\s*=\s*22[\s\S]*?to_port\s*=\s*22[\s\S]*?cidr_blocks/)).toBe(true);
  });

  test("creates IAM role and instance profile for EC2", () => {
    expect(has(/resource\s+"aws_iam_role"\s+"ec2_role"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_instance_profile"\s+"ec2_profile"/)).toBe(true);
    expect(has(/assume_role_policy/)).toBe(true);
  });

  test("creates application load balancers for both regions", () => {
    expect(has(/resource\s+"aws_lb"\s+"primary"/)).toBe(true);
    expect(has(/resource\s+"aws_lb"\s+"secondary"/)).toBe(true);
    expect(has(/load_balancer_type\s*=\s*"application"/)).toBe(true);
    expect(has(/internal\s*=\s*false/)).toBe(true);
  });

  test("creates target groups for both regions", () => {
    expect(has(/resource\s+"aws_lb_target_group"\s+"primary"/)).toBe(true);
    expect(has(/resource\s+"aws_lb_target_group"\s+"secondary"/)).toBe(true);
    expect(has(/port\s*=\s*80/)).toBe(true);
    expect(has(/protocol\s*=\s*"HTTP"/)).toBe(true);
  });

  test("creates load balancer listeners", () => {
    expect(has(/resource\s+"aws_lb_listener"\s+"primary"/)).toBe(true);
    expect(has(/resource\s+"aws_lb_listener"\s+"secondary"/)).toBe(true);
    expect(has(/port\s*=\s*"80"/)).toBe(true);
    expect(has(/protocol\s*=\s*"HTTP"/)).toBe(true);
  });

  test("creates launch templates for both regions", () => {
    expect(has(/resource\s+"aws_launch_template"\s+"primary"/)).toBe(true);
    expect(has(/resource\s+"aws_launch_template"\s+"secondary"/)).toBe(true);
    expect(has(/instance_type\s*=\s*"t3\.micro"/)).toBe(true);
  });

  test("creates auto scaling groups for both regions", () => {
    expect(has(/resource\s+"aws_autoscaling_group"\s+"primary"/)).toBe(true);
    expect(has(/resource\s+"aws_autoscaling_group"\s+"secondary"/)).toBe(true);
    expect(has(/min_size\s*=\s*1/)).toBe(true);
    expect(has(/max_size\s*=\s*4/)).toBe(true);
    expect(has(/desired_capacity\s*=\s*2/)).toBe(true);
  });

  test("creates auto scaling policies for scale up and down", () => {
    expect(has(/resource\s+"aws_autoscaling_policy"\s+"primary_scale_up"/)).toBe(true);
    expect(has(/resource\s+"aws_autoscaling_policy"\s+"primary_scale_down"/)).toBe(true);
    expect(has(/resource\s+"aws_autoscaling_policy"\s+"secondary_scale_up"/)).toBe(true);
    expect(has(/resource\s+"aws_autoscaling_policy"\s+"secondary_scale_down"/)).toBe(true);
  });

  test("creates CloudWatch alarms for CPU monitoring", () => {
    expect(has(/resource\s+"aws_cloudwatch_metric_alarm"\s+"primary_cpu_high"/)).toBe(true);
    expect(has(/resource\s+"aws_cloudwatch_metric_alarm"\s+"primary_cpu_low"/)).toBe(true);
    expect(has(/resource\s+"aws_cloudwatch_metric_alarm"\s+"secondary_cpu_high"/)).toBe(true);
    expect(has(/resource\s+"aws_cloudwatch_metric_alarm"\s+"secondary_cpu_low"/)).toBe(true);
    expect(has(/metric_name\s*=\s*"CPUUtilization"/)).toBe(true);
  });

  test("declares required outputs", () => {
    const outputs = [
      'primary_alb_dns',
      'secondary_alb_dns', 
      'primary_vpc_id',
      'secondary_vpc_id',
      'application_urls'
    ];
    outputs.forEach(o => {
      expect(has(new RegExp(`output\\s+"${s(o)}"`))).toBe(true);
    });
  });

  test("does not contain hardcoded AWS credentials", () => {
    expect(has(/aws_access_key_id\s*=/)).toBe(false);
    expect(has(/aws_secret_access_key\s*=/)).toBe(false);
  });

  test("uses proper naming conventions with app name and region", () => {
    expect(has(/\$\{local\.app_name\}-\$\{local\.regions\.primary\}/)).toBe(true);
    expect(has(/\$\{local\.app_name\}-\$\{local\.regions\.secondary\}/)).toBe(true);
  });

  test("includes user data script for web server setup", () => {
    expect(has(/user_data_script\s*=\s*<<-EOF/)).toBe(true);
    expect(has(/yum install -y httpd/)).toBe(true);
    expect(has(/systemctl start httpd/)).toBe(true);
  });
});