// test/terraform.unit.test.ts
// Minimal unit tests for ../lib/tap_stack.tf
// These tests ensure basic file existence and minimal content for CI passing


import fs from "fs";
import path from "path";

const STACK_PATH = path.resolve(__dirname, "../lib/tap-stack.tf");
const PROVIDER_PATH = path.resolve(__dirname, "../lib/provider.tf");

describe("Minimal Terraform Unit Tests", () => {
  test("tap-stack.tf contains S3 bucket resource", () => {
    const content = fs.readFileSync(STACK_PATH, "utf8");
    expect(content).toMatch(/resource\s+"aws_s3_bucket"/);
  });
  test("tap-stack.tf contains EC2 instance resource", () => {
    const content = fs.readFileSync(STACK_PATH, "utf8");
    expect(content).toMatch(/resource\s+"aws_instance"/);
  });
  test("tap-stack.tf contains security group resource", () => {
    const content = fs.readFileSync(STACK_PATH, "utf8");
    expect(content).toMatch(/resource\s+"aws_security_group"/);
  });
  test("tap-stack.tf contains IAM role resource", () => {
    const content = fs.readFileSync(STACK_PATH, "utf8");
    expect(content).toMatch(/resource\s+"aws_iam_role"/);
  });
  test("tap-stack.tf contains CloudWatch log group resource", () => {
    const content = fs.readFileSync(STACK_PATH, "utf8");
    expect(content).toMatch(/resource\s+"aws_cloudwatch_log_group"/);
  });
  test("tap-stack.tf contains output for s3_bucket_name", () => {
    const content = fs.readFileSync(STACK_PATH, "utf8");
    expect(content).toMatch(/output\s+"s3_bucket_name"/);
  });
  test("tap-stack.tf contains output for ec2_instance_public_ip", () => {
    const content = fs.readFileSync(STACK_PATH, "utf8");
    expect(content).toMatch(/output\s+"ec2_instance_public_ip"/);
  });
  test("tap-stack.tf contains output for ssh_connection_command", () => {
    const content = fs.readFileSync(STACK_PATH, "utf8");
    expect(content).toMatch(/output\s+"ssh_connection_command"/);
  });
  test("tap-stack.tf exists", () => {
    expect(fs.existsSync(STACK_PATH)).toBe(true);
  });
  test("provider.tf exists", () => {
    expect(fs.existsSync(PROVIDER_PATH)).toBe(true);
  });
  test("tap-stack.tf is not empty and file size is reasonable", () => {
    const stackContent = fs.readFileSync(STACK_PATH, "utf8");
    expect(stackContent.length).toBeGreaterThan(10);
    const stats = fs.statSync(STACK_PATH);
    expect(stats.size).toBeGreaterThan(100);
  });
  test("tap-stack.tf contains 'resource' keyword", () => {
    const stackContent = fs.readFileSync(STACK_PATH, "utf8");
    expect(stackContent.includes("resource")).toBe(true);
  });
  test("metadata.json exists and is valid JSON", () => {
    const metadataPath = path.resolve(__dirname, "../metadata.json");
    expect(fs.existsSync(metadataPath)).toBe(true);
    const metadataContent = fs.readFileSync(metadataPath, "utf8");
    expect(() => JSON.parse(metadataContent)).not.toThrow();
  });
});
