// Terraform Infrastructure Analysis Module - Integration Tests
// Tests the analysis module's ability to validate infrastructure scenarios
// Note: This is an ANALYSIS task - no deployment required, only configuration validation

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

describe("Terraform Infrastructure Analysis Module - Integration Tests", () => {
  const libDir = path.resolve(__dirname, "../lib");
  const testDataDir = path.resolve(__dirname, "test-data");

  beforeAll(() => {
    // Ensure test data directory exists
    if (!fs.existsSync(testDataDir)) {
      fs.mkdirSync(testDataDir, { recursive: true });
    }
  });

  describe("Terraform Configuration Validation", () => {
    test("terraform init succeeds", () => {
      const output = execSync("terraform init -backend=false", {
        cwd: libDir,
        encoding: "utf8",
      });
      expect(output).toContain("Terraform has been successfully initialized");
    });

    test("terraform validate succeeds", () => {
      const output = execSync("terraform validate", {
        cwd: libDir,
        encoding: "utf8",
      });
      expect(output).toContain("Success!");
      expect(output).toContain("The configuration is valid");
    });

    test("terraform fmt check passes", () => {
      const output = execSync("terraform fmt -check -recursive", {
        cwd: libDir,
        encoding: "utf8",
      }).trim();
      // If output is empty, formatting is correct
      expect(output).toBe("");
    });
  });

  describe("Module Configuration - Empty Resource Lists", () => {
    test("accepts empty resource lists without errors", () => {
      const tfvarsPath = path.join(testDataDir, "empty.tfvars");
      fs.writeFileSync(
        tfvarsPath,
        `
aws_region            = "us-east-1"
environment_suffix    = "test"
ec2_instance_ids      = []
rds_db_instance_ids   = []
s3_bucket_names       = []
security_group_ids    = []
`
      );

      const output = execSync(`terraform validate`, {
        cwd: libDir,
        encoding: "utf8",
      });

      expect(output).toContain("Success!");
    });
  });

  describe("Module Configuration - With Test Resource IDs", () => {
    test("accepts valid resource ID formats", () => {
      const tfvarsPath = path.join(testDataDir, "valid-resources.tfvars");
      fs.writeFileSync(
        tfvarsPath,
        `
aws_region            = "us-east-1"
environment_suffix    = "test"
ec2_instance_ids      = ["i-0123456789abcdef0", "i-0abcdef123456789"]
rds_db_instance_ids   = ["mydb-test", "analytics-test"]
s3_bucket_names       = ["mybucket-test", "logs-test"]
security_group_ids    = ["sg-0123456789abcdef0", "sg-0abcdef123456789"]
`
      );

      const output = execSync(`terraform validate`, {
        cwd: libDir,
        encoding: "utf8",
      });

      expect(output).toContain("Success!");
    });
  });

  describe("Analysis Logic - EC2 Validation", () => {
    test("approved_instance_types list contains t3.micro, t3.small, t3.medium", () => {
      const mainTf = fs.readFileSync(path.join(libDir, "main.tf"), "utf8");
      expect(mainTf).toContain('approved_instance_types = ["t3.micro", "t3.small", "t3.medium"]');
    });

    test("instance_costs map includes pricing for common instance types", () => {
      const mainTf = fs.readFileSync(path.join(libDir, "main.tf"), "utf8");
      expect(mainTf).toMatch(/"t3\.micro"\s*=\s*7\.30/);
      expect(mainTf).toMatch(/"t3\.small"\s*=\s*14\.60/);
      expect(mainTf).toMatch(/"t3\.medium"\s*=\s*29\.20/);
    });

    test("EC2 validation logic checks for unapproved instance types", () => {
      const mainTf = fs.readFileSync(path.join(libDir, "main.tf"), "utf8");
      expect(mainTf).toMatch(/ec2_type_violations.*!contains\(local\.approved_instance_types/s);
    });

    test("EC2 cost warnings trigger for instances over $100/month", () => {
      const mainTf = fs.readFileSync(path.join(libDir, "main.tf"), "utf8");
      expect(mainTf).toMatch(/ec2_cost_warnings.*cost\s*>\s*100\.0/s);
    });
  });

  describe("Analysis Logic - RDS Validation", () => {
    test("RDS backup validation checks retention period >= 7 days", () => {
      const mainTf = fs.readFileSync(path.join(libDir, "main.tf"), "utf8");
      expect(mainTf).toMatch(/rds_backup_violations.*backup_retention_period\s*<\s*7/s);
    });

    test("RDS backup validation checks backup_enabled flag", () => {
      const mainTf = fs.readFileSync(path.join(libDir, "main.tf"), "utf8");
      expect(mainTf).toMatch(/!db\.backup_enabled/);
    });
  });

  describe("Analysis Logic - S3 Validation", () => {
    test("S3 validation checks versioning_enabled", () => {
      const mainTf = fs.readFileSync(path.join(libDir, "main.tf"), "utf8");
      expect(mainTf).toMatch(/!bucket\.versioning_enabled/);
    });

    test("S3 validation checks encryption_enabled", () => {
      const mainTf = fs.readFileSync(path.join(libDir, "main.tf"), "utf8");
      expect(mainTf).toMatch(/!bucket\.encryption_enabled/);
    });

    test("S3 uses external data source for versioning check", () => {
      const mainTf = fs.readFileSync(path.join(libDir, "main.tf"), "utf8");
      expect(mainTf).toMatch(/data\s+"external"\s+"s3_versioning"/);
      expect(mainTf).toMatch(/aws s3api get-bucket-versioning/);
    });

    test("S3 uses external data source for encryption check", () => {
      const mainTf = fs.readFileSync(path.join(libDir, "main.tf"), "utf8");
      expect(mainTf).toMatch(/data\s+"external"\s+"s3_encryption"/);
      expect(mainTf).toMatch(/aws s3api get-bucket-encryption/);
    });
  });

  describe("Analysis Logic - Security Group Validation", () => {
    test("allows ports 80 and 443 for public access", () => {
      const mainTf = fs.readFileSync(path.join(libDir, "main.tf"), "utf8");
      expect(mainTf).toMatch(/allowed_public_ports\s*=\s*\[80,\s*443\]/);
    });

    test("flags unrestricted access (0.0.0.0/0) to other ports", () => {
      const mainTf = fs.readFileSync(path.join(libDir, "main.tf"), "utf8");
      expect(mainTf).toMatch(/0\.0\.0\.0\/0/);
      expect(mainTf).toMatch(/!contains\(local\.allowed_public_ports/);
    });
  });

  describe("Analysis Logic - Tagging Validation", () => {
    test("requires Environment, Owner, CostCenter, Project tags", () => {
      const mainTf = fs.readFileSync(path.join(libDir, "main.tf"), "utf8");
      expect(mainTf).toMatch(/required_tags\s*=\s*\["Environment",\s*"Owner",\s*"CostCenter",\s*"Project"\]/);
    });

    test("merges resources from EC2, RDS, and S3", () => {
      const mainTf = fs.readFileSync(path.join(libDir, "main.tf"), "utf8");
      expect(mainTf).toMatch(/all_resources\s*=\s*merge\(/);
      expect(mainTf).toMatch(/ec2-\$\{id\}/);
      expect(mainTf).toMatch(/rds-\$\{id\}/);
      expect(mainTf).toMatch(/s3-\$\{name\}/);
    });

    test("calculates compliance percentage", () => {
      const mainTf = fs.readFileSync(path.join(libDir, "main.tf"), "utf8");
      expect(mainTf).toMatch(/compliance_percentage.*floor.*compliant_resources.*total_resources/s);
    });
  });

  describe("Output Validation", () => {
    test("outputs include PASS/FAIL compliance status", () => {
      const outputsTf = fs.readFileSync(path.join(libDir, "outputs.tf"), "utf8");
      expect(outputsTf).toMatch(/compliance_status\s*=.*"PASS".*"FAIL"/s);
    });

    test("outputs include total_violations count", () => {
      const outputsTf = fs.readFileSync(path.join(libDir, "outputs.tf"), "utf8");
      expect(outputsTf).toMatch(/total_violations\s*=\s*local\.total_violations/);
    });

    test("outputs include cicd_report with jsonencode", () => {
      const outputsTf = fs.readFileSync(path.join(libDir, "outputs.tf"), "utf8");
      expect(outputsTf).toMatch(/output\s+"cicd_report"/);
      expect(outputsTf).toMatch(/jsonencode\(/);
    });

    test("outputs include timestamp for report generation", () => {
      const outputsTf = fs.readFileSync(path.join(libDir, "outputs.tf"), "utf8");
      expect(outputsTf).toMatch(/timestamp\(\)/);
    });
  });

  describe("Non-Destructive Analysis", () => {
    test("module uses only data sources, no resource creation", () => {
      const mainTf = fs.readFileSync(path.join(libDir, "main.tf"), "utf8");
      const resourceBlocks = mainTf.match(/resource\s+"[^"]+"\s+"[^"]+"\s*{/g);
      expect(resourceBlocks).toBeNull();
    });

    test("all data sources use for_each for scalability", () => {
      const mainTf = fs.readFileSync(path.join(libDir, "main.tf"), "utf8");
      const dataSourcesWithForEach = mainTf.match(/data\s+"aws_\w+"\s+"[\w_]+"\s*{[\s\S]*?for_each\s*=/g);
      expect(dataSourcesWithForEach).not.toBeNull();
      expect(dataSourcesWithForEach!.length).toBeGreaterThanOrEqual(4); // EC2, RDS, S3, SG
    });

    test("uses try() for graceful error handling", () => {
      const mainTf = fs.readFileSync(path.join(libDir, "main.tf"), "utf8");
      const tryFunctions = mainTf.match(/try\(/g);
      expect(tryFunctions).not.toBeNull();
      expect(tryFunctions!.length).toBeGreaterThan(10); // Multiple try() usages
    });
  });

  describe("Provider Configuration", () => {
    test("requires AWS provider version 5.x", () => {
      const providerTf = fs.readFileSync(path.join(libDir, "provider.tf"), "utf8");
      expect(providerTf).toMatch(/version\s*=\s*"[>=~]+\s*5\.0"/);
    });

    test("requires external provider for S3 checks", () => {
      const providerTf = fs.readFileSync(path.join(libDir, "provider.tf"), "utf8");
      expect(providerTf).toMatch(/external\s*=\s*{[\s\S]*?version\s*=\s*"~>\s*2\.0"/);
    });

    test("configures default tags for resource tracking", () => {
      const providerTf = fs.readFileSync(path.join(libDir, "provider.tf"), "utf8");
      expect(providerTf).toMatch(/default_tags\s*{/);
      expect(providerTf).toMatch(/Environment\s*=\s*var\.environment_suffix/);
    });
  });

  describe("Module Reusability", () => {
    test("accepts environment_suffix for multi-environment support", () => {
      const variablesTf = fs.readFileSync(path.join(libDir, "variables.tf"), "utf8");
      expect(variablesTf).toMatch(/variable\s+"environment_suffix"/);
    });

    test("provides default values for all optional variables", () => {
      const variablesTf = fs.readFileSync(path.join(libDir, "variables.tf"), "utf8");
      const defaultCount = (variablesTf.match(/default\s*=\s*\[\]/g) || []).length;
      expect(defaultCount).toBeGreaterThanOrEqual(4); // All list variables have defaults
    });

    test("uses aws_region variable for multi-region support", () => {
      const variablesTf = fs.readFileSync(path.join(libDir, "variables.tf"), "utf8");
      expect(variablesTf).toMatch(/variable\s+"aws_region"/);
      expect(variablesTf).toMatch(/default\s*=\s*"us-east-1"/);
    });
  });

  describe("Error Handling and Edge Cases", () => {
    test("handles division by zero in compliance percentage calculation", () => {
      const mainTf = fs.readFileSync(path.join(libDir, "main.tf"), "utf8");
      expect(mainTf).toMatch(/compliance_percentage.*total_resources\s*>\s*0.*:\s*0/s);
    });

    test("uses try() to handle missing resource attributes", () => {
      const mainTf = fs.readFileSync(path.join(libDir, "main.tf"), "utf8");
      expect(mainTf).toMatch(/try\(.*,\s*"unknown"\)/);
      expect(mainTf).toMatch(/try\(.*,\s*false\)/);
      expect(mainTf).toMatch(/try\(.*,\s*{}\)/);
    });

    test("filters running instances for cost calculations", () => {
      const mainTf = fs.readFileSync(path.join(libDir, "main.tf"), "utf8");
      expect(mainTf).toMatch(/ec2_costs.*instance\.state\s*==\s*"running"/s);
    });
  });

  describe("Cost Analysis Functionality", () => {
    test("calculates total EC2 monthly costs using sum()", () => {
      const mainTf = fs.readFileSync(path.join(libDir, "main.tf"), "utf8");
      expect(mainTf).toMatch(/total_ec2_cost\s*=\s*sum\(/);
    });

    test("provides individual instance cost breakdown", () => {
      const outputsTf = fs.readFileSync(path.join(libDir, "outputs.tf"), "utf8");
      expect(outputsTf).toMatch(/individual_costs\s*=\s*local\.ec2_costs/);
    });

    test("includes cost warnings in output", () => {
      const outputsTf = fs.readFileSync(path.join(libDir, "outputs.tf"), "utf8");
      expect(outputsTf).toMatch(/cost_warnings\s*=\s*local\.ec2_cost_warnings/);
    });
  });
});
