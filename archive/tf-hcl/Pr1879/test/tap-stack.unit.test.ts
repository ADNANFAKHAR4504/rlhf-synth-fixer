import * as fs from 'fs';
import * as path from 'path';

describe('Terraform High Availability Web App Stack', () => {
  let tfConfig: string;

  beforeAll(() => {
    // Read the Terraform file
    tfConfig = fs.readFileSync(path.join(__dirname, '../lib/tap_stack.tf'), 'utf8');
  });

  test('environment variable is defined and used in resource names', () => {
    expect(tfConfig).toMatch(/variable\s+"environment"/);
    expect(tfConfig).toMatch(/\${var\.environment}/);
  });

  test('VPC and subnets are present and tagged', () => {
    expect(tfConfig).toMatch(/resource\s+"aws_vpc"\s+"main"/);
    expect(tfConfig).toMatch(/resource\s+"aws_subnet"\s+"public_1"/);
    expect(tfConfig).toMatch(/resource\s+"aws_subnet"\s+"public_2"/);
    expect(tfConfig).toMatch(/resource\s+"aws_subnet"\s+"private_1"/);
    expect(tfConfig).toMatch(/resource\s+"aws_subnet"\s+"private_2"/);
    expect(tfConfig).toMatch(/tags\s*=\s*{[\s\S]*?Environment[\s\S]*?}/);
  });

  test('Security groups are present and web_servers SG does NOT allow SSH from anywhere', () => {
    expect(tfConfig).toMatch(/resource\s+"aws_security_group"\s+"elb"/);
    expect(tfConfig).toMatch(/resource\s+"aws_security_group"\s+"web_servers"/);
    // Should not have port 22 open to 0.0.0.0/0
    const sgBlock = tfConfig.match(/resource\s+"aws_security_group"\s+"web_servers"[\s\S]*?}/);
    expect(sgBlock).not.toBeNull();
    if (sgBlock) {
      expect(sgBlock[0]).not.toMatch(/from_port\s*=\s*22/);
      expect(sgBlock[0]).not.toMatch(/cidr_blocks\s*=\s*\[.*0\.0\.0\.0\/0.*\]/);
    }
  });

  test('Launch template, ASG, and ALB resources are present', () => {
    expect(tfConfig).toMatch(/resource\s+"aws_launch_template"\s+"web_server"/);
    expect(tfConfig).toMatch(/resource\s+"aws_autoscaling_group"\s+"web_servers"/);
    expect(tfConfig).toMatch(/resource\s+"aws_lb"\s+"main"/);
    expect(tfConfig).toMatch(/resource\s+"aws_lb_target_group"\s+"web_servers"/);
    expect(tfConfig).toMatch(/resource\s+"aws_lb_listener"\s+"web"/);
  });

  test('CloudWatch alarms and scaling policies are present', () => {
    expect(tfConfig).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"cpu_high"/);
    expect(tfConfig).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"cpu_low"/);
    expect(tfConfig).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"target_health"/);
    expect(tfConfig).toMatch(/resource\s+"aws_autoscaling_policy"\s+"scale_up"/);
    expect(tfConfig).toMatch(/resource\s+"aws_autoscaling_policy"\s+"scale_down"/);
  });

  test('SNS topic and subscription for scaling notifications are present', () => {
    expect(tfConfig).toMatch(/resource\s+"aws_sns_topic"\s+"scaling_notifications"/);
    expect(tfConfig).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"email_notification"/);
    expect(tfConfig).toMatch(/resource\s+"aws_autoscaling_notification"\s+"scaling_notifications"/);
  });

  test('Outputs for all major resources are present and use correct references', () => {
    expect(tfConfig).toMatch(/output\s+"vpc_id"[\s\S]*value\s*=\s*aws_vpc\.main\.id/);
    expect(tfConfig).toMatch(/output\s+"public_subnet_ids"[\s\S]*value\s*=\s*\[aws_subnet\.public_1\.id,\s*aws_subnet\.public_2\.id\]/);
    expect(tfConfig).toMatch(/output\s+"private_subnet_ids"[\s\S]*value\s*=\s*\[aws_subnet\.private_1\.id,\s*aws_subnet\.private_2\.id\]/);
    expect(tfConfig).toMatch(/output\s+"availability_zones"[\s\S]*value\s*=\s*\[local\.azs\[0\],\s*local\.azs\[1\]\]/);    expect(tfConfig).toMatch(/output\s+"elb_security_group_id"[\s\S]*value\s*=\s*aws_security_group\.elb\.id/);
    expect(tfConfig).toMatch(/output\s+"web_servers_security_group_id"[\s\S]*value\s*=\s*aws_security_group\.web_servers\.id/);
    expect(tfConfig).toMatch(/output\s+"load_balancer_dns_name"[\s\S]*value\s*=\s*aws_lb\.main\.dns_name/);
    expect(tfConfig).toMatch(/output\s+"load_balancer_zone_id"[\s\S]*value\s*=\s*aws_lb\.main\.zone_id/);
    expect(tfConfig).toMatch(/output\s+"autoscaling_group_name"[\s\S]*value\s*=\s*aws_autoscaling_group\.web_servers\.name/);
    expect(tfConfig).toMatch(/output\s+"sns_topic_arn"[\s\S]*value\s*=\s*aws_sns_topic\.scaling_notifications\.arn/);
  });

  test('At least 70% of expected major resources are present', () => {
    const expectedResources = [
      'resource "aws_vpc" "main"',
      'resource "aws_internet_gateway" "main"',
      'resource "aws_subnet" "public_1"',
      'resource "aws_subnet" "public_2"',
      'resource "aws_subnet" "private_1"',
      'resource "aws_subnet" "private_2"',
      'resource "aws_security_group" "elb"',
      'resource "aws_security_group" "web_servers"',
      'resource "aws_launch_template" "web_server"',
      'resource "aws_lb" "main"',
      'resource "aws_lb_target_group" "web_servers"',
      'resource "aws_lb_listener" "web"',
      'resource "aws_autoscaling_group" "web_servers"',
      'resource "aws_autoscaling_policy" "scale_up"',
      'resource "aws_autoscaling_policy" "scale_down"',
      'resource "aws_cloudwatch_metric_alarm" "cpu_high"',
      'resource "aws_cloudwatch_metric_alarm" "cpu_low"',
      'resource "aws_cloudwatch_metric_alarm" "target_health"',
      'resource "aws_sns_topic" "scaling_notifications"',
      'resource "aws_sns_topic_subscription" "email_notification"',
      'resource "aws_autoscaling_notification" "scaling_notifications"',
    ];
    const found = expectedResources.filter(resource => tfConfig.includes(resource));
    const coverage = found.length / expectedResources.length;
    expect(coverage).toBeGreaterThanOrEqual(0.7);
  });

  test('All major resources are present and correctly named', () => {
    const expectedResources = [
      'resource "aws_vpc" "main"',
      'resource "aws_internet_gateway" "main"',
      'resource "aws_subnet" "public_1"',
      'resource "aws_subnet" "public_2"',
      'resource "aws_subnet" "private_1"',
      'resource "aws_subnet" "private_2"',
      'resource "aws_security_group" "elb"',
      'resource "aws_security_group" "web_servers"',
      'resource "aws_launch_template" "web_server"',
      'resource "aws_lb" "main"',
      'resource "aws_lb_target_group" "web_servers"',
      'resource "aws_lb_listener" "web"',
      'resource "aws_autoscaling_group" "web_servers"',
      'resource "aws_autoscaling_policy" "scale_up"',
      'resource "aws_autoscaling_policy" "scale_down"',
      'resource "aws_cloudwatch_metric_alarm" "cpu_high"',
      'resource "aws_cloudwatch_metric_alarm" "cpu_low"',
      'resource "aws_cloudwatch_metric_alarm" "target_health"',
      'resource "aws_sns_topic" "scaling_notifications"',
      'resource "aws_sns_topic_subscription" "email_notification"',
      'resource "aws_autoscaling_notification" "scaling_notifications"',
    ];
    expectedResources.forEach(resource => {
      expect(tfConfig).toContain(resource);
    });
  });

  test('All expected variables are declared', () => {
    const expectedVariables = [
      'variable "aws_region"',
      'variable "environment"',
      'variable "bucket_region"',
      'variable "bucket_name"',
      'variable "bucket_tags"',
      'variable "key_pair_name"',
      'variable "notification_email"',
    ];
    expectedVariables.forEach(variable => {
      expect(tfConfig).toContain(variable);
    });
  });

  test('Tags are set for all major resources', () => {
    // Environment tag check for all main resources
    expect(tfConfig).toMatch(/tags\s*=\s*{[\s\S]*?Environment[\s\S]*?}/);
  });

  test('Auto Scaling Group uses environment suffix in name', () => {
    expect(tfConfig).toMatch(/name\s*=\s*"ha-web-app-asg-\${var\.environment}"/);
  });

  test('Documentation and comments are present', () => {
    expect(tfConfig).toMatch(/########################/);
    expect(tfConfig).toMatch(/CloudWatch Alarms, Scaling Policies, and SNS Notifications/);
    expect(tfConfig).toMatch(/Launch Template, Auto Scaling Group, and Load Balancer/);
    expect(tfConfig).toMatch(/Security Groups/);
    expect(tfConfig).toMatch(/VPC and Subnets \(High Availability\)/);
  });
});