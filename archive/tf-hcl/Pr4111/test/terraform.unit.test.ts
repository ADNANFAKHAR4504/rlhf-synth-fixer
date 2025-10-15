// tests/unit/unit-tests.ts
// Simple presence + sanity checks for ../lib/tap_stack.tf
// No Terraform or CDKTF commands are executed.

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const PROVIDER_REL = "../lib/provider.tf";
const stackPath = path.resolve(__dirname, STACK_REL);
const providerPath = path.resolve(__dirname, PROVIDER_REL);

describe("Terraform multi-region infrastructure configuration", () => {
  test("tap_stack.tf exists", () => {
    const exists = fs.existsSync(stackPath);
    if (!exists) {
      console.error(`[unit] Expected stack at: ${stackPath}`);
    }
    expect(exists).toBe(true);
  });

  test("provider.tf exists", () => {
    const exists = fs.existsSync(providerPath);
    if (!exists) {
      console.error(`[unit] Expected provider config at: ${providerPath}`);
    }
    expect(exists).toBe(true);
  });

  test("provider.tf declares multi-region AWS providers", () => {
    const content = fs.readFileSync(providerPath, "utf8");
    expect(content).toMatch(/provider\s+"aws"\s*{[\s\S]*?alias\s*=\s*"us-east-1"/);
    expect(content).toMatch(/provider\s+"aws"\s*{[\s\S]*?alias\s*=\s*"us-west-2"/);
  });

  test("tap_stack.tf does NOT declare provider blocks", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).not.toMatch(/^\s*provider\s+"aws"\s*{/m);
  });

  test("tap_stack.tf does NOT declare terraform block", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).not.toMatch(/^\s*terraform\s*{/m);
  });

  test("declares VPC resources for us-east-1", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_vpc"\s+"vpc_us_east_1"/);
  });

  test("declares VPC resources for us-west-2", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_vpc"\s+"vpc_us_west_2"/);
  });

  test("declares EC2 instances in both regions", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_instance"\s+"ec2_1_us_east_1"/);
    expect(content).toMatch(/resource\s+"aws_instance"\s+"ec2_2_us_east_1"/);
    expect(content).toMatch(/resource\s+"aws_instance"\s+"ec2_1_us_west_2"/);
    expect(content).toMatch(/resource\s+"aws_instance"\s+"ec2_2_us_west_2"/);
  });

  test("declares RDS MySQL instances in both regions", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_db_instance"\s+"mysql_us_east_1"/);
    expect(content).toMatch(/resource\s+"aws_db_instance"\s+"mysql_us_west_2"/);
  });

  test("declares Application Load Balancers in both regions", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_lb"\s+"alb_us_east_1"/);
    expect(content).toMatch(/resource\s+"aws_lb"\s+"alb_us_west_2"/);
  });

  test("declares S3 buckets in both regions", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"bucket_us_east_1"/);
    expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"bucket_us_west_2"/);
  });

  test("declares SSM parameters for database credentials", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_ssm_parameter"\s+"db_username_us_east_1"/);
    expect(content).toMatch(/resource\s+"aws_ssm_parameter"\s+"db_password_us_east_1"/);
    expect(content).toMatch(/resource\s+"aws_ssm_parameter"\s+"db_username_us_west_2"/);
    expect(content).toMatch(/resource\s+"aws_ssm_parameter"\s+"db_password_us_west_2"/);
  });

  test("includes Environment=Production tags", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/Environment\s*=\s*"Production"/);
  });

  test("declares outputs for key resources", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/output\s+"vpc_id_us_east_1"/);
    expect(content).toMatch(/output\s+"vpc_id_us_west_2"/);
    expect(content).toMatch(/output\s+"alb_dns_us_east_1"/);
    expect(content).toMatch(/output\s+"alb_dns_us_west_2"/);
    expect(content).toMatch(/output\s+"rds_endpoint_us_east_1"/);
    expect(content).toMatch(/output\s+"rds_endpoint_us_west_2"/);
  });

  test("uses provider aliases for multi-region deployment", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/provider\s*=\s*aws\.us-east-1/);
    expect(content).toMatch(/provider\s*=\s*aws\.us-west-2/);
  });

  test("declares HTTPS listeners on port 443", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_lb_listener"\s+"https_listener_us_east_1"/);
    expect(content).toMatch(/resource\s+"aws_lb_listener"\s+"https_listener_us_west_2"/);
    expect(content).toMatch(/port\s*=\s*"443"/);
    expect(content).toMatch(/protocol\s*=\s*"HTTPS"/);
  });

  test("enables S3 bucket versioning", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_s3_bucket_versioning"/);
    expect(content).toMatch(/status\s*=\s*"Enabled"/);
  });

  test("enables S3 server-side encryption with AES256", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/);
    expect(content).toMatch(/sse_algorithm\s*=\s*"AES256"/);
  });

  test("blocks public access on S3 buckets", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_s3_bucket_public_access_block"/);
    expect(content).toMatch(/block_public_acls\s*=\s*true/);
    expect(content).toMatch(/block_public_policy\s*=\s*true/);
  });

  test("uses t3.micro instance type for EC2", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/instance_type\s*=\s*"t3\.micro"/);
  });

  test("uses db.t3.micro instance class for RDS", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/instance_class\s*=\s*"db\.t3\.micro"/);
  });
});
