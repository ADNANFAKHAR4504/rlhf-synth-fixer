// test/terraform.unit.test.ts
// Comprehensive unit tests for tap-stack.tf
// Tests infrastructure configuration without deploying resources

import fs from "fs";
import path from "path";

const TAP_STACK_PATH = path.resolve(__dirname, "../lib/tap-stack.tf");
const PROVIDER_PATH = path.resolve(__dirname, "../lib/provider.tf");

describe("E-books Content Delivery Infrastructure - Unit Tests", () => {
  let stackContent: string;
  let providerContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(TAP_STACK_PATH, "utf-8");
    providerContent = fs.readFileSync(PROVIDER_PATH, "utf-8");
  });

  describe("File Structure and Existence", () => {
    test("tap-stack.tf exists and is readable", () => {
      expect(fs.existsSync(TAP_STACK_PATH)).toBe(true);
      expect(stackContent.length).toBeGreaterThan(0);
    });

    test("provider.tf exists and is readable", () => {
      expect(fs.existsSync(PROVIDER_PATH)).toBe(true);
      expect(providerContent.length).toBeGreaterThan(0);
    });

    test("terraform configuration follows HCL syntax patterns", () => {
      expect(stackContent).toMatch(/variable\s+"\w+"\s*{/);
      expect(stackContent).toMatch(/resource\s+"\w+"\s+"\w+"\s*{/);
      expect(stackContent).toMatch(/locals\s*{/);
      expect(stackContent).toMatch(/output\s+"\w+"\s*{/);
    });
  });

  describe("Provider Configuration", () => {
    test("provider is NOT declared in tap-stack.tf (provider.tf owns it)", () => {
      expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
    });

    test("AWS provider is configured in provider.tf", () => {
      expect(providerContent).toMatch(/required_providers\s*{[\s\S]*aws\s*=\s*{/);
      expect(providerContent).toMatch(/source\s*=\s*"hashicorp\/aws"/);
      expect(providerContent).toMatch(/version\s*=\s*">=\s*5\.0"/);
    });

    test("S3 backend is configured in provider.tf", () => {
      expect(providerContent).toMatch(/backend\s+"s3"\s*{}/);
    });
  });

  describe("Variable Definitions", () => {
    test("aws_region variable is defined", () => {
      expect(stackContent).toMatch(/variable\s+"aws_region"\s*{/);
      expect(stackContent).toMatch(/variable\s+"aws_region"[\s\S]*?type\s*=\s*string/);
      expect(stackContent).toMatch(/variable\s+"aws_region"[\s\S]*?default\s*=\s*"us-east-1"/);
    });

    test("environment_suffix variable is defined", () => {
      expect(stackContent).toMatch(/variable\s+"environment_suffix"\s*{/);
      expect(stackContent).toMatch(/variable\s+"environment_suffix"[\s\S]*?type\s*=\s*string/);
    });

    test("tags variable is defined", () => {
      expect(stackContent).toMatch(/variable\s+"tags"\s*{/);
      expect(stackContent).toMatch(/variable\s+"tags"[\s\S]*?type\s*=\s*map\(string\)/);
    });

    test("all variables have descriptions", () => {
      const variableBlocks = stackContent.match(/variable\s+"\w+"\s*{[\s\S]*?}/g) || [];
      expect(variableBlocks.length).toBeGreaterThan(0);
      variableBlocks.forEach(block => {
        expect(block).toMatch(/description\s*=/);
      });
    });
  });

  describe("Local Values", () => {
    test("locals block is defined", () => {
      expect(stackContent).toMatch(/locals\s*{/);
    });

    test("name_prefix local uses environment_suffix", () => {
      expect(stackContent).toMatch(/name_prefix\s*=\s*"ebooks-\$\{var\.environment_suffix\}"/);
    });

    test("common_tags local merges variables", () => {
      expect(stackContent).toMatch(/common_tags\s*=\s*merge\(/);
      expect(stackContent).toMatch(/Environment\s*=\s*var\.environment_suffix/);
      expect(stackContent).toMatch(/ManagedBy\s*=\s*"Terraform"/);
    });
  });

  describe("KMS Key Resources", () => {
    test("KMS key for logs encryption is defined", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"logs_key"\s*{/);
      expect(stackContent).toMatch(/description\s*=\s*"KMS key for encrypting S3 access logs"/);
      expect(stackContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test("KMS key has appropriate deletion window", () => {
      expect(stackContent).toMatch(/deletion_window_in_days\s*=\s*7/);
    });

    test("KMS alias is defined", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"logs_key_alias"\s*{/);
      expect(stackContent).toMatch(/target_key_id\s*=\s*aws_kms_key\.logs_key\.key_id/);
    });
  });

  describe("S3 Bucket Resources - E-books Content", () => {
    test("e-books bucket is defined with unique naming", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"ebooks_bucket"\s*{/);
      expect(stackContent).toMatch(/bucket\s*=\s*"\$\{local\.name_prefix\}-content-\$\{data\.aws_caller_identity\.current\.account_id\}"/);
    });

    test("e-books bucket has versioning enabled", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"ebooks_bucket_versioning"\s*{/);
      expect(stackContent).toMatch(/status\s*=\s*"Enabled"/);
    });

    test("e-books bucket has server-side encryption", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"ebooks_bucket_encryption"\s*{/);
      expect(stackContent).toMatch(/sse_algorithm\s*=\s*"AES256"/);
    });

    test("e-books bucket has public access blocked", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"ebooks_bucket_public_access_block"\s*{/);
      expect(stackContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/block_public_policy\s*=\s*true/);
      expect(stackContent).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/restrict_public_buckets\s*=\s*true/);
    });
  });

  describe("S3 Bucket Resources - Logs", () => {
    test("logs bucket is defined with unique naming", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"logs_bucket"\s*{/);
      expect(stackContent).toMatch(/bucket\s*=\s*"\$\{local\.name_prefix\}-logs-\$\{data\.aws_caller_identity\.current\.account_id\}"/);
    });

    test("logs bucket has KMS encryption", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"logs_bucket_encryption"\s*{/);
      expect(stackContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.logs_key\.arn/);
      expect(stackContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
    });

    test("logs bucket has lifecycle configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"logs_bucket_lifecycle"\s*{/);
      expect(stackContent).toMatch(/expiration\s*{[\s\S]*?days\s*=\s*365/);
    });

    test("logs bucket has public access blocked", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"logs_bucket_public_access_block"\s*{/);
    });

    test("logs bucket has ownership controls for ACL", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_ownership_controls"\s+"logs_bucket_ownership"\s*{/);
      expect(stackContent).toMatch(/object_ownership\s*=\s*"BucketOwnerPreferred"/);
    });

    test("logs bucket has ACL configured for log delivery", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_acl"\s+"logs_bucket_acl"\s*{/);
      expect(stackContent).toMatch(/acl\s*=\s*"log-delivery-write"/);
    });
  });

  describe("CloudFront Resources", () => {
    test("CloudFront Origin Access Identity is defined", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudfront_origin_access_identity"\s+"oai"\s*{/);
      expect(stackContent).toMatch(/comment\s*=.*e-books distribution/);
    });

    test("S3 bucket policy allows CloudFront OAI access", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"ebooks_bucket_policy"\s*{/);
      expect(stackContent).toMatch(/bucket\s*=\s*aws_s3_bucket\.ebooks_bucket\.id/);
      expect(stackContent).toMatch(/s3:GetObject/);
      expect(stackContent).toMatch(/aws_cloudfront_origin_access_identity\.oai\.iam_arn/);
    });

    test("CloudFront distribution is defined", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudfront_distribution"\s+"ebooks_distribution"\s*{/);
      expect(stackContent).toMatch(/enabled\s*=\s*true/);
      expect(stackContent).toMatch(/is_ipv6_enabled\s*=\s*true/);
    });

    test("CloudFront uses S3 bucket as origin with OAI", () => {
      expect(stackContent).toMatch(/origin\s*{[\s\S]*?domain_name\s*=\s*aws_s3_bucket\.ebooks_bucket\.bucket_regional_domain_name/);
      expect(stackContent).toMatch(/s3_origin_config\s*{[\s\S]*?origin_access_identity/);
    });

    test("CloudFront enforces HTTPS", () => {
      expect(stackContent).toMatch(/viewer_protocol_policy\s*=\s*"redirect-to-https"/);
    });

    test("CloudFront has caching configured", () => {
      expect(stackContent).toMatch(/default_cache_behavior\s*{/);
      expect(stackContent).toMatch(/cached_methods\s*=\s*\["GET",\s*"HEAD",\s*"OPTIONS"\]/);
      expect(stackContent).toMatch(/min_ttl\s*=\s*0/);
      expect(stackContent).toMatch(/default_ttl\s*=\s*3600/);
      expect(stackContent).toMatch(/max_ttl\s*=\s*86400/);
    });

    test("CloudFront has compression enabled", () => {
      expect(stackContent).toMatch(/compress\s*=\s*true/);
    });

    test("CloudFront has logging configured", () => {
      expect(stackContent).toMatch(/logging_config\s*{/);
      expect(stackContent).toMatch(/bucket\s*=\s*aws_s3_bucket\.logs_bucket\.bucket_domain_name/);
      expect(stackContent).toMatch(/prefix\s*=\s*"cloudfront-logs\/"/);
    });

    test("CloudFront has no geo restrictions by default", () => {
      expect(stackContent).toMatch(/geo_restriction\s*{[\s\S]*?restriction_type\s*=\s*"none"/);
    });
  });

  describe("CloudWatch Monitoring", () => {
    test("CloudWatch alarm for high error rate is defined", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"high_error_rate"\s*{/);
      expect(stackContent).toMatch(/metric_name\s*=\s*"5xxErrorRate"/);
      expect(stackContent).toMatch(/namespace\s*=\s*"AWS\/CloudFront"/);
      expect(stackContent).toMatch(/comparison_operator\s*=\s*"GreaterThanThreshold"/);
      expect(stackContent).toMatch(/threshold\s*=\s*5/);
    });

    test("CloudWatch alarm for request count is defined", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"low_request_count"\s*{/);
      expect(stackContent).toMatch(/metric_name\s*=\s*"Requests"/);
    });

    test("CloudWatch dashboard is defined", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_dashboard"\s+"ebooks_dashboard"\s*{/);
      expect(stackContent).toMatch(/dashboard_body\s*=/);
    });

    test("CloudWatch dashboard tracks key metrics", () => {
      expect(stackContent).toMatch(/Requests/);
      expect(stackContent).toMatch(/BytesDownloaded/);
      expect(stackContent).toMatch(/4xxErrorRate/);
      expect(stackContent).toMatch(/5xxErrorRate/);
    });
  });

  describe("IAM Resources", () => {
    test("IAM policy for CloudWatch Logs is defined", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_policy"\s+"cloudwatch_logs_policy"\s*{/);
      expect(stackContent).toMatch(/logs:CreateLogGroup/);
      expect(stackContent).toMatch(/logs:CreateLogStream/);
      expect(stackContent).toMatch(/logs:PutLogEvents/);
    });
  });

  describe("Data Sources", () => {
    test("AWS caller identity data source is used", () => {
      expect(stackContent).toMatch(/data\s+"aws_caller_identity"\s+"current"\s*{}/);
    });
  });

  describe("Output Values", () => {
    const requiredOutputs = [
      "aws_region",
      "ebooks_bucket_name",
      "ebooks_bucket_arn",
      "logs_bucket_name",
      "logs_bucket_arn",
      "kms_key_id",
      "kms_key_arn",
      "cloudfront_distribution_id",
      "cloudfront_distribution_arn",
      "cloudfront_domain_name",
      "cloudfront_oai_iam_arn",
      "cloudwatch_alarm_error_rate_arn",
      "cloudwatch_dashboard_name"
    ];

    test("all required outputs are defined", () => {
      requiredOutputs.forEach(output => {
        expect(stackContent).toMatch(new RegExp(`output\\s+"${output}"\\s*{`));
      });
    });

    test("all outputs have descriptions", () => {
      const outputBlocks = stackContent.match(/output\s+"\w+"\s*{[\s\S]*?}/g) || [];
      expect(outputBlocks.length).toBeGreaterThanOrEqual(requiredOutputs.length);
      outputBlocks.forEach(block => {
        expect(block).toMatch(/description\s*=/);
        expect(block).toMatch(/value\s*=/);
      });
    });

    test("outputs reference correct resources", () => {
      expect(stackContent).toMatch(/output\s+"ebooks_bucket_name"[\s\S]*?value\s*=\s*aws_s3_bucket\.ebooks_bucket\.id/);
      expect(stackContent).toMatch(/output\s+"cloudfront_distribution_id"[\s\S]*?value\s*=\s*aws_cloudfront_distribution\.ebooks_distribution\.id/);
      expect(stackContent).toMatch(/output\s+"kms_key_id"[\s\S]*?value\s*=\s*aws_kms_key\.logs_key\.key_id/);
    });
  });

  describe("Resource Tagging", () => {
    test("all resources use common_tags", () => {
      const taggedResources = [
        'aws_kms_key',
        'aws_s3_bucket',
        'aws_cloudfront_distribution',
        'aws_cloudwatch_metric_alarm',
        'aws_iam_policy'
      ];

      taggedResources.forEach(resource => {
        expect(stackContent).toMatch(new RegExp(`resource\\s+"${resource}"[\\s\\S]*?tags\\s*=`));
      });
    });

    test("resources have specific Name tags", () => {
      expect(stackContent).toMatch(/Name\s*=\s*"\$\{local\.name_prefix\}-logs-key"/);
      expect(stackContent).toMatch(/Name\s*=\s*"\$\{local\.name_prefix\}-ebooks-content"/);
      expect(stackContent).toMatch(/Name\s*=\s*"\$\{local\.name_prefix\}-access-logs"/);
    });
  });

  describe("Security Best Practices", () => {
    test("S3 buckets are not publicly accessible", () => {
      expect(stackContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/block_public_policy\s*=\s*true/);
      expect(stackContent).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test("S3 buckets have encryption enabled", () => {
      expect(stackContent).toMatch(/sse_algorithm\s*=\s*"AES256"/);
      expect(stackContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
    });

    test("KMS key rotation is enabled", () => {
      expect(stackContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test("CloudFront enforces HTTPS", () => {
      expect(stackContent).toMatch(/viewer_protocol_policy\s*=\s*"redirect-to-https"/);
    });

    test("S3 bucket policy follows least privilege", () => {
      expect(stackContent).toMatch(/Action.*s3:GetObject/);
      expect(stackContent).toMatch(/aws_cloudfront_origin_access_identity\.oai\.iam_arn/);
    });
  });

  describe("Resource Naming and Uniqueness", () => {
    test("resources use name_prefix for consistent naming", () => {
      expect(stackContent).toMatch(/\$\{local\.name_prefix\}/g);
    });

    test("S3 buckets include account ID for global uniqueness", () => {
      expect(stackContent).toMatch(/\$\{data\.aws_caller_identity\.current\.account_id\}/);
    });

    test("environment_suffix enables multi-environment support", () => {
      expect(stackContent).toMatch(/var\.environment_suffix/);
    });
  });

  describe("Lifecycle and Dependencies", () => {
    test("logs bucket ACL depends on ownership controls", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_acl"\s+"logs_bucket_acl"[\s\S]*?depends_on\s*=\s*\[aws_s3_bucket_ownership_controls\.logs_bucket_ownership\]/);
    });
  });

  describe("Cost Optimization", () => {
    test("CloudFront uses cost-effective price class", () => {
      expect(stackContent).toMatch(/price_class\s*=\s*"PriceClass_100"/);
    });

    test("S3 logs have lifecycle policy", () => {
      expect(stackContent).toMatch(/expiration\s*{[\s\S]*?days\s*=\s*365/);
    });

    test("KMS key has reasonable deletion window", () => {
      expect(stackContent).toMatch(/deletion_window_in_days\s*=\s*7/);
    });
  });

  describe("Configuration Completeness", () => {
    test("all AWS resource types are properly defined", () => {
      const expectedResourceTypes = [
        'aws_kms_key',
        'aws_kms_alias',
        'aws_s3_bucket',
        'aws_s3_bucket_versioning',
        'aws_s3_bucket_server_side_encryption_configuration',
        'aws_s3_bucket_public_access_block',
        'aws_s3_bucket_lifecycle_configuration',
        'aws_s3_bucket_ownership_controls',
        'aws_s3_bucket_acl',
        'aws_s3_bucket_policy',
        'aws_cloudfront_origin_access_identity',
        'aws_cloudfront_distribution',
        'aws_cloudwatch_metric_alarm',
        'aws_cloudwatch_dashboard',
        'aws_iam_policy'
      ];

      expectedResourceTypes.forEach(resourceType => {
        expect(stackContent).toMatch(new RegExp(`resource\\s+"${resourceType}"`));
      });
    });

    test("no hardcoded values that should be parameterized", () => {
      expect(stackContent).not.toMatch(/"premium-ebooks-content"/);
      expect(stackContent).not.toMatch(/"premium-ebooks-logs"/);
      expect(stackContent).not.toMatch(/"example\.com"/);
    });
  });
});
