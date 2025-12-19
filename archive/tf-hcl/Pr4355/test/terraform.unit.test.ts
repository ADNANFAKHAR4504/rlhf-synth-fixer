// test/terraform.unit.test.ts
// Unit tests for S3 Media Assets Storage
// Static code analysis - validates configuration before deployment
// NO Terraform commands - just reads main.tf file as text

import fs from "fs";
import path from "path";

const TERRAFORM_FILE = path.resolve(__dirname, "../lib/main.tf");
let tf: string;

beforeAll(() => {
  if (!fs.existsSync(TERRAFORM_FILE)) {
    throw new Error(`Terraform file not found at: ${TERRAFORM_FILE}`);
  }
  tf = fs.readFileSync(TERRAFORM_FILE, "utf8");
});

// Helper functions
function has(rx: RegExp): boolean {
  return rx.test(tf);
}

function count(rx: RegExp): number {
  return (tf.match(rx) || []).length;
}

describe("S3 Media Assets Storage - Unit Tests", () => {
  
  // ============================================================================
  // TEST GROUP 1: FILE STRUCTURE AND DATA SOURCES (5 tests)
  // ============================================================================
  describe("File Structure and Data Sources", () => {
    test("main.tf exists and is non-trivial", () => {
      expect(tf).toBeDefined();
      expect(tf.length).toBeGreaterThan(2000);
      expect(tf).toMatch(/resource|output/);
    });

    test("uses data source for AWS account identity", () => {
      expect(has(/data\s+"aws_caller_identity"\s+"current"/)).toBe(true);
    });

    test("defines locals block with common configuration", () => {
      expect(has(/locals\s*\{/)).toBe(true);
      expect(has(/account_id\s*=/)).toBe(true);
    });

    test("has common_tags defined in locals", () => {
      expect(has(/common_tags\s*=\s*\{/)).toBe(true);
    });

    test("has CORS configuration defined in locals", () => {
      expect(has(/cors_configuration\s*=\s*\{/)).toBe(true);
    });
  });

  // ============================================================================
  // TEST GROUP 2: RANDOM SUFFIX CONFIGURATION (4 tests)
  // ============================================================================
  describe("Random Suffix Configuration", () => {
    test("creates random_string resource for bucket suffix", () => {
      expect(has(/resource\s+"random_string"\s+"bucket_suffix"/)).toBe(true);
    });

    test("random suffix length is 8 characters", () => {
      expect(has(/length\s*=\s*8/)).toBe(true);
    });

    test("random suffix disables special characters", () => {
      expect(has(/special\s*=\s*false/)).toBe(true);
    });

    test("random suffix disables uppercase", () => {
      expect(has(/upper\s*=\s*false/)).toBe(true);
    });
  });

  // ============================================================================
  // TEST GROUP 3: CLOUDFRONT OAI CONFIGURATION (4 tests)
  // ============================================================================
  describe("CloudFront OAI Configuration", () => {
    test("creates CloudFront Origin Access Identity", () => {
      expect(has(/resource\s+"aws_cloudfront_origin_access_identity"\s+"media_oai"/)).toBe(true);
    });

    test("OAI has descriptive comment", () => {
      const oaiBlock = tf.match(/resource\s+"aws_cloudfront_origin_access_identity"[\s\S]*?^\}/m);
      expect(oaiBlock).toBeTruthy();
      if (oaiBlock) {
        expect(/comment\s*=/.test(oaiBlock[0])).toBe(true);
      }
    });

    test("OAI is referenced in prod bucket policy", () => {
      expect(has(/aws_cloudfront_origin_access_identity\.media_oai/)).toBe(true);
    });

    test("OAI IAM ARN is used in bucket policy", () => {
      expect(has(/aws_cloudfront_origin_access_identity\.media_oai\.iam_arn/)).toBe(true);
    });
  });

  // ============================================================================
  // TEST GROUP 4: S3 BUCKET RESOURCES (7 tests)
  // ============================================================================
  describe("S3 Bucket Resources", () => {
    test("creates exactly 3 S3 buckets", () => {
      expect(count(/resource\s+"aws_s3_bucket"\s+"/g)).toBe(3);
    });

    test("creates logs bucket with correct prefix", () => {
      expect(has(/resource\s+"aws_s3_bucket"\s+"logs"/)).toBe(true);
      expect(has(/bucket\s*=\s*"media-assets-logs-/)).toBe(true);
    });

    test("creates dev bucket with correct prefix", () => {
      expect(has(/resource\s+"aws_s3_bucket"\s+"dev"/)).toBe(true);
      expect(has(/bucket\s*=\s*"media-assets-dev-/)).toBe(true);
    });

    test("creates prod bucket with correct prefix", () => {
      expect(has(/resource\s+"aws_s3_bucket"\s+"prod"/)).toBe(true);
      expect(has(/bucket\s*=\s*"media-assets-prod-/)).toBe(true);
    });

    test("all buckets use random suffix for uniqueness", () => {
      const bucketNames = tf.match(/bucket\s*=\s*"media-assets-[^"]+"/g) || [];
      expect(bucketNames.length).toBe(3);
      bucketNames.forEach(name => {
        expect(name).toContain('random_string.bucket_suffix.result');
      });
    });

    test("bucket names follow media-assets- prefix pattern", () => {
      const bucketDeclarations = tf.match(/bucket\s*=\s*"[^"]+"/g) || [];
      const mediaAssetBuckets = bucketDeclarations.filter(b => b.includes('media-assets-'));
      expect(mediaAssetBuckets.length).toBeGreaterThanOrEqual(3);
    });

    test("all buckets have tags defined", () => {
      const s3Buckets = ['logs', 'dev', 'prod'];
      s3Buckets.forEach(bucket => {
        const bucketBlock = new RegExp(`resource\\s+"aws_s3_bucket"\\s+"${bucket}"[\\s\\S]*?tags\\s*=`, 'm');
        expect(has(bucketBlock)).toBe(true);
      });
    });
  });

  // ============================================================================
  // TEST GROUP 5: LOGS BUCKET CONFIGURATION (6 tests)
  // ============================================================================
  describe("Logs Bucket Configuration", () => {
    test("logs bucket has public access block", () => {
      expect(has(/resource\s+"aws_s3_bucket_public_access_block"\s+"logs"/)).toBe(true);
    });

    test("logs bucket has encryption enabled", () => {
      expect(has(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"logs"/)).toBe(true);
    });

    test("logs bucket has lifecycle configuration", () => {
      expect(has(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"logs"/)).toBe(true);
    });

    test("logs bucket lifecycle deletes objects after 90 days", () => {
      const logsLifecycle = tf.match(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"logs"[\s\S]*?(?=resource|$)/);
      expect(logsLifecycle).toBeTruthy();
      if (logsLifecycle) {
        expect(/days\s*=\s*90/.test(logsLifecycle[0])).toBe(true);
        expect(/expiration/.test(logsLifecycle[0])).toBe(true);
      }
    });

    test("logs bucket has bucket policy for S3 logging service", () => {
      expect(has(/resource\s+"aws_s3_bucket_policy"\s+"logs"/)).toBe(true);
    });

    test("logs bucket policy allows logging.s3.amazonaws.com", () => {
      const logsPolicy = tf.match(/resource\s+"aws_s3_bucket_policy"\s+"logs"[\s\S]*?(?=resource|output|$)/);
      expect(logsPolicy).toBeTruthy();
      if (logsPolicy) {
        expect(/logging\.s3\.amazonaws\.com/.test(logsPolicy[0])).toBe(true);
      }
    });
  });

  // ============================================================================
  // TEST GROUP 6: DEV BUCKET CONFIGURATION (7 tests)
  // ============================================================================
  describe("Dev Bucket Configuration", () => {
    test("dev bucket has public access block", () => {
      expect(has(/resource\s+"aws_s3_bucket_public_access_block"\s+"dev"/)).toBe(true);
    });

    test("dev bucket has encryption enabled", () => {
      expect(has(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"dev"/)).toBe(true);
    });

    test("dev bucket has CORS configuration", () => {
      expect(has(/resource\s+"aws_s3_bucket_cors_configuration"\s+"dev"/)).toBe(true);
    });

    test("dev bucket has logging enabled", () => {
      expect(has(/resource\s+"aws_s3_bucket_logging"\s+"dev"/)).toBe(true);
    });

    test("dev bucket has lifecycle configuration", () => {
      expect(has(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"dev"/)).toBe(true);
    });

    test("dev bucket does NOT have versioning enabled", () => {
      expect(has(/resource\s+"aws_s3_bucket_versioning"\s+"dev"/)).toBe(false);
    });

    test("dev bucket lifecycle deletes objects after 30 days", () => {
      const devLifecycle = tf.match(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"dev"[\s\S]*?(?=resource|$)/);
      expect(devLifecycle).toBeTruthy();
      if (devLifecycle) {
        expect(/days\s*=\s*30/.test(devLifecycle[0])).toBe(true);
        expect(/expiration/.test(devLifecycle[0])).toBe(true);
      }
    });
  });

  // ============================================================================
  // TEST GROUP 7: PROD BUCKET CONFIGURATION (8 tests)
  // ============================================================================
  describe("Prod Bucket Configuration", () => {
    test("prod bucket has public access block", () => {
      expect(has(/resource\s+"aws_s3_bucket_public_access_block"\s+"prod"/)).toBe(true);
    });

    test("prod bucket has versioning enabled", () => {
      expect(has(/resource\s+"aws_s3_bucket_versioning"\s+"prod"/)).toBe(true);
    });

    test("prod bucket versioning status is Enabled", () => {
      const prodVersioning = tf.match(/resource\s+"aws_s3_bucket_versioning"\s+"prod"[\s\S]*?(?=resource|$)/);
      expect(prodVersioning).toBeTruthy();
      if (prodVersioning) {
        expect(/status\s*=\s*"Enabled"/.test(prodVersioning[0])).toBe(true);
      }
    });

    test("prod bucket has encryption enabled", () => {
      expect(has(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"prod"/)).toBe(true);
    });

    test("prod bucket has CORS configuration", () => {
      expect(has(/resource\s+"aws_s3_bucket_cors_configuration"\s+"prod"/)).toBe(true);
    });

    test("prod bucket has logging enabled", () => {
      expect(has(/resource\s+"aws_s3_bucket_logging"\s+"prod"/)).toBe(true);
    });

    test("prod bucket has lifecycle configuration", () => {
      expect(has(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"prod"/)).toBe(true);
    });

    test("prod bucket has bucket policy for CloudFront", () => {
      expect(has(/resource\s+"aws_s3_bucket_policy"\s+"prod"/)).toBe(true);
    });
  });

  // ============================================================================
  // TEST GROUP 8: SERVER-SIDE ENCRYPTION (6 tests)
  // ============================================================================
  describe("Server-Side Encryption", () => {
    test("all 3 buckets have encryption configuration", () => {
      expect(count(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/g)).toBe(3);
    });

    test("logs bucket uses AES256 encryption", () => {
      const logsEnc = tf.match(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"logs"[\s\S]*?(?=resource|$)/);
      expect(logsEnc).toBeTruthy();
      if (logsEnc) {
        expect(/sse_algorithm\s*=\s*"AES256"/.test(logsEnc[0])).toBe(true);
      }
    });

    test("dev bucket uses AES256 encryption", () => {
      const devEnc = tf.match(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"dev"[\s\S]*?(?=resource|$)/);
      expect(devEnc).toBeTruthy();
      if (devEnc) {
        expect(/sse_algorithm\s*=\s*"AES256"/.test(devEnc[0])).toBe(true);
      }
    });

    test("prod bucket uses AES256 encryption", () => {
      const prodEnc = tf.match(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"prod"[\s\S]*?(?=resource|$)/);
      expect(prodEnc).toBeTruthy();
      if (prodEnc) {
        expect(/sse_algorithm\s*=\s*"AES256"/.test(prodEnc[0])).toBe(true);
      }
    });

    test("encryption uses apply_server_side_encryption_by_default", () => {
      expect(count(/apply_server_side_encryption_by_default/g)).toBe(3);
    });

    test("no KMS keys are used (AES256 only)", () => {
      expect(has(/kms_master_key_id/)).toBe(false);
      expect(has(/aws:kms/)).toBe(false);
    });
  });

  // ============================================================================
  // TEST GROUP 9: CORS CONFIGURATION (5 tests)
  // ============================================================================
  describe("CORS Configuration", () => {
    test("CORS configuration defined in locals", () => {
      expect(has(/cors_configuration\s*=\s*\{/)).toBe(true);
    });

    test("CORS allows GET and HEAD methods", () => {
      const corsConfig = tf.match(/cors_configuration\s*=\s*\{[\s\S]*?\n\s*\}/);
      expect(corsConfig).toBeTruthy();
      if (corsConfig) {
        const hasGetMethod = /allowed_methods/.test(corsConfig[0]) && /"GET"/.test(corsConfig[0]);
        const hasHeadMethod = /"HEAD"/.test(corsConfig[0]);
        expect(hasGetMethod).toBe(true);
        expect(hasHeadMethod).toBe(true);
      }
    });

    test("CORS allows origin https://example.com", () => {
      const corsConfig = tf.match(/cors_configuration\s*=\s*\{[\s\S]*?\n\s*\}/);
      expect(corsConfig).toBeTruthy();
      if (corsConfig) {
        expect(/https:\/\/example\.com/.test(corsConfig[0])).toBe(true);
      }
    });

    test("dev bucket has CORS configuration resource", () => {
      expect(has(/resource\s+"aws_s3_bucket_cors_configuration"\s+"dev"/)).toBe(true);
    });

    test("prod bucket has CORS configuration resource", () => {
      expect(has(/resource\s+"aws_s3_bucket_cors_configuration"\s+"prod"/)).toBe(true);
    });
  });

  // ============================================================================
  // TEST GROUP 10: LIFECYCLE RULES (7 tests)
  // ============================================================================
  describe("Lifecycle Rules", () => {
    test("all 3 buckets have lifecycle configuration", () => {
      expect(count(/resource\s+"aws_s3_bucket_lifecycle_configuration"/g)).toBe(3);
    });

    test("dev bucket lifecycle rule has id", () => {
      const devLifecycle = tf.match(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"dev"[\s\S]*?(?=resource|$)/);
      expect(devLifecycle).toBeTruthy();
      if (devLifecycle) {
        expect(/id\s*=\s*"delete-old-dev-objects"/.test(devLifecycle[0])).toBe(true);
      }
    });

    test("dev bucket lifecycle status is Enabled", () => {
      const devLifecycle = tf.match(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"dev"[\s\S]*?(?=resource|$)/);
      expect(devLifecycle).toBeTruthy();
      if (devLifecycle) {
        expect(/status\s*=\s*"Enabled"/.test(devLifecycle[0])).toBe(true);
      }
    });

    test("prod bucket lifecycle transitions to GLACIER after 90 days", () => {
      const prodLifecycle = tf.match(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"prod"[\s\S]*?(?=resource|output|$)/);
      expect(prodLifecycle).toBeTruthy();
      if (prodLifecycle) {
        expect(/transition/.test(prodLifecycle[0])).toBe(true);
        expect(/days\s*=\s*90/.test(prodLifecycle[0])).toBe(true);
        expect(/storage_class\s*=\s*"GLACIER"/.test(prodLifecycle[0])).toBe(true);
      }
    });

    test("prod bucket lifecycle does NOT delete objects", () => {
      const prodLifecycle = tf.match(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"prod"[\s\S]*?(?=resource|output|$)/);
      expect(prodLifecycle).toBeTruthy();
      if (prodLifecycle) {
        expect(/expiration\s*\{/.test(prodLifecycle[0])).toBe(false);
      }
    });

    test("logs bucket lifecycle deletes after 90 days", () => {
      const logsLifecycle = tf.match(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"logs"[\s\S]*?(?=resource|$)/);
      expect(logsLifecycle).toBeTruthy();
      if (logsLifecycle) {
        expect(/expiration/.test(logsLifecycle[0])).toBe(true);
        expect(/days\s*=\s*90/.test(logsLifecycle[0])).toBe(true);
      }
    });

    test("lifecycle rules use aws_s3_bucket_lifecycle_configuration resource", () => {
      const bucketResources = tf.match(/resource\s+"aws_s3_bucket"\s+"(dev|prod|logs)"[\s\S]*?^\}/gm) || [];
      bucketResources.forEach(bucket => {
        expect(/lifecycle\s*\{/.test(bucket)).toBe(false);
      });
    });
  });

  // ============================================================================
  // TEST GROUP 11: PUBLIC ACCESS BLOCK (5 tests)
  // ============================================================================
  describe("Public Access Block", () => {
    test("all 3 buckets have public access block", () => {
      expect(count(/resource\s+"aws_s3_bucket_public_access_block"/g)).toBe(3);
    });

    test("all buckets block public ACLs", () => {
      expect(count(/block_public_acls\s*=\s*true/g)).toBe(3);
    });

    test("all buckets block public policy", () => {
      expect(count(/block_public_policy\s*=\s*true/g)).toBe(3);
    });

    test("all buckets ignore public ACLs", () => {
      expect(count(/ignore_public_acls\s*=\s*true/g)).toBe(3);
    });

    test("all buckets restrict public buckets", () => {
      expect(count(/restrict_public_buckets\s*=\s*true/g)).toBe(3);
    });
  });

  // ============================================================================
  // TEST GROUP 12: BUCKET POLICIES (6 tests)
  // ============================================================================
  describe("Bucket Policies", () => {
    test("bucket policies use separate aws_s3_bucket_policy resources", () => {
      expect(count(/resource\s+"aws_s3_bucket_policy"/g)).toBe(2);
    });

    test("bucket policies use jsonencode", () => {
      expect(count(/jsonencode\s*\(/g)).toBeGreaterThanOrEqual(2);
    });

    test("prod bucket policy allows CloudFront OAI GetObject", () => {
      const prodPolicy = tf.match(/resource\s+"aws_s3_bucket_policy"\s+"prod"[\s\S]*?(?=resource|output|$)/);
      expect(prodPolicy).toBeTruthy();
      if (prodPolicy) {
        expect(/s3:GetObject/.test(prodPolicy[0])).toBe(true);
        expect(/aws_cloudfront_origin_access_identity\.media_oai/.test(prodPolicy[0])).toBe(true);
      }
    });

    test("prod bucket policy allows GetObjectVersion", () => {
      const prodPolicy = tf.match(/resource\s+"aws_s3_bucket_policy"\s+"prod"[\s\S]*?(?=resource|output|$)/);
      expect(prodPolicy).toBeTruthy();
      if (prodPolicy) {
        expect(/s3:GetObjectVersion/.test(prodPolicy[0])).toBe(true);
      }
    });

    test("prod bucket policy allows ListBucket", () => {
      const prodPolicy = tf.match(/resource\s+"aws_s3_bucket_policy"\s+"prod"[\s\S]*?(?=resource|output|$)/);
      expect(prodPolicy).toBeTruthy();
      if (prodPolicy) {
        expect(/s3:ListBucket/.test(prodPolicy[0])).toBe(true);
      }
    });

    test("logs bucket policy grants access to logging service", () => {
      const logsPolicy = tf.match(/resource\s+"aws_s3_bucket_policy"\s+"logs"[\s\S]*?(?=resource|$)/);
      expect(logsPolicy).toBeTruthy();
      if (logsPolicy) {
        expect(/s3:PutObject/.test(logsPolicy[0])).toBe(true);
        expect(/logging\.s3\.amazonaws\.com/.test(logsPolicy[0])).toBe(true);
      }
    });
  });

  // ============================================================================
  // TEST GROUP 13: LOGGING CONFIGURATION (5 tests)
  // ============================================================================
  describe("Logging Configuration", () => {
    test("dev bucket has logging enabled", () => {
      expect(has(/resource\s+"aws_s3_bucket_logging"\s+"dev"/)).toBe(true);
    });

    test("prod bucket has logging enabled", () => {
      expect(has(/resource\s+"aws_s3_bucket_logging"\s+"prod"/)).toBe(true);
    });

    test("dev bucket logs to logs bucket with dev-logs/ prefix", () => {
      const devLogging = tf.match(/resource\s+"aws_s3_bucket_logging"\s+"dev"[\s\S]*?(?=resource|$)/);
      expect(devLogging).toBeTruthy();
      if (devLogging) {
        expect(/target_bucket\s*=\s*aws_s3_bucket\.logs\.id/.test(devLogging[0])).toBe(true);
        expect(/target_prefix\s*=\s*"dev-logs\/"/.test(devLogging[0])).toBe(true);
      }
    });

    test("prod bucket logs to logs bucket with prod-logs/ prefix", () => {
      const prodLogging = tf.match(/resource\s+"aws_s3_bucket_logging"\s+"prod"[\s\S]*?(?=resource|$)/);
      expect(prodLogging).toBeTruthy();
      if (prodLogging) {
        expect(/target_bucket\s*=\s*aws_s3_bucket\.logs\.id/.test(prodLogging[0])).toBe(true);
        expect(/target_prefix\s*=\s*"prod-logs\/"/.test(prodLogging[0])).toBe(true);
      }
    });

    test("logging uses aws_s3_bucket_logging resource", () => {
      expect(count(/resource\s+"aws_s3_bucket_logging"/g)).toBe(2);
    });
  });

  // ============================================================================
  // TEST GROUP 14: TAGGING COMPLIANCE (5 tests)
  // ============================================================================
  describe("Tagging Compliance", () => {
    test("common_tags defined in locals", () => {
      expect(has(/common_tags\s*=\s*\{/)).toBe(true);
    });

    test("common_tags include Project tag", () => {
      const commonTags = tf.match(/common_tags\s*=\s*\{[\s\S]*?\n\s*\}/);
      expect(commonTags).toBeTruthy();
      if (commonTags) {
        expect(/Project\s*=/.test(commonTags[0])).toBe(true);
      }
    });

    test("common_tags include Owner tag", () => {
      const commonTags = tf.match(/common_tags\s*=\s*\{[\s\S]*?\n\s*\}/);
      expect(commonTags).toBeTruthy();
      if (commonTags) {
        expect(/Owner\s*=/.test(commonTags[0])).toBe(true);
      }
    });

    test("buckets use merge function for tags", () => {
      expect(has(/merge\s*\(\s*local\.common_tags/)).toBe(true);
    });

    test("all buckets have Environment and Purpose tags", () => {
      const bucketResources = tf.match(/resource\s+"aws_s3_bucket"\s+"(dev|prod|logs)"[\s\S]*?tags\s*=[\s\S]*?\n\s*\)/g) || [];
      expect(bucketResources.length).toBe(3);
      bucketResources.forEach(bucket => {
        expect(/Environment\s*=/.test(bucket)).toBe(true);
        expect(/Purpose\s*=/.test(bucket)).toBe(true);
      });
    });
  });

  // ============================================================================
  // TEST GROUP 15: OUTPUT DEFINITIONS (6 tests)
  // ============================================================================
  describe("Output Definitions", () => {
    test("has exactly 10 outputs", () => {
      expect(count(/output\s+"[^"]+"/g)).toBe(10);
    });

    test("all outputs have descriptions", () => {
      const outputs = tf.match(/output\s+"[^"]+"/g) || [];
      const descriptions = tf.match(/description\s*=/g) || [];
      expect(descriptions.length).toBeGreaterThanOrEqual(outputs.length);
    });

    test("outputs include dev_bucket_name and dev_bucket_arn", () => {
      expect(has(/output\s+"dev_bucket_name"/)).toBe(true);
      expect(has(/output\s+"dev_bucket_arn"/)).toBe(true);
    });

    test("outputs include prod_bucket_name and prod_bucket_arn", () => {
      expect(has(/output\s+"prod_bucket_name"/)).toBe(true);
      expect(has(/output\s+"prod_bucket_arn"/)).toBe(true);
    });

    test("outputs include logs_bucket_name and logs_bucket_arn", () => {
      expect(has(/output\s+"logs_bucket_name"/)).toBe(true);
      expect(has(/output\s+"logs_bucket_arn"/)).toBe(true);
    });

    test("outputs include CloudFront OAI information", () => {
      expect(has(/output\s+"cloudfront_oai_id"/)).toBe(true);
      expect(has(/output\s+"cloudfront_oai_arn"/)).toBe(true);
    });
  });

  // ============================================================================
  // TEST GROUP 16: BEST PRACTICES (6 tests)
  // ============================================================================
  describe("Best Practices", () => {
    test("no hardcoded account IDs", () => {
      const accountIdMatches = tf.match(/\d{12}/g);
      expect(accountIdMatches).toBeNull();
    });

    test("no placeholder values", () => {
      expect(has(/REPLACE|TODO|CHANGEME|PLACEHOLDER|EXAMPLE_/i)).toBe(false);
    });

    test("uses resource references not hardcoded ARNs", () => {
      expect(has(/aws_s3_bucket\.(dev|prod|logs)\.arn/)).toBe(true);
      expect(has(/aws_s3_bucket\.(dev|prod|logs)\.id/)).toBe(true);
    });

    test("uses jsonencode for all policies", () => {
      const policyResources = count(/resource\s+"aws_s3_bucket_policy"/g);
      const jsonEncodeUsage = count(/jsonencode\s*\(/g);
      expect(jsonEncodeUsage).toBeGreaterThanOrEqual(policyResources);
    });

    test("uses locals for reusable configuration", () => {
      expect(has(/local\.common_tags/)).toBe(true);
      expect(has(/local\.cors_configuration/)).toBe(true);
      expect(has(/local\.account_id/)).toBe(true);
    });

    test("follows naming conventions for resources", () => {
      expect(has(/resource\s+"aws_s3_bucket"\s+"(dev|prod|logs)"/)).toBe(true);
      expect(has(/resource\s+"aws_cloudfront_origin_access_identity"\s+"media_oai"/)).toBe(true);
    });
  });
});