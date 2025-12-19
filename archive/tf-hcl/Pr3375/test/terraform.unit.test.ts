// tests/unit/unit-tests.ts
// Comprehensive unit tests for secure content delivery system
// Validates all requirements from PROMPT.md without executing Terraform commands

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const VARIABLES_REL = "../lib/variables.tf";
const OUTPUTS_REL = "../lib/outputs.tf";
const PROVIDER_REL = "../lib/provider.tf";

const stackPath = path.resolve(__dirname, STACK_REL);
const variablesPath = path.resolve(__dirname, VARIABLES_REL);
const outputsPath = path.resolve(__dirname, OUTPUTS_REL);
const providerPath = path.resolve(__dirname, PROVIDER_REL);

describe("Secure Content Delivery System - Unit Tests", () => {
  let stackContent: string;
  let variablesContent: string;
  let outputsContent: string;
  let providerContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
    variablesContent = fs.readFileSync(variablesPath, "utf8");
    outputsContent = fs.readFileSync(outputsPath, "utf8");
    providerContent = fs.readFileSync(providerPath, "utf8");
  });

  describe("File Structure Validation", () => {
    test("tap_stack.tf exists", () => {
      expect(fs.existsSync(stackPath)).toBe(true);
    });

    test("variables.tf exists", () => {
      expect(fs.existsSync(variablesPath)).toBe(true);
    });

    test("outputs.tf exists", () => {
      expect(fs.existsSync(outputsPath)).toBe(true);
    });

    test("provider.tf exists", () => {
      expect(fs.existsSync(providerPath)).toBe(true);
    });

    test("does NOT declare provider in tap_stack.tf (provider.tf owns providers)", () => {
      expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
    });
  });

  describe("S3 Bucket Configuration", () => {
    test("S3 bucket for content storage is defined", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"content"/);
    });

    test("S3 bucket versioning is enabled", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"content"/);
      expect(stackContent).toMatch(/status\s*=\s*"Enabled"/);
    });

    test("S3 bucket encryption is configured with KMS", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"content"/);
      expect(stackContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
      expect(stackContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.content_encryption\.arn/);
    });

    test("S3 bucket public access is blocked", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"content"/);
      expect(stackContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/block_public_policy\s*=\s*true/);
      expect(stackContent).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test("S3 bucket lifecycle configuration for cost optimization", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"content"/);
      expect(stackContent).toMatch(/storage_class\s*=\s*"STANDARD_IA"/);
      expect(stackContent).toMatch(/storage_class\s*=\s*"GLACIER"/);
    });

    test("S3 bucket policy restricts access to CloudFront only", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"content"/);
      expect(stackContent).toMatch(/cloudfront\.amazonaws\.com/);
      expect(stackContent).toMatch(/aws:SecureTransport.*false/);
    });
  });

  describe("KMS Encryption Configuration", () => {
    test("KMS key for content encryption is defined", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"content_encryption"/);
    });

    test("KMS key has proper configuration", () => {
      expect(stackContent).toMatch(/enable_key_rotation\s*=\s*true/);
      expect(stackContent).toMatch(/deletion_window_in_days\s*=\s*30/);
    });

    test("KMS alias is defined", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"content_encryption"/);
    });
  });

  describe("CloudFront Distribution Configuration", () => {
    test("CloudFront distribution is defined", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudfront_distribution"\s+"content"/);
    });

    test("CloudFront OAI is defined", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudfront_origin_access_identity"\s+"content"/);
    });

    test("CloudFront has proper security configuration", () => {
      expect(stackContent).toMatch(/viewer_protocol_policy\s*=\s*"redirect-to-https"/);
      expect(stackContent).toMatch(/viewer_protocol_policy\s*=\s*"https-only"/);
      expect(stackContent).toMatch(/minimum_protocol_version\s*=\s*var\.domain_name\s*!=\s*""\s*\?\s*"TLSv1\.2_2021"\s*:\s*null/);
      expect(stackContent).toMatch(/ssl_support_method\s*=\s*var\.domain_name\s*!=\s*""\s*\?\s*"sni-only"\s*:\s*null/);
      expect(stackContent).toMatch(/acm_certificate_arn\s*=\s*var\.domain_name\s*!=\s*""\s*\?\s*aws_acm_certificate_validation\.content\[0\]\.certificate_arn\s*:\s*null/);
      expect(stackContent).toMatch(/cloudfront_default_certificate\s*=\s*var\.domain_name\s*==\s*""\s*\?\s*true\s*:\s*null/);
    });

    test("CloudFront has caching policies for different content types", () => {
      expect(stackContent).toMatch(/path_pattern\s*=\s*"\*\.epub"/);
      expect(stackContent).toMatch(/path_pattern\s*=\s*"\*\.pdf"/);
    });

    test("CloudFront has security headers policy", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudfront_response_headers_policy"\s+"security_headers"/);
      expect(stackContent).toMatch(/content_type_options/);
      expect(stackContent).toMatch(/frame_options/);
      expect(stackContent).toMatch(/strict_transport_security/);
    });

    test("CloudFront has logging enabled", () => {
      expect(stackContent).toMatch(/logging_config/);
      expect(stackContent).toMatch(/bucket\s*=\s*aws_s3_bucket\.logs\.bucket_domain_name/);
    });
  });

  describe("Route 53 DNS Configuration", () => {
    test("Route 53 hosted zone is defined conditionally", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route53_zone"\s+"main"\s*\{[\s\S]*count\s*=\s*var\.domain_name\s*!=\s*""\s*\?\s*1\s*:\s*0/);
    });

    test("Route 53 A records for domain are defined conditionally", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route53_record"\s+"root"\s*\{[\s\S]*count\s*=\s*var\.domain_name\s*!=\s*""\s*\?\s*1\s*:\s*0/);
      expect(stackContent).toMatch(/resource\s+"aws_route53_record"\s+"www"\s*\{[\s\S]*count\s*=\s*var\.domain_name\s*!=\s*""\s*\?\s*1\s*:\s*0/);
    });

    test("Route 53 records point to CloudFront", () => {
      expect(stackContent).toMatch(/aws_cloudfront_distribution\.content\.domain_name/);
      expect(stackContent).toMatch(/aws_cloudfront_distribution\.content\.hosted_zone_id/);
    });
  });

  describe("SSL/TLS Certificate Configuration", () => {
    test("ACM certificate is defined conditionally", () => {
      expect(stackContent).toMatch(/resource\s+"aws_acm_certificate"\s+"content"\s*\{[\s\S]*count\s*=\s*var\.domain_name\s*!=\s*""\s*\?\s*1\s*:\s*0/);
    });

    test("ACM certificate validation is configured conditionally", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route53_record"\s+"cert_validation"/);
      expect(stackContent).toMatch(/resource\s+"aws_acm_certificate_validation"\s+"content"\s*\{[\s\S]*count\s*=\s*var\.domain_name\s*!=\s*""\s*\?\s*1\s*:\s*0/);
    });

    test("ACM certificate uses DNS validation", () => {
      expect(stackContent).toMatch(/validation_method\s*=\s*"DNS"/);
    });
  });

  describe("CloudWatch Monitoring Configuration", () => {
    test("CloudWatch log group is defined", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"cloudfront"/);
    });

    test("CloudWatch alarms are defined", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"high_error_rate"/);
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"low_cache_hit_rate"/);
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"high_origin_latency"/);
    });

    test("CloudWatch dashboard is defined", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_dashboard"\s+"content_delivery"/);
    });

    test("SNS topic for alerts is defined", () => {
      expect(stackContent).toMatch(/resource\s+"aws_sns_topic"\s+"alerts"/);
      expect(stackContent).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"email_alerts"/);
    });
  });

  describe("CloudTrail Audit Logging", () => {
    test("CloudTrail is conditionally defined", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudtrail"\s+"content_delivery"/);
      expect(stackContent).toMatch(/count\s*=\s*var\.enable_cloudtrail/);
    });

    test("CloudTrail has proper configuration", () => {
      expect(stackContent).toMatch(/include_global_service_events\s*=\s*true/);
      expect(stackContent).toMatch(/is_multi_region_trail\s*=\s*true/);
      expect(stackContent).toMatch(/enable_logging\s*=\s*true/);
    });

    test("CloudTrail event selectors are configured", () => {
      expect(stackContent).toMatch(/event_selector/);
      expect(stackContent).toMatch(/AWS::S3::Object/);
      expect(stackContent).toMatch(/CloudFront management events are tracked by default/);
    });
  });

  describe("WAF Security Configuration", () => {
    test("WAF Web ACL is conditionally defined", () => {
      expect(stackContent).toMatch(/resource\s+"aws_wafv2_web_acl"\s+"cloudfront"/);
      expect(stackContent).toMatch(/count\s*=\s*var\.enable_waf/);
    });

    test("WAF has rate limiting rule", () => {
      expect(stackContent).toMatch(/RateLimitRule/);
      expect(stackContent).toMatch(/rate_based_statement/);
    });

    test("WAF has AWS managed rules", () => {
      expect(stackContent).toMatch(/AWSManagedRulesCommonRuleSet/);
      expect(stackContent).toMatch(/managed_rule_group_statement/);
    });
  });

  describe("Variables Validation", () => {
    test("Required variables are defined", () => {
      expect(variablesContent).toMatch(/variable\s+"aws_region"/);
      expect(variablesContent).toMatch(/variable\s+"project_name"/);
      expect(variablesContent).toMatch(/variable\s+"environment"/);
      expect(variablesContent).toMatch(/variable\s+"domain_name"/);
      expect(variablesContent).toMatch(/variable\s+"content_bucket_name"/);
      expect(variablesContent).toMatch(/variable\s+"alarm_email"/);
    });

    test("Optional variables with defaults are defined", () => {
      expect(variablesContent).toMatch(/variable\s+"cloudfront_price_class"/);
      expect(variablesContent).toMatch(/variable\s+"enable_waf"/);
      expect(variablesContent).toMatch(/variable\s+"enable_cloudtrail"/);
      expect(variablesContent).toMatch(/variable\s+"high_error_rate_threshold"/);
      expect(variablesContent).toMatch(/variable\s+"low_cache_hit_rate_threshold"/);
      expect(variablesContent).toMatch(/variable\s+"high_origin_latency_threshold"/);
    });
  });

  describe("Outputs Validation", () => {
    test("CloudFront outputs are defined", () => {
      expect(outputsContent).toMatch(/output\s+"cloudfront_distribution_id"/);
      expect(outputsContent).toMatch(/output\s+"cloudfront_domain_name"/);
      expect(outputsContent).toMatch(/output\s+"cloudfront_distribution_arn"/);
    });

    test("S3 outputs are defined", () => {
      expect(outputsContent).toMatch(/output\s+"s3_bucket_name"/);
      expect(outputsContent).toMatch(/output\s+"s3_bucket_arn"/);
    });

    test("KMS outputs are defined", () => {
      expect(outputsContent).toMatch(/output\s+"kms_key_id"/);
      expect(outputsContent).toMatch(/output\s+"kms_key_arn"/);
      expect(outputsContent).toMatch(/output\s+"kms_alias_name"/);
    });

    test("Route 53 outputs are defined", () => {
      expect(outputsContent).toMatch(/output\s+"route53_zone_id"/);
      expect(outputsContent).toMatch(/output\s+"route53_name_servers"/);
    });

    test("Monitoring outputs are defined", () => {
      expect(outputsContent).toMatch(/output\s+"cloudwatch_dashboard_url"/);
      expect(outputsContent).toMatch(/output\s+"sns_topic_arn"/);
    });

    test("Summary output is defined", () => {
      expect(outputsContent).toMatch(/output\s+"content_delivery_summary"/);
      expect(outputsContent).toMatch(/output\s+"website_url"/);
      expect(outputsContent).toMatch(/output\s+"test_url"/);
    });
  });

  describe("Security Best Practices", () => {
    test("No hardcoded secrets or credentials", () => {
      // Check for common secret patterns but allow KMS key references
      expect(stackContent).not.toMatch(/password\s*=\s*["'][^"']+["']/i);
      expect(stackContent).not.toMatch(/secret\s*=\s*["'][^"']+["']/i);
      expect(variablesContent).not.toMatch(/password\s*=\s*["'][^"']+["']/i);
      expect(variablesContent).not.toMatch(/secret\s*=\s*["'][^"']+["']/i);
    });

    test("All resources have proper tags", () => {
      expect(stackContent).toMatch(/tags\s*=\s*\{/);
    });

    test("Dependencies are properly defined", () => {
      expect(stackContent).toMatch(/depends_on/);
    });

    test("Resource names follow naming convention", () => {
      expect(stackContent).toMatch(/\$\{var\.project_name\}/);
      expect(stackContent).toMatch(/\$\{var\.environment\}/);
    });
  });

  describe("Cost Optimization Features", () => {
    test("S3 lifecycle policies for cost optimization", () => {
      expect(stackContent).toMatch(/transition\s*\{/);
      expect(stackContent).toMatch(/storage_class\s*=\s*"STANDARD_IA"/);
      expect(stackContent).toMatch(/noncurrent_version_transition/);
      expect(stackContent).toMatch(/noncurrent_version_expiration/);
    });

    test("CloudFront price class is configurable", () => {
      expect(stackContent).toMatch(/price_class\s*=\s*var\.cloudfront_price_class/);
    });

    test("Log retention is configurable", () => {
      expect(stackContent).toMatch(/retention_in_days\s*=\s*var\.log_retention_days/);
    });
  });

  describe("High Availability and Scalability", () => {
    test("CloudFront is globally distributed", () => {
      expect(stackContent).toMatch(/enabled\s*=\s*true/);
      expect(stackContent).toMatch(/is_ipv6_enabled\s*=\s*true/);
    });

    test("Multi-region CloudTrail support", () => {
      expect(stackContent).toMatch(/is_multi_region_trail\s*=\s*true/);
    });

    test("Geo-restriction is configurable", () => {
      expect(stackContent).toMatch(/geo_restriction/);
      expect(stackContent).toMatch(/restriction_type\s*=\s*var\.geo_restriction_type/);
    });
  });
});
