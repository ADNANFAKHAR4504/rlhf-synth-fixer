// Integration tests for News Platform Content Delivery System
// These tests validate the Terraform infrastructure configuration

import * as fs from 'fs';
import * as path from 'path';

const STACK_FILE = path.resolve(__dirname, '../lib/tap_stack.tf');

describe('News Platform Content Delivery System - Integration Tests', () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_FILE, 'utf8');
  });

  describe('S3 Infrastructure', () => {
    test('declares content S3 bucket with versioning', () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"content"/);
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"content_versioning"/);
    });

    test('declares logs S3 bucket with lifecycle policy', () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"logs"/);
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"logs_lifecycle"/);
    });

    test('enforces S3 encryption with KMS', () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/);
      expect(stackContent).toMatch(/sse_algorithm\s+=\s+"aws:kms"/);
    });

    test('blocks public access to S3 buckets', () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"/);
      expect(stackContent).toMatch(/block_public_acls\s+=\s+true/);
      expect(stackContent).toMatch(/block_public_policy\s+=\s+true/);
    });

    test('enforces TLS-only access via bucket policy', () => {
      expect(stackContent).toMatch(/AllowSSLRequestsOnly/);
      expect(stackContent).toMatch(/"aws:SecureTransport"\s+=\s+"false"/);
    });

    test('enables S3 access logging', () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_logging"\s+"content_logging"/);
      expect(stackContent).toMatch(/target_bucket/);
    });
  });

  describe('KMS Encryption', () => {
    test('declares KMS key with rotation enabled', () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"s3_encryption"/);
      expect(stackContent).toMatch(/enable_key_rotation\s+=\s+true/);
    });

    test('creates KMS alias for easy reference', () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"s3_encryption_alias"/);
      expect(stackContent).toMatch(/name\s+=\s+"alias\/news-platform-s3-encryption"/);
    });

    test('sets appropriate deletion window', () => {
      expect(stackContent).toMatch(/deletion_window_in_days\s+=\s+30/);
    });
  });

  describe('CloudFront Distribution', () => {
    test('declares CloudFront distribution with S3 origin', () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudfront_distribution"\s+"news_distribution"/);
      expect(stackContent).toMatch(/origin\s+\{/);
      expect(stackContent).toMatch(/bucket_regional_domain_name/);
    });

    test('enables IPv6 and HTTPS redirect', () => {
      expect(stackContent).toMatch(/is_ipv6_enabled\s+=\s+true/);
      expect(stackContent).toMatch(/viewer_protocol_policy\s+=\s+"redirect-to-https"/);
    });

    test('configures caching behavior', () => {
      expect(stackContent).toMatch(/default_cache_behavior/);
      expect(stackContent).toMatch(/cached_methods/);
      expect(stackContent).toMatch(/compress\s+=\s+true/);
    });

    test('enables CloudFront logging', () => {
      expect(stackContent).toMatch(/logging_config/);
      expect(stackContent).toMatch(/cloudfront-logs/);
    });

    test('configures custom error pages', () => {
      expect(stackContent).toMatch(/custom_error_response/);
      expect(stackContent).toMatch(/error_code\s+=\s+403/);
      expect(stackContent).toMatch(/error_code\s+=\s+404/);
    });

    test('uses minimum TLS 1.2', () => {
      expect(stackContent).toMatch(/minimum_protocol_version\s+=\s+"TLSv1\.2_2021"/);
    });
  });

  describe('WAF Configuration', () => {
    test('declares WAF Web ACL with CloudFront scope', () => {
      expect(stackContent).toMatch(/resource\s+"aws_wafv2_web_acl"\s+"news_platform"/);
      expect(stackContent).toMatch(/scope\s+=\s+"CLOUDFRONT"/);
    });

    test('integrates WAF with CloudFront', () => {
      expect(stackContent).toMatch(/web_acl_id\s+=\s+aws_wafv2_web_acl\.news_platform\.arn/);
    });

    test('implements AWS Managed Rules for common threats', () => {
      expect(stackContent).toMatch(/AWSManagedRulesCommonRuleSet/);
    });

    test('implements SQL injection protection', () => {
      expect(stackContent).toMatch(/AWSManagedRulesSQLiRuleSet/);
    });

    test('implements rate limiting', () => {
      expect(stackContent).toMatch(/RateLimitRule/);
      expect(stackContent).toMatch(/rate_based_statement/);
      expect(stackContent).toMatch(/waf_request_threshold/);
    });

    test('enables CloudWatch metrics for WAF', () => {
      expect(stackContent).toMatch(/visibility_config/);
      expect(stackContent).toMatch(/cloudwatch_metrics_enabled\s+=\s+true/);
    });
  });

  describe('Origin Access Control', () => {
    test('declares CloudFront Origin Access Control', () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudfront_origin_access_control"\s+"news_oac"/);
    });

    test('restricts S3 bucket access to CloudFront only', () => {
      expect(stackContent).toMatch(/AllowCloudFrontServicePrincipal/);
      expect(stackContent).toMatch(/cloudfront\.amazonaws\.com/);
    });

    test('enforces source ARN condition for S3 policy', () => {
      expect(stackContent).toMatch(/AWS:SourceArn/);
      expect(stackContent).toMatch(/news_distribution\.arn/);
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('creates alarm for CloudFront 5xx errors', () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"cloudfront_5xx_errors"/);
      expect(stackContent).toMatch(/5xxErrorRate/);
    });

    test('creates alarm for WAF blocked requests', () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"waf_blocked_requests"/);
      expect(stackContent).toMatch(/BlockedRequests/);
    });

    test('creates alarm for S3 4xx errors', () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"s3_4xx_errors"/);
      expect(stackContent).toMatch(/4xxErrors/);
    });

    test('creates CloudWatch log group', () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"/);
      expect(stackContent).toMatch(/retention_in_days\s+=\s+var\.log_retention_days/);
    });

    test('encrypts CloudWatch logs with KMS', () => {
      expect(stackContent).toMatch(/kms_key_id\s+=\s+aws_kms_key\.s3_encryption\.arn/);
    });
  });

  describe('IAM Security', () => {
    test('creates IAM role for CloudFront S3 access', () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"cloudfront_s3_access"/);
    });

    test('implements least privilege IAM policy', () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_policy"\s+"cloudfront_s3_access"/);
      expect(stackContent).toMatch(/s3:GetObject/);
      expect(stackContent).toMatch(/s3:ListBucket/);
    });

    test('includes KMS permissions for CloudFront', () => {
      expect(stackContent).toMatch(/kms:Decrypt/);
      expect(stackContent).toMatch(/kms:GenerateDataKey/);
    });

    test('attaches policy to role', () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"cloudfront_s3_access"/);
    });

    test('enforces assume role condition with source ARN', () => {
      expect(stackContent).toMatch(/assume_role_policy/);
      expect(stackContent).toMatch(/aws:SourceArn/);
    });
  });

  describe('Resource Tagging', () => {
    test('applies Environment tags to all resources', () => {
      const envTagMatches = stackContent.match(/Environment\s+=\s+var\.environment/g);
      expect(envTagMatches).not.toBeNull();
      expect(envTagMatches!.length).toBeGreaterThan(5);
    });

    test('applies Owner tags to all resources', () => {
      const ownerTagMatches = stackContent.match(/Owner\s+=\s+var\.owner/g);
      expect(ownerTagMatches).not.toBeNull();
      expect(ownerTagMatches!.length).toBeGreaterThan(5);
    });

    test('applies Project tags to all resources', () => {
      const projectTagMatches = stackContent.match(/Project\s+=\s+var\.project/g);
      expect(projectTagMatches).not.toBeNull();
      expect(projectTagMatches!.length).toBeGreaterThan(5);
    });
  });

  describe('Configuration Variables', () => {
    test('declares aws_region variable', () => {
      expect(stackContent).toMatch(/variable\s+"aws_region"/);
    });

    test('declares environment variable with default', () => {
      expect(stackContent).toMatch(/variable\s+"environment"/);
      expect(stackContent).toMatch(/default\s+=\s+"production"/);
    });

    test('declares log_retention_days variable', () => {
      expect(stackContent).toMatch(/variable\s+"log_retention_days"/);
      expect(stackContent).toMatch(/type\s+=\s+number/);
    });

    test('declares waf_request_threshold variable', () => {
      expect(stackContent).toMatch(/variable\s+"waf_request_threshold"/);
    });

    test('declares domain_name variable with default', () => {
      expect(stackContent).toMatch(/variable\s+"domain_name"/);
      expect(stackContent).toMatch(/default\s+=\s+"news\.example\.com"/);
    });
  });

  describe('Output Values', () => {
    test('outputs content bucket name', () => {
      expect(stackContent).toMatch(/output\s+"content_bucket_name"/);
    });

    test('outputs logs bucket name', () => {
      expect(stackContent).toMatch(/output\s+"logs_bucket_name"/);
    });

    test('outputs CloudFront domain name', () => {
      expect(stackContent).toMatch(/output\s+"cloudfront_domain_name"/);
    });

    test('outputs CloudFront distribution ID', () => {
      expect(stackContent).toMatch(/output\s+"cloudfront_distribution_id"/);
    });

    test('outputs WAF Web ACL ID and ARN', () => {
      expect(stackContent).toMatch(/output\s+"waf_web_acl_id"/);
      expect(stackContent).toMatch(/output\s+"waf_web_acl_arn"/);
    });

    test('outputs KMS key details', () => {
      expect(stackContent).toMatch(/output\s+"kms_key_id"/);
      expect(stackContent).toMatch(/output\s+"kms_key_arn"/);
    });
  });

  describe('Security Best Practices', () => {
    test('no hardcoded secrets or credentials', () => {
      expect(stackContent).not.toMatch(/password\s*=\s*"[^"]+"/i);
      expect(stackContent).not.toMatch(/secret\s*=\s*"[^"]+"/i);
      expect(stackContent).not.toMatch(/access_key\s*=\s*"[^"]+"/i);
    });

    test('uses secure protocols only', () => {
      expect(stackContent).not.toMatch(/http:\/\//);
      expect(stackContent).toMatch(/redirect-to-https/);
    });

    test('implements defense in depth with multiple security layers', () => {
      const securityLayers = [
        /aws_kms_key/,
        /aws_wafv2_web_acl/,
        /aws_s3_bucket_public_access_block/,
        /AllowSSLRequestsOnly/,
        /aws_iam_policy/
      ];
      securityLayers.forEach(pattern => {
        expect(stackContent).toMatch(pattern);
      });
    });
  });

  describe('Cost Optimization', () => {
    test('uses cost-effective price class for CloudFront', () => {
      expect(stackContent).toMatch(/price_class\s+=\s+"PriceClass_/);
    });

    test('implements S3 lifecycle policies for log retention', () => {
      expect(stackContent).toMatch(/expiration/);
      expect(stackContent).toMatch(/days\s+=\s+var\.log_retention_days/);
    });

    test('enables S3 bucket key to reduce KMS costs', () => {
      expect(stackContent).toMatch(/bucket_key_enabled\s+=\s+true/);
    });
  });

  describe('Compliance and Governance', () => {
    test('enables versioning for data protection', () => {
      expect(stackContent).toMatch(/versioning_configuration/);
      expect(stackContent).toMatch(/status\s+=\s+"Enabled"/);
    });

    test('implements comprehensive logging', () => {
      const loggingComponents = [
        /logging_config/,
        /cloudfront-logs/,
        /s3-content-logs/,
        /cloudwatch_log_group/
      ];
      loggingComponents.forEach(pattern => {
        expect(stackContent).toMatch(pattern);
      });
    });

    test('treats missing data appropriately in alarms', () => {
      expect(stackContent).toMatch(/treat_missing_data\s+=\s+"notBreaching"/);
    });
  });
});
