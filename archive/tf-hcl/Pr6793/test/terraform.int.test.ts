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
    "terraform version is compatible",
    () => {
      const output = runTerraform("version");
      expect(output).toContain("Terraform");
      // Check for minimum version 1.0 or higher
      expect(output).toMatch(/v[1-9]\.\d+\.\d+/);
    },
    TIMEOUT
  );
});

describe("Terraform Configuration Validation", () => {
  test(
    "no deprecated syntax warnings",
    () => {
      const output = runTerraform("validate");
      expect(output).not.toContain("deprecated");
      expect(output).not.toContain("Warning");
    },
    TIMEOUT
  );

  test(
    "terraform configuration files exist",
    () => {
      expect(fs.existsSync(path.join(LIB_DIR, "main.tf"))).toBe(true);
      expect(fs.existsSync(path.join(LIB_DIR, "variables.tf"))).toBe(true);
      expect(fs.existsSync(path.join(LIB_DIR, "outputs.tf"))).toBe(true);
      expect(fs.existsSync(path.join(LIB_DIR, "backend.tf"))).toBe(true);
      expect(fs.existsSync(path.join(LIB_DIR, "provider.tf"))).toBe(true);
    },
    TIMEOUT
  );

  test(
    "documentation files exist",
    () => {
      expect(fs.existsSync(path.join(LIB_DIR, "README.md"))).toBe(true);
      expect(fs.existsSync(path.join(LIB_DIR, "state-migration.md"))).toBe(true);
      expect(fs.existsSync(path.join(LIB_DIR, "runbook.md"))).toBe(true);
      expect(fs.existsSync(path.join(LIB_DIR, "id-mapping.csv"))).toBe(true);
    },
    TIMEOUT
  );
});

describe("Resource Dependencies", () => {
  test(
    "main.tf contains required AWS resources",
    () => {
      const mainContent = fs.readFileSync(path.join(LIB_DIR, "main.tf"), "utf8");

      // Check for VPC resources
      expect(mainContent).toContain("resource \"aws_vpc\"");
      expect(mainContent).toContain("resource \"aws_subnet\"");
      expect(mainContent).toContain("resource \"aws_internet_gateway\"");
      expect(mainContent).toContain("resource \"aws_route_table\"");

      // Check for compute resources
      expect(mainContent).toContain("resource \"aws_lb\"");
      expect(mainContent).toContain("resource \"aws_lb_target_group\"");
      expect(mainContent).toContain("resource \"aws_autoscaling_group\"");
      expect(mainContent).toContain("resource \"aws_launch_template\"");

      // Check for database resources
      expect(mainContent).toContain("resource \"aws_db_instance\"");
      expect(mainContent).toContain("resource \"aws_db_subnet_group\"");

      // Check for security resources
      expect(mainContent).toContain("resource \"aws_security_group\"");
    },
    TIMEOUT
  );

  test(
    "variables.tf contains environment_suffix variable",
    () => {
      const variablesContent = fs.readFileSync(path.join(LIB_DIR, "variables.tf"), "utf8");
      expect(variablesContent).toContain("variable \"environment_suffix\"");
      expect(variablesContent).toContain("description");
      expect(variablesContent).toContain("type");
    },
    TIMEOUT
  );

  test(
    "outputs.tf contains necessary outputs",
    () => {
      const outputsContent = fs.readFileSync(path.join(LIB_DIR, "outputs.tf"), "utf8");
      expect(outputsContent).toContain("output \"vpc_id\"");
      expect(outputsContent).toContain("output \"alb_dns_name\"");
      expect(outputsContent).toContain("output \"db_instance_endpoint\"");
      expect(outputsContent).toContain("output \"asg_name\"");
    },
    TIMEOUT
  );
});