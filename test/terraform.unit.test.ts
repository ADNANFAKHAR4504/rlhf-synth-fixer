// test/terraform.unit.test.ts
// Unit tests for S3 Static Website Hosting
// Static code analysis - validates configuration before deployment
// NO Terraform commands - just reads main.tf file as text

import fs from "fs";
import path from "path";

// Path to main.tf in lib/ folder
const TERRAFORM_FILE = path.resolve(__dirname, "../lib/main.tf");

let tf: string;

beforeAll(() => {
  if (!fs.existsSync(TERRAFORM_FILE)) {
    throw new Error(`Terraform file not found at: ${TERRAFORM_FILE}`);
  }
  tf = fs.readFileSync(TERRAFORM_FILE, "utf8");
});

// Helper function to test regex patterns
function has(rx: RegExp): boolean {
  return rx.test(tf);
}

// Helper to count occurrences
function count(rx: RegExp): number {
  return (tf.match(rx) || []).length;
}

describe("S3 Static Website - Unit Tests", () => {
  
  // ==========================================================================
  // TEST GROUP 1: FILE STRUCTURE AND PROVIDER
  // ==========================================================================
  describe("File Structure and Provider", () => {
    test("main.tf exists and is non-trivial", () => {
      expect(tf).toBeDefined();
      expect(tf.length).toBeGreaterThan(1000);
      expect(tf).toMatch(/resource|output/);
    });

    test("has AWS provider configuration", () => {
      const providerFile = path.resolve(__dirname, "../lib/provider.tf");
      const hasProviderInMain = /terraform\s*{/.test(tf) || /provider\s+"aws"/.test(tf);
      const hasProviderFile = fs.existsSync(providerFile);
      
      expect(hasProviderInMain || hasProviderFile).toBe(true);
    });

    test("specifies AWS region variable", () => {
      expect(has(/variable\s+"aws_region"/)).toBe(true);
      expect(has(/default\s*=\s*"us-west-2"/)).toBe(true);
    });

    test("uses data sources for AWS account info", () => {
      expect(has(/data\s+"aws_caller_identity"\s+"current"/)).toBe(true);
      expect(has(/data\s+"aws_region"\s+"current"/)).toBe(true);
    });
  });

  // ==========================================================================
  // TEST GROUP 2: S3 BUCKET CONFIGURATION
  // ==========================================================================
  describe("S3 Bucket Configuration", () => {
    test("S3 bucket resource exists", () => {
      expect(has(/resource\s+"aws_s3_bucket"\s+"media_assets"/)).toBe(true);
    });

    test("bucket name uses media-assets prefix", () => {
      expect(has(/bucket\s*=\s*"media-assets-\$\{random_string\.bucket_suffix\.result\}"/)).toBe(true);
    });

    test("bucket name uses random suffix for uniqueness", () => {
      expect(has(/random_string\.bucket_suffix\.result/)).toBe(true);
    });

    test("random string resource configured correctly", () => {
      expect(has(/resource\s+"random_string"\s+"bucket_suffix"/)).toBe(true);
      expect(has(/length\s*=\s*8/)).toBe(true);
      expect(has(/lower\s*=\s*true/)).toBe(true);
      expect(has(/upper\s*=\s*false/)).toBe(true);
      expect(has(/numeric\s*=\s*true/)).toBe(true);
      expect(has(/special\s*=\s*false/)).toBe(true);
    });

    test("bucket uses common tags", () => {
      expect(has(/tags\s*=\s*local\.common_tags/)).toBe(true);
    });
  });

  // ==========================================================================
  // TEST GROUP 3: VERSIONING CONFIGURATION
  // ==========================================================================
  describe("Bucket Versioning", () => {
    test("versioning resource exists", () => {
      expect(has(/resource\s+"aws_s3_bucket_versioning"\s+"media_assets"/)).toBe(true);
    });

    test("versioning is enabled", () => {
      expect(has(/status\s*=\s*"Enabled"/)).toBe(true);
    });

    test("versioning references bucket correctly", () => {
      expect(has(/bucket\s*=\s*aws_s3_bucket\.media_assets\.id/)).toBe(true);
    });
  });

  // ==========================================================================
  // TEST GROUP 4: ENCRYPTION CONFIGURATION
  // ==========================================================================
  describe("Server-Side Encryption", () => {
    test("encryption configuration resource exists", () => {
      expect(has(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"media_assets"/)).toBe(true);
    });

    test("uses AES256 encryption (SSE-S3)", () => {
      expect(has(/sse_algorithm\s*=\s*"AES256"/)).toBe(true);
    });

    test("encryption references bucket correctly", () => {
      const encryptionBlock = tf.match(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"[^}]+bucket\s*=\s*([^\n]+)/);
      expect(encryptionBlock).toBeTruthy();
      expect(encryptionBlock![1]).toContain("aws_s3_bucket.media_assets");
    });

    test("does not use customer managed KMS keys", () => {
      expect(has(/kms_master_key_id/)).toBe(false);
      expect(has(/aws:kms/)).toBe(false);
    });
  });

  // ==========================================================================
  // TEST GROUP 5: STATIC WEBSITE HOSTING
  // ==========================================================================
  describe("Static Website Hosting", () => {
    test("website configuration resource exists", () => {
      expect(has(/resource\s+"aws_s3_bucket_website_configuration"\s+"media_assets"/)).toBe(true);
    });

    test("index document is index.html", () => {
      expect(has(/suffix\s*=\s*"index\.html"/)).toBe(true);
    });

    test("error document is error.html", () => {
      expect(has(/key\s*=\s*"error\.html"/)).toBe(true);
    });

    test("website configuration references bucket", () => {
      const websiteBlock = tf.match(/resource\s+"aws_s3_bucket_website_configuration"[^}]+bucket\s*=\s*([^\n]+)/);
      expect(websiteBlock).toBeTruthy();
      expect(websiteBlock![1]).toContain("aws_s3_bucket.media_assets");
    });
  });

  // ==========================================================================
  // TEST GROUP 6: CORS CONFIGURATION
  // ==========================================================================
  describe("CORS Configuration", () => {
    test("CORS configuration resource exists", () => {
      expect(has(/resource\s+"aws_s3_bucket_cors_configuration"\s+"media_assets"/)).toBe(true);
    });

    test("allows GET method", () => {
      // Check that GET is included in allowed_methods
      expect(has(/allowed_methods\s*=\s*\[\s*"GET"\s*\]/)).toBe(true);
    });

    test("does not include OPTIONS method (not supported by S3 static websites)", () => {
      // S3 static website hosting does not support OPTIONS method
      expect(has(/allowed_methods\s*=\s*\[\s*"GET",\s*"OPTIONS"\s*\]/)).toBe(false);
    });

    test("allows all origins", () => {
      expect(has(/allowed_origins\s*=\s*\[\s*"\*"\s*\]/)).toBe(true);
    });

    test("specifies required headers", () => {
      // Check both headers are present
      expect(has(/allowed_headers\s*=\s*\[\s*"Content-Type",\s*"Authorization"\s*\]/)).toBe(true);
    });

    test("max age is 3600 seconds", () => {
      expect(has(/max_age_seconds\s*=\s*3600/)).toBe(true);
    });
  });

  // ==========================================================================
  // TEST GROUP 7: LIFECYCLE CONFIGURATION
  // ==========================================================================
  describe("Lifecycle Configuration", () => {
    test("lifecycle configuration resource exists", () => {
      expect(has(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"media_assets"/)).toBe(true);
    });

    test("has transition rule to Standard-IA", () => {
      expect(has(/id\s*=\s*"transition-to-ia"/)).toBe(true);
    });

    test("rule is enabled", () => {
      expect(has(/status\s*=\s*"Enabled"/)).toBe(true);
    });

    test("transitions after 30 days", () => {
      expect(has(/days\s*=\s*30/)).toBe(true);
    });

    test("transitions to STANDARD_IA storage class", () => {
      expect(has(/storage_class\s*=\s*"STANDARD_IA"/)).toBe(true);
    });

    test("has empty filter to apply to all objects", () => {
      expect(has(/filter\s*\{\}/)).toBe(true);
    });

    test("does not have expiration rules", () => {
      expect(has(/expiration\s*\{/)).toBe(false);
    });
  });

  // ==========================================================================
  // TEST GROUP 8: PUBLIC ACCESS CONFIGURATION
  // ==========================================================================
  describe("Public Access Configuration", () => {
    test("public access block resource exists", () => {
      expect(has(/resource\s+"aws_s3_bucket_public_access_block"\s+"media_assets"/)).toBe(true);
    });

    test("block_public_acls is false", () => {
      expect(has(/block_public_acls\s*=\s*false/)).toBe(true);
    });

    test("block_public_policy is false", () => {
      expect(has(/block_public_policy\s*=\s*false/)).toBe(true);
    });

    test("ignore_public_acls is false", () => {
      expect(has(/ignore_public_acls\s*=\s*false/)).toBe(true);
    });

    test("restrict_public_buckets is false", () => {
      expect(has(/restrict_public_buckets\s*=\s*false/)).toBe(true);
    });
  });

  // ==========================================================================
  // TEST GROUP 9: BUCKET POLICY
  // ==========================================================================
  describe("Bucket Policy", () => {
    test("bucket policy resource exists", () => {
      expect(has(/resource\s+"aws_s3_bucket_policy"\s+"media_assets"/)).toBe(true);
    });

    test("policy allows public read", () => {
      expect(has(/PublicReadGetObject/)).toBe(true);
      expect(has(/Effect\s*=\s*"Allow"/)).toBe(true);
      expect(has(/Principal\s*=\s*"\*"/)).toBe(true);
    });

    test("policy allows s3:GetObject action", () => {
      expect(has(/Action\s*=\s*"s3:GetObject"/)).toBe(true);
    });

    test("policy uses bucket ARN reference", () => {
      expect(has(/\$\{aws_s3_bucket\.media_assets\.arn\}/)).toBe(true);
    });

    test("policy resource includes all objects with /*", () => {
      expect(has(/\$\{aws_s3_bucket\.media_assets\.arn\}\/\*/)).toBe(true);
    });

    test("policy depends on public access block", () => {
      expect(has(/depends_on\s*=\s*\[\s*aws_s3_bucket_public_access_block\.media_assets\s*\]/)).toBe(true);
    });
  });

  // ==========================================================================
  // TEST GROUP 10: TAGGING COMPLIANCE
  // ==========================================================================
  describe("Tagging Compliance", () => {
    test("common_tags defined in locals", () => {
      expect(has(/locals\s*\{/)).toBe(true);
      expect(has(/common_tags\s*=/)).toBe(true);
    });

    test("Environment tag is production", () => {
      expect(has(/Environment\s*=\s*"production"/)).toBe(true);
    });

    test("Project tag is media-launch", () => {
      expect(has(/Project\s*=\s*"media-launch"/)).toBe(true);
    });

    test("bucket uses common_tags", () => {
      expect(has(/tags\s*=\s*local\.common_tags/)).toBe(true);
    });
  });

  // ==========================================================================
  // TEST GROUP 11: OUTPUT DEFINITIONS
  // ==========================================================================
  describe("Output Definitions", () => {
    test("bucket_name output exists", () => {
      expect(has(/output\s+"bucket_name"/)).toBe(true);
    });

    test("website_endpoint output exists", () => {
      expect(has(/output\s+"website_endpoint"/)).toBe(true);
    });

    test("bucket_arn output exists", () => {
      expect(has(/output\s+"bucket_arn"/)).toBe(true);
    });

    test("bucket_name references bucket id", () => {
      expect(has(/value\s*=\s*aws_s3_bucket\.media_assets\.id/)).toBe(true);
    });

    test("website_endpoint references website configuration", () => {
      expect(has(/value\s*=\s*aws_s3_bucket_website_configuration\.media_assets\.website_endpoint/)).toBe(true);
    });

    test("bucket_arn references bucket arn", () => {
      expect(has(/value\s*=\s*aws_s3_bucket\.media_assets\.arn/)).toBe(true);
    });

    test("all outputs have descriptions", () => {
      const outputs = tf.match(/output\s+"[^"]+"/g) || [];
      const descriptions = tf.match(/description\s*=/g) || [];
      expect(descriptions.length).toBeGreaterThanOrEqual(outputs.length);
    });
  });

  // ==========================================================================
  // TEST GROUP 12: BEST PRACTICES
  // ==========================================================================
  describe("Best Practices", () => {
    test("no hardcoded bucket names", () => {
      const hardcodedBuckets = tf.match(/"media-assets-[a-z0-9]{8}"/g);
      expect(hardcodedBuckets).toBeNull();
    });

    test("uses resource references not hardcoded ARNs", () => {
      expect(has(/aws_s3_bucket\.media_assets\./)).toBe(true);
    });

    test("no placeholder values", () => {
      expect(has(/REPLACE|TODO|CHANGEME|PLACEHOLDER|EXAMPLE/i)).toBe(false);
    });

    test("uses jsonencode for policies", () => {
      expect(has(/jsonencode\s*\(/)).toBe(true);
    });

    test("bucket references use .id not .bucket", () => {
      const bucketRefs = tf.match(/aws_s3_bucket\.media_assets\.(id|bucket)/g);
      expect(bucketRefs).toBeTruthy();
      // Most should use .id
      const idCount = (tf.match(/aws_s3_bucket\.media_assets\.id/g) || []).length;
      expect(idCount).toBeGreaterThan(0);
    });

    test("all S3 configuration resources reference the main bucket", () => {
      expect(count(/aws_s3_bucket\.media_assets/g)).toBeGreaterThan(5);
    });
  });

  // ==========================================================================
  // TEST GROUP 13: SECURITY FEATURES
  // ==========================================================================
  describe("Security Features", () => {
    test("encryption is enabled", () => {
      expect(has(/aws_s3_bucket_server_side_encryption_configuration/)).toBe(true);
    });

    test("versioning is enabled for audit trail", () => {
      expect(has(/status\s*=\s*"Enabled"/)).toBe(true);
    });

    test("public access is intentionally configured", () => {
      // Public access is allowed for static website, but should be explicit
      expect(has(/aws_s3_bucket_public_access_block/)).toBe(true);
    });

    test("bucket policy is explicitly defined", () => {
      expect(has(/aws_s3_bucket_policy/)).toBe(true);
    });
  });

  // ==========================================================================
  // TEST GROUP 14: RESOURCE COUNT VALIDATION
  // ==========================================================================
  describe("Resource Count Validation", () => {
    test("has exactly one S3 bucket", () => {
      expect(count(/resource\s+"aws_s3_bucket"\s+"media_assets"/)).toBe(1);
    });

    test("has exactly one random_string resource", () => {
      expect(count(/resource\s+"random_string"\s+"bucket_suffix"/)).toBe(1);
    });

    test("has all required S3 configuration resources", () => {
      const requiredResources = [
        'aws_s3_bucket_versioning',
        'aws_s3_bucket_server_side_encryption_configuration',
        'aws_s3_bucket_website_configuration',
        'aws_s3_bucket_cors_configuration',
        'aws_s3_bucket_lifecycle_configuration',
        'aws_s3_bucket_public_access_block',
        'aws_s3_bucket_policy'
      ];

      requiredResources.forEach(resource => {
        expect(has(new RegExp(`resource\\s+"${resource}"`))).toBe(true);
      });
    });

    test("has exactly 3 outputs", () => {
      expect(count(/output\s+"[^"]+"/g)).toBe(3);
    });
  });
});