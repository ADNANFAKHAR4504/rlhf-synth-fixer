// tests/unit/unit-tests.ts
// Comprehensive unit tests for ../lib/tap_stack.tf
// No Terraform or CDKTF commands are executed.

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const PROVIDER_REL = "../lib/provider.tf";
const stackPath = path.resolve(__dirname, STACK_REL);
const providerPath = path.resolve(__dirname, PROVIDER_REL);

describe("Terraform single-file stack: tap_stack.tf", () => {
  let stackContent: string;
  let providerContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
    providerContent = fs.readFileSync(providerPath, "utf8");
  });

  describe("File existence and basic structure", () => {
    test("tap_stack.tf exists", () => {
      const exists = fs.existsSync(stackPath);
      if (!exists) {
        console.error(`[unit] Expected stack at: ${stackPath}`);
      }
      expect(exists).toBe(true);
    });

    test("provider.tf exists", () => {
      const exists = fs.existsSync(providerPath);
      expect(exists).toBe(true);
    });

    test("does NOT declare provider in tap_stack.tf (provider.tf owns providers)", () => {
      expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
    });

    test("does NOT declare terraform block in tap_stack.tf (provider.tf owns terraform)", () => {
      expect(stackContent).not.toMatch(/terraform\s*{/);
    });
  });

  describe("Variables", () => {
    test("declares aws_region variable in provider.tf", () => {
      expect(providerContent).toMatch(/variable\s+"aws_region"\s*{/);
    });

    test("declares domain_name variable", () => {
      expect(stackContent).toMatch(/variable\s+"domain_name"\s*{/);
    });

    test("declares environment variable", () => {
      expect(stackContent).toMatch(/variable\s+"environment"\s*{/);
    });

    test("aws_region variable has correct type and default in provider.tf", () => {
      expect(providerContent).toMatch(/variable\s+"aws_region"\s*{[^}]*type\s*=\s*string[^}]*default\s*=\s*"us-east-1"/s);
    });

    test("domain_name variable has correct type and default", () => {
      expect(stackContent).toMatch(/variable\s+"domain_name"\s*{[^}]*type\s*=\s*string[^}]*default\s*=\s*"ebooks\.example\.com"/s);
    });

    test("environment variable has correct type and default", () => {
      expect(stackContent).toMatch(/variable\s+"environment"\s*{[^}]*type\s*=\s*string[^}]*default\s*=\s*"prod"/s);
    });
  });

  describe("Data sources", () => {
    test("declares aws_caller_identity data source", () => {
      expect(stackContent).toMatch(/data\s+"aws_caller_identity"\s+"current"\s*{/);
    });
  });

  describe("KMS resources", () => {
    test("declares content KMS key", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"content_key"\s*{/);
    });

    test("declares logs KMS key", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"logs_key"\s*{/);
    });

    test("declares content KMS key alias", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"content_key_alias"\s*{/);
    });

    test("declares logs KMS key alias", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"logs_key_alias"\s*{/);
    });

    test("content key has key rotation enabled", () => {
      expect(stackContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test("logs key has key rotation enabled", () => {
      expect(stackContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test("content key has 30 day deletion window", () => {
      expect(stackContent).toMatch(/deletion_window_in_days\s*=\s*30/);
    });

    test("logs key has 30 day deletion window", () => {
      expect(stackContent).toMatch(/deletion_window_in_days\s*=\s*30/);
    });
  });

  describe("S3 resources", () => {
    test("declares ebook S3 bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"ebook_bucket"\s*{/);
    });

    test("declares logs S3 bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"logs_bucket"\s*{/);
    });

    test("declares ebook bucket public access block", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"ebook_bucket_block"\s*{/);
    });

    test("declares logs bucket public access block", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"logs_bucket_block"\s*{/);
    });

    test("declares ebook bucket encryption configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"ebook_bucket_encryption"\s*{/);
    });

    test("declares logs bucket encryption configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"logs_bucket_encryption"\s*{/);
    });

    test("declares ebook bucket versioning", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"ebook_bucket_versioning"\s*{/);
    });

    test("declares logs bucket lifecycle configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"logs_lifecycle"\s*{/);
    });

    test("ebook bucket uses KMS encryption", () => {
      expect(stackContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.content_key\.arn/);
    });

    test("logs bucket uses KMS encryption", () => {
      expect(stackContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.logs_key\.arn/);
    });

    test("public access blocks are enabled", () => {
      expect(stackContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/block_public_policy\s*=\s*true/);
      expect(stackContent).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test("versioning is enabled for ebook bucket", () => {
      expect(stackContent).toMatch(/status\s*=\s*"Enabled"/);
    });

    test("bucket key is enabled for encryption", () => {
      expect(stackContent).toMatch(/bucket_key_enabled\s*=\s*true/);
    });
  });

  describe("CloudFront resources", () => {
    test("declares CloudFront origin access identity", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudfront_origin_access_identity"\s+"ebook_oai"\s*{/);
    });

    test("declares CloudFront distribution", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudfront_distribution"\s+"ebook_distribution"\s*{/);
    });

    test("declares CloudFront response headers policy", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudfront_response_headers_policy"\s+"security_headers_policy"\s*{/);
    });

    test("CloudFront distribution is enabled", () => {
      expect(stackContent).toMatch(/enabled\s*=\s*true/);
    });

    test("CloudFront distribution has IPv6 enabled", () => {
      expect(stackContent).toMatch(/is_ipv6_enabled\s*=\s*true/);
    });

    test("CloudFront distribution has logging configured", () => {
      expect(stackContent).toMatch(/logging_config\s*{/);
    });

    test("CloudFront distribution uses OAI for S3 access", () => {
      expect(stackContent).toMatch(/origin_access_identity\s*=\s*aws_cloudfront_origin_access_identity\.ebook_oai/);
    });

    test("CloudFront distribution redirects to HTTPS", () => {
      expect(stackContent).toMatch(/viewer_protocol_policy\s*=\s*"redirect-to-https"/);
    });

    test("CloudFront distribution has proper cache behavior", () => {
      expect(stackContent).toMatch(/allowed_methods\s*=\s*\["GET",\s*"HEAD",\s*"OPTIONS"\]/);
      expect(stackContent).toMatch(/cached_methods\s*=\s*\["GET",\s*"HEAD"\]/);
    });

    test("CloudFront distribution has proper TTL settings", () => {
      expect(stackContent).toMatch(/min_ttl\s*=\s*0/);
      expect(stackContent).toMatch(/default_ttl\s*=\s*3600/);
      expect(stackContent).toMatch(/max_ttl\s*=\s*86400/);
    });
  });

  describe("S3 bucket policy", () => {
    test("declares S3 bucket policy data source", () => {
      expect(stackContent).toMatch(/data\s+"aws_iam_policy_document"\s+"s3_policy"\s*{/);
    });

    test("declares S3 bucket policy resource", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"ebook_bucket_policy"\s*{/);
    });

    test("S3 policy allows CloudFront OAI access", () => {
      expect(stackContent).toMatch(/identifiers\s*=\s*\[aws_cloudfront_origin_access_identity\.ebook_oai\.iam_arn\]/);
    });

    test("S3 policy allows GetObject action", () => {
      expect(stackContent).toMatch(/actions\s*=\s*\["s3:GetObject"\]/);
    });
  });

  describe("ACM and Route53 resources", () => {
    test("declares ACM certificate", () => {
      expect(stackContent).toMatch(/resource\s+"aws_acm_certificate"\s+"ebook_cert"\s*{/);
    });

    test("declares Route53 zone", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route53_zone"\s+"primary"\s*{/);
    });

    test("declares Route53 certificate validation records", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route53_record"\s+"cert_validation"\s*{/);
    });

    test("declares ACM certificate validation", () => {
      expect(stackContent).toMatch(/resource\s+"aws_acm_certificate_validation"\s+"ebook_cert_validation"\s*{/);
    });

    test("declares Route53 alias record", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route53_record"\s+"ebook_record"\s*{/);
    });

    test("ACM certificate uses DNS validation", () => {
      expect(stackContent).toMatch(/validation_method\s*=\s*"DNS"/);
    });

    test("Route53 record uses alias", () => {
      expect(stackContent).toMatch(/alias\s*{/);
    });
  });

  describe("WAF resources", () => {
    test("declares WAF Web ACL", () => {
      expect(stackContent).toMatch(/resource\s+"aws_wafv2_web_acl"\s+"ebook_waf"\s*{/);
    });

    test("WAF has CloudFront scope", () => {
      expect(stackContent).toMatch(/scope\s*=\s*"CLOUDFRONT"/);
    });

    test("WAF uses AWS managed rules", () => {
      expect(stackContent).toMatch(/AWSManagedRulesCommonRuleSet/);
    });

    test("WAF has CloudWatch metrics enabled", () => {
      expect(stackContent).toMatch(/cloudwatch_metrics_enabled\s*=\s*true/);
    });
  });

  describe("CloudWatch resources", () => {
    test("declares CloudWatch dashboard", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_dashboard"\s+"ebook_dashboard"\s*{/);
    });

    test("declares CloudWatch metric alarms", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"high_error_rate"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"high_4xx_rate"\s*{/);
    });

    test("dashboard has proper widgets configuration", () => {
      expect(stackContent).toMatch(/widgets\s*=/);
      expect(stackContent).toMatch(/CloudFront Requests/);
      expect(stackContent).toMatch(/CloudFront Error Rates/);
      expect(stackContent).toMatch(/CloudFront Data Transfer/);
    });

    test("alarms monitor error rates", () => {
      expect(stackContent).toMatch(/5xxErrorRate/);
      expect(stackContent).toMatch(/4xxErrorRate/);
    });
  });

  describe("Outputs", () => {
    test("declares cloudfront_distribution_id output", () => {
      expect(stackContent).toMatch(/output\s+"cloudfront_distribution_id"\s*{/);
    });

    test("declares cloudfront_domain_name output", () => {
      expect(stackContent).toMatch(/output\s+"cloudfront_domain_name"\s*{/);
    });

    test("declares s3_bucket_name output", () => {
      expect(stackContent).toMatch(/output\s+"s3_bucket_name"\s*{/);
    });

    test("declares s3_bucket_arn output", () => {
      expect(stackContent).toMatch(/output\s+"s3_bucket_arn"\s*{/);
    });

    test("declares logs_bucket_name output", () => {
      expect(stackContent).toMatch(/output\s+"logs_bucket_name"\s*{/);
    });

    test("declares logs_bucket_arn output", () => {
      expect(stackContent).toMatch(/output\s+"logs_bucket_arn"\s*{/);
    });

    test("declares kms_content_key_id output", () => {
      expect(stackContent).toMatch(/output\s+"kms_content_key_id"\s*{/);
    });

    test("declares kms_logs_key_id output", () => {
      expect(stackContent).toMatch(/output\s+"kms_logs_key_id"\s*{/);
    });

    test("declares route53_zone_id output", () => {
      expect(stackContent).toMatch(/output\s+"route53_zone_id"\s*{/);
    });

    test("declares acm_certificate_arn output", () => {
      expect(stackContent).toMatch(/output\s+"acm_certificate_arn"\s*{/);
    });

    test("declares waf_web_acl_arn output", () => {
      expect(stackContent).toMatch(/output\s+"waf_web_acl_arn"\s*{/);
    });

    test("declares cloudwatch_dashboard_url output", () => {
      expect(stackContent).toMatch(/output\s+"cloudwatch_dashboard_url"\s*{/);
    });
  });

  describe("Security and compliance", () => {
    test("all S3 buckets have public access blocked", () => {
      const publicAccessBlockCount = (stackContent.match(/aws_s3_bucket_public_access_block/g) || []).length;
      expect(publicAccessBlockCount).toBe(2);
    });

    test("all S3 buckets have encryption enabled", () => {
      const encryptionConfigCount = (stackContent.match(/aws_s3_bucket_server_side_encryption_configuration/g) || []).length;
      expect(encryptionConfigCount).toBe(2);
    });

    test("KMS keys have proper policies", () => {
      expect(stackContent).toMatch(/policy\s*=\s*jsonencode/);
    });

    test("CloudFront uses HTTPS only", () => {
      expect(stackContent).toMatch(/minimum_protocol_version\s*=\s*"TLSv1\.2_2021"/);
    });

    test("security headers policy is configured", () => {
      expect(stackContent).toMatch(/content_type_options/);
      expect(stackContent).toMatch(/frame_options/);
      expect(stackContent).toMatch(/strict_transport_security/);
      expect(stackContent).toMatch(/xss_protection/);
      expect(stackContent).toMatch(/referrer_policy/);
    });
  });

  describe("Resource tagging", () => {
    test("resources have proper tags", () => {
      expect(stackContent).toMatch(/tags\s*=\s*{/);
      expect(stackContent).toMatch(/Name\s*=/);
      expect(stackContent).toMatch(/Environment\s*=/);
    });

    test("tags use variables for environment", () => {
      expect(stackContent).toMatch(/Environment\s*=\s*var\.environment/);
    });
  });

  describe("Resource relationships", () => {
    test("CloudFront distribution references S3 bucket", () => {
      expect(stackContent).toMatch(/aws_s3_bucket\.ebook_bucket\.bucket_regional_domain_name/);
    });

    test("CloudFront distribution references OAI", () => {
      expect(stackContent).toMatch(/aws_cloudfront_origin_access_identity\.ebook_oai/);
    });

    test("CloudFront distribution references logs bucket", () => {
      expect(stackContent).toMatch(/aws_s3_bucket\.logs_bucket\.bucket_regional_domain_name/);
    });

    test("CloudFront distribution references WAF", () => {
      expect(stackContent).toMatch(/aws_wafv2_web_acl\.ebook_waf\.arn/);
    });

    test("CloudFront distribution references ACM certificate", () => {
      expect(stackContent).toMatch(/aws_acm_certificate_validation\.ebook_cert_validation/);
    });

    test("Route53 record references CloudFront distribution", () => {
      expect(stackContent).toMatch(/aws_cloudfront_distribution\.ebook_distribution\.domain_name/);
    });

    test("S3 bucket policy references CloudFront OAI", () => {
      expect(stackContent).toMatch(/aws_cloudfront_origin_access_identity\.ebook_oai\.iam_arn/);
    });
  });

  describe("Provider configuration", () => {
    test("provider.tf declares AWS provider", () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
    });

    test("provider.tf declares terraform block", () => {
      expect(providerContent).toMatch(/terraform\s*{/);
    });

    test("provider.tf declares required providers", () => {
      expect(providerContent).toMatch(/required_providers/);
    });

    test("provider.tf declares aws_region variable", () => {
      expect(providerContent).toMatch(/variable\s+"aws_region"/);
    });

    test("provider uses variable for region", () => {
      expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
    });
  });
});
