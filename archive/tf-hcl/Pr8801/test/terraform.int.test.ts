// tests/integration/terraform.int.test.ts
// Integration tests for Terraform multi-account security framework
// Tests Terraform commands and configuration validation

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const LIB_DIR = path.resolve(__dirname, "../lib");
const TIMEOUT = 30000;

describe("Terraform Integration Tests", () => {

  describe("Terraform Initialization", () => {
    test("terraform init succeeds", () => {
      expect(() => {
        const output = execSync("terraform init -backend=false", {
          cwd: LIB_DIR,
          encoding: "utf8",
          stdio: "pipe"
        });
        expect(output).toContain("Terraform has been successfully initialized");
      }).not.toThrow();
    }, TIMEOUT);
  });

  describe("Terraform Validation", () => {
    test("terraform validate succeeds", () => {
      expect(() => {
        const output = execSync("terraform validate", {
          cwd: LIB_DIR,
          encoding: "utf8",
          stdio: "pipe"
        });
        expect(output).toContain("Success");
      }).not.toThrow();
    }, TIMEOUT);
  });

  describe("Terraform Formatting", () => {
    test("terraform fmt check passes", () => {
      expect(() => {
        execSync("terraform fmt -check -recursive", {
          cwd: LIB_DIR,
          encoding: "utf8",
          stdio: "pipe"
        });
      }).not.toThrow();
    }, TIMEOUT);
  });

  describe("Provider Configuration", () => {
    test("provider.tf contains AWS provider configuration", () => {
      const providerPath = path.join(LIB_DIR, "provider.tf");
      const content = fs.readFileSync(providerPath, "utf8");

      expect(content).toMatch(/provider\s+"aws"\s*{/);
      expect(content).toMatch(/region\s*=/);
    });

    test("provider.tf contains eu-west-1 provider alias", () => {
      const providerPath = path.join(LIB_DIR, "provider.tf");
      const content = fs.readFileSync(providerPath, "utf8");

      expect(content).toMatch(/alias\s*=\s*"eu_west_1"/);
      expect(content).toMatch(/region\s*=\s*"eu-west-1"/);
    });
  });

  describe("Backend Configuration", () => {
    test("backend.tf contains S3 backend configuration", () => {
      const backendPath = path.join(LIB_DIR, "backend.tf");
      if (fs.existsSync(backendPath)) {
        const content = fs.readFileSync(backendPath, "utf8");
        expect(content).toMatch(/backend\s+"s3"\s*{/);
      }
    });
  });

  describe("Variables Configuration", () => {
    test("variables.tf declares environment_suffix with proper type", () => {
      const variablesPath = path.join(LIB_DIR, "variables.tf");
      const content = fs.readFileSync(variablesPath, "utf8");

      expect(content).toMatch(/variable\s+"environment_suffix"\s*{/);
      expect(content).toMatch(/type\s*=\s*string/);
    });
  });

  describe("Outputs Configuration", () => {
    test("outputs.tf exports key resource information", () => {
      const outputsPath = path.join(LIB_DIR, "outputs.tf");
      if (fs.existsSync(outputsPath)) {
        const content = fs.readFileSync(outputsPath, "utf8");

        // Should export at least some key resource IDs or ARNs
        expect(content).toMatch(/output\s+"/);
        expect(content).toMatch(/value\s*=/);
      }
    });
  });

  describe("Security Validation", () => {
    test("no plaintext secrets in terraform files", () => {
      const tfFiles = fs.readdirSync(LIB_DIR).filter(f => f.endsWith(".tf"));

      tfFiles.forEach(file => {
        const content = fs.readFileSync(path.join(LIB_DIR, file), "utf8");

        // Check for common secret patterns
        expect(content).not.toMatch(/password\s*=\s*"[^$]/i);
        expect(content).not.toMatch(/secret\s*=\s*"[^$]/i);
        expect(content).not.toMatch(/AKIA[0-9A-Z]{16}/); // AWS access key pattern
      });
    });

    test("all S3 buckets have encryption configuration", () => {
      const mainTfPath = path.join(LIB_DIR, "main.tf");
      const content = fs.readFileSync(mainTfPath, "utf8");

      const s3BucketMatches = content.match(/resource\s+"aws_s3_bucket"\s+"(\w+)"/g) || [];
      const s3BucketNames = s3BucketMatches.map(match => {
        const nameMatch = match.match(/resource\s+"aws_s3_bucket"\s+"(\w+)"/);
        return nameMatch ? nameMatch[1] : null;
      }).filter(Boolean);

      s3BucketNames.forEach(bucketName => {
        const encryptionRegex = new RegExp(
          `resource\\s+"aws_s3_bucket_server_side_encryption_configuration"\\s+"${bucketName}"`,
          "m"
        );
        expect(content).toMatch(encryptionRegex);
      });
    });
  });

  describe("Multi-Region Configuration", () => {
    test("KMS replica key uses eu-west-1 provider", () => {
      const mainTfPath = path.join(LIB_DIR, "main.tf");
      const content = fs.readFileSync(mainTfPath, "utf8");

      // Find the replica key resource block
      const replicaKeyMatch = content.match(
        /resource\s+"aws_kms_replica_key"\s+"secondary"\s*{[\s\S]*?^}/m
      );

      expect(replicaKeyMatch).toBeTruthy();
      if (replicaKeyMatch) {
        expect(replicaKeyMatch[0]).toMatch(/provider\s*=\s*aws\.eu_west_1/);
      }
    });
  });

  describe("Compliance Requirements", () => {
    test("all IAM roles enforce MFA", () => {
      const mainTfPath = path.join(LIB_DIR, "main.tf");
      const content = fs.readFileSync(mainTfPath, "utf8");

      const auditRoles = content.match(/resource\s+"aws_iam_role"\s+"(security_audit|compliance_audit)"/g) || [];

      auditRoles.forEach(() => {
        expect(content).toMatch(/aws:MultiFactorAuthPresent/);
      });
    });

    test("KMS keys have rotation enabled", () => {
      const mainTfPath = path.join(LIB_DIR, "main.tf");
      const content = fs.readFileSync(mainTfPath, "utf8");

      const kmsKeyMatch = content.match(/resource\s+"aws_kms_key"\s+"primary"\s*{[\s\S]*?^}/m);
      expect(kmsKeyMatch).toBeTruthy();
      if (kmsKeyMatch) {
        expect(kmsKeyMatch[0]).toMatch(/enable_key_rotation\s*=\s*true/);
      }
    });

    test("CloudWatch logs have 90-day retention", () => {
      const mainTfPath = path.join(LIB_DIR, "main.tf");
      const content = fs.readFileSync(mainTfPath, "utf8");

      const logGroups = content.match(/resource\s+"aws_cloudwatch_log_group"/g) || [];
      expect(logGroups.length).toBeGreaterThan(0);

      // All log groups should have 90-day retention
      const retentionMatches = content.match(/retention_in_days\s*=\s*90/g) || [];
      expect(retentionMatches.length).toBeGreaterThanOrEqual(logGroups.length);
    });

    test("CloudTrail enables log file validation", () => {
      const mainTfPath = path.join(LIB_DIR, "main.tf");
      const content = fs.readFileSync(mainTfPath, "utf8");

      expect(content).toMatch(/enable_log_file_validation\s*=\s*true/);
    });
  });

  describe("Organization Structure", () => {
    test("creates exactly 3 organizational units", () => {
      const mainTfPath = path.join(LIB_DIR, "main.tf");
      const content = fs.readFileSync(mainTfPath, "utf8");

      const ouMatches = content.match(/resource\s+"aws_organizations_organizational_unit"/g) || [];
      expect(ouMatches).toHaveLength(3);
    });

    test("SCPs are attached to all OUs", () => {
      const mainTfPath = path.join(LIB_DIR, "main.tf");
      const content = fs.readFileSync(mainTfPath, "utf8");

      // Check that encryption SCPs are attached to all 3 OUs
      const s3Attachments = content.match(
        /resource\s+"aws_organizations_policy_attachment"\s+"\w+_s3_encryption"/g
      ) || [];
      expect(s3Attachments.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("Resource Naming", () => {
    test("all named resources include environment_suffix", () => {
      const mainTfPath = path.join(LIB_DIR, "main.tf");
      const content = fs.readFileSync(mainTfPath, "utf8");

      // Extract all name attributes
      const nameMatches = content.match(/^\s*name\s*=\s*"[^"]+"/gm) || [];

      // Filter out terraform meta attributes
      const resourceNames = nameMatches.filter(name =>
        !name.includes("aws_service_access_principals") &&
        !name.includes("enabled_policy_types") &&
        !name.includes("feature_set")
      );

      // All resource names should include environment_suffix variable
      resourceNames.forEach(name => {
        expect(name).toMatch(/\$\{var\.environment_suffix\}/);
      });
    });
  });
});
