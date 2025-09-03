// tests/unit/unit-tests.ts
// Simple presence + sanity checks for ../lib/tap_stack.tf
// No Terraform or CDKTF commands are executed.

import fs from "fs";
import path from "path";

const LIB_DIR = path.resolve(__dirname, "../lib");

const tfFiles = [
  "cloudwatch.tf",
  "data.tf",
  "ec2.tf",
  "iam.tf",
  "kms.tf",
  "nat_gateways.tf",
  "outputs.tf",
  "provider.tf",
  "rds.tf",
  "route_tables.tf",
  "route53.tf",
  "security_groups.tf",
  "subnets.tf",
  "variables.tf",
  "vpc.tf",
];

describe("Terraform multi-file stack: /lib/*.tf", () => {
  test("All expected .tf files exist in /lib", () => {
    tfFiles.forEach((file) => {
      const filePath = path.join(LIB_DIR, file);
      const exists = fs.existsSync(filePath);
      if (!exists) {
        console.error(`[unit] Expected file missing: ${filePath}`);
      }
      expect(exists).toBe(true);
    });
  });

  test("provider.tf declares AWS provider only", () => {
    const providerPath = path.join(LIB_DIR, "provider.tf");
    const content = fs.readFileSync(providerPath, "utf8");
    expect(content).toMatch(/\bprovider\s+"aws"\s*{/);
    expect(content).not.toMatch(/\bprovider\s+"google"\s*{/);
  });

  test("variables.tf declares aws_region and rds_master_password as sensitive", () => {
    const variablesPath = path.join(LIB_DIR, "variables.tf");
    const content = fs.readFileSync(variablesPath, "utf8");
    expect(content).toMatch(/variable\s+"aws_region"\s*{/);
    expect(content).toMatch(/variable\s+"rds_master_password"\s*{[^}]*sensitive\s*=\s*true/);
  });

  test("cloudwatch.tf uses environment suffix in log group names", () => {
    const cloudwatchPath = path.join(LIB_DIR, "cloudwatch.tf");
    const content = fs.readFileSync(cloudwatchPath, "utf8");
    expect(content).toMatch(/name\s*=\s*["']\/aws\/ec2\/vpc1-\${var\.environment}["']/);
    expect(content).toMatch(/name\s*=\s*["']\/aws\/ec2\/vpc2-\${var\.environment}["']/);
  });

  test("iam.tf uses environment suffix in role and policy names", () => {
    const iamPath = path.join(LIB_DIR, "iam.tf");
    const content = fs.readFileSync(iamPath, "utf8");
    expect(content).toMatch(/name\s*=\s*["']ec2-s3-readonly-role-\${var\.environment}["']/);
    expect(content).toMatch(/name\s*=\s*["']s3-readonly-policy-\${var\.environment}["']/);
    expect(content).toMatch(/name\s*=\s*["']cloudwatch-logs-policy-\${var\.environment}["']/);
  });

  test("kms.tf uses environment suffix in alias name", () => {
    const kmsPath = path.join(LIB_DIR, "kms.tf");
    const content = fs.readFileSync(kmsPath, "utf8");
    expect(content).toMatch(/name\s*=\s*["']alias\/rds-encryption-\${var\.environment}["']/);
  });

  test("rds.tf uses environment suffix in subnet group name", () => {
    const rdsPath = path.join(LIB_DIR, "rds.tf");
    const content = fs.readFileSync(rdsPath, "utf8");
    expect(content).toMatch(/name\s*=\s*["']rds-subnet-group-\${var\.environment}["']/);
  });

  test("No provider blocks in other .tf files except provider.tf", () => {
    tfFiles.filter(f => f !== "provider.tf").forEach(file => {
      const filePath = path.join(LIB_DIR, file);
      const content = fs.readFileSync(filePath, "utf8");
      expect(content).not.toMatch(/\bprovider\s+"/);
    });
  });

  test("ec2.tf declares EC2 instances for both VPCs", () => {
    const ec2Path = path.join(LIB_DIR, "ec2.tf");
    const content = fs.readFileSync(ec2Path, "utf8");
    expect(content).toMatch(/resource\s+"aws_instance"\s+"vpc1_ec2"/);
    expect(content).toMatch(/resource\s+"aws_instance"\s+"vpc2_ec2"/);
  });
});
