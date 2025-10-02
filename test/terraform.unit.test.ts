// test/tap_stack.unit.test.ts
import fs from "fs";
import path from "path";

describe("tap_stack.tf static verification", () => {
  const tfPath = path.join(__dirname, "../lib/tap_stack.tf");
  const content = fs.readFileSync(tfPath, "utf-8");

  const has = (regex: RegExp) => regex.test(content);

  it("exists and is a non-trivial config file", () => {
    expect(content.length).toBeGreaterThan(500);
  });

  it("declares required input variables", () => {
    [
      "region",
      "vpc_cidr",
      "public_subnet_cidrs",
      "private_subnet_cidrs",
      "db_username",
      "db_password",
      "instance_type"
    ].forEach(variable =>
      expect(has(new RegExp(`variable\\s+"${variable}"`))).toBe(true)
    );
  });

  it("defines locals for tags and networking", () => {
    ["common_tags", "azs", "name_prefix"].forEach(local =>
      expect(has(new RegExp(`${local}\\s*=`))).toBe(true)
    );
  });

  it("creates random resources for entropy", () => {
    [
      /resource\s+"random_string"/,
      /resource\s+"random_password"/,
      /resource\s+"random_id"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it("declares VPC, subnets, IGW, NATs, and route tables", () => {
    [
      /resource\s+"aws_vpc"/,
      /resource\s+"aws_subnet"\s+"public/,
      /resource\s+"aws_subnet"\s+"private/,
      /resource\s+"aws_internet_gateway"/,
      /resource\s+"aws_nat_gateway"/,
      /resource\s+"aws_eip"/,
      /resource\s+"aws_route_table"\s+"public/,
      /resource\s+"aws_route_table"\s+"private/,
      /resource\s+"aws_route_table_association"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it("creates security groups for EC2, RDS, and ALB", () => {
    [
      /resource\s+"aws_security_group"\s+"ec2/,
      /resource\s+"aws_security_group"\s+"rds/,
      /resource\s+"aws_security_group"\s+"alb/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it("defines IAM roles, policies, and attachments", () => {
    [
      /resource\s+"aws_iam_role"/,
      /resource\s+"aws_iam_policy"/,
      /resource\s+"aws_iam_role_policy_attachment"/,
      /resource\s+"aws_iam_instance_profile"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it("defines S3 buckets with security configs", () => {
    [
      /resource\s+"aws_s3_bucket"/,
      /resource\s+"aws_s3_bucket_versioning"/,
      /resource\s+"aws_s3_bucket_server_side_encryption_configuration"/,
      /resource\s+"aws_s3_bucket_public_access_block"/,
      /resource\s+"aws_s3_bucket_logging"/,
      /resource\s+"aws_s3_bucket_policy"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it("creates RDS resources", () => {
    [
      /resource\s+"aws_db_subnet_group"/,
      /resource\s+"aws_db_instance"/,
      /resource\s+"aws_ssm_parameter"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it("creates ALB, target group, and listener", () => {
    [
      /resource\s+"aws_lb"/,
      /resource\s+"aws_lb_target_group"/,
      /resource\s+"aws_lb_listener"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it("creates Launch Template, ASG, and scaling policies", () => {
    [
      /resource\s+"aws_launch_template"/,
      /resource\s+"aws_autoscaling_group"/,
      /resource\s+"aws_autoscaling_policy"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it("defines CloudWatch alarms", () => {
    [
      /resource\s+"aws_cloudwatch_metric_alarm"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it("creates CloudTrail with dependency on S3", () => {
    expect(has(/resource\s+"aws_cloudtrail"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket"\s+"cloudtrail/)).toBe(true);
  });

  it("creates DLM lifecycle manager resources", () => {
    [
      /resource\s+"aws_dlm_lifecycle_policy"/,
      /resource\s+"aws_iam_role"\s+"dlm/,
      /resource\s+"aws_iam_role_policy_attachment"\s+"dlm/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it("declares key outputs", () => {
    [
      "vpc_id",
      "rds_endpoint",
      "s3_bucket_name",
      "alb_dns_name",
      "autoscaling_group_name"
    ].forEach(output =>
      expect(has(new RegExp(`output\\s+"${output}"`))).toBe(true)
    );
  });
});

