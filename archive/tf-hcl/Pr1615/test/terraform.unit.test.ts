// tests/unit/unit-tests.ts
// Simple presence + sanity checks for ../lib/main.tf
// No Terraform or CDKTF commands are executed.

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/main.tf"; // adjust if your structure differs
const stackPath = path.resolve(__dirname, STACK_REL);

describe("Terraform single-file stack: main.tf", () => {
  test("main.tf exists", () => {
    const exists = fs.existsSync(stackPath);
    if (!exists) {
      console.error(`[unit] Expected stack at: ${stackPath}`);
    }
    expect(exists).toBe(true);
  });

  // --- Optional sanity checks (keep lightweight) ---

  test("does NOT declare provider in main.tf (provider.tf owns providers)", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).not.toMatch(/\bprovider\s+"aws"\s*{/);
  });

  test("declares aws_region variable in main.tf", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/variable\s+"aws_region"\s*{/);
  });

  test("contains VPC resource definition", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_vpc"\s+"main"/);
  });

  test("contains security groups with appropriate configurations", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_security_group"/);
    
    // ALB can have 0.0.0.0/0 for HTTP/HTTPS, but app and database should not
    expect(content).toMatch(/resource\s+"aws_security_group"\s+"alb"/);
    expect(content).toMatch(/resource\s+"aws_security_group"\s+"app"/);
    expect(content).toMatch(/resource\s+"aws_security_group"\s+"database"/);
    
    // App security group should reference ALB security group, not 0.0.0.0/0
    expect(content).toMatch(/security_groups\s*=\s*\[aws_security_group\.alb\.id\]/);
    
    // Database should only allow access from app security group
    expect(content).toMatch(/security_groups\s*=\s*\[aws_security_group\.app\.id\]/);
  });

  test("uses encryption for storage resources", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/storage_encrypted\s*=\s*true/);
    expect(content).toMatch(/kms_master_key_id/);
  });

  test("includes consistent tagging", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/Environment/);
    expect(content).toMatch(/Project/);
    expect(content).toMatch(/ManagedBy.*terraform/);
  });

  test("outputs are defined for CI/CD integration", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/output\s+"aws_region"/);
    expect(content).toMatch(/output\s+"vpc_id"/);
    expect(content).toMatch(/output\s+"common_tags"/);
  });

});
