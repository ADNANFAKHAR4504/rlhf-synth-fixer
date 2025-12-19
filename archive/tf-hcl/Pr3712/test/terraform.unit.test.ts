// tests/unit/terraform-unit-tests.ts
// Unit tests for Terraform static website S3 infrastructure in ../lib/main.tf
// No Terraform commands are executed - only static file analysis.

import fs from "fs";
import path from "path";

const MAIN_TF_REL = "../lib/main.tf";
const PROVIDER_TF_REL = "../lib/provider.tf";
const mainTfPath = path.resolve(__dirname, MAIN_TF_REL);
const providerTfPath = path.resolve(__dirname, PROVIDER_TF_REL);

describe("Terraform Static Website S3 Infrastructure", () => {
  let mainTfContent: string;
  let providerTfContent: string;

  beforeAll(() => {
    // Load file contents once for all tests
    if (fs.existsSync(mainTfPath)) {
      mainTfContent = fs.readFileSync(mainTfPath, "utf8");
    }
    if (fs.existsSync(providerTfPath)) {
      providerTfContent = fs.readFileSync(providerTfPath, "utf8");
    }
  });

  // ============================================================================
  // File Structure Tests
  // ============================================================================
  describe("File Structure", () => {
    test("main.tf exists", () => {
      const exists = fs.existsSync(mainTfPath);
      if (!exists) {
        console.error(`[unit] Expected main.tf at: ${mainTfPath}`);
      }
      expect(exists).toBe(true);
    });

    test("provider.tf exists", () => {
      const exists = fs.existsSync(providerTfPath);
      if (!exists) {
        console.error(`[unit] Expected provider.tf at: ${providerTfPath}`);
      }
      expect(exists).toBe(true);
    });
  });

  // ============================================================================
  // Variable Configuration Tests
  // ============================================================================
  describe("Variables", () => {
    test("declares aws_region variable with correct configuration", () => {
      expect(mainTfContent).toMatch(/variable\s+"aws_region"\s*{/);
      expect(mainTfContent).toMatch(/type\s*=\s*string/);
      expect(mainTfContent).toMatch(/default\s*=\s*"us-west-2"/);
    });

    test("aws_region variable has proper description", () => {
      expect(mainTfContent).toMatch(/description\s*=\s*"AWS region for resources"/);
    });
  });

  // ============================================================================
  // Random String Resource Tests
  // ============================================================================
  describe("Random String Resource", () => {
    test("declares random_string.bucket_suffix resource", () => {
      expect(mainTfContent).toMatch(/resource\s+"random_string"\s+"bucket_suffix"\s*{/);
    });

    test("random string configured with correct length", () => {
      expect(mainTfContent).toMatch(/length\s*=\s*8/);
    });

    test("random string disables special characters and uppercase", () => {
      expect(mainTfContent).toMatch(/special\s*=\s*false/);
      expect(mainTfContent).toMatch(/upper\s*=\s*false/);
    });
  });

  // ============================================================================
  // S3 Bucket Resource Tests
  // ============================================================================
  describe("S3 Bucket", () => {
    test("declares aws_s3_bucket.media_assets resource", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_s3_bucket"\s+"media_assets"\s*{/);
    });

    test("bucket name uses correct prefix and random suffix pattern", () => {
      expect(mainTfContent).toMatch(/bucket\s*=\s*"media-assets-\$\{random_string\.bucket_suffix\.result\}"/);
    });

    test("bucket has required tags", () => {
      expect(mainTfContent).toMatch(/Environment\s*=\s*"production"/);
      expect(mainTfContent).toMatch(/Project\s*=\s*"media-launch"/);
    });
  });

  // ============================================================================
  // S3 Bucket Versioning Tests
  // ============================================================================
  describe("S3 Bucket Versioning", () => {
    test("declares aws_s3_bucket_versioning resource", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"media_assets_versioning"\s*{/);
    });

    test("versioning references correct bucket", () => {
      expect(mainTfContent).toMatch(/bucket\s*=\s*aws_s3_bucket\.media_assets\.id/);
    });

    test("versioning is enabled", () => {
      expect(mainTfContent).toMatch(/status\s*=\s*"Enabled"/);
    });
  });

  // ============================================================================
  // S3 Bucket Encryption Tests
  // ============================================================================
  describe("S3 Bucket Encryption", () => {
    test("declares server-side encryption configuration", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"media_assets_encryption"/);
    });

    test("uses AES256 encryption algorithm", () => {
      expect(mainTfContent).toMatch(/sse_algorithm\s*=\s*"AES256"/);
    });
  });

  // ============================================================================
  // S3 Website Configuration Tests
  // ============================================================================
  describe("S3 Website Configuration", () => {
    test("declares website configuration resource", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_s3_bucket_website_configuration"\s+"media_assets_website"/);
    });

    test("configures index.html as index document", () => {
      expect(mainTfContent).toMatch(/suffix\s*=\s*"index\.html"/);
    });

    test("configures error.html as error document", () => {
      expect(mainTfContent).toMatch(/key\s*=\s*"error\.html"/);
    });
  });

  // ============================================================================
  // S3 Public Access Block Tests
  // ============================================================================
  describe("S3 Public Access Block", () => {
    test("declares public access block resource", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"media_assets_pab"/);
    });

    test("allows public access by setting all blocks to false", () => {
      expect(mainTfContent).toMatch(/block_public_acls\s*=\s*false/);
      expect(mainTfContent).toMatch(/block_public_policy\s*=\s*false/);
      expect(mainTfContent).toMatch(/ignore_public_acls\s*=\s*false/);
      expect(mainTfContent).toMatch(/restrict_public_buckets\s*=\s*false/);
    });
  });

  // ============================================================================
  // S3 Bucket Policy Tests
  // ============================================================================
  describe("S3 Bucket Policy", () => {
    test("declares bucket policy resource", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"media_assets_policy"/);
    });

    test("policy depends on public access block", () => {
      expect(mainTfContent).toMatch(/depends_on\s*=\s*\[aws_s3_bucket_public_access_block\.media_assets_pab\]/);
    });

    test("policy allows public read access", () => {
      expect(mainTfContent).toMatch(/Effect\s*=\s*"Allow"/);
      expect(mainTfContent).toMatch(/Principal\s*=\s*"\*"/);
      expect(mainTfContent).toMatch(/Action\s*=\s*"s3:GetObject"/);
    });

    test("policy uses bucket ARN reference not hardcoded values", () => {
      expect(mainTfContent).toMatch(/Resource\s*=\s*"\$\{aws_s3_bucket\.media_assets\.arn\}\/\*"/);
    });
  });

  // ============================================================================
  // S3 Lifecycle Configuration Tests
  // ============================================================================
  describe("S3 Lifecycle Configuration", () => {
    test("declares lifecycle configuration resource", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"media_assets_lifecycle"/);
    });

    test("lifecycle rule transitions to Standard-IA after 30 days", () => {
      expect(mainTfContent).toMatch(/days\s*=\s*30/);
      expect(mainTfContent).toMatch(/storage_class\s*=\s*"STANDARD_IA"/);
    });

    test("lifecycle rule is enabled", () => {
      expect(mainTfContent).toMatch(/status\s*=\s*"Enabled"/);
    });

    test("lifecycle rule has proper ID", () => {
      expect(mainTfContent).toMatch(/id\s*=\s*"transition_to_standard_ia"/);
    });
  });

  // ============================================================================
  // S3 CORS Configuration Tests
  // ============================================================================
  describe("S3 CORS Configuration", () => {
    test("declares CORS configuration resource", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_s3_bucket_cors_configuration"\s+"media_assets_cors"/);
    });

    test("CORS allows GET methods", () => {
      expect(mainTfContent).toMatch(/allowed_methods\s*=\s*\["GET"\]/);
    });

    test("CORS allows all origins", () => {
      expect(mainTfContent).toMatch(/allowed_origins\s*=\s*\["\*"\]/);
    });

    test("CORS has correct headers", () => {
      expect(mainTfContent).toMatch(/allowed_headers\s*=\s*\["Content-Type",\s*"Authorization"\]/);
    });

    test("CORS has correct max age", () => {
      expect(mainTfContent).toMatch(/max_age_seconds\s*=\s*3600/);
    });
  });

  // ============================================================================
  // Output Tests
  // ============================================================================
  describe("Outputs", () => {
    test("declares bucket_name output", () => {
      expect(mainTfContent).toMatch(/output\s+"bucket_name"\s*{/);
      expect(mainTfContent).toMatch(/value\s*=\s*aws_s3_bucket\.media_assets\.id/);
    });

    test("declares website_endpoint_url output", () => {
      expect(mainTfContent).toMatch(/output\s+"website_endpoint_url"\s*{/);
      expect(mainTfContent).toMatch(/value\s*=\s*aws_s3_bucket_website_configuration\.media_assets_website\.website_endpoint/);
    });

    test("declares bucket_arn output", () => {
      expect(mainTfContent).toMatch(/output\s+"bucket_arn"\s*{/);
      expect(mainTfContent).toMatch(/value\s*=\s*aws_s3_bucket\.media_assets\.arn/);
    });

    test("all outputs have descriptions", () => {
      expect(mainTfContent).toMatch(/output\s+"bucket_name"\s*{[\s\S]*?description\s*=\s*"Name of the S3 bucket for pipeline integration"/);
      expect(mainTfContent).toMatch(/output\s+"website_endpoint_url"\s*{[\s\S]*?description\s*=\s*"Website endpoint URL for DNS configuration"/);
      expect(mainTfContent).toMatch(/output\s+"bucket_arn"\s*{[\s\S]*?description\s*=\s*"ARN of the S3 bucket for cross-service references"/);
    });
  });

  // ============================================================================
  // Provider Configuration Tests
  // ============================================================================
  describe("Provider Configuration", () => {
    test("main.tf does NOT declare provider (provider.tf owns providers)", () => {
      expect(mainTfContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
    });

    test("provider.tf declares AWS provider with correct version constraint", () => {
      expect(providerTfContent).toMatch(/aws\s*=\s*{[\s\S]*?version\s*=\s*"~>\s*5\.0"/);
    });

    test("provider.tf declares random provider", () => {
      expect(providerTfContent).toMatch(/random\s*=\s*{[\s\S]*?version\s*=\s*"~>\s*3\.1"/);
    });

    test("provider.tf references aws_region variable", () => {
      expect(providerTfContent).toMatch(/region\s*=\s*var\.aws_region/);
    });
  });

  // ============================================================================
  // Resource Dependencies and References Tests
  // ============================================================================
  describe("Resource Dependencies", () => {
    test("all S3 configuration resources reference main bucket", () => {
      const bucketReferences = [
        "aws_s3_bucket_versioning",
        "aws_s3_bucket_server_side_encryption_configuration",
        "aws_s3_bucket_website_configuration",
        "aws_s3_bucket_public_access_block",
        "aws_s3_bucket_policy",
        "aws_s3_bucket_lifecycle_configuration",
        "aws_s3_bucket_cors_configuration"
      ];

      bucketReferences.forEach(resourceType => {
        expect(mainTfContent).toMatch(new RegExp(`${resourceType}[\\s\\S]*?bucket\\s*=\\s*aws_s3_bucket\\.media_assets\\.id`));
      });
    });

    test("bucket policy has explicit dependency on public access block", () => {
      expect(mainTfContent).toMatch(/aws_s3_bucket_policy[\s\S]*?depends_on\s*=\s*\[aws_s3_bucket_public_access_block\.media_assets_pab\]/);
    });
  });

  // ============================================================================
  // Best Practices Tests
  // ============================================================================
  describe("Terraform Best Practices", () => {
    test("uses proper resource naming convention", () => {
      const resourceNames = [
        "media_assets",
        "media_assets_versioning",
        "media_assets_encryption",
        "media_assets_website",
        "media_assets_pab",
        "media_assets_policy",
        "media_assets_lifecycle",
        "media_assets_cors"
      ];

      resourceNames.forEach(name => {
        expect(mainTfContent).toMatch(new RegExp(`"${name}"`));
      });
    });

    test("includes comprehensive comments for major sections", () => {
      const expectedSections = [
        "Variables",
        "Random String for Unique Bucket Naming",
        "S3 Bucket for Static Website Hosting",
        "S3 Bucket Versioning Configuration",
        "S3 Bucket Server-Side Encryption Configuration",
        "S3 Bucket Static Website Hosting Configuration",
        "S3 Bucket Public Access Block",
        "S3 Bucket Policy for Public Read Access",
        "S3 Bucket Lifecycle Configuration",
        "S3 Bucket CORS Configuration",
        "Outputs"
      ];

      expectedSections.forEach(section => {
        expect(mainTfContent).toMatch(new RegExp(`# ${section}`));
      });
    });

    test("uses jsonencode for complex JSON structures", () => {
      expect(mainTfContent).toMatch(/policy\s*=\s*jsonencode\(/);
    });
  });
});
