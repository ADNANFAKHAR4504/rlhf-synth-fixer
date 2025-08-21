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

  test("does NOT declare provider in tap_stack.tf (provider.tf owns providers)", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).not.toMatch(/\bprovider\s+"aws"\s*{/);
  });

  test("declares aws_region variable in tap_stack.tf", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/variable\s+"aws_region"\s*{/);
  });

  test("declares all required outputs", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/output\s+"alb_dns_name"/);
    expect(content).toMatch(/output\s+"rds_endpoint"/);
    expect(content).toMatch(/output\s+"s3_bucket_name"/);
    expect(content).toMatch(/output\s+"vpc_id"/);
    expect(content).toMatch(/output\s+"sns_topic_arn"/);
  });

  test("declares VPC resource", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_vpc"\s+"prod_vpc"/);
  });

  test("declares Application Load Balancer", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_lb"\s+"prod_alb"/);
  });

  test("declares RDS MySQL instance", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_db_instance"\s+"prod_mysql"/);
  });

  test("declares S3 bucket", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"prod_s3_bucket"/);
  });

  test("declares SNS topic", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_sns_topic"\s+"prod_alerts"/);
  });

  test("uses unique random IDs for IAM roles", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/random_id\.ec2_role_suffix/);
    expect(content).toMatch(/random_id\.s3_replication_role_suffix/);
    expect(content).toMatch(/random_id\.config_role_suffix/);
    expect(content).toMatch(/random_id\.lambda_role_suffix/);
  });

  test("declares availability zones as local variable", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/locals\s*{\s*availability_zones/);
  });

  test("declares CloudTrail resource", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_cloudtrail"\s+"prod_cloudtrail"/);
  });

  test("declares AWS Config resources", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_config_configuration_recorder"/);
    expect(content).toMatch(/resource\s+"aws_config_delivery_channel"/);
  });

  test("declares Auto Scaling Group", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_autoscaling_group"\s+"prod_asg"/);
  });

  test("declares Route53 Health Check", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_route53_health_check"\s+"prod_health_check"/);
  });

  test("declares Lambda function", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_lambda_function"\s+"prod_auto_response"/);
  });

  test("declares Systems Manager Parameter", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_ssm_parameter"\s+"prod_db_endpoint"/);
  });
});
