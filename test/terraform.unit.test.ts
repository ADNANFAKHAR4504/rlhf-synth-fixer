// Comprehensive unit tests for Terraform infrastructure
// Tests configuration files, variables, outputs, and module structure
// No Terraform commands are executed - pure static analysis

import fs from "fs";
import path from "path";

// File paths for testing
const stackPath = path.resolve(__dirname, "../lib/tap_stack.tf");
const providerPath = path.resolve(__dirname, "../lib/provider.tf");
const variablesPath = path.resolve(__dirname, "../lib/variables.tf");
const outputsPath = path.resolve(__dirname, "../lib/outputs.tf");
const moduleMainPath = path.resolve(__dirname, "../lib/modules/tap_stack/main.tf");
const moduleVariablesPath = path.resolve(__dirname, "../lib/modules/tap_stack/variables.tf");
const moduleOutputsPath = path.resolve(__dirname, "../lib/modules/tap_stack/outputs.tf");

describe("Terraform Infrastructure Unit Tests", () => {
  
  describe("Core Configuration Files", () => {
    test("tap_stack.tf exists and is readable", () => {
      expect(fs.existsSync(stackPath)).toBe(true);
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content.length).toBeGreaterThan(0);
    });

    test("provider.tf exists and is readable", () => {
      expect(fs.existsSync(providerPath)).toBe(true);
      const content = fs.readFileSync(providerPath, "utf8");
      expect(content.length).toBeGreaterThan(0);
    });

    test("variables.tf exists and is readable", () => {
      expect(fs.existsSync(variablesPath)).toBe(true);
      const content = fs.readFileSync(variablesPath, "utf8");
      expect(content.length).toBeGreaterThan(0);
    });

    test("outputs.tf exists and is readable", () => {
      expect(fs.existsSync(outputsPath)).toBe(true);
      const content = fs.readFileSync(outputsPath, "utf8");
      expect(content.length).toBeGreaterThan(0);
    });
  });

  describe("Provider Configuration", () => {
    test("provider.tf declares AWS provider", () => {
      const content = fs.readFileSync(providerPath, "utf8");
      expect(content).toMatch(/provider\s+"aws"\s*{/);
    });

    test("tap_stack.tf does NOT declare provider (separation of concerns)", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).not.toMatch(/\bprovider\s+"aws"\s*{/);
    });
  });

  describe("Variable Definitions", () => {
    test("declares aws_region variable", () => {
      const content = fs.readFileSync(variablesPath, "utf8");
      expect(content).toMatch(/variable\s+"aws_region"\s*{/);
    });

    test("declares environment variable with validation", () => {
      const content = fs.readFileSync(variablesPath, "utf8");
      expect(content).toMatch(/variable\s+"environment"\s*{/);
      expect(content).toMatch(/validation\s*{/);
    });

    test("declares environment_suffix variable for uniqueness", () => {
      const content = fs.readFileSync(variablesPath, "utf8");
      expect(content).toMatch(/variable\s+"environment_suffix"\s*{/);
    });

    test("declares project_name variable", () => {
      const content = fs.readFileSync(variablesPath, "utf8");
      expect(content).toMatch(/variable\s+"project_name"\s*{/);
    });
  });

  describe("Main Stack Configuration", () => {
    test("tap_stack.tf uses tap_stack module", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/module\s+"tap_stack"\s*{/);
      expect(content).toMatch(/source\s*=\s*"\.\/modules\/tap_stack"/);
    });

    test("includes randomization for unique naming", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/resource\s+"random_string"/);
    });

    test("includes rollback and validation logic", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/resource\s+"null_resource"\s+"deployment_validator"/);
    });

    test("uses environment_suffix in name_prefix calculation", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/final_suffix/);
      expect(content).toMatch(/environment_suffix/);
    });
  });

  describe("Module Structure", () => {
    test("tap_stack module main.tf exists", () => {
      expect(fs.existsSync(moduleMainPath)).toBe(true);
    });

    test("tap_stack module variables.tf exists", () => {
      expect(fs.existsSync(moduleVariablesPath)).toBe(true);
    });

    test("tap_stack module outputs.tf exists", () => {
      expect(fs.existsSync(moduleOutputsPath)).toBe(true);
    });

    test("module variables include environment_suffix", () => {
      const content = fs.readFileSync(moduleVariablesPath, "utf8");
      expect(content).toMatch(/variable\s+"environment_suffix"/);
    });

    test("module uses unique naming with environment_suffix", () => {
      const content = fs.readFileSync(moduleMainPath, "utf8");
      expect(content).toMatch(/environment_suffix/);
      expect(content).toMatch(/name_prefix/);
    });
  });

  describe("Security and Best Practices", () => {
    test("uses Secrets Manager for sensitive data", () => {
      const content = fs.readFileSync(moduleMainPath, "utf8");
      expect(content).toMatch(/aws_secretsmanager_secret/);
    });

    test("includes proper tagging strategy", () => {
      const content = fs.readFileSync(moduleMainPath, "utf8");
      expect(content).toMatch(/common_tags/);
      expect(content).toMatch(/Environment/);
      expect(content).toMatch(/ManagedBy/);
    });

    test("no hardcoded credentials in files", () => {
      const moduleContent = fs.readFileSync(moduleMainPath, "utf8");
      const stackContent = fs.readFileSync(stackPath, "utf8");
      
      // Check for common credential patterns
      expect(moduleContent).not.toMatch(/AKIA[A-Z0-9]{16}/); // AWS Access Key pattern
      expect(moduleContent).not.toMatch(/password\s*=\s*"[^"]*"/); // Hardcoded passwords
      expect(stackContent).not.toMatch(/AKIA[A-Z0-9]{16}/);
      expect(stackContent).not.toMatch(/password\s*=\s*"[^"]*"/);
    });

    test("uses proper ARN references (AWS managed policies only)", () => {
      const content = fs.readFileSync(moduleMainPath, "utf8");
      const arnMatches = content.match(/arn:aws:[^"]+/g) || [];
      
      // Ensure any ARNs are AWS managed policies, not hardcoded resource ARNs
      arnMatches.forEach(arn => {
        expect(arn).toMatch(/^arn:aws:iam::aws:policy\//);
      });
    });
  });

  describe("Infrastructure Components", () => {
    test("defines VPC and networking resources", () => {
      const content = fs.readFileSync(moduleMainPath, "utf8");
      expect(content).toMatch(/aws_vpc/);
      expect(content).toMatch(/aws_subnet/);
      expect(content).toMatch(/aws_internet_gateway/);
    });

    test("includes database configuration", () => {
      const content = fs.readFileSync(moduleMainPath, "utf8");
      expect(content).toMatch(/aws_db_instance/);
      expect(content).toMatch(/aws_db_subnet_group/);
    });

    test("includes security groups", () => {
      const content = fs.readFileSync(moduleMainPath, "utf8");
      expect(content).toMatch(/aws_security_group/);
    });
  });

  describe("Environment Configuration", () => {
    test("has environment-specific tfvars files", () => {
      const devTfvars = path.resolve(__dirname, "../lib/environments/dev/terraform.tfvars");
      const stagingTfvars = path.resolve(__dirname, "../lib/environments/staging/terraform.tfvars");
      const prodTfvars = path.resolve(__dirname, "../lib/environments/prod/terraform.tfvars");
      
      expect(fs.existsSync(devTfvars)).toBe(true);
      expect(fs.existsSync(stagingTfvars)).toBe(true);
      expect(fs.existsSync(prodTfvars)).toBe(true);
    });

    test("has backend configuration for each environment", () => {
      const devBackend = path.resolve(__dirname, "../lib/environments/dev/backend.tf");
      const stagingBackend = path.resolve(__dirname, "../lib/environments/staging/backend.tf");
      const prodBackend = path.resolve(__dirname, "../lib/environments/prod/backend.tf");
      
      expect(fs.existsSync(devBackend)).toBe(true);
      expect(fs.existsSync(stagingBackend)).toBe(true);
      expect(fs.existsSync(prodBackend)).toBe(true);
    });
  });
});
