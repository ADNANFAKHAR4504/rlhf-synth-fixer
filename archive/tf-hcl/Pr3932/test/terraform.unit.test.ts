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

  test("declares terraform block with required providers", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/terraform\s*{/);
    expect(content).toMatch(/required_providers\s*{/);
    expect(content).toMatch(/aws\s*=\s*{/);
  });

  test("declares multi-region AWS providers (us-east-1 and us-west-2)", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/provider\s+"aws"\s*{[\s\S]*?region\s*=\s*"us-east-1"/);
    expect(content).toMatch(/provider\s+"aws"\s*{[\s\S]*?region\s*=\s*"us-west-2"/);
    expect(content).toMatch(/alias\s*=\s*"us_east_1"/);
    expect(content).toMatch(/alias\s*=\s*"us_west_2"/);
  });

  test("contains KMS keys for both regions", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_kms_key"\s+"us_east_1"/);
    expect(content).toMatch(/resource\s+"aws_kms_key"\s+"us_west_2"/);
  });

  test("contains VPCs in both regions", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_vpc"\s+"us_east_1"/);
    expect(content).toMatch(/resource\s+"aws_vpc"\s+"us_west_2"/);
  });

  test("contains subnets (public and private) in both regions", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_subnet"\s+"us_east_1_public_1"/);
    expect(content).toMatch(/resource\s+"aws_subnet"\s+"us_east_1_private_1"/);
    expect(content).toMatch(/resource\s+"aws_subnet"\s+"us_west_2_public_1"/);
    expect(content).toMatch(/resource\s+"aws_subnet"\s+"us_west_2_private_1"/);
  });

  test("contains NAT gateways for both regions", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_nat_gateway"\s+"us_east_1"/);
    expect(content).toMatch(/resource\s+"aws_nat_gateway"\s+"us_west_2"/);
  });

  test("contains Internet gateways for both regions", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_internet_gateway"\s+"us_east_1"/);
    expect(content).toMatch(/resource\s+"aws_internet_gateway"\s+"us_west_2"/);
  });

  test("contains S3 buckets with encryption", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"main_us_east_1"/);
    expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"main_us_west_2"/);
    expect(content).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/);
  });

  test("contains S3 bucket versioning", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_s3_bucket_versioning"/);
  });

  test("contains S3 cross-region replication", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_s3_bucket_replication_configuration"/);
    expect(content).toMatch(/resource\s+"aws_iam_role"\s+"replication"/);
  });

  test("contains IAM roles with least privilege (application, database, logging)", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_iam_role"\s+"application"/);
    expect(content).toMatch(/resource\s+"aws_iam_role"\s+"database"/);
    expect(content).toMatch(/resource\s+"aws_iam_role"\s+"logging"/);
  });

  test("contains VPC flow logs with CloudWatch", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_flow_log"/);
    expect(content).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"vpc_flow_logs/);
  });

  test("contains security groups with restricted access", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_security_group"\s+"web_us_east_1"/);
    expect(content).toMatch(/resource\s+"aws_security_group"\s+"database_us_east_1"/);
  });

  test("contains AWS Config for compliance", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_config_configuration_recorder"/);
    expect(content).toMatch(/resource\s+"aws_config_config_rule"/);
  });

  test("contains RDS instances with encryption", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_db_instance"\s+"us_east_1"/);
    expect(content).toMatch(/resource\s+"aws_db_instance"\s+"us_west_2"/);
    expect(content).toMatch(/storage_encrypted\s*=\s*true/);
  });

  test("contains Application Load Balancers", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_lb"\s+"us_east_1"/);
    expect(content).toMatch(/resource\s+"aws_lb"\s+"us_west_2"/);
  });

  test("contains ACM certificates for SSL/TLS", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_acm_certificate"/);
  });

  test("contains CloudTrail with multi-region logging", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_cloudtrail"\s+"main"/);
    expect(content).toMatch(/is_multi_region_trail\s*=\s*true/);
    expect(content).toMatch(/enable_log_file_validation\s*=\s*true/);
  });

  test("contains CloudWatch Log Groups with KMS encryption", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_cloudwatch_log_group"/);
    expect(content).toMatch(/kms_key_id\s*=\s*aws_kms_key/);
  });

  test("enforces SSL/TLS for S3 buckets", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/aws:SecureTransport/);
  });

});
