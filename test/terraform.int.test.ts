// test/terraform.int.test.ts
// Integration tests for Terraform configuration
// Executes Terraform commands: init, validate, plan

import { execSync } from "child_process";
import path from "path";
import fs from "fs";

const LIB_DIR = path.resolve(__dirname, "../lib");
const TIMEOUT = 300000; // 5 minutes

// Helper function to execute terraform commands
function runTerraform(command: string): string {
  try {
    return execSync(`cd ${LIB_DIR} && terraform ${command}`, {
      encoding: "utf8",
      stdio: "pipe",
    });
  } catch (error: any) {
    throw new Error(`Terraform command failed: ${error.message}\n${error.stdout}\n${error.stderr}`);
  }
}

describe("Terraform Integration Tests", () => {
  beforeAll(() => {
    // Ensure we're in the correct directory
    expect(fs.existsSync(LIB_DIR)).toBe(true);
    expect(fs.existsSync(path.join(LIB_DIR, "main.tf"))).toBe(true);
  }, TIMEOUT);

  test(
    "terraform init succeeds",
    () => {
      const output = runTerraform("init -backend=false");
      expect(output).toContain("Terraform has been successfully initialized");
    },
    TIMEOUT
  );

  test(
    "terraform validate succeeds",
    () => {
      const output = runTerraform("validate");
      expect(output).toContain("Success");
      expect(output).toMatch(/The configuration is valid/i);
    },
    TIMEOUT
  );

  test(
    "terraform fmt check passes",
    () => {
      const output = runTerraform("fmt -check -recursive");
      // If output is empty, formatting is correct
      expect(output.trim()).toBe("");
    },
    TIMEOUT
  );

  test(
    "terraform plan succeeds with mock variables",
    () => {
      // Create a temporary tfvars file with mock values
      const mockVars = `
aws_region = "us-west-2"
environment_suffix = "test123"
project_name = "tmig"
db_password = "TestPassword123!"
key_pair_name = "test-key"
skip_final_snapshot = true
enable_deletion_protection = false
`;
      const tfvarsPath = path.join(LIB_DIR, "test.tfvars");
      fs.writeFileSync(tfvarsPath, mockVars);

      try {
        const output = runTerraform(`plan -var-file=test.tfvars -out=test.tfplan`);
        expect(output).toContain("Terraform will perform the following actions");

        // Clean up
        if (fs.existsSync(tfvarsPath)) fs.unlinkSync(tfvarsPath);
        const tfplanPath = path.join(LIB_DIR, "test.tfplan");
        if (fs.existsSync(tfplanPath)) fs.unlinkSync(tfplanPath);
      } catch (error) {
        // Clean up even on failure
        if (fs.existsSync(tfvarsPath)) fs.unlinkSync(tfvarsPath);
        const tfplanPath = path.join(LIB_DIR, "test.tfplan");
        if (fs.existsSync(tfplanPath)) fs.unlinkSync(tfplanPath);
        throw error;
      }
    },
    TIMEOUT
  );
});

describe("Terraform Configuration Validation", () => {
  test(
    "all required providers are available",
    () => {
      const output = runTerraform("providers");
      expect(output).toContain("hashicorp/aws");
    },
    TIMEOUT
  );

  test(
    "no deprecated syntax warnings",
    () => {
      const output = runTerraform("validate");
      expect(output).not.toContain("deprecated");
      expect(output).not.toContain("Warning");
    },
    TIMEOUT
  );
});

describe("Resource Dependencies", () => {
  test(
    "terraform graph generates without errors",
    () => {
      const output = runTerraform("graph");
      expect(output).toContain("digraph");
      expect(output).toContain("aws_vpc.main");
      expect(output).toContain("aws_lb.main");
      expect(output).toContain("aws_db_instance.main");
    },
    TIMEOUT
  );
});
