// tests/unit/unit-tests.ts
// Simple presence + sanity checks for ../lib/tap_stack.tf
// No Terraform or CDKTF commands are executed.

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf"; // adjust if your structure differs
const stackPath = path.resolve(__dirname, STACK_REL);

describe("Terraform single-file stack: tap_stack.tf", () => {
  test("tap_stack.tf exists", () => {
    const exists = fs.existsSync(stackPath);
    if (!exists) {
      console.error(`[unit] Expected stack at: ${stackPath}`);
    }
    expect(exists).toBe(true);
  });

  // --- Optional sanity checks (keep lightweight) ---

  test("declares terraform and provider blocks in tap_stack.tf", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/terraform\s*{/);
    expect(content).toMatch(/provider\s+"aws"\s*{/);
  });

  test("declares multiple providers for us-east-1 and us-west-2", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/alias\s*=\s*"us_east_1"/);
    expect(content).toMatch(/alias\s*=\s*"us_west_2"/);
  });

  test("declares required variables (project_name, environment, owner, db_username, key_name)", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/variable\s+"project_name"\s*{/);
    expect(content).toMatch(/variable\s+"environment"\s*{/);
    expect(content).toMatch(/variable\s+"owner"\s*{/);
    expect(content).toMatch(/variable\s+"db_username"\s*{/);
    expect(content).toMatch(/variable\s+"key_name"\s*{/);
    // Note: db_password is now managed via random_password and Secrets Manager for security
  });

  test("declares VPCs for both regions", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_vpc"\s+"us_east_1"/);
    expect(content).toMatch(/resource\s+"aws_vpc"\s+"us_west_2"/);
  });

  test("declares public, private, and database subnets in both regions", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_subnet"\s+"public_us_east_1"/);
    expect(content).toMatch(/resource\s+"aws_subnet"\s+"private_us_east_1"/);
    expect(content).toMatch(/resource\s+"aws_subnet"\s+"database_us_east_1"/);
    expect(content).toMatch(/resource\s+"aws_subnet"\s+"public_us_west_2"/);
    expect(content).toMatch(/resource\s+"aws_subnet"\s+"private_us_west_2"/);
    expect(content).toMatch(/resource\s+"aws_subnet"\s+"database_us_west_2"/);
  });

  test("declares NAT gateways and Internet gateways for both regions", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_internet_gateway"\s+"us_east_1"/);
    expect(content).toMatch(/resource\s+"aws_internet_gateway"\s+"us_west_2"/);
    expect(content).toMatch(/resource\s+"aws_nat_gateway"\s+"us_east_1"/);
    expect(content).toMatch(/resource\s+"aws_nat_gateway"\s+"us_west_2"/);
  });

  test("declares KMS keys with encryption for both regions", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_kms_key"\s+"us_east_1"/);
    expect(content).toMatch(/resource\s+"aws_kms_key"\s+"us_west_2"/);
    expect(content).toMatch(/enable_key_rotation\s*=\s*true/);
  });

  test("declares RDS instances with encryption in both regions", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_db_instance"\s+"database_us_east_1"/);
    expect(content).toMatch(/resource\s+"aws_db_instance"\s+"database_us_west_2"/);
    expect(content).toMatch(/storage_encrypted\s*=\s*true/);
    expect(content).toMatch(/engine\s*=\s*"postgres"/);
  });

  test("implements AWS Secrets Manager for RDS password with random generation", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    // Check for random password resource
    expect(content).toMatch(/resource\s+"random_password"\s+"db_password"/);
    expect(content).toMatch(/length\s*=\s*16/);
    expect(content).toMatch(/special\s*=\s*true/);
    // Check for Secrets Manager secrets in both regions
    expect(content).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"db_password_us_east_1"/);
    expect(content).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"db_password_us_west_2"/);
    // Check for secret versions
    expect(content).toMatch(/resource\s+"aws_secretsmanager_secret_version"\s+"db_password_us_east_1"/);
    expect(content).toMatch(/resource\s+"aws_secretsmanager_secret_version"\s+"db_password_us_west_2"/);
    // Check RDS uses random password
    expect(content).toMatch(/password\s*=\s*random_password\.db_password\.result/);
  });

  test("declares ALB and Auto Scaling Groups in both regions", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_lb"\s+"app_us_east_1"/);
    expect(content).toMatch(/resource\s+"aws_lb"\s+"app_us_west_2"/);
    expect(content).toMatch(/resource\s+"aws_autoscaling_group"\s+"app_us_east_1"/);
    expect(content).toMatch(/resource\s+"aws_autoscaling_group"\s+"app_us_west_2"/);
  });

  test("declares bastion hosts in both regions", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_instance"\s+"bastion_us_east_1"/);
    expect(content).toMatch(/resource\s+"aws_instance"\s+"bastion_us_west_2"/);
  });

  test("declares security groups for ALB, app, database, and bastion", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_security_group"\s+"alb_us_east_1"/);
    expect(content).toMatch(/resource\s+"aws_security_group"\s+"app_us_east_1"/);
    expect(content).toMatch(/resource\s+"aws_security_group"\s+"database_us_east_1"/);
    expect(content).toMatch(/resource\s+"aws_security_group"\s+"bastion_us_east_1"/);
  });

  test("declares CloudTrail with S3 bucket for logging", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_cloudtrail"\s+"main"/);
    expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"cloudtrail_logs"/);
    expect(content).toMatch(/enable_logging\s*=\s*true/);
  });

  test("declares S3 bucket with encryption and lifecycle policies", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/);
    expect(content).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"/);
    expect(content).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
  });

  test("declares CloudWatch log groups and alarms", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_cloudwatch_log_group"/);
    expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"/);
  });

  test("declares CloudFront distribution", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_cloudfront_distribution"\s+"main"/);
    expect(content).toMatch(/viewer_protocol_policy\s*=\s*"redirect-to-https"/);
  });

  test("declares Route53 zone and health checks", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_route53_zone"\s+"main"/);
    expect(content).toMatch(/resource\s+"aws_route53_health_check"/);
  });

  test("declares IAM roles and policies with least privilege", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_iam_role"\s+"ec2_role"/);
    expect(content).toMatch(/resource\s+"aws_iam_instance_profile"/);
    expect(content).toMatch(/AmazonSSMManagedInstanceCore/);
  });

  test("declares launch templates with encrypted EBS volumes", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_launch_template"/);
    expect(content).toMatch(/encrypted\s*=\s*true/);
    expect(content).toMatch(/kms_key_id/);
  });

  test("includes proper tagging with Environment, Project, Owner", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/Environment\s*=\s*var\.environment/);
    expect(content).toMatch(/Project\s*=\s*var\.project_name/);
    expect(content).toMatch(/Owner\s*=\s*var\.owner/);
  });

  test("declares outputs for ALB DNS, CloudFront, Route53, and bastion IPs", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/output\s+"alb_dns_us_east_1"/);
    expect(content).toMatch(/output\s+"alb_dns_us_west_2"/);
    expect(content).toMatch(/output\s+"cloudfront_domain_name"/);
    expect(content).toMatch(/output\s+"bastion_ip_us_east_1"/);
  });

  test("enforces IMDSv2 for EC2 metadata", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/http_tokens\s*=\s*"required"/);
  });

  test("no hardcoded credentials or secrets", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).not.toMatch(/AKIA[0-9A-Z]{16}/); // AWS access key pattern
    expect(content).not.toMatch(/password\s*=\s*"[^"]*"/); // Direct password assignments (should use vars)
  });

});
