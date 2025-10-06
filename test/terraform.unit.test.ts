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

  // --- Required infrastructure components checks ---

  test("contains terraform block with AWS provider", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/terraform\s*{[\s\S]*?required_providers[\s\S]*?aws[\s\S]*?}/);
  });

  test("declares aws provider with region us-east-1", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/provider\s+"aws"\s*{[\s\S]*?region\s*=\s*"us-east-1"/);
  });

  test("has default_tags with Environment = Production", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/default_tags[\s\S]*?Environment\s*=\s*"Production"/);
  });

  // --- Required variables checks ---

  test("declares required variables", () => {
    const content = fs.readFileSync(stackPath, "utf8");

    // Check for required variables
    expect(content).toMatch(/variable\s+"vpc_cidr"/);
    expect(content).toMatch(/variable\s+"acm_certificate_arn"/);
    expect(content).toMatch(/variable\s+"key_pair_name"/);
    expect(content).toMatch(/variable\s+"my_allowed_cidr"/);
    expect(content).toMatch(/variable\s+"rds_password"/);
  });

  // --- VPC and Networking checks ---

  test("declares VPC with correct CIDR", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_vpc"\s+"main"/);
    expect(content).toMatch(/cidr_block\s*=\s*var\.vpc_cidr/);
  });

  test("declares public and private subnets", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_subnet"\s+"public"/);
    expect(content).toMatch(/resource\s+"aws_subnet"\s+"private_primary"/);
    expect(content).toMatch(/resource\s+"aws_subnet"\s+"private_secondary"/);
  });

  // --- Security Groups checks ---

  test("declares security groups for ALB, web, and database", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_security_group"\s+"alb"/);
    expect(content).toMatch(/resource\s+"aws_security_group"\s+"web"/);
    expect(content).toMatch(/resource\s+"aws_security_group"\s+"db"/);
  });

  // --- EC2 and IAM checks ---

  test("declares EC2 instance with IAM role", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_instance"\s+"web"/);
    expect(content).toMatch(/resource\s+"aws_iam_role"\s+"ec2_s3_read"/);
    expect(content).toMatch(/resource\s+"aws_iam_instance_profile"/);
  });

  // --- Load Balancer checks ---

  test("declares Application Load Balancer components", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_lb"\s+"main"/);
    expect(content).toMatch(/resource\s+"aws_lb_target_group"/);
    expect(content).toMatch(/resource\s+"aws_lb_listener"\s+"https"/);
  });

  // --- RDS checks ---

  test("declares RDS PostgreSQL with Multi-AZ", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_db_instance"\s+"main"/);
    expect(content).toMatch(/engine\s*=\s*"postgres"/);
    expect(content).toMatch(/multi_az\s*=\s*true/);
    expect(content).toMatch(/resource\s+"aws_db_subnet_group"/);
  });

  // --- CloudWatch checks ---

  test("declares CloudWatch alarms", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"/);
  });

  // --- S3 bucket for ALB logs ---

  test("declares S3 bucket for ALB access logs", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"alb_logs"/);
    expect(content).toMatch(/resource\s+"aws_s3_bucket_policy"/);
  });

  // --- Outputs checks ---

  test("declares required outputs", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/output\s+"alb_dns_name"/);
    expect(content).toMatch(/output\s+"web_instance_public_ip"/);
    expect(content).toMatch(/output\s+"rds_endpoint_address"/);
    expect(content).toMatch(/output\s+"rds_endpoint_port"/);
  });

  // --- Security best practices checks ---

  test("database is not publicly accessible", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/publicly_accessible\s*=\s*false/);
  });

  test("database security group only allows web server access for inbound", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    const sgDbMatch = content.match(/resource\s+"aws_security_group"\s+"db"[\s\S]*?(?=resource\s+"|# ====)/);
    expect(sgDbMatch).toBeTruthy();
    if (sgDbMatch) {
      // Check that inbound rules only allow web server security group
      expect(sgDbMatch[0]).toMatch(/security_groups\s*=\s*\[aws_security_group\.web\.id\]/);
      // Ensure no inbound cidr_blocks allows 0.0.0.0/0 for database port
      const ingressMatch = sgDbMatch[0].match(/ingress\s*{[\s\S]*?}/);
      if (ingressMatch) {
        expect(ingressMatch[0]).not.toMatch(/cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/);
      }
    }
  });

  test("SSH access is restricted to allowed CIDR", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    const webSgMatch = content.match(/resource\s+"aws_security_group"\s+"web"[\s\S]*?(?=resource\s+"|# ====)/);
    expect(webSgMatch).toBeTruthy();
    if (webSgMatch) {
      expect(webSgMatch[0]).toMatch(/var\.my_allowed_cidr/);
    }
  });
});
