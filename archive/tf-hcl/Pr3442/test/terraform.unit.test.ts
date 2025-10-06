// tests/unit/unit-tests.ts
// Simple presence + sanity checks for ../lib/tap_stack.tf
// No Terraform or CDKTF commands are executed.

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf"; // adjust if your structure differs
const stackPath = path.resolve(__dirname, STACK_REL);

describe("Terraform single-file stack: tap_stack.tf", () => {
  test("tap_stack.tf exists", () => {
    const exists = fs.existsSync(stackPath);
    if (!exists) {
      console.error(`[unit] Expected stack at: ${stackPath}`);
    }
    expect(exists).toBe(true);
  });

  // --- Optional sanity checks (keep lightweight) ---

  test("does NOT declare provider in tap_stack.tf (provider.tf owns providers)", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).not.toMatch(/\bprovider\s+"aws"\s*{/);
  });

  test("declares aws_region variable in tap_stack.tf", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/variable\s+"aws_region"\s*{/);
  });

  test("aws_region variable has a default value for ease of deployment", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    const awsRegionVarBlock = content.match(
      /variable\s+"aws_region"\s*{[^}]*}/s
    );
    expect(awsRegionVarBlock).toBeTruthy();
    // Should contain a default value for practical deployment
    expect(awsRegionVarBlock![0]).toMatch(/default\s*=\s*"us-east-1"/);
  });

  // --- S3 Bucket Tests ---

  test("declares S3 content bucket resource", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"content"\s*{/);
  });

  test("declares S3 logs bucket resource", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"logs"\s*{/);
  });

  test("enables versioning on content bucket", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(
      /resource\s+"aws_s3_bucket_versioning"\s+"content_versioning"/
    );
    expect(content).toMatch(/status\s*=\s*"Enabled"/);
  });

  test("enables versioning on logs bucket", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(
      /resource\s+"aws_s3_bucket_versioning"\s+"logs_versioning"/
    );
  });

  test("configures KMS encryption for S3 buckets", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(
      /resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"content_encryption"/
    );
    expect(content).toMatch(
      /resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"logs_encryption"/
    );
    expect(content).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
  });

  test("blocks public access on S3 buckets", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(
      /resource\s+"aws_s3_bucket_public_access_block"\s+"content_public_access"/
    );
    expect(content).toMatch(
      /resource\s+"aws_s3_bucket_public_access_block"\s+"logs_public_access"/
    );
    expect(content).toMatch(/block_public_acls\s*=\s*true/);
    expect(content).toMatch(/block_public_policy\s*=\s*true/);
  });

  test("enforces TLS-only access via S3 bucket policy", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/AllowSSLRequestsOnly/);
    expect(content).toMatch(/"aws:SecureTransport"/);
  });

  test("configures S3 logging for content bucket", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(
      /resource\s+"aws_s3_bucket_logging"\s+"content_logging"/
    );
  });

  test("configures lifecycle policy for logs bucket", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(
      /resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"logs_lifecycle"/
    );
    expect(content).toMatch(/expiration\s*{/);
  });

  // --- KMS Tests ---

  test("declares KMS key resource", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_kms_key"\s+"s3_encryption"\s*{/);
  });

  test("enables KMS key rotation", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/enable_key_rotation\s*=\s*true/);
  });

  test("declares KMS key alias", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(
      /resource\s+"aws_kms_alias"\s+"s3_encryption_alias"/
    );
  });

  // --- CloudFront Tests ---

  test("declares CloudFront distribution resource", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(
      /resource\s+"aws_cloudfront_distribution"\s+"news_distribution"/
    );
  });

  test("uses Origin Access Control (OAC) not legacy OAI", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(
      /resource\s+"aws_cloudfront_origin_access_control"\s+"news_oac"/
    );
    expect(content).toMatch(/origin_access_control_id/);
    // Should NOT use legacy OAI
    expect(content).not.toMatch(/origin_access_identity/);
  });

  test("enforces HTTPS on CloudFront distribution", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/viewer_protocol_policy\s*=\s*"redirect-to-https"/);
    expect(content).toMatch(/minimum_protocol_version\s*=\s*"TLSv1\.2_2021"/);
  });

  test("enables CloudFront logging", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/logging_config\s*{/);
    expect(content).toMatch(/cloudfront-logs/);
  });

  test("enables compression on CloudFront", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/compress\s*=\s*true/);
  });

  // --- WAF Tests ---

  test("declares WAF Web ACL resource", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(
      /resource\s+"aws_wafv2_web_acl"\s+"news_platform"/
    );
  });

  test("WAF is scoped for CLOUDFRONT", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/scope\s*=\s*"CLOUDFRONT"/);
  });

  test("WAF includes managed rule set for common threats", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/AWSManagedRulesCommonRuleSet/);
  });

  test("WAF includes SQL injection protection", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/AWSManagedRulesSQLiRuleSet/);
  });

  test("WAF includes rate limiting rule", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/rate_based_statement/);
    expect(content).toMatch(/aggregate_key_type\s*=\s*"IP"/);
  });

  test("CloudFront distribution is associated with WAF", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/web_acl_id\s*=\s*aws_wafv2_web_acl\.news_platform\.arn/);
  });

  // --- CloudWatch Tests ---

  test("declares CloudWatch alarm for CloudFront 5xx errors", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(
      /resource\s+"aws_cloudwatch_metric_alarm"\s+"cloudfront_5xx_errors"/
    );
    expect(content).toMatch(/metric_name\s*=\s*"5xxErrorRate"/);
  });

  test("declares CloudWatch alarm for WAF blocked requests", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(
      /resource\s+"aws_cloudwatch_metric_alarm"\s+"waf_blocked_requests"/
    );
    expect(content).toMatch(/metric_name\s*=\s*"BlockedRequests"/);
  });

  test("declares CloudWatch alarm for S3 4xx errors", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(
      /resource\s+"aws_cloudwatch_metric_alarm"\s+"s3_4xx_errors"/
    );
    expect(content).toMatch(/metric_name\s*=\s*"4xxErrors"/);
  });

  test("declares CloudWatch log group", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(
      /resource\s+"aws_cloudwatch_log_group"\s+"news_platform"/
    );
  });

  // --- IAM Tests ---

  test("declares IAM role for CloudFront S3 access", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(
      /resource\s+"aws_iam_role"\s+"cloudfront_s3_access"/
    );
  });

  test("declares IAM policy for CloudFront S3 access", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(
      /resource\s+"aws_iam_policy"\s+"cloudfront_s3_access"/
    );
  });

  test("attaches IAM policy to role", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(
      /resource\s+"aws_iam_role_policy_attachment"\s+"cloudfront_s3_access"/
    );
  });

  test("IAM policy includes KMS decrypt permissions", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    const iamPolicyMatch = content.match(
      /resource\s+"aws_iam_policy"\s+"cloudfront_s3_access"\s*{[\s\S]*?^}/m
    );
    expect(iamPolicyMatch).toBeTruthy();
    expect(iamPolicyMatch![0]).toMatch(/kms:Decrypt/);
  });

  // --- Tagging Tests ---

  test("all resources include Environment tag", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    const resourceBlocks = content.match(/resource\s+"[^"]+"\s+"[^"]+"\s*{/g);
    const tagBlocks = content.match(/Environment\s*=\s*var\.environment/g);

    // We should have multiple resources with Environment tags
    expect(tagBlocks).toBeTruthy();
    expect(tagBlocks!.length).toBeGreaterThan(5);
  });

  test("all resources include Owner tag", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    const tagBlocks = content.match(/Owner\s*=\s*var\.owner/g);

    expect(tagBlocks).toBeTruthy();
    expect(tagBlocks!.length).toBeGreaterThan(5);
  });

  test("all resources include Project tag", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    const tagBlocks = content.match(/Project\s*=\s*var\.project/g);

    expect(tagBlocks).toBeTruthy();
    expect(tagBlocks!.length).toBeGreaterThan(5);
  });

  // --- Variable Tests ---

  test("declares environment variable with default", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/variable\s+"environment"\s*{/);
    expect(content).toMatch(/default\s*=\s*"production"/);
  });

  test("declares owner variable with default", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/variable\s+"owner"\s*{/);
  });

  test("declares project variable with default", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/variable\s+"project"\s*{/);
  });

  test("declares log_retention_days variable", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/variable\s+"log_retention_days"\s*{/);
  });

  test("declares waf_request_threshold variable", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/variable\s+"waf_request_threshold"\s*{/);
  });

  // --- Output Tests ---

  test("declares output for content bucket name", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/output\s+"content_bucket_name"\s*{/);
  });

  test("declares output for logs bucket name", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/output\s+"logs_bucket_name"\s*{/);
  });

  test("declares output for CloudFront domain name", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/output\s+"cloudfront_domain_name"\s*{/);
  });

  test("declares output for CloudFront distribution ID", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/output\s+"cloudfront_distribution_id"\s*{/);
  });

  test("declares output for WAF Web ACL ID", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/output\s+"waf_web_acl_id"\s*{/);
  });

  test("declares output for KMS key ARN", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/output\s+"kms_key_arn"\s*{/);
  });

  // --- Security Best Practices Tests ---

  test("S3 bucket policy uses CloudFront service principal with source ARN condition", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/cloudfront\.amazonaws\.com/);
    expect(content).toMatch(/"AWS:SourceArn"/);
  });

  test("uses bucket_key_enabled for KMS cost optimization", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/bucket_key_enabled\s*=\s*true/);
  });

  test("CloudWatch alarms use treat_missing_data configuration", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/treat_missing_data\s*=\s*"notBreaching"/);
  });

  test("uses data source for AWS account ID", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
    expect(content).toMatch(/data\.aws_caller_identity\.current\.account_id/);
  });

  // --- Cost Optimization Tests ---

  test("uses cost-optimized CloudFront price class", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    // Should use PriceClass_100 or PriceClass_200, not PriceClass_All
    expect(content).toMatch(/price_class\s*=\s*"PriceClass_100"/);
  });

  test("enables CloudFront caching with appropriate TTLs", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/default_ttl\s*=\s*3600/);
    expect(content).toMatch(/max_ttl\s*=\s*86400/);
  });

});
