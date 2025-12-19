// tests/unit/unit-tests.ts
// Simple presence + sanity checks for ../lib/tap_stack.tf
// No Terraform or CDKTF commands are executed.

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/secure_infrastructure_setup.tf";
const stackPath = path.resolve(__dirname, STACK_REL);

describe("Terraform stack: secure_infrastructure_setup.tf", () => {
  let content: string;
  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("file exists", () => {
    expect(fs.existsSync(stackPath)).toBe(true);
  });

  test("declares AWS provider", () => {
    expect(content).toMatch(/\bprovider\s+"aws"\s*{/);
  });

  test("declares S3 backend", () => {
    expect(content).toMatch(/backend\s+"s3"\s*{/);
  });

  test("declares VPC resource", () => {
    expect(content).toMatch(/resource\s+"aws_vpc"\s+"main"\s*{/);
  });

  test("declares public subnet resource", () => {
    expect(content).toMatch(/resource\s+"aws_subnet"\s+"public"\s*{/);
  });

  test("declares private subnet resource", () => {
    expect(content).toMatch(/resource\s+"aws_subnet"\s+"private"\s*{/);
  });

  test("declares security group for web", () => {
    expect(content).toMatch(/resource\s+"aws_security_group"\s+"web"\s*{/);
  });

  test("declares security group for database", () => {
    expect(content).toMatch(/resource\s+"aws_security_group"\s+"database"\s*{/);
  });

  test("declares KMS key", () => {
    expect(content).toMatch(/resource\s+"aws_kms_key"\s+"main"\s*{/);
  });

  test("declares S3 bucket for main", () => {
    expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"main"\s*{/);
  });

  test("declares CloudTrail resource", () => {
    expect(content).toMatch(/resource\s+"aws_cloudtrail"\s+"main"\s*{/);
  });

  test("declares AWS Config delivery channel", () => {
    expect(content).toMatch(/resource\s+"aws_config_delivery_channel"\s+"main"\s*{/);
  });

  test("declares IAM password policy", () => {
    expect(content).toMatch(/resource\s+"aws_iam_account_password_policy"\s+"strict"\s*{/);
  });

  test("declares RDS instance", () => {
    expect(content).toMatch(/resource\s+"aws_db_instance"\s+"main"\s*{/);
  });

  test("declares EC2 launch template", () => {
    expect(content).toMatch(/resource\s+"aws_launch_template"\s+"web"\s*{/);
  });

  test("declares Application Load Balancer", () => {
    expect(content).toMatch(/resource\s+"aws_lb"\s+"main"\s*{/);
  });

  test("declares WAF Web ACL", () => {
    expect(content).toMatch(/resource\s+"aws_wafv2_web_acl"\s+"main"\s*{/);
  });

  test("declares Lambda function", () => {
    expect(content).toMatch(/resource\s+"aws_lambda_function"\s+"example"\s*{/);
  });

  test("declares output for vpc_id", () => {
    expect(content).toMatch(/output\s+"vpc_id"\s*{/);
  });

  test("declares output for load_balancer_dns", () => {
    expect(content).toMatch(/output\s+"load_balancer_dns"\s*{/);
  });

  test("declares output for s3_bucket_name", () => {
    expect(content).toMatch(/output\s+"s3_bucket_name"\s*{/);
  });

  test("declares output for rds_endpoint", () => {
    expect(content).toMatch(/output\s+"rds_endpoint"\s*{/);
  });

  test("declares output for cloudtrail_bucket_name", () => {
    expect(content).toMatch(/output\s+"cloudtrail_bucket_name"\s*{/);
  });

  test("declares output for config_bucket_name", () => {
    expect(content).toMatch(/output\s+"config_bucket_name"\s*{/);
  });

  test("declares output for web_acl_arn", () => {
    expect(content).toMatch(/output\s+"web_acl_arn"\s*{/);
  });
});
