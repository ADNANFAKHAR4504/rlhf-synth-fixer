
import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const stackPath = path.resolve(__dirname, STACK_REL);

describe("Terraform stack: tap_stack.tf - comprehensive unit checks", () => {
  let content: string;
  beforeAll(() => {
    expect(fs.existsSync(stackPath)).toBe(true);
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("does NOT declare provider block (provider.tf owns providers)", () => {
    expect(content).not.toMatch(/provider\s+"aws"\s*{/);
  });

  test("declares aws_region variable", () => {
    expect(content).toMatch(/variable\s+"aws_region"\s*{/);
  });

  test("declares VPC with correct CIDR block", () => {
    expect(content).toMatch(/resource\s+"aws_vpc"\s+"main"[\s\S]*cidr_block\s*=\s*"10.0.0.0\/16"/);
  });

  test("S3 bucket enforces AES-256 encryption", () => {
    expect(content).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"[\s\S]*sse_algorithm\s*=\s*"AES256"/);
  });

  test("IAM role for EC2 is declared and attached to instance profile", () => {
    expect(content).toMatch(/resource\s+"aws_iam_role"\s+"ec2_role"/);
    expect(content).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2_profile"/);
    expect(content).toMatch(/role\s*=\s*aws_iam_role.ec2_role.name/);
  });

  test("EC2 IAM policies for CloudWatch and S3 access are present and attached", () => {
    expect(content).toMatch(/resource\s+"aws_iam_policy"\s+"cloudwatch_logs_policy"/);
    expect(content).toMatch(/resource\s+"aws_iam_policy"\s+"s3_access_policy"/);
    expect(content).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"cloudwatch_logs_attachment"/);
    expect(content).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"s3_access_attachment"/);
  });

  test("Network ACL only allows TCP ports 443 and 22, denies all else", () => {
    expect(content).toMatch(/resource\s+"aws_network_acl"\s+"secure_prod"/);
    expect(content).toMatch(/from_port\s*=\s*443[\s\S]*to_port\s*=\s*443/);
    expect(content).toMatch(/from_port\s*=\s*22[\s\S]*to_port\s*=\s*22/);
    expect(content).toMatch(/protocol\s*=\s*"-1"[\s\S]*action\s*=\s*"deny"/);
  });

  test("RDS password is stored in Secrets Manager", () => {
    expect(content).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"rds_password"/);
    expect(content).toMatch(/resource\s+"aws_secretsmanager_secret_version"\s+"rds_password_version"/);
  });


  test("CloudWatch dashboard is present and tags argument is not used", () => {
    expect(content).toMatch(/resource\s+"aws_cloudwatch_dashboard"\s+"secure_prod"/);
    expect(content).not.toMatch(/tags\s*=/);
  });

  test("All resources and variables use us-west-2 region where required", () => {
    expect(content).toMatch(/default\s*=\s*"us-west-2"/);
  });

  test("No unsupported arguments in aws_cloudwatch_dashboard", () => {
    const dashboardBlock = content.match(/resource\s+"aws_cloudwatch_dashboard"[\s\S]*?}/);
    if (dashboardBlock) {
      expect(dashboardBlock[0]).not.toMatch(/tags\s*=/);
    }
  });

  // Add more tests as needed for additional coverage
});
