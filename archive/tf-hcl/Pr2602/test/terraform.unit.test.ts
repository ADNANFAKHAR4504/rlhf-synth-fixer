// tests/unit/unit-tests.ts
// Simple presence + sanity checks for ../lib/tap_stack.tf
// No Terraform or CDKTF commands are executed.

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const stackPath = path.resolve(__dirname, STACK_REL);

describe("Terraform stack: tap_stack.tf", () => {
  let content: string;
  beforeAll(() => {
    expect(fs.existsSync(stackPath)).toBe(true);
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares required variables", () => {
    [
      "aws_region",
      "environment",
      "project_name",
      "owner",
      "cost_center",
      "vpc_cidr",
      "allowed_ssh_cidrs",
      "db_username",
      "db_password"
    ].forEach(variable =>
      expect(content).toMatch(new RegExp(`variable\\s+"${variable}"\\s*{`))
    );
  });

  test("declares required data sources", () => {
    [
      'aws_availability_zones',
      'aws_ami',
      'aws_caller_identity',
      'aws_region',
      'aws_guardduty_detector'
    ].forEach(ds =>
      expect(content).toMatch(new RegExp(`data\\s+"${ds}"\\s+`))
    );
  });

  test("declares GuardDuty features using local.guardduty_detector_id", () => {
    [
      's3_protection',
      'eks_protection',
      'malware_protection'
    ].forEach(feature =>
      expect(content).toMatch(new RegExp(`resource\\s+"aws_guardduty_detector_feature"\\s+"${feature}"`))
    );
    expect(content).toMatch(/locals\s*{[^}]*guardduty_detector_id[^}]*}/s);
  });

  test("declares KMS key and alias", () => {
    expect(content).toMatch(/resource\s+"aws_kms_key"\s+"main"/);
    expect(content).toMatch(/resource\s+"aws_kms_alias"\s+"main"/);
  });

  test("declares VPC, subnets, IGW, NAT, route tables", () => {
    [
      'aws_vpc',
      'aws_subnet',
      'aws_internet_gateway',
      'aws_eip',
      'aws_nat_gateway',
      'aws_route_table',
      'aws_route_table_association'
    ].forEach(resource =>
      expect(content).toMatch(new RegExp(`resource\\s+"${resource}"\\s+`))
    );
  });

  test("declares security groups for alb, web, database", () => {
    [
      'alb',
      'web',
      'database'
    ].forEach(sg =>
      expect(content).toMatch(new RegExp(`resource\\s+"aws_security_group"\\s+"${sg}"`))
    );
  });

  test("declares IAM role, policy, profile for EC2", () => {
    [
      'aws_iam_role',
      'aws_iam_policy',
      'aws_iam_role_policy_attachment',
      'aws_iam_instance_profile'
    ].forEach(resource =>
      expect(content).toMatch(new RegExp(`resource\\s+"${resource}"\\s+`))
    );
  });

  test("declares S3 buckets and encryption for app_data and cloudtrail_logs", () => {
    [
      'aws_s3_bucket',
      'aws_s3_bucket_versioning',
      'aws_s3_bucket_server_side_encryption_configuration',
      'aws_s3_bucket_public_access_block'
    ].forEach(resource =>
      expect(content).toMatch(new RegExp(`resource\\s+"${resource}"\\s+`))
    );
    expect(content).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"cloudtrail_bucket_policy"/);
  });

  test("declares CloudTrail resource", () => {
    expect(content).toMatch(/resource\s+"aws_cloudtrail"\s+"main"/);
  });

  test("declares RDS subnet group and instance", () => {
    expect(content).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"/);
    expect(content).toMatch(/resource\s+"aws_db_instance"\s+"main"/);
  });

  test("declares CloudWatch log groups for httpd_access and httpd_error", () => {
    expect(content).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"httpd_access"/);
    expect(content).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"httpd_error"/);
  });

  test("declares EC2 launch template and autoscaling group", () => {
    expect(content).toMatch(/resource\s+"aws_launch_template"\s+"web"/);
    expect(content).toMatch(/resource\s+"aws_autoscaling_group"\s+"web"/);
  });

  test("declares ALB, target group, listener", () => {
    expect(content).toMatch(/resource\s+"aws_lb"\s+"main"/);
    expect(content).toMatch(/resource\s+"aws_lb_target_group"\s+"web"/);
    expect(content).toMatch(/resource\s+"aws_lb_listener"\s+"web"/);
  });

  test("declares WAF ACL and association", () => {
    expect(content).toMatch(/resource\s+"aws_wafv2_web_acl"\s+"main"/);
    expect(content).toMatch(/resource\s+"aws_wafv2_web_acl_association"\s+"main"/);
  });

  test("declares SNS topic for alarms", () => {
    expect(content).toMatch(/resource\s+"aws_sns_topic"\s+"alarms"/);
  });

  test("declares CloudWatch alarms for CPU, disk, memory, RDS, ELB, etc.", () => {
    [
      'high_cpu',
      'low_disk_space',
      'high_memory',
      'rds_backup_failure',
      'elb_5xx',
      'rds_cpu_utilization',
      'rds_storage_space',
      'elb_request_count',
      'high_network_in',
      'high_network_out',
      'instance_reboot',
      'instance_termination',
      'rds_reboot',
      'rds_termination',
      'elb_active_connection_count',
      'rds_read_latency',
      'rds_write_latency',
      'rds_deadlock_count',
      'rds_replica_lag'
    ].forEach(alarm =>
      expect(content).toMatch(new RegExp(`resource\\s+"aws_cloudwatch_metric_alarm"\\s+"${alarm}"`))
    );
  });
});
