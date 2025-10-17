// test/terraform.unit.test.ts
// Unit tests for S3 Static Asset Storage
// Static code analysis - validates configuration before deployment
// NO Terraform commands - just reads main.tf file as text
// Coverage requirement: 90%+ (MANDATORY - Claude QA enforced)

import fs from "fs";
import path from "path";

const TERRAFORM_FILE = path.resolve(__dirname, "../lib/main.tf");
const PROVIDER_FILE = path.resolve(__dirname, "../lib/provider.tf");
let tf: string;

beforeAll(() => {
  if (!fs.existsSync(TERRAFORM_FILE)) {
    throw new Error(`Terraform file not found at: ${TERRAFORM_FILE}`);
  }
  tf = fs.readFileSync(TERRAFORM_FILE, "utf8");
  
  // Also read provider.tf for provider tests
  if (fs.existsSync(PROVIDER_FILE)) {
    const providerContent = fs.readFileSync(PROVIDER_FILE, "utf8");
    tf += "\n" + providerContent;
  }
});

// Helper functions
function has(rx: RegExp): boolean {
  return rx.test(tf);
}

function count(rx: RegExp): number {
  return (tf.match(rx) || []).length;
}

describe("S3 Static Asset Storage - Unit Tests", () => {
  
  // ========================================================================
  // TEST GROUP 1: FILE STRUCTURE AND TERRAFORM CONFIG (5 tests)
  // ========================================================================
  describe("File Structure and Terraform Configuration", () => {
    test("main.tf exists and is non-trivial", () => {
      expect(tf).toBeDefined();
      expect(tf.length).toBeGreaterThan(1000);
      expect(tf).toMatch(/resource|output/);
    });

    test("has clear section headers with comments", () => {
      expect(count(/# ={20,}/g)).toBeGreaterThan(5);
    });

    test("uses AWS provider", () => {
      expect(has(/provider\s+"aws"/)).toBe(true);
    });

    test("uses random provider for suffix", () => {
      expect(has(/resource\s+"random_string"/)).toBe(true);
    });

    test("all sections properly organized", () => {
      const dataIndex = tf.indexOf('data "');
      const variableIndex = tf.indexOf('variable "');
      const localsIndex = tf.indexOf('locals {');
      const resourceIndex = tf.indexOf('resource "');
      const outputIndex = tf.indexOf('output "');
      
      expect(dataIndex).toBeGreaterThan(0);
      expect(variableIndex).toBeGreaterThan(dataIndex);
      expect(localsIndex).toBeGreaterThan(variableIndex);
      expect(resourceIndex).toBeGreaterThan(localsIndex);
      expect(outputIndex).toBeGreaterThan(resourceIndex);
    });
  });

  // ========================================================================
  // TEST GROUP 2: DATA SOURCES (4 tests)
  // ========================================================================
  describe("Data Sources", () => {
    test("uses aws_caller_identity for account ID", () => {
      expect(has(/data\s+"aws_caller_identity"\s+"current"/)).toBe(true);
    });

    test("uses aws_region data source", () => {
      expect(has(/data\s+"aws_region"\s+"current"/)).toBe(true);
    });

    test("no hardcoded account IDs", () => {
      const accountIdMatches = tf.match(/\d{12}/g);
      expect(accountIdMatches).toBeNull();
    });

    test("account_id referenced in locals", () => {
      expect(has(/account_id\s*=\s*data\.aws_caller_identity\.current\.account_id/)).toBe(true);
    });
  });

  // ========================================================================
  // TEST GROUP 3: VARIABLES (5 tests)
  // ========================================================================
  describe("Variable Definitions", () => {
    test("has project_name variable", () => {
      expect(has(/variable\s+"project_name"/)).toBe(true);
    });

    test("has environment variable", () => {
      expect(has(/variable\s+"environment"/)).toBe(true);
    });

    test("all variables have descriptions", () => {
      const variables = tf.match(/variable\s+"[^"]+"/g) || [];
      const descriptions = tf.match(/description\s*=/g) || [];
      expect(descriptions.length).toBeGreaterThanOrEqual(variables.length);
    });

    test("all variables have type specifications", () => {
      const variables = tf.match(/variable\s+"[^"]+"/g) || [];
      const types = tf.match(/type\s*=/g) || [];
      expect(types.length).toBeGreaterThanOrEqual(variables.length);
    });

    test("variables have default values", () => {
      expect(count(/default\s*=/g)).toBeGreaterThan(0);
    });
  });

  // ========================================================================
  // TEST GROUP 4: LOCALS AND COMMON TAGS (5 tests)
  // ========================================================================
  describe("Locals and Common Tags", () => {
    test("has locals block", () => {
      expect(has(/locals\s*\{/)).toBe(true);
    });

    test("defines common_tags in locals", () => {
      expect(has(/common_tags\s*=\s*\{/)).toBe(true);
    });

    test("common_tags include required fields", () => {
      const commonTagsBlock = tf.match(/common_tags\s*=\s*\{[\s\S]*?\n\s*\}/);
      expect(commonTagsBlock).toBeTruthy();
      if (commonTagsBlock) {
        expect(/Project\s*=/.test(commonTagsBlock[0])).toBe(true);
        expect(/Environment\s*=/.test(commonTagsBlock[0])).toBe(true);
      }
    });

    test("defines bucket_prefix in locals", () => {
      expect(has(/bucket_prefix\s*=/)).toBe(true);
    });

    test("region uses data.aws_region.current.id not .name", () => {
      expect(has(/region\s*=\s*data\.aws_region\.current\.id/)).toBe(true);
      expect(has(/data\.aws_region\.current\.name/)).toBe(false);
    });
  });

  // ========================================================================
  // TEST GROUP 5: RANDOM SUFFIX (5 tests)
  // ========================================================================
  describe("Random Suffix for Unique Naming", () => {
    test("creates random_string resource", () => {
      expect(has(/resource\s+"random_string"\s+"bucket_suffix"/)).toBe(true);
    });

    test("random_string has length of 8", () => {
      expect(has(/length\s*=\s*8/)).toBe(true);
    });

    test("random_string disables special characters", () => {
      expect(has(/special\s*=\s*false/)).toBe(true);
    });

    test("random_string disables uppercase", () => {
      expect(has(/upper\s*=\s*false/)).toBe(true);
    });

    test("bucket resources reference random suffix", () => {
      expect(has(/random_string\.bucket_suffix\.result/)).toBe(true);
    });
  });

  // ========================================================================
  // TEST GROUP 6: RESOURCE NAMING (5 tests)
  // ========================================================================
  describe("Resource Naming and Uniqueness", () => {
    test("logging bucket uses random suffix", () => {
      expect(has(/bucket\s*=\s*"\$\{local\.bucket_prefix\}-logs-\$\{random_string\.bucket_suffix\.result\}"/)).toBe(true);
    });

    test("static assets bucket uses random suffix", () => {
      expect(has(/bucket\s*=\s*"\$\{local\.bucket_prefix\}-assets-\$\{random_string\.bucket_suffix\.result\}"/)).toBe(true);
    });

    test("IAM role uses random suffix", () => {
      expect(has(/name\s*=\s*"\$\{local\.bucket_prefix\}-ec2-s3-upload-role-\$\{random_string\.bucket_suffix\.result\}"/)).toBe(true);
    });

    test("IAM policy uses random suffix", () => {
      expect(has(/name\s*=\s*"\$\{local\.bucket_prefix\}-s3-upload-policy-\$\{random_string\.bucket_suffix\.result\}"/)).toBe(true);
    });

    test("no hardcoded bucket names", () => {
      const bucketAssignments = tf.match(/bucket\s*=\s*"[^$][^"]+"/g) || [];
      expect(bucketAssignments.length).toBe(0);
    });
  });

  // ========================================================================
  // TEST GROUP 7: S3 BUCKETS (6 tests)
  // ========================================================================
  describe("S3 Bucket Resources", () => {
    test("creates logging bucket", () => {
      expect(has(/resource\s+"aws_s3_bucket"\s+"logging"/)).toBe(true);
    });

    test("creates static assets bucket", () => {
      expect(has(/resource\s+"aws_s3_bucket"\s+"static_assets"/)).toBe(true);
    });

    test("both buckets have tags", () => {
      const buckets = tf.match(/resource\s+"aws_s3_bucket"/g) || [];
      const tags = tf.match(/tags\s*=\s*local\.common_tags/g) || [];
      expect(tags.length).toBeGreaterThanOrEqual(buckets.length);
    });

    test("no inline bucket configurations", () => {
      const bucketBlocks = tf.match(/resource\s+"aws_s3_bucket"[\s\S]*?^\}/gm) || [];
      bucketBlocks.forEach(block => {
        expect(/versioning\s*\{/.test(block)).toBe(false);
        expect(/lifecycle_rule\s*\{/.test(block)).toBe(false);
        expect(/server_side_encryption_configuration\s*\{/.test(block)).toBe(false);
      });
    });

    test("buckets reference locals for naming", () => {
      expect(has(/local\.bucket_prefix/)).toBe(true);
    });

    test("bucket names follow pattern: prefix-purpose-suffix", () => {
      expect(has(/-logs-\$\{random_string/)).toBe(true);
      expect(has(/-assets-\$\{random_string/)).toBe(true);
    });
  });

  // ========================================================================
  // TEST GROUP 8: ENCRYPTION (6 tests)
  // ========================================================================
  describe("Security - Encryption", () => {
    test("logging bucket has encryption configuration", () => {
      expect(has(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"logging"/)).toBe(true);
    });

    test("static assets bucket has encryption configuration", () => {
      expect(has(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"static_assets"/)).toBe(true);
    });

    test("uses AES256 encryption", () => {
      const encryptionCount = count(/sse_algorithm\s*=\s*"AES256"/g);
      expect(encryptionCount).toBeGreaterThanOrEqual(2);
    });

    test("uses apply_server_side_encryption_by_default", () => {
      expect(has(/apply_server_side_encryption_by_default/)).toBe(true);
    });

    test("no inline encryption in bucket resource", () => {
      const bucketBlocks = tf.match(/resource\s+"aws_s3_bucket"[\s\S]*?^\}/gm) || [];
      bucketBlocks.forEach(block => {
        expect(/server_side_encryption_configuration\s*\{/.test(block)).toBe(false);
      });
    });

    test("encryption uses separate resource blocks", () => {
      expect(count(/aws_s3_bucket_server_side_encryption_configuration/g)).toBeGreaterThanOrEqual(2);
    });
  });

  // ========================================================================
  // TEST GROUP 9: PUBLIC ACCESS CONTROL (6 tests)
  // ========================================================================
  describe("Security - Public Access Control", () => {
    test("logging bucket blocks all public access", () => {
      expect(has(/resource\s+"aws_s3_bucket_public_access_block"\s+"logging"/)).toBe(true);
    });

    test("logging bucket has all block settings true", () => {
      const loggingBlock = tf.match(/resource\s+"aws_s3_bucket_public_access_block"\s+"logging"[\s\S]*?^\}/m);
      expect(loggingBlock).toBeTruthy();
      if (loggingBlock) {
        expect(/block_public_acls\s*=\s*true/.test(loggingBlock[0])).toBe(true);
        expect(/block_public_policy\s*=\s*true/.test(loggingBlock[0])).toBe(true);
        expect(/ignore_public_acls\s*=\s*true/.test(loggingBlock[0])).toBe(true);
        expect(/restrict_public_buckets\s*=\s*true/.test(loggingBlock[0])).toBe(true);
      }
    });

    test("static assets bucket has public access block configured", () => {
      expect(has(/resource\s+"aws_s3_bucket_public_access_block"\s+"static_assets"/)).toBe(true);
    });

    test("static assets bucket allows controlled public access", () => {
      const assetsBlock = tf.match(/resource\s+"aws_s3_bucket_public_access_block"\s+"static_assets"[\s\S]*?^\}/m);
      expect(assetsBlock).toBeTruthy();
      if (assetsBlock) {
        expect(/block_public_acls\s*=\s*false/.test(assetsBlock[0])).toBe(true);
        expect(/block_public_policy\s*=\s*false/.test(assetsBlock[0])).toBe(true);
      }
    });

    test("has bucket policy for public access", () => {
      expect(has(/resource\s+"aws_s3_bucket_policy"\s+"static_assets"/)).toBe(true);
    });

    test("bucket policy allows public read only for public/ prefix", () => {
      expect(has(/\/public\/\*/)).toBe(true);
      expect(has(/s3:GetObject/)).toBe(true);
    });
  });

  // ========================================================================
  // TEST GROUP 10: VERSIONING (4 tests)
  // ========================================================================
  describe("Bucket Versioning", () => {
    test("static assets bucket has versioning configured", () => {
      expect(has(/resource\s+"aws_s3_bucket_versioning"\s+"static_assets"/)).toBe(true);
    });

    test("versioning status is Enabled", () => {
      expect(has(/status\s*=\s*"Enabled"/)).toBe(true);
    });

    test("versioning uses separate resource", () => {
      expect(has(/aws_s3_bucket_versioning/)).toBe(true);
    });

    test("versioning references static assets bucket", () => {
      const versioningBlock = tf.match(/resource\s+"aws_s3_bucket_versioning"[\s\S]*?^\}/m);
      expect(versioningBlock).toBeTruthy();
      if (versioningBlock) {
        expect(/bucket\s*=\s*aws_s3_bucket\.static_assets\.id/.test(versioningBlock[0])).toBe(true);
      }
    });
  });

  // ========================================================================
  // TEST GROUP 11: WEBSITE CONFIGURATION (5 tests)
  // ========================================================================
  describe("Website Configuration", () => {
    test("has website configuration resource", () => {
      expect(has(/resource\s+"aws_s3_bucket_website_configuration"\s+"static_assets"/)).toBe(true);
    });

    test("index document is index.html", () => {
      expect(has(/suffix\s*=\s*"index\.html"/)).toBe(true);
    });

    test("has error document configured", () => {
      expect(has(/error_document\s*\{/)).toBe(true);
      expect(has(/key\s*=\s*"error\.html"/)).toBe(true);
    });

    test("website config references static assets bucket", () => {
      const websiteBlock = tf.match(/resource\s+"aws_s3_bucket_website_configuration"[\s\S]*?^\}/m);
      expect(websiteBlock).toBeTruthy();
      if (websiteBlock) {
        expect(/bucket\s*=\s*aws_s3_bucket\.static_assets\.id/.test(websiteBlock[0])).toBe(true);
      }
    });

    test("uses separate website configuration resource", () => {
      expect(has(/aws_s3_bucket_website_configuration/)).toBe(true);
    });
  });

  // ========================================================================
  // TEST GROUP 12: CORS CONFIGURATION (6 tests)
  // ========================================================================
  describe("CORS Configuration", () => {
    test("has CORS configuration resource", () => {
      expect(has(/resource\s+"aws_s3_bucket_cors_configuration"\s+"static_assets"/)).toBe(true);
    });

    test("allows GET requests", () => {
      expect(has(/allowed_methods\s*=\s*\["GET"\]/)).toBe(true);
    });

    test("allows requests from https://example.com", () => {
      expect(has(/allowed_origins\s*=\s*\["https:\/\/example\.com"\]/)).toBe(true);
    });

    test("max_age_seconds is 3600", () => {
      expect(has(/max_age_seconds\s*=\s*3600/)).toBe(true);
    });

    test("has cors_rule block", () => {
      expect(has(/cors_rule\s*\{/)).toBe(true);
    });

    test("exposes ETag header", () => {
      expect(has(/expose_headers\s*=\s*\["ETag"\]/)).toBe(true);
    });
  });

  // ========================================================================
  // TEST GROUP 13: LIFECYCLE RULES (8 tests)
  // ========================================================================
  describe("Lifecycle Configuration", () => {
    test("logging bucket has lifecycle configuration", () => {
      expect(has(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"logging"/)).toBe(true);
    });

    test("static assets bucket has lifecycle configuration", () => {
      expect(has(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"static_assets"/)).toBe(true);
    });

    test("all lifecycle rules have filter blocks", () => {
      const rules = tf.match(/rule\s*\{[\s\S]*?^\s*\}/gm) || [];
      const filtersInRules = rules.filter(rule => /filter\s*\{\s*\}/.test(rule));
      expect(filtersInRules.length).toBeGreaterThan(0);
    });

    test("has transition to Standard-IA after 30 days", () => {
      expect(has(/transition\s*\{/)).toBe(true);
      expect(has(/days\s*=\s*30/)).toBe(true);
      expect(has(/storage_class\s*=\s*"STANDARD_IA"/)).toBe(true);
    });

    test("has multipart upload cleanup after 7 days", () => {
      expect(has(/abort_incomplete_multipart_upload\s*\{/)).toBe(true);
      expect(has(/days_after_initiation\s*=\s*7/)).toBe(true);
    });

    test("logging bucket expires old logs after 90 days", () => {
      expect(has(/expiration\s*\{/)).toBe(true);
      expect(has(/days\s*=\s*90/)).toBe(true);
    });

    test("all lifecycle rules have id and status", () => {
      const lifecycleRules = tf.match(/resource\s+"aws_s3_bucket_lifecycle_configuration"[\s\S]*?^\}/gm) || [];
      lifecycleRules.forEach(lifecycleConfig => {
        const rules = lifecycleConfig.match(/rule\s*\{[\s\S]*?^\s*\}/gm) || [];
        rules.forEach(rule => {
          expect(/id\s*=/.test(rule)).toBe(true);
          expect(/status\s*=\s*"Enabled"/.test(rule)).toBe(true);
        });
      });
    });

    test("uses separate lifecycle configuration resources", () => {
      expect(count(/aws_s3_bucket_lifecycle_configuration/g)).toBeGreaterThanOrEqual(2);
    });
  });

  // ========================================================================
  // TEST GROUP 14: LOGGING CONFIGURATION (5 tests)
  // ========================================================================
  describe("Logging Configuration", () => {
    test("static assets bucket has logging configured", () => {
      expect(has(/resource\s+"aws_s3_bucket_logging"\s+"static_assets"/)).toBe(true);
    });

    test("logs to separate logging bucket", () => {
      expect(has(/target_bucket\s*=\s*aws_s3_bucket\.logging\.id/)).toBe(true);
    });

    test("has target prefix for logs", () => {
      expect(has(/target_prefix\s*=\s*"access-logs\/"/)).toBe(true);
    });

    test("logging bucket has proper ACL configuration", () => {
      expect(has(/resource\s+"aws_s3_bucket_acl"\s+"logging"/)).toBe(true);
      expect(has(/acl\s*=\s*"log-delivery-write"/)).toBe(true);
    });

    test("logging bucket has ownership controls", () => {
      expect(has(/resource\s+"aws_s3_bucket_ownership_controls"\s+"logging"/)).toBe(true);
      expect(has(/object_ownership\s*=\s*"BucketOwnerPreferred"/)).toBe(true);
    });
  });

  // ========================================================================
  // TEST GROUP 15: IAM ROLE AND POLICIES (8 tests)
  // ========================================================================
  describe("IAM Role and Policies", () => {
    test("creates IAM role for EC2", () => {
      expect(has(/resource\s+"aws_iam_role"\s+"ec2_s3_upload"/)).toBe(true);
    });

    test("IAM role has assume role policy for EC2", () => {
      expect(has(/assume_role_policy\s*=/)).toBe(true);
      expect(has(/Service.*ec2\.amazonaws\.com/)).toBe(true);
    });

    test("creates IAM policy for S3 upload", () => {
      expect(has(/resource\s+"aws_iam_policy"\s+"s3_upload"/)).toBe(true);
    });

    test("IAM policy allows S3 operations", () => {
      expect(has(/s3:PutObject/)).toBe(true);
      expect(has(/s3:GetObject/)).toBe(true);
      expect(has(/s3:DeleteObject/)).toBe(true);
      expect(has(/s3:ListBucket/)).toBe(true);
    });

    test("attaches policy to role", () => {
      expect(has(/resource\s+"aws_iam_role_policy_attachment"\s+"ec2_s3_upload"/)).toBe(true);
    });

    test("creates instance profile", () => {
      expect(has(/resource\s+"aws_iam_instance_profile"\s+"ec2_s3_upload"/)).toBe(true);
    });

    test("policies use jsonencode", () => {
      expect(count(/jsonencode\s*\(/g)).toBeGreaterThan(0);
    });

    test("IAM resources reference bucket ARN", () => {
      expect(has(/aws_s3_bucket\.static_assets\.arn/)).toBe(true);
    });
  });

  // ========================================================================
  // TEST GROUP 16: OUTPUTS (7 tests)
  // ========================================================================
  describe("Output Definitions", () => {
    test("has output for bucket name", () => {
      expect(has(/output\s+"bucket_name"/)).toBe(true);
    });

    test("has output for website endpoint", () => {
      expect(has(/output\s+"bucket_website_endpoint"/)).toBe(true);
    });

    test("has output for EC2 instance profile", () => {
      expect(has(/output\s+"ec2_instance_profile_name"/)).toBe(true);
    });

    test("has output for logging bucket", () => {
      expect(has(/output\s+"logging_bucket_name"/)).toBe(true);
    });

    test("all outputs have descriptions", () => {
      const outputs = tf.match(/output\s+"[^"]+"/g) || [];
      const descriptions = count(/description\s*=/g);
      expect(descriptions).toBeGreaterThanOrEqual(outputs.length);
    });

    test("outputs reference resource attributes", () => {
      expect(has(/aws_s3_bucket\.static_assets\.id/)).toBe(true);
      expect(has(/aws_s3_bucket_website_configuration\.static_assets\.website_endpoint/)).toBe(true);
    });

    test("no hardcoded values in outputs", () => {
      const outputBlocks = tf.match(/output\s+"[^"]+"\s*\{[\s\S]*?\n\}/g) || [];
      outputBlocks.forEach(output => {
        const valueMatch = output.match(/value\s*=\s*"[^$][^"]+"/);
        expect(valueMatch).toBeNull();
      });
    });
  });

  // ========================================================================
  // TEST GROUP 17: AWS PROVIDER 5.x COMPLIANCE (7 tests)
  // ========================================================================
  describe("AWS Provider 5.x Compliance", () => {
    test("uses separate versioning resource", () => {
      expect(has(/aws_s3_bucket_versioning/)).toBe(true);
    });

    test("uses separate encryption resource", () => {
      expect(has(/aws_s3_bucket_server_side_encryption_configuration/)).toBe(true);
    });

    test("uses separate lifecycle resource", () => {
      expect(has(/aws_s3_bucket_lifecycle_configuration/)).toBe(true);
    });

    test("uses separate CORS resource", () => {
      expect(has(/aws_s3_bucket_cors_configuration/)).toBe(true);
    });

    test("uses separate website configuration resource", () => {
      expect(has(/aws_s3_bucket_website_configuration/)).toBe(true);
    });

    test("uses separate logging resource", () => {
      expect(has(/aws_s3_bucket_logging/)).toBe(true);
    });

    test("uses separate public access block resource", () => {
      expect(has(/aws_s3_bucket_public_access_block/)).toBe(true);
    });
  });

  // ========================================================================
  // TEST GROUP 18: DESTROYABILITY (5 tests)
  // ========================================================================
  describe("Resource Destroyability", () => {
    test("no prevent_destroy lifecycle policies", () => {
      expect(has(/prevent_destroy\s*=\s*true/)).toBe(false);
    });

    test("no DeletionPolicy Retain", () => {
      expect(has(/DeletionPolicy.*Retain/i)).toBe(false);
    });

    test("buckets can be destroyed", () => {
      const bucketBlocks = tf.match(/resource\s+"aws_s3_bucket"[\s\S]*?^\}/gm) || [];
      bucketBlocks.forEach(block => {
        expect(/prevent_destroy/.test(block)).toBe(false);
      });
    });

    test("IAM resources can be destroyed", () => {
      expect(has(/prevent_destroy\s*=\s*true/)).toBe(false);
    });

    test("all resources fully managed by Terraform", () => {
      expect(has(/import\s*\{/)).toBe(false);
    });
  });

  // ========================================================================
  // TEST GROUP 19: DEPENDENCIES (5 tests)
  // ========================================================================
  describe("Resource Dependencies", () => {
    test("bucket policy depends on public access block", () => {
      const policyBlock = tf.match(/resource\s+"aws_s3_bucket_policy"[\s\S]*?^\}/m);
      expect(policyBlock).toBeTruthy();
      if (policyBlock) {
        expect(/depends_on\s*=\s*\[aws_s3_bucket_public_access_block/.test(policyBlock[0])).toBe(true);
      }
    });

    test("bucket ACL depends on ownership controls", () => {
      const aclBlock = tf.match(/resource\s+"aws_s3_bucket_acl"[\s\S]*?^\}/m);
      expect(aclBlock).toBeTruthy();
      if (aclBlock) {
        expect(/depends_on/.test(aclBlock[0])).toBe(true);
      }
    });

    test("policy attachment references role", () => {
      expect(has(/role\s*=\s*aws_iam_role\.ec2_s3_upload\.name/)).toBe(true);
    });

    test("instance profile references role", () => {
      const profileBlock = tf.match(/resource\s+"aws_iam_instance_profile"[\s\S]*?^\}/m);
      expect(profileBlock).toBeTruthy();
      if (profileBlock) {
        expect(/role\s*=\s*aws_iam_role/.test(profileBlock[0])).toBe(true);
      }
    });

    test("logging configuration references logging bucket", () => {
      expect(has(/target_bucket\s*=\s*aws_s3_bucket\.logging\.id/)).toBe(true);
    });
  });

  // ========================================================================
  // TEST GROUP 20: BEST PRACTICES (6 tests)
  // ========================================================================
  describe("Terraform Best Practices", () => {
    test("uses data sources for dynamic values", () => {
      expect(has(/data\s+"aws_/)).toBe(true);
    });

    test("uses locals for reusable values", () => {
      expect(has(/locals\s*\{/)).toBe(true);
    });

    test("consistent resource naming pattern", () => {
      expect(has(/\$\{local\.bucket_prefix\}/)).toBe(true);
      expect(has(/\$\{random_string\.bucket_suffix\.result\}/)).toBe(true);
    });

    test("all resources properly tagged", () => {
      expect(count(/tags\s*=\s*local\.common_tags/g)).toBeGreaterThan(0);
    });

    test("policies use jsonencode not heredoc", () => {
      expect(has(/jsonencode\s*\(/)).toBe(true);
      expect(has(/<<EOF/)).toBe(false);
    });

    test("descriptive resource names", () => {
      const resources = tf.match(/resource\s+"[^"]+"\s+"([^"]+)"/g) || [];
      resources.forEach(resource => {
        const name = resource.match(/"([^"]+)"$/)?.[1];
        expect(name).toBeDefined();
        expect(name!.length).toBeGreaterThan(2);
      });
    });
  });
});