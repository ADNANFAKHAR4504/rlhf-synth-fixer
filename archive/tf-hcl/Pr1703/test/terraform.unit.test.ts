// Unit tests for Terraform infrastructure
import fs from "fs";
import path from "path";
import { parse } from "@cdktf/hcl2json";

const libPath = path.resolve(__dirname, "../lib");

// Helper function to read HCL files
function readHCLFile(filename: string): string {
  const filePath = path.join(libPath, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  return fs.readFileSync(filePath, "utf8");
}

// Helper to parse HCL content
async function parseHCL(content: string): Promise<any> {
  try {
    // Basic HCL parsing - for complex parsing we'd use proper HCL parser
    return content;
  } catch (error) {
    return content;
  }
}

describe("Terraform Infrastructure Files", () => {
  describe("File existence checks", () => {
    const requiredFiles = [
      "provider.tf",
      "variables.tf", 
      "s3.tf",
      "kms.tf",
      "iam.tf",
      "guardduty.tf",
      "macie.tf",
      "outputs.tf"
    ];

    requiredFiles.forEach(file => {
      test(`${file} exists`, () => {
        const filePath = path.join(libPath, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });
  });

  describe("Provider Configuration", () => {
    test("provider.tf contains AWS provider configuration", () => {
      const content = readHCLFile("provider.tf");
      expect(content).toMatch(/provider\s+"aws"/);
      expect(content).toMatch(/region\s*=\s*var\.aws_region/);
    });

    test("provider.tf has S3 backend configuration", () => {
      const content = readHCLFile("provider.tf");
      expect(content).toMatch(/backend\s+"s3"/);
    });

    test("provider.tf requires Terraform version >= 1.4.0", () => {
      const content = readHCLFile("provider.tf");
      expect(content).toMatch(/required_version\s*=\s*">=\s*1\.4\.0"/);
    });
  });

  describe("Variables Configuration", () => {
    test("variables.tf contains environment_suffix variable", () => {
      const content = readHCLFile("variables.tf");
      expect(content).toMatch(/variable\s+"environment_suffix"/);
    });

    test("variables.tf contains aws_region with default us-east-1", () => {
      const content = readHCLFile("variables.tf");
      expect(content).toMatch(/variable\s+"aws_region"/);
      expect(content).toMatch(/default\s*=\s*"us-east-1"/);
    });

    test("variables.tf contains bucket_names list", () => {
      const content = readHCLFile("variables.tf");
      expect(content).toMatch(/variable\s+"bucket_names"/);
      expect(content).toMatch(/type\s*=\s*list\(string\)/);
    });

    test("variables.tf contains application_name variable", () => {
      const content = readHCLFile("variables.tf");
      expect(content).toMatch(/variable\s+"application_name"/);
      expect(content).toMatch(/default\s*=\s*"myapp"/);
    });
  });

  describe("S3 Configuration", () => {
    test("s3.tf creates S3 buckets with proper naming", () => {
      const content = readHCLFile("s3.tf");
      expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"secure_buckets"/);
      expect(content).toMatch(/\$\{var\.application_name\}-\$\{var\.bucket_names\[count\.index\]\}-\$\{var\.environment\}-\$\{var\.environment_suffix\}/);
    });

    test("s3.tf enables force_destroy for cleanup", () => {
      const content = readHCLFile("s3.tf");
      expect(content).toMatch(/force_destroy\s*=\s*true/);
    });

    test("s3.tf configures server-side encryption with KMS", () => {
      const content = readHCLFile("s3.tf");
      expect(content).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/);
      expect(content).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
      expect(content).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.s3_encryption_key\.arn/);
    });

    test("s3.tf blocks public access", () => {
      const content = readHCLFile("s3.tf");
      expect(content).toMatch(/resource\s+"aws_s3_bucket_public_access_block"/);
      expect(content).toMatch(/block_public_acls\s*=\s*true/);
      expect(content).toMatch(/block_public_policy\s*=\s*true/);
      expect(content).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(content).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test("s3.tf enables versioning", () => {
      const content = readHCLFile("s3.tf");
      expect(content).toMatch(/resource\s+"aws_s3_bucket_versioning"/);
      expect(content).toMatch(/status\s*=\s*"Enabled"/);
    });
  });

  describe("KMS Configuration", () => {
    test("kms.tf creates KMS key with rotation enabled", () => {
      const content = readHCLFile("kms.tf");
      expect(content).toMatch(/resource\s+"aws_kms_key"\s+"s3_encryption_key"/);
      expect(content).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test("kms.tf sets deletion window", () => {
      const content = readHCLFile("kms.tf");
      expect(content).toMatch(/deletion_window_in_days\s*=\s*7/);
    });

    test("kms.tf creates KMS alias with environment suffix", () => {
      const content = readHCLFile("kms.tf");
      expect(content).toMatch(/resource\s+"aws_kms_alias"/);
      expect(content).toMatch(/alias\/\$\{var\.application_name\}-s3-key-\$\{var\.environment\}-\$\{var\.environment_suffix\}/);
    });

    test("kms.tf includes proper KMS key policy", () => {
      const content = readHCLFile("kms.tf");
      expect(content).toMatch(/policy\s*=\s*jsonencode/);
      expect(content).toMatch(/kms:Encrypt/);
      expect(content).toMatch(/kms:Decrypt/);
      expect(content).toMatch(/kms:GenerateDataKey/);
    });
  });

  describe("IAM Configuration", () => {
    test("iam.tf creates IAM role with proper naming", () => {
      const content = readHCLFile("iam.tf");
      expect(content).toMatch(/resource\s+"aws_iam_role"\s+"s3_access_role"/);
      expect(content).toMatch(/\$\{var\.application_name\}-s3-role-\$\{var\.environment\}-\$\{var\.environment_suffix\}/);
    });

    test("iam.tf implements least privilege policy", () => {
      const content = readHCLFile("iam.tf");
      expect(content).toMatch(/resource\s+"aws_iam_role_policy"\s+"s3_access_policy"/);
      expect(content).toMatch(/s3:GetObject/);
      expect(content).toMatch(/s3:PutObject/);
      expect(content).toMatch(/s3:DeleteObject/);
      expect(content).toMatch(/s3:ListBucket/);
    });

    test("iam.tf allows EC2 service to assume role", () => {
      const content = readHCLFile("iam.tf");
      expect(content).toMatch(/Service\s*=\s*"ec2\.amazonaws\.com"/);
      expect(content).toMatch(/Action\s*=\s*"sts:AssumeRole"/);
    });

    test("iam.tf creates instance profile", () => {
      const content = readHCLFile("iam.tf");
      expect(content).toMatch(/resource\s+"aws_iam_instance_profile"\s+"s3_access_profile"/);
    });
  });

  describe("GuardDuty Configuration", () => {
    test("guardduty.tf handles existing detector gracefully", () => {
      const content = readHCLFile("guardduty.tf");
      expect(content).toMatch(/data\s+"aws_guardduty_detector"\s+"existing"/);
      expect(content).toMatch(/locals\s*\{/);
      expect(content).toMatch(/guardduty_detector_id/);
    });

    test("guardduty.tf enables S3 protection", () => {
      const content = readHCLFile("guardduty.tf");
      expect(content).toMatch(/resource\s+"aws_guardduty_detector_feature"\s+"s3_logs"/);
      expect(content).toMatch(/name\s*=\s*"S3_DATA_EVENTS"/);
      expect(content).toMatch(/status\s*=\s*"ENABLED"/);
    });

    test("guardduty.tf enables malware protection", () => {
      const content = readHCLFile("guardduty.tf");
      expect(content).toMatch(/resource\s+"aws_guardduty_detector_feature"\s+"malware_protection"/);
      expect(content).toMatch(/name\s*=\s*"EBS_MALWARE_PROTECTION"/);
    });

    test("guardduty.tf enables runtime monitoring", () => {
      const content = readHCLFile("guardduty.tf");
      expect(content).toMatch(/resource\s+"aws_guardduty_detector_feature"\s+"runtime_monitoring"/);
      expect(content).toMatch(/name\s*=\s*"RUNTIME_MONITORING"/);
    });
  });

  describe("Macie Configuration", () => {
    test("macie.tf enables Macie account", () => {
      const content = readHCLFile("macie.tf");
      expect(content).toMatch(/resource\s+"aws_macie2_account"\s+"main"/);
    });

    test("macie.tf creates classification jobs for each bucket", () => {
      const content = readHCLFile("macie.tf");
      expect(content).toMatch(/resource\s+"aws_macie2_classification_job"\s+"s3_classification"/);
      expect(content).toMatch(/count\s*=\s*length\(aws_s3_bucket\.secure_buckets\)/);
    });

    test("macie.tf schedules daily classification", () => {
      const content = readHCLFile("macie.tf");
      expect(content).toMatch(/schedule_frequency\s*\{/);
      expect(content).toMatch(/daily_schedule\s*=\s*true/);
    });

    test("macie.tf sets sampling to 100%", () => {
      const content = readHCLFile("macie.tf");
      expect(content).toMatch(/sampling_percentage\s*=\s*100/);
    });
  });

  describe("Outputs Configuration", () => {
    test("outputs.tf exports bucket names", () => {
      const content = readHCLFile("outputs.tf");
      expect(content).toMatch(/output\s+"bucket_names"/);
    });

    test("outputs.tf exports KMS key information", () => {
      const content = readHCLFile("outputs.tf");
      expect(content).toMatch(/output\s+"kms_key_id"/);
      expect(content).toMatch(/output\s+"kms_key_arn"/);
    });

    test("outputs.tf exports IAM role ARN", () => {
      const content = readHCLFile("outputs.tf");
      expect(content).toMatch(/output\s+"iam_role_arn"/);
    });

    test("outputs.tf exports GuardDuty detector ID", () => {
      const content = readHCLFile("outputs.tf");
      expect(content).toMatch(/output\s+"guardduty_detector_id"/);
    });
  });

  describe("Security Best Practices", () => {
    test("All resources use environment_suffix for unique naming", () => {
      const files = ["s3.tf", "kms.tf", "iam.tf", "guardduty.tf", "macie.tf"];
      files.forEach(file => {
        const content = readHCLFile(file);
        expect(content).toMatch(/var\.environment_suffix/);
      });
    });

    test("No hardcoded AWS account IDs", () => {
      const files = ["s3.tf", "kms.tf", "iam.tf", "guardduty.tf", "macie.tf"];
      files.forEach(file => {
        const content = readHCLFile(file);
        // Should use data.aws_caller_identity.current.account_id instead
        expect(content).not.toMatch(/\d{12}/); // No 12-digit account IDs
      });
    });

    test("KMS key policy references IAM role", () => {
      const content = readHCLFile("kms.tf");
      expect(content).toMatch(/aws_iam_role\.s3_access_role\.arn/);
    });

    test("S3 encryption uses customer-managed KMS key", () => {
      const content = readHCLFile("s3.tf");
      expect(content).toMatch(/aws_kms_key\.s3_encryption_key\.arn/);
      expect(content).not.toMatch(/alias\/aws\/s3/); // Not using AWS managed key
    });
  });
});