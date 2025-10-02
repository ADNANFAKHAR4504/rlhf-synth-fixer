// test/terraform.unit.test.ts
import fs from "fs";
import path from "path";

describe("tap_stack.tf static verification", () => {
  const tfPath = path.join(__dirname, "../lib/tap_stack.tf");
  const content = fs.readFileSync(tfPath, "utf-8");

  const has = (regex: RegExp) => regex.test(content);

  it("exists and is non-trivial", () => {
    expect(content.length).toBeGreaterThan(1000);
  });

  it("declares required input variables", () => {
    [
      "region",
      "vpc_cidr",
      "environment",
      "ssh_allowed_cidr",
      "key_pair_name"
    ].forEach(variable =>
      expect(has(new RegExp(`variable\\s+"${variable}"`))).toBe(true)
    );
  });

  it("declares essential data sources", () => {
    [
      /data\s+"aws_availability_zones"\s+"available"/,
      /data\s+"aws_ami"\s+"amazon_linux_2"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it("defines locals for tags, prefix, and subnet CIDRs", () => {
    [
      "common_tags",
      "prefix",
      "public_subnet_cidrs",
      "private_subnet_cidrs",
      "db_subnet_cidrs",
      "rds_allowed_special_chars"
    ].forEach(local =>
      expect(has(new RegExp(`${local}\\s*=`))).toBe(true)
    );
  });

  it("creates random resources for RDS and S3", () => {
    [
      /resource\s+"random_string"\s+"rds_username"/,
      /resource\s+"random_password"\s+"rds_password"/,
      /resource\s+"random_string"\s+"bucket_suffix"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it("declares VPC, subnets, IGW, NAT, and route tables", () => {
    [
      /resource\s+"aws_vpc"\s+"main"/,
      /resource\s+"aws_internet_gateway"\s+"main"/,
      /resource\s+"aws_subnet"\s+"public"/,
      /resource\s+"aws_subnet"\s+"private"/,
      /resource\s+"aws_subnet"\s+"database"/,
      /resource\s+"aws_eip"\s+"nat"/,
      /resource\s+"aws_nat_gateway"\s+"main"/,
      /resource\s+"aws_route_table"\s+"public"/,
      /resource\s+"aws_route_table"\s+"private"/,
      /resource\s+"aws_route_table_association"\s+"public"/,
      /resource\s+"aws_route_table_association"\s+"private"/,
      /resource\s+"aws_route_table_association"\s+"database"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it("creates security groups for ALB, Bastion, App, and RDS", () => {
    [
      /resource\s+"aws_security_group"\s+"alb"/,
      /resource\s+"aws_security_group"\s+"bastion"/,
      /resource\s+"aws_security_group"\s+"app"/,
      /resource\s+"aws_security_group"\s+"rds"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it("defines IAM roles, policies, and instance profiles", () => {
    [
      /resource\s+"aws_iam_role"\s+"ec2"/,
      /resource\s+"aws_iam_role_policy"\s+"ec2_s3_logs"/,
      /resource\s+"aws_iam_role_policy"\s+"ec2_cloudwatch"/,
      /resource\s+"aws_iam_instance_profile"\s+"ec2"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it("defines S3 logs bucket with encryption and access block", () => {
    [
      /resource\s+"aws_s3_bucket"\s+"logs"/,
      /resource\s+"aws_s3_bucket_versioning"\s+"logs"/,
      /resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"logs"/,
      /resource\s+"aws_s3_bucket_public_access_block"\s+"logs"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it("creates KMS key and alias", () => {
    [
      /resource\s+"aws_kms_key"\s+"main"/,
      /resource\s+"aws_kms_alias"\s+"main"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it("defines ALB, Target Group, and Listener", () => {
    [
      /resource\s+"aws_lb"\s+"main"/,
      /resource\s+"aws_lb_target_group"\s+"app"/,
      /resource\s+"aws_lb_listener"\s+"app"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it("defines Launch Template and AutoScaling Group", () => {
    [
      /resource\s+"aws_launch_template"\s+"app"/,
      /resource\s+"aws_autoscaling_group"\s+"app"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it("defines AutoScaling policies and CloudWatch alarms", () => {
    [
      /resource\s+"aws_autoscaling_policy"\s+"scale_up"/,
      /resource\s+"aws_autoscaling_policy"\s+"scale_down"/,
      /resource\s+"aws_cloudwatch_metric_alarm"\s+"cpu_high"/,
      /resource\s+"aws_cloudwatch_metric_alarm"\s+"cpu_low"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it("creates Bastion Host instance", () => {
    expect(has(/resource\s+"aws_instance"\s+"bastion"/)).toBe(true);
  });

  it("defines RDS subnet group and DB instance", () => {
    [
      /resource\s+"aws_db_subnet_group"\s+"main"/,
      /resource\s+"aws_db_instance"\s+"mysql"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it("declares outputs for all major resources", () => {
    const outputs = [
      "vpc_id","vpc_cidr","public_subnet_ids","private_subnet_ids","database_subnet_ids",
      "internet_gateway_id","nat_gateway_ids","alb_dns_name","alb_arn","target_group_arn",
      "bastion_public_ip","bastion_instance_id","rds_endpoint","rds_instance_id",
      "rds_database_name","rds_username","s3_logs_bucket_name","s3_logs_bucket_arn",
      "kms_key_id","kms_key_arn","iam_ec2_role_arn","iam_ec2_role_name",
      "iam_instance_profile_name","autoscaling_group_name","autoscaling_group_arn",
      "launch_template_id","launch_template_arn","cloudwatch_log_group_name",
      "security_group_alb_id","security_group_bastion_id","security_group_app_id","security_group_rds_id",
      "ami_id","availability_zones","route_table_public_id","route_table_private_ids",
      "elastic_ip_allocation_ids","db_subnet_group_name"
    ];
    outputs.forEach(output =>
      expect(has(new RegExp(`output\\s+"${output}"`))).toBe(true)
    );
  });
});

